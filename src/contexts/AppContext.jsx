import { createContext, useContext, useState, useCallback } from 'react'
import { db } from '../lib/db'

// Demo build: every read/write goes to localStorage through `db`.
// The research prototype talked to Supabase here; that path is gone.

const AppContext = createContext()

// eslint-disable-next-line react-refresh/only-export-components
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

const emptyProject = (name, username) => ({
  name,
  createdBy: username,
  situation: '',
  myPosition: '',
  myInterest: '',
  myDisclosureStrategy: '',
  myInferenceStrategy: '',
  opponentType: '',
  rounds: [],
  currentRound: 1,
  conversations: []
})

export const AppProvider = ({ children }) => {
  // Restore the last nickname synchronously so a page reload on
  // /simulation/:id does not bounce the visitor back to /login.
  const [currentUser, setCurrentUser] = useState(() => db.getSavedUser())
  const [projects, setProjects] = useState(() => {
    const saved = db.getSavedUser()
    return saved ? readProjectsSync(saved) : []
  })
  const [loading, setLoading] = useState(false)

  // localStorage is synchronous, so this is just the async wrapper the
  // pages already expect.
  const loadUserProjects = useCallback(async () => {
    if (!currentUser) {
      setProjects([])
      return
    }
    try {
      setLoading(true)
      const userProjects = await db.getUserProjects(currentUser)
      setProjects(userProjects)
      console.log('✅ 프로젝트 로딩 완료:', userProjects.length, '개')
    } catch (error) {
      console.error('❌ 프로젝트 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  const login = async (username) => {
    const name = (username || '').trim()
    if (!name) {
      throw new Error('닉네임을 입력해주세요.')
    }
    try {
      setLoading(true)
      console.log('👤 로컬 닉네임 로그인:', name)
      db.saveUser(name)
      const userProjects = await db.getUserProjects(name)
      setCurrentUser(name)
      setProjects(userProjects)
      return { id: name, username: name }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    console.log('👤 로그아웃 (로컬 데이터는 브라우저에 남습니다)')
    db.saveUser(null)
    setCurrentUser(null)
    setProjects([])
  }

  const createProject = async (projectName) => {
    if (!currentUser) throw new Error('로그인이 필요합니다.')
    try {
      setLoading(true)
      const newProject = await db.createProject(currentUser, emptyProject(projectName, currentUser))
      setProjects((prev) => [...prev, newProject])
      console.log('✅ 프로젝트 생성 완료:', newProject)
      return newProject
    } catch (error) {
      console.error('❌ 프로젝트 생성 오류:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (projectId, updates) => {
    if (!currentUser) return
    try {
      console.log('💾 프로젝트 업데이트:', { projectId, updatesKeys: Object.keys(updates) })
      await db.updateProject(currentUser, projectId, updates)
      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectId ? { ...project, ...updates } : project
        )
      )
    } catch (error) {
      console.error('❌ 프로젝트 업데이트 오류:', error)
      throw error
    }
  }

  const deleteProject = async (projectId) => {
    if (!currentUser) return
    try {
      setLoading(true)
      await db.deleteProject(currentUser, projectId)
      setProjects((prev) => prev.filter((project) => project.id !== projectId))
      console.log('✅ 프로젝트 삭제 완료')
    } catch (error) {
      console.error('❌ 프로젝트 삭제 오류:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getProject = (projectId) => {
    const project = projects.find((project) => project.id === projectId)
    console.log('📂 프로젝트 조회:', { projectId, found: !!project })
    return project
  }

  const value = {
    currentUser,
    currentUserId: currentUser,
    projects,
    loading,
    login,
    logout,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    loadUserProjects
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Synchronous read used only for the initial state.
function readProjectsSync(username) {
  try {
    const raw = localStorage.getItem(`asa.projects.${username}`)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}
