import type { BuilderInput, ToolId } from './content'

/**
 * Set VITE_AI_ENDPOINT (for example https://ai.example.com/api/ai) when
 * building to enable the AI backend. Without it the app stays in local
 * template mode, so a deploy without a server never breaks.
 */
const ENDPOINT = (import.meta.env?.VITE_AI_ENDPOINT as string | undefined)?.trim() ?? ''

export const aiEnabled = ENDPOINT.length > 0

export async function generateWithAi(id: ToolId, input: BuilderInput, signal?: AbortSignal): Promise<string> {
  if (!ENDPOINT) throw new Error('ai_not_configured')
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: id, ...input }),
    signal,
  })
  let payload: { text?: unknown; message?: unknown } = {}
  try { payload = await response.json() } catch { /* non-JSON error page */ }
  if (!response.ok) {
    const message = typeof payload.message === 'string' ? payload.message : 'ارتباط با سرویس هوش مصنوعی برقرار نشد.'
    throw new Error(message)
  }
  if (typeof payload.text !== 'string' || !payload.text.trim()) throw new Error('پاسخ خالی از سرویس هوش مصنوعی دریافت شد.')
  return payload.text.trim()
}
