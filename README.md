# Artificial Social Actor (ASA) — public demo

ASA is a research prototype in which you delegate a negotiation to an AI agent.
You describe the situation and your side of it in four fields (position, interest,
disclosure strategy, inference strategy), pick an opponent persona, and watch your
agent negotiate with the opponent agent in real time, with your agent's private
reasoning shown under each of its turns. The prototype accompanies a research paper
on delegating negotiation to AI; this repository is a self-contained, try-it-yourself
version of the interface used in that study.

**Live demo:** <https://able0401.github.io/artificial-social-actor-demo/> (bring your own xAI key; nothing leaves your browser except your calls to the xAI API).

![screenshot placeholder](docs/screenshot.png)

<!-- Replace docs/screenshot.png with a real capture of the simulation page. -->

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). You will need an xAI API
key to generate dialogue; see [Bring your own key](#bring-your-own-key-byok).

## How to use

1. **Enter a nickname.** There is no account and no password. The nickname only
   labels your projects inside this browser.
2. **Create a project** and open it.
3. **Fill in the dealmaking context** (협상 상황): the scenario both agents share.
4. **Configure "My Agent"** with the four fields from the paper:
   - **Position (입장)** — the demand you state openly ("I want 450,000 won for
     this laptop").
   - **Interest (이해관계)** — the reason behind the position ("I need to sell soon
     but not too cheaply").
   - **Disclosure strategy (공개 전략)** — when and how much of your position and
     interest the agent should reveal.
   - **Inference strategy (추론 전략)** — how the agent should read the other
     side's true intent from what they say.
5. **Pick the opponent type.** *Cunning* plays a sly, aggressive counterpart;
   *Desperate* plays one who pleads and dramatises hardship. The opponent agent
   only sees the shared context and its persona, never your fields.
6. **Click "대화 생성 / Run".** The two agents alternate, your agent first, for up
   to 20 turns (10 each) or until one of them ends the conversation. Each turn is a
   separate model call, and messages appear as they arrive. Use **Stop** to abort
   mid-run.
7. **Read the reasoning.** Under each of your agent's messages a 💭 line shows the
   reasoning the model produced for that turn. The opponent's reasoning is
   generated too but hidden, as in the study.
8. **Rounds.** When a run finishes, the round is marked complete and a new round
   tab appears. Each round starts from an empty dialogue with the same settings,
   so you can edit your strategy and try again. **Reset** clears the current round.

The model prompt, the model (`grok-4-0709`), the temperature (0.7) and the
structured JSON output (`message` + `reasoning`) are the same as in the research
code, so what you see here matches the paper's setup.

## Bring your own key (BYOK)

The demo calls the xAI API directly from your browser. It ships without any key.

1. Create a key at <https://console.x.ai>.
2. In the app, click the **API Key** button (top right on the projects page and on
   the simulation page).
3. Paste the key and save. Optionally choose a different xAI model id; the default
   is `grok-4-0709`, the model used in the study.

The key is stored in your browser's `localStorage` under `asa.apiKey` and is sent
only to `https://api.x.ai/v1`. Usage is billed to your xAI account. Remove it any
time with **Clear key** in the same panel.

## Privacy

Everything stays in your browser. Nicknames, projects, dialogues and the API key
live in `localStorage`; there is no backend, no database and no analytics. The only
network traffic is your own requests to the xAI API. Clearing site data for the
page removes everything.

## Deploy your own

The build is static (`dist/`). `VITE_BASE_PATH` controls the URL prefix; keep the
default `/` unless you serve from a sub-path. A copy of `index.html` is written to
`dist/404.html` so client-side routes survive a refresh on static hosts.

### Vercel

1. Import the repository in Vercel; the included `vercel.json` sets the build
   command, output directory and the SPA rewrite.
2. No environment variables are needed. Deploy.

### GitHub Pages

The live demo is served from the `gh-pages` branch of this repository
(repository settings, **Pages**, source "Deploy from a branch", branch `gh-pages`,
folder `/`). To publish a fork the same way:

```bash
VITE_BASE_PATH=/<repo-name>/ npm run build
npx gh-pages -d dist --dotfiles
```

`--dotfiles` keeps the `.nojekyll` marker so Pages serves `dist/` as-is. You can
also put `VITE_BASE_PATH=/<repo-name>/` in a `.env` file (see `.env.example`)
instead of prefixing the build command.

## Project layout

```
src/
  components/SettingsPanel.jsx  BYOK settings modal + gear button
  contexts/AppContext.jsx       nickname + project state (localStorage)
  lib/db.js                     localStorage-backed replacement for the study DB
  lib/settings.js               API key / model storage helpers
  pages/LoginPage.jsx           nickname entry
  pages/ProjectsPage.jsx        project list
  pages/SimulationPage.jsx      the negotiation interface and model calls
```

## License

MIT. See [LICENSE](LICENSE).

---

## 한국어 안내

ASA(Artificial Social Actor)는 협상을 AI 에이전트에게 위임하는 연구 프로토타입입니다.
협상 상황과 내 입장·이해관계·공개 전략·추론 전략을 입력하고 상대 유형(Cunning /
Desperate)을 고르면, 두 에이전트가 실시간으로 협상하며 내 에이전트의 발언 아래에는
그 발언의 근거(reasoning)가 함께 표시됩니다.

- 실행: `npm install` 후 `npm run dev`.
- 로그인: 비밀번호 없는 로컬 닉네임입니다. 브라우저 안에서 프로젝트를 구분하는 용도로만 쓰입니다.
- API 키: <https://console.x.ai>에서 발급받아 앱 오른쪽 위 **API Key** 버튼에 붙여 넣습니다.
  키는 이 브라우저의 localStorage(`asa.apiKey`)에만 저장되고 `https://api.x.ai/v1`로만 전송됩니다.
- 모델·온도·JSON 출력 형식은 연구 코드와 동일합니다 (`grok-4-0709`, 0.7).
- 모든 데이터(닉네임, 프로젝트, 대화, 키)는 브라우저에만 저장되며 서버는 없습니다.
