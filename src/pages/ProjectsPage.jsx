import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { Plus, Folder, Trash2, LogOut, Clock } from 'lucide-react'
import { SettingsButton } from '../components/SettingsPanel'

const ProjectsPage = () => {
  const navigate = useNavigate()
  const { currentUser, projects, createProject, deleteProject, logout } = useApp()
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login')
    }
  }, [currentUser, navigate])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    
    try {
      setIsCreating(true)
      const newProject = await createProject(newProjectName.trim())
      setNewProjectName('')
      setShowNewProject(false)
      navigate(`/simulation/${newProject.id}`)
    } catch (error) {
      console.error('프로젝트 생성 실패:', error)
      alert('프로젝트 생성에 실패했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  return (
    <div className="projects-container">
      <header className="projects-header">
        <div className="header-content">
          <div>
            <p className="app-name">Artificial Social Actor</p>
            <h1>프로젝트 <span className="label-en">Projects</span></h1>
          </div>
          <div className="header-user">
            <span>환영합니다, {currentUser}님</span>
            <SettingsButton />
            <button onClick={handleLogout} className="logout-button">
              <LogOut size={20} />
              로그아웃 / Log out
            </button>
          </div>
        </div>
      </header>

      <main className="projects-main">
        <div className="projects-actions">
          <button 
            onClick={() => setShowNewProject(true)} 
            className="new-project-button"
          >
            <Plus size={20} />
            새 프로젝트 / New project
          </button>
        </div>

        {showNewProject && (
          <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>새 프로젝트 만들기 / New project</h2>
              <form onSubmit={handleCreateProject}>
                  <input
                    type="text"
                    placeholder="프로젝트 이름 / Project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="project-name-input"
                    autoFocus
                    required
                    disabled={isCreating}
                  />
                  <div className="modal-actions">
                    <button type="button" onClick={() => {
                      setShowNewProject(false)
                      setNewProjectName('')
                    }} className="cancel-button" disabled={isCreating}>
                      취소
                    </button>
                    <button type="submit" className="create-button" disabled={isCreating}>
                      {isCreating ? '생성 중...' : '만들기'}
                    </button>
                  </div>
              </form>
            </div>
          </div>
        )}

        <div className="projects-grid">
          {projects.length === 0 ? (
            <div className="no-projects">
              <Folder size={64} />
              <p>아직 프로젝트가 없습니다 / No projects yet</p>
              <p className="hint">첫 번째 프로젝트를 만들어 시작하세요 / Create your first project to begin</p>
            </div>
          ) : (
            projects.map(project => (
              <div 
                key={project.id} 
                className="project-card"
                onClick={() => navigate(`/simulation/${project.id}`)}
              >
                <div className="project-card-header">
                  <Folder size={24} />
                  <button
                    aria-label="Delete project"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (confirm(`프로젝트 "${project.name}"을(를) 삭제하시겠습니까?`)) {
                        try {
                          await deleteProject(project.id)
                        } catch (error) {
                          console.error('프로젝트 삭제 실패:', error)
                          alert('프로젝트 삭제에 실패했습니다.')
                        }
                      }
                    }}
                    className="delete-project-button"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3>{project.name}</h3>
                <div className="project-meta">
                  <Clock size={14} />
                  <span>{formatDate(project.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default ProjectsPage
