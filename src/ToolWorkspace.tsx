import { useState } from 'react'
import { CheckCircle2, Download, FileText, Save, Sparkles, Trash2 } from 'lucide-react'
import { buildMaterial, downloadText, toolCatalog, type ToolId } from './content'
import { isDrafts, useLocalState, type Draft } from './storage'

export default function ToolWorkspace({ id }: { id: ToolId }) {
  const tool = toolCatalog.find(item => item.id === id)!
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('دانش‌آموزان دوره متوسطه')
  const [duration, setDuration] = useState(45)
  const [result, setResult] = useState('')
  const [status, setStatus] = useState('')
  const [drafts, setDrafts, storageError] = useLocalState<Draft[]>('drafts', [], isDrafts)
  return <>
    <div className="dialog-heading"><span className="dialog-icon"><Sparkles /></span><div><h2>{tool.title}</h2><p>{tool.text}</p></div></div>
    <div className="local-mode"><strong>حالت محلی · بدون اتصال به مدل AI</strong><p>خروجی از قالب‌های آموزشی ساخته می‌شود، نه مدل هوش مصنوعی. اطلاعات در همین مرورگر می‌ماند.</p></div>
    <form className="workspace-form" onSubmit={event => {
      event.preventDefault()
      try { setResult(buildMaterial(id, { topic, audience, duration })); setStatus('پیش‌نویس آماده شد؛ پیش از استفاده بازبینی کنید.') }
      catch (error) { setStatus((error as Error).message) }
    }}>
      <label>{id === 'analysis' ? 'متن برای بررسی' : 'موضوع درس یا دوره'}<textarea required maxLength={4000} value={topic} onChange={event => setTopic(event.target.value)} placeholder={id === 'analysis' ? 'متن آموزشی خود را اینجا قرار دهید…' : 'مثلاً فتوسنتز، کسرها یا مهارت حل مسئله…'} /></label>
      <div className="form-row"><label>مخاطب<input required maxLength={120} value={audience} onChange={event => setAudience(event.target.value)} /></label><label>زمان (دقیقه)<input type="number" min={10} max={180} required value={duration} onChange={event => setDuration(event.target.valueAsNumber)} /></label></div>
      <button className="dialog-primary full" type="submit"><FileText size={18} /> ساخت پیش‌نویس</button>
    </form>
    {result && <div className="generated-result">
      <strong><CheckCircle2 size={18} /> پیش‌نویس قابل ویرایش</strong>
      <textarea className="result-editor" aria-label="ویرایش خروجی" value={result} maxLength={20000} onChange={event => setResult(event.target.value)} />
      <div className="result-actions">
        <button disabled={!result.trim()} onClick={() => { downloadText(`smartteacher-${id}.txt`, result); setStatus('فایل آمادهٔ دانلود شد.') }}><Download size={16} /> دانلود متن</button>
        <button disabled={!result.trim()} onClick={() => { setDrafts([{ id: crypto.randomUUID(), title: topic.slice(0, 80) || tool.title, text: result, created: new Date().toISOString() }, ...drafts].slice(0, 30)); setStatus('پیش‌نویس در این مرورگر ذخیره شد.') }}><Save size={16} /> ذخیره</button>
        <button onClick={async () => { try { await navigator.clipboard.writeText(result); setStatus('متن کپی شد.') } catch { setStatus('دسترسی کپی وجود ندارد؛ از دانلود متن استفاده کنید.') } }}>کپی</button>
      </div>
    </div>}
    <p className="inline-status" role="status">{storageError ? 'ذخیره‌سازی مرورگر در دسترس نیست؛ برای نگه‌داشتن متن از دانلود استفاده کنید.' : status}</p>
    <section className="saved-drafts"><h3>پیش‌نویس‌های من <span>{drafts.length.toLocaleString('fa-IR')}</span></h3>
      {!drafts.length && <p>هنوز پیش‌نویسی ذخیره نکرده‌اید.</p>}
      {drafts.map(draft => <div className="draft-row" key={draft.id}><button onClick={() => { setResult(draft.text); setTopic(draft.title); setStatus('پیش‌نویس باز شد.') }}><strong>{draft.title}</strong><small>{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(draft.created))}</small></button><button aria-label={`دانلود ${draft.title}`} onClick={() => downloadText('smartteacher-draft.txt', draft.text)}><Download size={17} /></button><button aria-label={`حذف ${draft.title}`} onClick={() => { if (window.confirm('این پیش‌نویس حذف شود؟')) setDrafts(drafts.filter(item => item.id !== draft.id)) }}><Trash2 size={17} /></button></div>)}
    </section>
  </>
}
