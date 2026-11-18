import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './index.css'

class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="fallback-page" dir="rtl">
        <h1>بارگذاری برنامه انجام نشد</h1>
        <p>مرورگر شما با بخشی از این برنامه سازگار نیست. صفحه را دوباره باز کنید؛ اگر مشکل ادامه داشت، از مرورگر به‌روزتری استفاده کنید.</p>
        <button onClick={() => window.location.reload()}>بارگذاری دوباره</button>
      </main>
    )
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
)
