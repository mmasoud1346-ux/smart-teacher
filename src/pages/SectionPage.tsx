import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, Bot, ChevronDown, Clock3, Download, FileQuestion, FileText, GraduationCap, Megaphone, Search, Sparkles, Video, WandSparkles } from 'lucide-react'
import Modal from '../Modal'
import ToolWorkspace from '../ToolWorkspace'
import LearningCourse from '../LearningCourse'
import { articleLibrary, downloadText, learningCourses, normalizeSearch, resourceLibrary, toolCatalog, type ToolId } from '../content'
import { defaultProfile, isProfile, useLocalState } from '../storage'

type Section = 'tools' | 'courses' | 'resources' | 'blog' | 'not-found'
const navigation = [
  { label: 'خانه', path: '/' },
  { label: 'ابزارها', path: '/tools' },
  { label: 'دوره‌های آموزشی', path: '/courses' },
  { label: 'منابع', path: '/resources' },
  { label: 'بلاگ', path: '/blog' },
]
const pageCopy: Record<Section, { eyebrow: string; title: string; text: string }> = {
  tools: { eyebrow: 'جعبه‌ابزار مدرس', title: 'از ایده تا یک درس آماده', text: 'موضوع و مخاطب را وارد کنید، یک پیش‌نویس قالبی بسازید و با دانش خود آن را کامل کنید. ابزارهای این نسخه محلی‌اند و به مدل AI متصل نیستند.' },
  courses: { eyebrow: 'مسیرهای یادگیری', title: 'یادگیری کوتاه، کاربرد در کلاس', text: 'سه مسیر متنی رایگان با تمرین عملی. از درس اول شروع کنید و پیشرفت خود را در همین مرورگر نگه دارید.' },
  resources: { eyebrow: 'کتابخانه کاربردی', title: 'برای هر درس، یک شروع بهتر', text: 'راهنماها، قالب‌ها و چک‌لیست‌های واقعی قابل دانلود؛ فایل‌های متنی UTF-8 و تقویم CSV قابل بازکردن در نرم‌افزار صفحه‌گسترده.' },
  blog: { eyebrow: 'مجله مدرس', title: 'ایده‌های تازه برای آموزش آینده', text: 'یادداشت‌های کاربردی دربارهٔ طراحی آموزشی، استفادهٔ مسئولانه از هوش مصنوعی و رشد حرفه‌ای.' },
  'not-found': { eyebrow: 'خطای ۴۰۴', title: 'این صفحه پیدا نشد', text: 'ممکن است آدرس تغییر کرده باشد. از دکمه زیر به داشبورد برگردید.' },
}
const icons = [Bot, FileQuestion, FileText, Video, BarChart3, Megaphone]
const colors = ['blue', 'green', 'purple', 'pink', 'blue', 'purple']
type Panel = { type: 'tool'; id: ToolId } | { type: 'course'; id: string } | { type: 'article'; index: number } | null

export default function SectionPage({ section }: { section: Section }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [panel, setPanel] = useState<Panel>(null)
  const [message, setMessage] = useState('')
  const [profile] = useLocalState('profile', defaultProfile, isProfile)
  const copy = pageCopy[section]
  useEffect(() => { window.scrollTo(0, 0); setQuery(''); setPanel(null); setMessage('') }, [section])
  const matches = (title: string) => normalizeSearch(title).includes(normalizeSearch(query))
  const catalog = section === 'tools' ? toolCatalog : section === 'courses' ? learningCourses : section === 'resources' ? resourceLibrary : articleLibrary
  const count = catalog.filter(item => matches(item.title)).length
  return <div className="section-page" dir="rtl">
    <header className="topbar section-topbar">
      <button className="user-block" onClick={() => navigate('/')}><div className="avatar">{profile.name.charAt(0)}</div><div className="user-copy"><strong>سلام {profile.name}!</strong><span>{profile.specialty}</span></div><ChevronDown size={16} /></button>
      <nav className="main-nav" aria-label="منوی اصلی">{navigation.map(item => <button className={location.pathname === item.path ? 'active' : ''} aria-current={location.pathname === item.path ? 'page' : undefined} key={item.path} onClick={() => navigate(item.path)}>{item.label}</button>)}</nav>
      <div className="top-actions"><button aria-label="رفتن به جستجوی صفحه" onClick={() => document.getElementById('catalog-search')?.focus()}><Search size={20} /></button><div className="top-divider" /><button className="route-logo" onClick={() => navigate('/')} aria-label="رفتن به خانه"><span className="logo-mark"><GraduationCap size={28} /></span><span className="logo-text">Arsha</span></button></div>
    </header>
    <main className="section-main">
      <nav className="section-mobile-nav" aria-label="صفحات">{navigation.map(item => <button key={item.path} aria-current={location.pathname === item.path ? 'page' : undefined} onClick={() => navigate(item.path)}>{item.label}</button>)}</nav>
      <section className="section-hero"><div><span className="eyebrow"><Sparkles size={16} />{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.text}</p>{section === 'not-found' && <button className="section-primary" onClick={() => navigate('/')}><ArrowRight size={18} />بازگشت به داشبورد</button>}</div>{section !== 'not-found' && <div className="section-hero-art"><img src="/images/arsha-poster.png" alt="" /><span><WandSparkles /> فضای آموزشی SmartTeacherAI</span></div>}</section>
      {section !== 'not-found' && <div className="catalog-toolbar"><label className="search-field"><Search size={19} /><input id="catalog-search" aria-label="جستجو در این صفحه" placeholder="جستجو در این صفحه…" value={query} onChange={event => setQuery(event.target.value)} /></label><span aria-live="polite">{count.toLocaleString('fa-IR')} نتیجه</span></div>}
      {section === 'tools' && <section className="page-grid tools-page-grid">{toolCatalog.map((tool, i) => { const Icon = icons[i]; return matches(tool.title) && <article className="page-card tool-page-card" key={tool.id}><span className={`icon-tile ${colors[i]}`}><Icon /></span><h2>{tool.title}</h2><p>{tool.text}</p><button onClick={() => setPanel({ type: 'tool', id: tool.id })}>شروع استفاده <ArrowLeft size={17} /></button></article> })}</section>}
      {section === 'courses' && <section className="page-grid courses-page-grid">{learningCourses.filter(course => matches(course.title)).map(course => <article className="page-card full-course-card" key={course.id}><img src={course.image} alt="" /><div><span>{course.level}</span><h2>{course.title}</h2><p><Clock3 size={15} /> ۳ درس متنی • رایگان</p><button onClick={() => setPanel({ type: 'course', id: course.id })}>مشاهده و شروع یادگیری <ArrowLeft size={17} /></button></div></article>)}</section>}
      {section === 'resources' && <section className="resource-page-list">{resourceLibrary.filter(resource => matches(resource.title)).map(resource => <article className="page-card resource-page-card" key={resource.filename}><span className="resource-file-icon"><BookOpen /></span><div><small>{resource.type}</small><h2>{resource.title}</h2><p>{resource.filename.endsWith('.csv') ? 'CSV · تقویم قابل ویرایش' : 'TXT · متن فارسی قابل ویرایش'}</p></div><button onClick={() => { downloadText(resource.filename, resource.body); setMessage(`فایل «${resource.title}» برای دانلود آماده شد.`) }}><Download size={18} />دانلود</button></article>)}</section>}
      {section === 'blog' && <section className="page-grid blog-page-grid">{articleLibrary.map((article, index) => matches(article.title) && <article className="page-card article-card" key={article.title}><img src={article.image} alt="" /><div><span>{article.category}</span><h2>{article.title}</h2><p><Clock3 size={14} /> ۳ دقیقه مطالعه</p><button onClick={() => setPanel({ type: 'article', index })}>مطالعه مقاله <ArrowLeft size={17} /></button></div></article>)}</section>}
      {section !== 'not-found' && !count && <div className="empty-state"><Search size={32} /><h2>نتیجه‌ای پیدا نشد</h2><p>با واژه‌ای کوتاه‌تر جستجو کنید.</p><button onClick={() => setQuery('')}>نمایش همه</button></div>}
      <footer className="page-footer"><span>SmartTeacherAI · فضای آموزشی Arsha</span><span>نسخهٔ محلی · اطلاعات در همین مرورگر ذخیره می‌شود</span></footer>
    </main>
    {panel && <Modal title={panel.type === 'tool' ? 'ابزار آموزشی' : panel.type === 'course' ? 'مسیر یادگیری' : 'مطالعه مقاله'} onClose={() => setPanel(null)}>{panel.type === 'tool' ? <ToolWorkspace id={panel.id} /> : panel.type === 'course' ? <LearningCourse courseId={panel.id} /> : <article className="reader-article"><img className="course-cover" src={articleLibrary[panel.index].image} alt="" /><span className="course-label">{articleLibrary[panel.index].category}</span><h2>{articleLibrary[panel.index].title}</h2><p>{articleLibrary[panel.index].body}</p><button className="dialog-primary full" onClick={() => downloadText('smartteacher-article.txt', `${articleLibrary[panel.index].title}\n\n${articleLibrary[panel.index].body}`)}>ذخیرهٔ متن مقاله <Download size={17} /></button></article>}</Modal>}
    {message && <div className="toast" role="status"><Download size={17} />{message}<button aria-label="بستن پیام" onClick={() => setMessage('')}>×</button></div>}
  </div>
}
