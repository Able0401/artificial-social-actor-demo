import { useEffect, useState } from 'react'
import { Settings, Eye, EyeOff, X } from 'lucide-react'
import {
  DEFAULT_MODEL,
  XAI_BASE_URL,
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  hasApiKey
} from '../lib/settings'

const CUSTOM = '__custom__'

// Modal where the visitor pastes their own xAI API key.
// `open` / `onClose` are controlled by the parent; `onSaved` fires after
// a successful save or clear so the parent can refresh its own state.
export const SettingsPanel = ({ open, onClose, onSaved }) => {
  const [apiKey, setApiKeyState] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [modelChoice, setModelChoice] = useState(DEFAULT_MODEL)
  const [customModel, setCustomModel] = useState('')
  const [notice, setNotice] = useState('')

  // Reload stored values every time the panel opens.
  useEffect(() => {
    if (!open) return
    const storedModel = getModel()
    setApiKeyState(getApiKey())
    setShowKey(false)
    setNotice('')
    if (storedModel === DEFAULT_MODEL) {
      setModelChoice(DEFAULT_MODEL)
      setCustomModel('')
    } else {
      setModelChoice(CUSTOM)
      setCustomModel(storedModel)
    }
  }, [open])

  if (!open) return null

  const resolvedModel =
    modelChoice === CUSTOM ? customModel.trim() || DEFAULT_MODEL : DEFAULT_MODEL

  const handleSave = (e) => {
    e.preventDefault()
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setNotice('API 키를 입력해주세요. / Please paste an API key.')
      return
    }
    setApiKey(trimmed)
    setModel(resolvedModel)
    setNotice('')
    onSaved?.()
    onClose()
  }

  const handleClear = () => {
    if (!confirm('저장된 API 키를 브라우저에서 삭제할까요?\nRemove the stored API key from this browser?')) return
    setApiKey('')
    setModel(DEFAULT_MODEL)
    setApiKeyState('')
    setModelChoice(DEFAULT_MODEL)
    setCustomModel('')
    onSaved?.()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-panel-header">
          <h2>설정 / Settings</h2>
          <button type="button" className="settings-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <label className="settings-label" htmlFor="asa-api-key">
            xAI API Key
          </label>
          <div className="settings-key-row">
            <input
              id="asa-api-key"
              type={showKey ? 'text' : 'password'}
              className="project-name-input settings-key-input"
              placeholder="xai-..."
              value={apiKey}
              onChange={(e) => setApiKeyState(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <button
              type="button"
              className="settings-eye"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="settings-help">
            키는{' '}
            <a href="https://console.x.ai" target="_blank" rel="noreferrer">
              console.x.ai
            </a>
            에서 발급받을 수 있습니다. / Get a key at console.x.ai.
          </p>

          <label className="settings-label" htmlFor="asa-model">
            Model
          </label>
          <select
            id="asa-model"
            className="project-name-input settings-select"
            value={modelChoice}
            onChange={(e) => setModelChoice(e.target.value)}
          >
            <option value={DEFAULT_MODEL}>{DEFAULT_MODEL} (used in the paper)</option>
            <option value={CUSTOM}>Other xAI model id…</option>
          </select>
          {modelChoice === CUSTOM && (
            <input
              type="text"
              className="project-name-input settings-custom-model"
              placeholder="e.g. grok-4-latest"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              spellCheck={false}
            />
          )}

          <p className="settings-notice">
            Your key is saved in this browser&apos;s localStorage and sent only to{' '}
            <code>api.x.ai</code>. / 키는 이 브라우저의 localStorage에 저장되고 xAI API로만 전송됩니다.
          </p>

          {notice && <div className="error-message">{notice}</div>}

          <div className="modal-actions">
            {hasApiKey() && (
              <button type="button" className="settings-clear" onClick={handleClear}>
                키 삭제 / Clear key
              </button>
            )}
            <button type="button" className="cancel-button" onClick={onClose}>
              취소 / Cancel
            </button>
            <button type="submit" className="create-button">
              저장 / Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Gear button that owns its own panel. Drop it into any header.
export const SettingsButton = ({ onSaved, className = '' }) => {
  const [open, setOpen] = useState(false)
  const [configured, setConfigured] = useState(hasApiKey())

  const handleSaved = () => {
    setConfigured(hasApiKey())
    onSaved?.()
  }

  return (
    <>
      <button
        type="button"
        className={`settings-button ${configured ? '' : 'settings-button-missing'} ${className}`}
        onClick={() => setOpen(true)}
        title={configured ? 'API key set' : 'API key not set'}
      >
        <Settings size={18} />
        <span>API Key{configured ? '' : ' 필요 / needed'}</span>
      </button>
      <SettingsPanel open={open} onClose={() => setOpen(false)} onSaved={handleSaved} />
    </>
  )
}

export default SettingsButton
