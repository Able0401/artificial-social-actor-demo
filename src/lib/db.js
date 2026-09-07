// Local, browser-only storage for the ASA demo.
//
// The research prototype stored users, projects and conversations in
// Supabase. The demo keeps the same `db` surface but backs it with
// localStorage so nothing ever leaves the visitor's browser.
//
// Storage keys:
//   asa.user                 -> current nickname (string)
//   asa.projects.<nickname>  -> array of projects in app format

const USER_KEY = 'asa.user'
const projectsKey = (username) => `asa.projects.${username}`

const safeGet = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch (error) {
    console.warn('localStorage write failed:', error)
  }
}

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

const readProjects = (username) => {
  const raw = safeGet(projectsKey(username))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeProjects = (username, projects) => {
  safeSet(projectsKey(username), JSON.stringify(projects))
}

const newId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const db = {
  // Users -------------------------------------------------------------
  // There is no user table any more. A "user" is just a nickname that
  // namespaces projects in localStorage.
  async getUser(username) {
    return username ? { id: username, username } : null
  },

  async createUser(username) {
    return { id: username, username }
  },

  getSavedUser() {
    return safeGet(USER_KEY)
  },

  saveUser(username) {
    if (username) safeSet(USER_KEY, username)
    else safeRemove(USER_KEY)
  },

  // Projects ----------------------------------------------------------
  // Projects are stored in the app's own camelCase shape; the Supabase
  // snake_case conversion is gone.
  async getUserProjects(username) {
    return readProjects(username)
  },

  async createProject(username, projectData) {
    const project = {
      id: newId('project'),
      createdAt: new Date().toISOString(),
      createdBy: username,
      situation: '',
      myPosition: '',
      myInterest: '',
      myDisclosureStrategy: '',
      myInferenceStrategy: '',
      opponentType: '',
      rounds: [],
      currentRound: 1,
      conversations: [],
      ...projectData
    }
    const projects = readProjects(username)
    writeProjects(username, [...projects, project])
    return project
  },

  async updateProject(username, projectId, updates) {
    const projects = readProjects(username)
    let updated = null
    const next = projects.map((project) => {
      if (project.id !== projectId) return project
      updated = { ...project, ...updates, updatedAt: new Date().toISOString() }
      return updated
    })
    writeProjects(username, next)
    return updated
  },

  async deleteProject(username, projectId) {
    const projects = readProjects(username)
    writeProjects(username, projects.filter((p) => p.id !== projectId))
  },

  // Conversations -----------------------------------------------------
  // Conversations live inside project.rounds[].conversations, so this is
  // only kept for API compatibility with the research code.
  async saveConversations(username, projectId, roundId, conversations) {
    const projects = readProjects(username)
    const next = projects.map((project) => {
      if (project.id !== projectId) return project
      const rounds = (project.rounds || []).map((round) =>
        round.id === roundId ? { ...round, conversations } : round
      )
      return { ...project, rounds, conversations }
    })
    writeProjects(username, next)
    return conversations
  },

  // Wipe everything the demo stored for this nickname.
  clearUserData(username) {
    safeRemove(projectsKey(username))
  }
}
