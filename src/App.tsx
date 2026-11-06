import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import Modal from './Modal'
import ToolWorkspace from './ToolWorkspace'
import LearningCourse from './LearningCourse'
import { assetUrl, downloadText, normalizeSearch, resolveTool, learningCourses } from './content'
import { defaultProfile, defaultPreferences, isProfile, isPreferences, isBoolean, isDrafts, isStringArray, useLocalState, type Draft } from './storage'
import {
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronLeft,
  CircleUserRound,
  Clock3,
  Crown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  Star,
  Users,
  Video,
  WandSparkles,
  X,
} from 'lucide-react'

type DialogState =
  | { type: 'search' | 'notifications' | 'profile' | 'video' | 'settings' }
  | { type: 'tool'; title: string }
  | { type: 'course'; title: string; meta: string; image: string }
  | { type: 'upgrade' }
  | { type: 'consult' }
  | null

const sidebarItems = [
  { label: 'داشبورد', icon: LayoutDashboard },
  { label: 'ابزارهای AI', icon: WandSparkles },
  { label: 'دوره‌ها', icon: GraduationCap },
  { label: 'منابع آموزشی', icon: BookOpen },
  { label: 'پروفایل', icon: CircleUserRound },
  { label: 'تنظیمات', icon: Settings },
]

const featureCards = [
  {
    title: 'تولید محتوای درسی',
    text: 'ساخت اسلاید، جزوه و متن درس با کمک هوش مصنوعی',
    icon: FileText,
    tone: 'blue',
  },
  {
    title: 'طراحی آزمون و سؤال',
    text: 'ایجاد آزمون، تمرین و بانک سؤالات استاندارد',
    icon: FileText,
    tone: 'green',
  },
  {
    title: 'سناریوی ویدیوی آموزشی',
    text: 'طراحی ساختار و متن ویدیو؛ بدون تولید فایل ویدیو',
    icon: Video,
    tone: 'purple',
  },
  {
    title: 'بازاریابی آموزشی',
    text: 'ایده‌دهی تبلیغات، شبکه‌های اجتماعی و جذب دانشجو',
    icon: Megaphone,
    tone: 'pink',
  },
]

const popularTools = [
  { title: 'تولید طرح درس با AI', desc: 'سریع و حرفه‌ای', icon: Bot },
  { title: 'طراحی آزمون', desc: 'سؤالات متنوع و استاندارد', icon: FileText },
  { title: 'ایجاد جزوه و منابع', desc: 'مطابق با سرفصل دلخواه', icon: BookOpen },
  { title: 'آنالیز و بهینه‌سازی محتوا', desc: 'با تحلیل داده و پیشنهادهای AI', icon: BarChart3 },
]

const courses = [
  {
    title: 'مقدمه‌ای بر هوش مصنوعی برای مدرسان',
    meta: '۳ درس متنی  •  سطح مقدماتی',
    image: '/images/course-ai.jpg',
  },
  {
    title: 'تولید محتوای آموزشی با AI',
    meta: '۳ درس متنی  •  سطح متوسط',
    image: '/images/course-content.jpg',
  },
  {
    title: 'بازاریابی و رشد کسب‌وکار آموزشی',
    meta: '۳ درس متنی  •  سطح پیشرفته',
    image: '/images/course-growth.jpg',
  },
]

function Logo() {
  return (
    <div className="logo" aria-label="Arsha">
      <span className="logo-mark">
        <GraduationCap size={28} strokeWidth={2.4} />
      </span>
      <span className="logo-text">Arsha</span>
    </div>
  )
}

export default function App() {
  const navigate = useNavigate()
  const [activeItem, setActiveItem] = useState('داشبورد')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [profile, setProfile, profileError] = useLocalState('profile', defaultProfile, isProfile)
  const [profileDraft, setProfileDraft] = useState(profile)
  const [preferences, setPreferences, preferencesError] = useLocalState('preferences', defaultPreferences, isPreferences)
  const [notificationsRead, setNotificationsRead] = useLocalState('notifications-read', false, isBoolean)
  const [drafts] = useLocalState<Draft[]>('drafts', [], isDrafts)
  const [completedLessons] = useLocalState<string[]>('lessons', [], isStringArray)

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(noticeTimer.current), [])
  useEffect(() => {
    if (!mobileMenu) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMobileMenu(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [mobileMenu])
  const showNotice = (message: string) => {
    clearTimeout(noticeTimer.current)
    setNotice(message)
    noticeTimer.current = setTimeout(() => setNotice(''), 2600)
  }

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openTool = (title: string) => setDialog({ type: 'tool', title })
  const openProfile = () => {
    setProfileDraft(profile)
    setDialog({ type: 'profile' })
  }

  const handleTopNavigation = (item: string) => {
    const paths: Record<string, string> = {
      خانه: '/',
      ابزارها: '/tools',
      'دوره‌های آموزشی': '/courses',
      منابع: '/resources',
      بلاگ: '/blog',
    }
    navigate(paths[item])
  }

  const handleSidebarNavigation = (label: string) => {
    setActiveItem(label)
    setMobileMenu(false)
    if (label === 'داشبورد') navigate('/')
    if (label === 'ابزارهای AI') navigate('/tools')
    if (label === 'دوره‌ها') navigate('/courses')
    if (label === 'منابع آموزشی') navigate('/resources')
    if (label === 'پروفایل') openProfile()
    if (label === 'تنظیمات') setDialog({ type: 'settings' })
  }

  const searchResults = [
    ...featureCards.map(item => ({ title: item.title, type: 'ابزار' })),
    ...courses.map(item => ({ title: item.title, type: 'دوره' })),
  ].filter(item => normalizeSearch(item.title).includes(normalizeSearch(searchQuery)))

  return (
    <div className="app-shell" dir="rtl">
      <header className="topbar">
        <button className="user-block" onClick={openProfile}>
          <div className="avatar">ا</div>
          <div className="user-copy">
            <strong>سلام {profile.name}!</strong>
            <span>{profile.specialty}</span>
          </div>
          <ChevronDown size={16} />
        </button>

        <nav className="main-nav" aria-label="منوی اصلی">
          {['خانه', 'ابزارها', 'دوره‌های آموزشی', 'منابع', 'بلاگ'].map((item) => (
            <button
              className={item === 'خانه' ? 'active' : ''}
              key={item}
              onClick={() => handleTopNavigation(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="top-actions">
          <button aria-label="جستجو" onClick={() => setDialog({ type: 'search' })}>
            <Search size={20} />
          </button>
          <button aria-label="اعلان‌ها" onClick={() => setDialog({ type: 'notifications' })}>
            <Bell size={20} />
            {!notificationsRead && <span className="notification-dot" />}
          </button>
          <div className="top-divider" />
          <Logo />
          <button
            className="mobile-menu-button"
            aria-label="باز کردن منو"
            aria-expanded={mobileMenu}
            aria-controls="dashboard-sidebar"
            onClick={() => setMobileMenu(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <aside id="dashboard-sidebar" className={`sidebar ${mobileMenu ? 'open' : ''}`}>
        <button className="close-menu" aria-label="بستن منو" onClick={() => setMobileMenu(false)}>
          <X size={22} />
        </button>
        <div className="mobile-logo">
          <Logo />
        </div>
        <div className="sidebar-menu">
          {sidebarItems.map(({ label, icon: Icon }) => (
            <button
              className={activeItem === label ? 'active' : ''}
              key={label}
              onClick={() => handleSidebarNavigation(label)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="pro-card">
          <div className="crown">
            <Crown size={20} fill="currentColor" />
          </div>
          <strong>نسخه Pro</strong>
          <p>نسخهٔ محلی رایگان؛ امکانات حرفه‌ای در آینده</p>
          <button onClick={() => setDialog({ type: 'upgrade' })}>وضعیت نسخه حرفه‌ای</button>
        </div>
      </aside>

      {mobileMenu && <div className="menu-backdrop" onClick={() => setMobileMenu(false)} />}

      <main className="dashboard">
        <section className="hero">
          <div className="hero-photo">
            <img src={assetUrl('/images/arsha-poster.png')} alt="پوستر انتزاعی هوش مصنوعی Arsha" />
            <div className="ai-badge">AI</div>
            <div className="ai-menu" dir="ltr">
              <span><Bot size={16} /> Create Lesson</span>
              <span><FileText size={16} /> Generate Quiz</span>
              <span><BookOpen size={16} /> Build Content</span>
              <span><Megaphone size={16} /> Marketing</span>
            </div>
          </div>
          <div className="hero-copy">
            <span className="eyebrow"><Sparkles size={16} /> آینده تدریس از همین‌جا شروع می‌شود</span>
            <h1>هوش مصنوعی، دستیار حرفه‌ای مدرسان آینده</h1>
            <p>
              با Arsha به ابزارها، آموزش‌های کاربردی و منابع آماده دسترسی پیدا کنید و
              تدریس، تولید محتوا، طراحی منابع آموزشی و بازاریابی کسب‌وکار خود را به سطح بالاتری
              ببرید.
            </p>
            <div className="hero-actions">
              <button className="primary" onClick={() => scrollToSection('features')}>
                شروع کنید <ArrowLeft size={18} />
              </button>
              <button className="secondary" onClick={() => setDialog({ type: 'video' })}>
                مشاهده راهنما <BookOpen size={16} />
              </button>
            </div>
          </div>
        </section>

        <div className="local-mode version-banner"><strong>نسخهٔ اولیهٔ SmartTeacherAI</strong><p>ابزارها فعلاً با قالب‌های محلی کار می‌کنند؛ اتصال مدل هوش مصنوعی، حساب آنلاین و پرداخت فعال نیست. برای نگه‌داری مطمئن پیش‌نویس‌ها، فایل خروجی را دانلود کنید.</p></div>
        <div className="content-grid">
          <div className="main-column">
            <section className="welcome-card">
              <div>
                <h2>سلام {profile.name}!</h2>
                <p>خوش آمدی به Arsha. امروز چه کمکی از ما می‌خواهی؟</p>
              </div>
              <div className="welcome-quote">
                <Sparkles size={27} />
                <span>«آموزش بهتر، آینده‌ای روشن‌تر می‌سازد»</span>
              </div>
            </section>

            <section className="features-grid" id="features">
              {featureCards.map(({ title, text, icon: Icon, tone }) => (
                <button className="feature-card" key={title} onClick={() => openTool(title)}>
                  <span className={`icon-tile ${tone}`}><Icon size={24} /></span>
                  <strong>{title}</strong>
                  <p>{text}</p>
                  <ArrowLeft className="card-arrow" size={20} />
                </button>
              ))}
            </section>

            {preferences.personalized && <section className="courses-section" id="courses">
              <div className="section-heading">
                <h2>دوره‌های پیشنهادی برای شما</h2>
                <button onClick={() => navigate('/courses')}>
                  مشاهده همه <ArrowLeft size={15} />
                </button>
              </div>
              <div className="courses-grid">
                {courses.map((course) => (
                  <button
                    className="course-card"
                    key={course.title}
                    onClick={() => setDialog({ type: 'course', ...course })}
                  >
                    <img src={assetUrl(course.image)} alt="" />
                    <span className="course-copy">
                      <strong>{course.title}</strong>
                      <small><Clock3 size={14} /> {course.meta}</small>
                    </span>
                    <span className="course-arrow"><ArrowLeft size={18} /></span>
                  </button>
                ))}
              </div>
            </section>}
          </div>

          <div className="side-column">
            <section className="tools-panel">
              <div className="section-heading">
                <h2>ابزارهای پرکاربرد</h2>
                <button onClick={() => navigate('/tools')}>همه ابزارها</button>
              </div>
              <div className="tool-list">
                {popularTools.map(({ title, desc, icon: Icon }) => (
                  <button key={title} onClick={() => openTool(title)}>
                    <span className="tool-icon"><Icon size={21} /></span>
                    <span>
                      <strong>{title}</strong>
                      <small>{desc}</small>
                    </span>
                    <ChevronLeft size={19} />
                  </button>
                ))}
              </div>
            </section>

            <section className="mentor-card">
              <div className="mentor-art">
                <CircleUserRound size={66} />
                <Sparkles size={26} />
              </div>
              <div>
                <h2>منتورینگ و مشاوره تخصصی</h2>
                <p>برای تعریف مسئله و نیازهای آموزشی، فرم آمادگی جلسه را دانلود کنید. رزرو آنلاین هنوز فعال نیست.</p>
                <button onClick={() => setDialog({ type: 'consult' })}>
                  فرم آمادگی جلسه <ArrowLeft size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>

        <section className="stats-bar" aria-label="وضعیت فضای آموزشی شما">
          <div><GraduationCap /><span><strong>{learningCourses.length.toLocaleString('fa-IR')}</strong><small>مسیر یادگیری رایگان</small></span></div>
          <div><Star /><span><strong>{completedLessons.length.toLocaleString('fa-IR')}</strong><small>درس تکمیل‌شده</small></span></div>
          <div><Clock3 /><span><strong>{drafts.length.toLocaleString('fa-IR')}</strong><small>پیش‌نویس ذخیره‌شده</small></span></div>
          <div><Users /><span><strong>۶</strong><small>ابزار آموزشی محلی</small></span></div>
          <blockquote>داده‌های این نسخه در مرورگر شما ذخیره می‌شوند.</blockquote>
        </section>
      </main>

      {dialog && (
        <Modal title="پنجرهٔ داشبورد" onClose={() => setDialog(null)}>

            {dialog.type === 'search' && (
              <>
                <div className="dialog-heading">
                  <span className="dialog-icon"><Search /></span>
                  <div><h2>جستجوی هوشمند</h2><p>میان ابزارها، دوره‌ها و منابع جستجو کنید.</p></div>
                </div>
                <label className="search-field">
                  <Search size={19} />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="مثلاً تولید محتوا یا طراحی آزمون..."
                  />
                </label>
                <div className="search-results">
                  {!searchResults.length && <p className="dialog-description" role="status">نتیجه‌ای پیدا نشد؛ با واژه‌ای کوتاه‌تر جستجو کنید.</p>}
                  {searchResults.map((item) => (
                      <button
                        key={item.title}
                        onClick={() => {
                          setDialog(null)
                          item.type === 'ابزار'
                            ? openTool(item.title)
                            : setDialog({
                                type: 'course',
                                ...(courses.find((course) => course.title === item.title) ?? courses[0]),
                              })
                        }}
                      >
                        <span><strong>{item.title}</strong><small>{item.type}</small></span>
                        <ChevronLeft size={18} />
                      </button>
                    ))}
                </div>
              </>
            )}

            {dialog.type === 'notifications' && (
              <>
                <div className="dialog-heading">
                  <span className="dialog-icon"><Bell /></span>
                  <div><h2>اعلان‌ها</h2><p>تازه‌ترین رویدادهای حساب شما</p></div>
                </div>
                <div className="notification-list">
                  <div><Sparkles /><strong>نسخهٔ محلی SmartTeacherAI آمادهٔ استفاده است</strong><small>راهنمای شروع</small></div>
                  {preferences.courseAlerts && <div><BookOpen /><strong>سه مسیر متنی رایگان در بخش دوره‌ها در دسترس است</strong><small>یادگیری</small></div>}
                  <div><FileText /><strong>{drafts.length.toLocaleString('fa-IR')} پیش‌نویس در این مرورگر دارید</strong><small>فضای من</small></div>
                </div>
                <button
                  className="dialog-primary full"
                  onClick={() => {
                    setNotificationsRead(true)
                    showNotice('همه اعلان‌ها خوانده شدند')
                    setDialog(null)
                  }}
                >
                  علامت‌گذاری همه به‌عنوان خوانده‌شده
                </button>
              </>
            )}

            {dialog.type === 'profile' && (
              <form onSubmit={event => { event.preventDefault(); setProfile({ name: profileDraft.name.trim(), specialty: profileDraft.specialty.trim() }); showNotice('پروفایل در این مرورگر ذخیره شد') }}>
                <div className="profile-summary"><div className="profile-avatar">{profile.name.charAt(0)}</div><div><h2>پروفایل مدرس</h2><p>اطلاعات فقط در این دستگاه ذخیره می‌شود.</p></div></div>
                <div className="profile-info">
                  <label>نام نمایشی<input required maxLength={60} pattern=".*\S.*" value={profileDraft.name} onChange={event => setProfileDraft({ ...profileDraft, name: event.target.value })} /></label>
                  <label>تخصص<input required maxLength={100} pattern=".*\S.*" value={profileDraft.specialty} onChange={event => setProfileDraft({ ...profileDraft, specialty: event.target.value })} /></label>
                </div>
                <button className="dialog-primary full" type="submit">ذخیره تغییرات</button>
                {profileError && <p role="alert">ذخیره‌سازی مرورگر در دسترس نیست.</p>}
              </form>
            )}

            {dialog.type === 'video' && (
              <>
                <img className="course-cover" src={assetUrl('/images/arsha-poster.png')} alt="پوستر معرفی دستیار مدرس" />
                <h2>تدریس منظم‌تر در سه قدم</h2>
                <p className="dialog-description">۱. موضوع و مخاطب را در ابزارها وارد کنید. ۲. پیش‌نویس را بازبینی و ویرایش کنید. ۳. نتیجه را ذخیره یا دانلود کنید.</p>
                <p className="local-mode">ویدیوی معرفی هنوز ارائه نشده است؛ راهنمای متنی در دسترس است.</p>
                <button className="dialog-primary full" onClick={() => navigate('/tools')}>رفتن به ابزارها <ArrowLeft size={18} /></button>
              </>
            )}

            {dialog.type === 'tool' && <ToolWorkspace key={dialog.title} id={resolveTool(dialog.title)} />}

            {dialog.type === 'course' && <LearningCourse key={dialog.title} courseId={learningCourses.find(course => course.image === dialog.image)?.id ?? 'ai'} />}

            {dialog.type === 'upgrade' && (
              <>
                <div className="dialog-heading"><span className="dialog-icon purple"><Crown /></span><div><h2>نسخه حرفه‌ای</h2><p>پرداخت و اشتراک هنوز فعال نشده‌اند.</p></div></div>
                <p className="dialog-description">امکانات محلی این نسخه رایگان هستند. اتصال مدل هوش مصنوعی، حساب کاربری و اشتراک نیازمند سرویس سمت سرور است. در این صفحه مبلغی دریافت نمی‌شود.</p>
                <button className="dialog-primary full" onClick={() => navigate('/tools')}>استفاده از ابزارهای رایگان</button>
              </>
            )}

            {dialog.type === 'consult' && (
              <>
                <div className="dialog-heading"><span className="dialog-icon purple"><Users /></span><div><h2>آماده‌سازی جلسهٔ مشاوره</h2><p>در این نسخه درخواست به کارشناسی ارسال نمی‌شود.</p></div></div>
                <p className="dialog-description">برای جلسهٔ آینده، موضوع، مخاطب، چالش فعلی و نتیجهٔ مورد انتظار را مشخص کنید. می‌توانید فرم خام را دانلود و تکمیل کنید.</p>
                <button className="dialog-primary full" onClick={() => downloadText('consultation-brief.txt', 'فرم آمادگی مشاوره\n\nموضوع:\nمخاطب آموزشی:\nچالش فعلی:\nابزارهای مورد استفاده:\nنتیجه مورد انتظار:\nپرسش‌های من:\n\nاین فایل فقط برای آماده‌سازی است و به کسی ارسال نشده است.')}>دانلود فرم آمادگی جلسه</button>
              </>
            )}

            {dialog.type === 'settings' && (
              <>
                <div className="dialog-heading"><span className="dialog-icon"><Settings /></span><div><h2>تنظیمات</h2><p>تجربه کاربری خود را شخصی‌سازی کنید.</p></div></div>
                <div className="settings-list">
                  <label><span><strong>نمایش اعلان‌های آموزشی</strong><small>نمایش یادآوری در داشبورد</small></span><input type="checkbox" checked={preferences.courseAlerts} onChange={event => setPreferences({ ...preferences, courseAlerts: event.target.checked })} /></label>
                  <label><span><strong>خبرنامه هفتگی</strong><small>فعلاً ارسال ایمیل فعال نیست؛ فقط ترجیح شما ذخیره می‌شود.</small></span><input type="checkbox" checked={preferences.newsletter} onChange={event => setPreferences({ ...preferences, newsletter: event.target.checked })} /></label>
                  <label><span><strong>پیشنهاد دوره در داشبورد</strong><small>نمایش یا پنهان‌کردن دوره‌های پیشنهادی</small></span><input type="checkbox" checked={preferences.personalized} onChange={event => setPreferences({ ...preferences, personalized: event.target.checked })} /></label>
                </div>
                <p className="dialog-description" role="status">{preferencesError ? 'ذخیره در مرورگر امکان‌پذیر نیست.' : 'تغییرات به‌صورت خودکار در همین مرورگر ذخیره می‌شوند.'}</p>
                <button className="dialog-primary full" onClick={() => setDialog(null)}>انجام شد</button>
              </>
            )}
        </Modal>
      )}

      {notice && (
        <div className="toast" role="status">
          <Sparkles size={17} />
          {notice}
        </div>
      )}
    </div>
  )
}
