import test, { beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { MemoryRouter } from 'react-router'
import { renderToString } from 'react-dom/server'
import ToolWorkspace from './ToolWorkspace'
import LearningCourse from './LearningCourse'
import App from './App'
import SectionPage from './pages/SectionPage'

const store = new Map<string, string>()
Object.assign(globalThis, {
  IS_REACT_ACT_ENVIRONMENT: true,
  localStorage: { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) },
  window: Object.assign(new EventTarget(), { scrollTo: () => {}, confirm: () => true }),
})
beforeEach(() => store.clear())
const event = (value: unknown) => ({ target: { value }, preventDefault() {} })

test('tool workflow generates, edits, saves and restores drafts after remount', async () => {
  let view!: ReactTestRenderer
  await act(async () => { view = create(createElement(ToolWorkspace, { id: 'lesson' })) })
  await act(async () => { view.root.findAllByType('textarea')[0].props.onChange(event('فتوسنتز')) })
  await act(async () => { view.root.findByType('form').props.onSubmit(event('')) })
  const editor = view.root.findByProps({ 'aria-label': 'ویرایش خروجی' })
  assert.ok(editor.props.value.includes('فتوسنتز'))
  await act(async () => { editor.props.onChange(event('پیش‌نویس ویرایش‌شده')) })
  const save = view.root.findAllByType('button').find(button => button.children.includes(' ذخیره'))!
  await act(async () => save.props.onClick())
  const drafts = JSON.parse(store.get('smartteacher:drafts')!)
  assert.equal(drafts[0].text, 'پیش‌نویس ویرایش‌شده')
  await act(async () => view.unmount())
  await act(async () => { view = create(createElement(ToolWorkspace, { id: 'lesson' })) })
  assert.ok(JSON.stringify(view.toJSON()).includes('فتوسنتز'))
  await act(async () => view.unmount())
})

test('learning path persists completed lessons and advances content', async () => {
  let view!: ReactTestRenderer
  await act(async () => { view = create(createElement(LearningCourse, { courseId: 'ai' })) })
  const finish = view.root.findAllByType('button').find(button => button.children.includes('خواندم و تمرین را انجام دادم'))!
  await act(async () => finish.props.onClick())
  assert.deepEqual(JSON.parse(store.get('smartteacher:lessons')!), ['ai:0'])
  assert.equal(view.root.findByType('progress').props.value, 1)
  const next = view.root.findByProps({ className: 'next-lesson' })
  await act(async () => next.props.onClick())
  assert.equal(view.root.findByProps({ className: 'lesson-body' }).findByType('h3').children.join(''), 'نوشتن درخواست روشن')
  await act(async () => view.unmount())
})

test('catalog search shows an empty state and can reset', async () => {
  let view!: ReactTestRenderer
  await act(async () => { view = create(createElement(MemoryRouter, null, createElement(SectionPage, { section: 'tools' }))) })
  assert.equal(view.root.findAllByProps({ className: 'page-card tool-page-card' }).length, 6)
  await act(async () => view.root.findByProps({ id: 'catalog-search' }).props.onChange(event('نتیجه ناموجود')))
  assert.equal(view.root.findAllByProps({ className: 'page-card tool-page-card' }).length, 0)
  assert.equal(view.root.findAllByProps({ className: 'empty-state' }).length, 1)
  await act(async () => view.root.findByProps({ className: 'empty-state' }).findByType('button').props.onClick())
  assert.equal(view.root.findAllByProps({ className: 'page-card tool-page-card' }).length, 6)
  await act(async () => view.unmount())
})

test('all pages render without a browser and disclose local mode', () => {
  const home = renderToString(createElement(MemoryRouter, null, createElement(App)))
  assert.ok(home.includes('SmartTeacherAI'))
  assert.ok(home.includes('حساب آنلاین و پرداخت فعال نیست'))
  for (const section of ['tools', 'courses', 'resources', 'blog', 'not-found'] as const) {
    const html = renderToString(createElement(MemoryRouter, null, createElement(SectionPage, { section })))
    assert.ok(html.includes('dir="rtl"'))
    assert.ok(!html.includes('undefined'))
  }
})

test('malformed local storage cannot crash a workspace', () => {
  store.set('smartteacher:drafts', '{bad json')
  const html = renderToString(createElement(ToolWorkspace, { id: 'quiz' }))
  assert.ok(html.includes('هنوز پیش‌نویسی ذخیره نکرده‌اید'))
})
