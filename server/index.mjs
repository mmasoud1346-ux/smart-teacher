/**
 * SmartTeacherAI AI proxy.
 *
 * The browser never sees the provider API key: the static site calls
 * POST /api/ai and this server forwards the request to an OpenAI-compatible
 * chat-completions endpoint. Runs on Node 18+ with no external dependencies.
 *
 * Environment:
 *   AI_API_KEY   provider key (required)
 *   AI_BASE_URL  OpenAI-compatible base URL, e.g. https://api.openai.com/v1
 *   AI_MODEL     model name, e.g. gpt-4o-mini
 *   PORT         listen port (default 8787)
 *   ALLOWED_ORIGIN  site origin allowed by CORS, e.g. https://user.github.io
 */
import http from 'node:http'
import { createHash } from 'node:crypto'

const PORT = Number(process.env.PORT ?? 8787)
const API_KEY = process.env.AI_API_KEY ?? ''
const BASE_URL = (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/+$/, '')
const MODEL = process.env.AI_MODEL ?? 'gpt-4o-mini'
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? ''

const MAX_BODY_BYTES = 40_000
const MAX_TOPIC_CHARS = 4_000
const RATE_WINDOW_MS = 60_000
const RATE_MAX_REQUESTS = 12

const TASKS = {
  lesson: 'یک طرح درس کامل با هدف قابل سنجش، مراحل زمان‌بندی‌شده، تمرین و ارزیابی بنویس.',
  quiz: 'یک برگه آزمون همراه با راهنمای تصحیح و امتیاز هر سؤال بنویس.',
  content: 'یک چارچوب جزوه یا اسلاید آموزشی با بخش‌های مشخص بنویس.',
  video: 'یک سناریوی ویدیوی آموزشی با پلان‌ها و متن گفتار بنویس. فایل ویدیو تولید نکن.',
  analysis: 'متن را از نظر ساختار آموزشی، وضوح هدف، وجود مثال و تمرین و ارزیابی بررسی کن و پیشنهاد اصلاح بده.',
  marketing: 'یک برنامه محتوایی و بازاریابی برای مدرس بنویس، بدون وعده درآمد یا نتیجه تضمینی.',
}

const buckets = new Map()

function rateLimit(ip) {
  const now = Date.now()
  const entry = buckets.get(ip)
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 })
    return true
  }
  entry.count += 1
  return entry.count <= RATE_MAX_REQUESTS
}

function cors(res) {
  if (!ALLOWED_ORIGIN) return
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '600')
}

function send(res, status, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  res.end(body)
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    let oversized = false
    const chunks = []
    req.on('data', chunk => {
      if (oversized) return
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        oversized = true
        chunks.length = 0
        const error = Object.assign(new Error('body_too_large'), { status: 413 })
        req.on('end', () => reject(error))
        req.resume()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (oversized) return
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(Object.assign(new Error('invalid_json'), { status: 400 }))
      }
    })
    req.on('error', reject)
  })
}

function validate(input) {
  const task = input?.task
  if (!Object.hasOwn(TASKS, task)) return 'نوع درخواست معتبر نیست.'
  const topic = typeof input.topic === 'string' ? input.topic.trim() : ''
  if (!topic) return 'موضوع یا متن را وارد کنید.'
  if (topic.length > MAX_TOPIC_CHARS) return 'متن بیش از حد طولانی است.'
  const audience = typeof input.audience === 'string' ? input.audience.trim().slice(0, 120) : ''
  const duration = Number(input.duration)
  if (!Number.isInteger(duration) || duration < 10 || duration > 180) return 'زمان باید بین ۱۰ تا ۱۸۰ دقیقه باشد.'
  return { task, topic, audience, duration }
}

function buildPrompt({ task, topic, audience, duration }) {
  return [
    TASKS[task],
    `مخاطب: ${audience || 'یادگیرندگان عمومی'}`,
    `زمان جلسه: ${duration} دقیقه`,
    task === 'analysis' ? `متن برای بررسی:\n${topic}` : `موضوع:\n${topic}`,
    'پاسخ را فارسی، ساختارمند و آمادهٔ ویرایش توسط مدرس بنویس. اطلاعات شخصی یا دادهٔ دانش‌آموزان را درخواست نکن.',
  ].join('\n\n')
}

async function callProvider(messages) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60_000)
  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.6, max_tokens: 1800 }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const detail = await response.text()
      console.error('provider_error', response.status, detail.slice(0, 500))
      throw Object.assign(new Error('provider_error'), { status: 502 })
    }
    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim()) throw Object.assign(new Error('empty_completion'), { status: 502 })
    return text.trim()
  } finally {
    clearTimeout(timer)
  }
}

const server = http.createServer(async (req, res) => {
  cors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }
  if (req.method === 'GET' && req.url === '/api/health') {
    send(res, 200, { ok: true, configured: Boolean(API_KEY) })
    return
  }
  if (req.method !== 'POST' || req.url !== '/api/ai') {
    send(res, 404, { error: 'not_found' })
    return
  }
  if (!API_KEY) {
    send(res, 503, { error: 'provider_not_configured', message: 'سرویس هوش مصنوعی هنوز تنظیم نشده است.' })
    return
  }
  const ip = req.socket.remoteAddress ?? 'unknown'
  const hashed = createHash('sha256').update(ip).digest('hex').slice(0, 16)
  if (!rateLimit(hashed)) {
    send(res, 429, { error: 'rate_limited', message: 'تعداد درخواست‌ها زیاد است؛ یک دقیقه بعد دوباره تلاش کنید.' })
    return
  }
  try {
    const input = await readJson(req)
    const parsed = validate(input)
    if (typeof parsed === 'string') {
      send(res, 400, { error: 'invalid_input', message: parsed })
      return
    }
    const text = await callProvider([{ role: 'user', content: buildPrompt(parsed) }])
    send(res, 200, { text })
  } catch (error) {
    const status = error?.status ?? 500
    const message = status === 413 ? 'متن ارسالی بیش از حد بزرگ است.'
      : status === 400 ? 'درخواست معتبر نیست.'
      : status === 502 ? 'سرویس هوش مصنوعی پاسخ نداد؛ دوباره تلاش کنید.'
      : 'خطای داخلی سرور.'
    if (status === 500) console.error('unexpected_error', error)
    send(res, status, { error: 'request_failed', message })
  }
})

server.listen(PORT, () => {
  console.log(`AI proxy listening on port ${PORT} (configured: ${Boolean(API_KEY)})`)
})
