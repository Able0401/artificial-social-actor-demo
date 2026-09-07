// Bring-your-own-key settings for the ASA demo.
//
// The xAI API key is never read from the build environment. The visitor
// pastes it into the settings panel and it is kept in localStorage under
// `asa.apiKey`. The only place it is sent is https://api.x.ai/v1 (see
// SimulationPage.jsx).

export const API_KEY_STORAGE_KEY = 'asa.apiKey'
export const MODEL_STORAGE_KEY = 'asa.model'
export const XAI_BASE_URL = 'https://api.x.ai/v1'

// The model used in the research study. Keep this as the default so the
// demo reproduces the paper's setup.
export const DEFAULT_MODEL = 'grok-4-0709'

const read = (key) => {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

const write = (key, value) => {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch (error) {
    console.warn('localStorage write failed:', error)
  }
}

export const getApiKey = () => read(API_KEY_STORAGE_KEY).trim()
export const setApiKey = (value) => write(API_KEY_STORAGE_KEY, (value || '').trim())
export const hasApiKey = () => getApiKey().length > 0

export const getModel = () => read(MODEL_STORAGE_KEY).trim() || DEFAULT_MODEL
export const setModel = (value) => {
  const model = (value || '').trim()
  // Store nothing when the default is chosen so a later default change
  // propagates automatically.
  write(MODEL_STORAGE_KEY, model === DEFAULT_MODEL ? '' : model)
}

// Show only the tail of the key in the UI.
export const maskApiKey = (key) => {
  if (!key) return ''
  if (key.length <= 8) return '*'.repeat(key.length)
  return `${key.slice(0, 4)}…${key.slice(-4)}`
}
