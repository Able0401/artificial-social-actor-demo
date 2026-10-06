import { Link } from 'react-router-dom'
import { LangToggle, useLang, tr } from '../lib/i18n'

// Landing page: what the research is, one figure, and the way into the demo.
const REPO = 'https://github.com/Able0401/artificial-social-actor-demo'

const FIELDS = [
  {
    key: 'P',
    name: { en: 'Position', ko: '입장 (Position)' },
    text: { en: 'What you ask for out loud.', ko: '겉으로 요구하는 것.' }
  },
  {
    key: 'I',
    name: { en: 'Interest', ko: '이해관계 (Interest)' },
    text: { en: 'Why you ask for it. Your agent knows; the other side does not.', ko: '그것을 원하는 이유. 내 에이전트만 알고 상대는 모릅니다.' }
  },
  {
    key: 'D',
    name: { en: 'Disclosure strategy', ko: '공개 전략 (Disclosure)' },
    text: { en: 'What your agent may reveal, and when.', ko: '무엇을 언제까지 밝혀도 되는지.' }
  },
  {
    key: 'R',
    name: { en: 'Inference strategy', ko: '추론 전략 (Inference)' },
    text: { en: "How your agent reads the other side's moves.", ko: '상대의 말을 어떻게 읽을지.' }
  }
]

export default function HomePage() {
  const { lang } = useLang()
  const t = (en, ko) => tr(lang, { en, ko })
  const figure = `${import.meta.env.BASE_URL}figure.jpg`

  return (
    <div className="home">
      <header className="home-bar">
        <span className="home-brand">ASA</span>
        <LangToggle inline />
      </header>

      <main className="home-main">
        <section className="home-hero">
          <p className="home-kicker">{t("Master's thesis · KAIST Industrial Design · 2025", 'KAIST 산업디자인학과 석사논문 · 2025')}</p>
          <h1>
            {t(
              'When I Need a Stand-in: Building Artificial Social Actors for Negotiation with User-Guided Inference and Disclosure',
              '대역이 필요할 때: 사용자가 조정하는 추론과 정보 공개 기반 협상 에이전트 설계 연구'
            )}
          </h1>
          <p className="home-byline">
            <a href="https://hyunseungmoon.net" target="_blank" rel="noreferrer">Hyun Seung Moon</a>
            <span>·</span>
            {t('Advisor: Tak Yeon Lee', '지도교수: 이탁연')}
          </p>
          <div className="home-actions">
            <Link className="home-btn primary" to="/demo">{t('Try the demo', '데모 해보기')}</Link>
            <a className="home-btn" href={REPO} target="_blank" rel="noreferrer">{t('Code ↗', '코드 ↗')}</a>
          </div>
        </section>

        <figure className="home-figure">
          <img src={figure} alt={t('The demo after one run', '한 번 실행한 뒤의 데모 화면')} />
          <figcaption>
            {t(
              "The demo after one run. Your agent's settings are on the left, the opponent on the right, and the reasoning behind each of your agent's messages is shown under it.",
              '한 번 실행한 뒤의 화면. 왼쪽이 내 에이전트 설정, 오른쪽이 상대, 내 에이전트의 발언마다 그 판단 근거가 아래에 붙습니다.'
            )}
          </figcaption>
        </figure>

        <section className="home-section">
          <h2>{t('Try the demo', '데모 해보기')}</h2>
          <p>
            {t(
              'Tell an AI agent how to negotiate for you, then watch it negotiate with another agent. An example is ready: your agent is selling a used laptop. Press Run; a dialogue takes about two minutes.',
              'AI 에이전트에게 협상 방법을 알려주고, 상대 에이전트와 대신 협상하는 모습을 봅니다. 중고 노트북을 파는 예시가 준비되어 있습니다. Run을 누르면 2분쯤 걸립니다.'
            )}
          </p>
          <Link className="home-btn primary" to="/demo">{t('Open the example', '예시 열기')}</Link>
        </section>

        <section className="home-section">
          <h2>{t('Four instructions for your agent', '내 에이전트에게 주는 지시 네 가지')}</h2>
          <div className="home-cards">
            {FIELDS.map((f) => (
              <div className="home-card" key={f.key}>
                <span className="home-card-key">{f.key}</span>
                <div>
                  <strong>{tr(lang, f.name)}</strong>
                  <p>{tr(lang, f.text)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="home-note">
            {t(
              'The opponent is played by the same model. It reads only the shared situation and the dialogue, and you choose its style: Cunning or Desperate.',
              '상대도 같은 모델이 맡습니다. 공유된 상황과 대화만 읽고, 성향은 Cunning과 Desperate 중에서 고릅니다.'
            )}
          </p>
        </section>

        <section className="home-section">
          <h2>{t('Abstract', '초록')}</h2>
          <p className="home-abstract">
            {t(
              'LLMs can now hold a strategic conversation well enough that handing one a negotiation is a real option, but little is known about how people want to hand it over. This thesis asks how a user should steer two things: how the agent reads the other party (inference) and how much of the user\'s own situation it reveals (disclosure), and how that steering changes with the kind of negotiation.',
              'LLM이 전략적인 대화를 해낼 만큼 좋아지면서 협상을 AI에게 맡기는 일이 현실적인 선택지가 되었지만, 사람들이 그것을 어떻게 맡기고 싶어 하는지는 잘 알려져 있지 않다. 이 논문은 사용자가 에이전트의 상대 읽기(추론)와 자기 사정 밝히기(정보 공개)를 어떻게 조정해야 하는지, 그리고 그 조정이 협상 종류에 따라 어떻게 달라지는지 묻는다.'
            )}
          </p>
          <p className="home-abstract">
            {t(
              'Position and interest come from principled negotiation (Fisher and Ury, Getting to Yes); disclosure and inference strategy are what the thesis studies. In the user study, 12 participants set up an agent for three negotiations they would like to hand off, ran the simulation, revised their settings, ran it again and were interviewed. This demo uses the study\'s interface, prompts and model (grok-4-0709).',
              '입장과 이해관계는 원칙 협상(Fisher와 Ury, Getting to Yes)에서 가져왔고, 공개 전략과 추론 전략이 이 논문이 다루는 부분이다. 사용자 연구에서 참가자 12명이 맡기고 싶은 협상 세 가지에 에이전트를 설정해 실행하고, 설정을 고쳐 다시 실행한 뒤 인터뷰했다. 이 데모는 연구 때의 인터페이스, 프롬프트, 모델(grok-4-0709)을 그대로 쓴다.'
            )}
          </p>
        </section>
      </main>

      <footer className="home-footer">
        <span>© 2025 Hyun Seung Moon</span>
        <a href={REPO} target="_blank" rel="noreferrer">github.com/Able0401/artificial-social-actor-demo</a>
      </footer>
    </div>
  )
}
