import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'
import { db } from '../lib/db'
import { EXAMPLE, exampleFields } from '../lib/example'
import { useLang, tr } from '../lib/i18n'

// Landing route. Visitors skip the nickname and project list: a guest
// profile and one example project are made on first visit, and the page
// opens straight on the negotiation screen.
const GUEST = 'guest'

export default function StartPage() {
  const navigate = useNavigate()
  const { login } = useApp()
  const { lang } = useLang()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const user = db.getSavedUser() || GUEST
      await login(user)
      const projects = await db.getUserProjects(user)
      let project = projects.find((p) => p.example) || projects[0]
      if (!project) {
        await db.createProject(user, { name: (EXAMPLE[lang] || EXAMPLE.en).name, example: true, ...exampleFields(lang) })
        await login(user) // reload the project list into context
        project = (await db.getUserProjects(user))[0]
      }
      if (cancelled) return
      if (!project) setFailed(true) // browser storage is blocked
      else navigate(`/simulation/${project.id}`, { replace: true })
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="start-page">
      {failed
        ? tr(lang, {
            en: 'This demo keeps your settings in browser storage, which is blocked in this window. Open the page in a normal (not private) window.',
            ko: '이 데모는 설정을 브라우저 저장소에 보관하는데, 이 창에서는 막혀 있습니다. 일반(비공개가 아닌) 창에서 열어주세요.'
          })
        : tr(lang, { en: 'Loading the example…', ko: '예시를 불러오는 중…' })}
    </div>
  )
}
