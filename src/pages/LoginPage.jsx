import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { User } from 'lucide-react'

// Demo build: there is no account system. The "name" is a local nickname
// that namespaces projects in this browser's localStorage.
const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, loading } = useApp()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('닉네임을 입력해주세요. / Please enter a nickname.')
      return
    }

    try {
      setError('')
      await login(username.trim())
      navigate('/projects')
    } catch (error) {
      console.error('로그인 실패:', error)
      setError(error.message || '로그인에 실패했습니다.')
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <User size={48} className="login-icon" />
          <h1>에이전트 협상 시뮬레이터</h1>
          <p>로컬 닉네임을 입력하여 계속하세요 / Enter a local nickname to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="닉네임 / Nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
            autoFocus
            required
            disabled={loading}
          />
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? '입장 중...' : '입장 / Enter'}
          </button>
        </form>

        <p className="login-note">
          비밀번호는 없습니다. 닉네임은 이 브라우저 안에서 프로젝트를 구분하는 용도로만 쓰이며,
          모든 데이터는 localStorage에 저장됩니다.
          <br />
          No password, no account. The nickname only labels your projects in this
          browser; everything is stored in localStorage.
        </p>
      </div>
    </div>
  )
}

export default LoginPage
