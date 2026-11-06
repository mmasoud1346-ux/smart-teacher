import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMaterial, learningCourses, normalizeSearch, resourceLibrary, resolveTool, toolCatalog } from './content'
import { isDrafts, isPreferences, isProfile, isStringArray } from './storage'

for (const tool of toolCatalog) {
  test(`${tool.id}: builds topic-specific, transparent material`, () => {
    const output = buildMaterial(tool.id, { topic: 'فتوسنتز', audience: 'پایه هفتم', duration: 45 })
    assert.ok(output.includes('فتوسنتز'))
    assert.ok(output.includes('پایه هفتم'))
    assert.ok(output.includes('پیش‌نویس قالبی'))
    assert.ok(output.length > 350)
  })
}
test('each tool produces a different output', () => {
  const outputs = toolCatalog.map(tool => buildMaterial(tool.id, { topic: 'کسر', audience: 'ابتدایی', duration: 40 }))
  assert.equal(new Set(outputs).size, toolCatalog.length)
})
test('rejects blank topics, invalid durations and oversized input', () => {
  for (const topic of ['', '  ', 'a'.repeat(4001)]) assert.throws(() => buildMaterial('lesson', { topic, audience: '', duration: 45 }))
  for (const duration of [NaN, 9, 181, 15.5]) assert.throws(() => buildMaterial('lesson', { topic: 'علوم', audience: '', duration }))
})
test('lesson timing sums exactly to the requested duration', () => {
  for (const duration of [10, 45, 67, 180]) {
    const output = buildMaterial('lesson', { topic: 'علوم', audience: '', duration })
    const minutes = [...output.matchAll(/— (\d+) دقیقه/g)].map(match => Number(match[1]))
    assert.equal(minutes.reduce((a, b) => a + b, 0), duration)
  }
})
test('analysis describes observable structural checks rather than AI judgment', () => {
  const output = buildMaterial('analysis', { topic: 'هدف درس: یک مثال و تمرین همراه ارزیابی و منبع', audience: 'مدرس', duration: 30 })
  assert.ok(output.includes('۵') || output.includes('5 از ۵'))
  assert.ok(output.includes('صحت علمی یا کیفیت معنایی'))
})
test('Persian search normalizes Arabic letters, spacing and casing', () => {
  assert.equal(normalizeSearch('  كاربرد يک AI  '), normalizeSearch('کاربرد یک ai'))
  assert.equal(normalizeSearch('طرح‌درس'), normalizeSearch('طرح درس'))
})
test('dashboard tool titles map to their actual workflows', () => {
  assert.equal(resolveTool('طراحی آزمون و سؤال'), 'quiz')
  assert.equal(resolveTool('آنالیز و بهینه‌سازی محتوا'), 'analysis')
  assert.equal(resolveTool('سناریوی ویدیوی آموزشی'), 'video')
  assert.equal(resolveTool('تولید طرح درس با AI'), 'lesson')
  assert.equal(resolveTool('ایجاد جزوه و منابع'), 'content')
})
test('resources contain real text and unique downloadable filenames', () => {
  assert.equal(new Set(resourceLibrary.map(r => r.filename)).size, resourceLibrary.length)
  for (const resource of resourceLibrary) {
    assert.ok(resource.body.length > 150)
    assert.match(resource.filename, /\.(txt|csv)$/)
  }
})
test('every learning path has three substantive lessons', () => {
  for (const course of learningCourses) {
    assert.equal(course.lessons.length, 3)
    assert.ok(course.lessons.every(lesson => lesson.body.length > 150))
  }
})
test('local storage rejects corrupted data shapes and invalid dates', () => {
  assert.equal(isProfile(null), false)
  assert.equal(isProfile({ name: 42, specialty: 'علوم' }), false)
  assert.equal(isProfile({ name: 'مدرس', specialty: 'علوم' }), true)
  assert.equal(isPreferences({}), false)
  assert.equal(isStringArray(['ai:0']), true)
  assert.equal(isStringArray([false]), false)
  assert.equal(isDrafts([{ id: '1', title: 'درس', text: 'متن', created: 'invalid' }]), false)
  assert.equal(isDrafts([{ id: '1', title: 'درس', text: 'متن', created: new Date().toISOString() }]), true)
})
