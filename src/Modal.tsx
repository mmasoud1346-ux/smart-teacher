import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const dialog = ref.current!
    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [])
  return <dialog ref={ref} className="native-dialog" aria-label={title} onCancel={event => { event.preventDefault(); close.current() }} onClick={event => { if (event.target === ref.current) close.current() }}>
    <section className="dialog-card" onClick={event => event.stopPropagation()}>
      <button autoFocus className="dialog-close" aria-label="بستن پنجره" onClick={onClose}><X size={21} /></button>
      {children}
    </section>
  </dialog>
}
