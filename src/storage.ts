import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export function useLocalState<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const read = () => {
    try {
      const raw = localStorage.getItem(`smartteacher:${key}`)
      const value: unknown = raw ? JSON.parse(raw) : initial
      return validate(value) ? value : initial
    } catch { return initial }
  }
  const [value, setValue] = useState<T>(read)
  const [storageError, setStorageError] = useState(false)
  useEffect(() => {
    const sync = () => setValue(read())
    window.addEventListener('storage', sync)
    window.addEventListener(`smartteacher:${key}`, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(`smartteacher:${key}`, sync)
    }
  }, [key])
  const update: Dispatch<SetStateAction<T>> = next => {
    const result = typeof next === 'function' ? (next as (previous: T) => T)(value) : next
    setValue(result)
    try {
      localStorage.setItem(`smartteacher:${key}`, JSON.stringify(result))
      setStorageError(false)
      window.dispatchEvent(new Event(`smartteacher:${key}`))
    } catch { setStorageError(true) }
  }
  return [value, update, storageError] as const
}
export type Profile = { name: string; specialty: string }
export const defaultProfile: Profile = { name: 'مدرس عزیز', specialty: 'آموزش و تولید محتوا' }
export const isProfile = (value: unknown): value is Profile => typeof value === 'object' && value !== null && 'name' in value && typeof value.name === 'string' && 'specialty' in value && typeof value.specialty === 'string'
export const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === 'string')
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
export type Preferences = { courseAlerts: boolean; newsletter: boolean; personalized: boolean }
export const defaultPreferences: Preferences = { courseAlerts: true, newsletter: false, personalized: true }
export const isPreferences = (value: unknown): value is Preferences => typeof value === 'object' && value !== null && ['courseAlerts', 'newsletter', 'personalized'].every(key => typeof (value as Record<string, unknown>)[key] === 'boolean')
export type Draft = { id: string; title: string; text: string; created: string }
export const isDrafts = (value: unknown): value is Draft[] => Array.isArray(value) && value.every(v => v && ['id', 'title', 'text', 'created'].every(k => typeof v[k] === 'string') && Number.isFinite(Date.parse(v.created)))
