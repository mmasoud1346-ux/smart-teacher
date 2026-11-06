import { useState } from 'react'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import { learningCourses } from './content'
import { isStringArray, useLocalState } from './storage'

export default function LearningCourse({ courseId }: { courseId: string }) {
  const course = learningCourses.find(item => item.id === courseId) ?? learningCourses[0]
  const [index, setIndex] = useState(0)
  const [completed, setCompleted, error] = useLocalState<string[]>('lessons', [], isStringArray)
  const progress = course.lessons.filter((_, i) => completed.includes(`${course.id}:${i}`)).length
  const lesson = course.lessons[index]
  return <>
    <img className="course-cover" src={course.image} alt="" />
    <span className="course-label">مسیر متنی رایگان · {course.level}</span>
    <h2>{course.title}</h2>
    <p className="dialog-description">۳ درس کوتاه همراه تمرین؛ این نسخه ویدیو یا گواهی پایان دوره ندارد. پیشرفت فقط در همین مرورگر ذخیره می‌شود.</p>
    <div className="course-progress"><label htmlFor="course-progress">{progress.toLocaleString('fa-IR')} از ۳ درس تکمیل شده</label><progress id="course-progress" max={3} value={progress} /></div>
    <div className="lesson-tabs" aria-label="درس‌های دوره">{course.lessons.map((item, i) => <button key={item.title} aria-pressed={index === i} className={index === i ? 'selected' : ''} onClick={() => setIndex(i)}>{completed.includes(`${course.id}:${i}`) ? <CheckCircle2 size={16} /> : <BookOpen size={16} />}{item.title}</button>)}</div>
    <article className="lesson-body"><h3>{lesson.title}</h3><p>{lesson.body}</p></article>
    <button className="dialog-primary full" disabled={completed.includes(`${course.id}:${index}`)} onClick={() => setCompleted([...new Set([...completed, `${course.id}:${index}`])])}>{completed.includes(`${course.id}:${index}`) ? 'این درس تکمیل شده است' : 'خواندم و تمرین را انجام دادم'}</button>
    {index < course.lessons.length - 1 && <button className="next-lesson" onClick={() => setIndex(index + 1)}>رفتن به درس بعدی ←</button>}
    {error && <p role="alert">ذخیرهٔ پیشرفت در مرورگر ممکن نیست.</p>}
  </>
}
