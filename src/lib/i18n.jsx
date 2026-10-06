/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

// UI and prompt language. 'en' (default) shows English only and asks the
// model to answer in English; 'ko' keeps the original Korean study setup.
const STORAGE_KEY = 'asa.lang'
export const LANGS = ['en', 'ko']

const readLang = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return LANGS.includes(v) ? v : 'en'
  } catch {
    return 'en'
  }
}

const LangContext = createContext({ lang: 'en', setLang: () => {} })

export const LangProvider = ({ children }) => {
  const [lang, setLangState] = useState(readLang)

  useEffect(() => {
    try { document.documentElement.lang = lang } catch { /* ignore */ }
  }, [lang])

  const setLang = (next) => {
    if (!LANGS.includes(next)) return
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)

// Pick the string for the current language: tr(lang, { en: '...', ko: '...' }).
export const tr = (lang, strings) => strings[lang] ?? strings.en

// Two-option switch. Pages place it in their own header (inline).
export const LangToggle = ({ inline = false }) => {
  const { lang, setLang } = useLang()
  return (
    <div className={`lang-toggle${inline ? ' inline' : ''}`} role="group" aria-label="Language">
      <button
        type="button"
        className={lang === 'en' ? 'active' : ''}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === 'ko' ? 'active' : ''}
        aria-pressed={lang === 'ko'}
        onClick={() => setLang('ko')}
      >
        KO
      </button>
    </div>
  )
}
