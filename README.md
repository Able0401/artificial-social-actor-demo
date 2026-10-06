# Artificial Social Actor (ASA): Delegating a Negotiation to an LLM Agent

[![Live Demo](https://img.shields.io/badge/demo-live-green.svg)](https://able0401.github.io/artificial-social-actor-demo/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)
[![xAI Grok 4](https://img.shields.io/badge/xAI-grok--4--0709-black.svg)](https://docs.x.ai/)
[![License: MIT](https://img.shields.io/badge/license-MIT-lightgrey.svg)](LICENSE)

> You tell an AI agent what you want from a negotiation, what you are willing to reveal and how to read the other side. It then negotiates for you against another agent, and you can read its reasoning after every turn.

![ASA simulation page, set up for a used-laptop sale](docs/screenshot.png)

<sub>The simulation page with an example scenario filled in: shared context on top, the strategy guide on the left, your agent's four fields, the dialogue pane and the opponent type.</sub>

---

## Contents

- [Overview](#overview)
- [Research background](#research-background)
- [Live demo](#live-demo)
- [How it works](#how-it-works)
- [Model calls](#model-calls)
- [Privacy](#privacy)
- [Run locally](#run-locally)
- [Deploy your own](#deploy-your-own)
- [Project layout](#project-layout)
- [Citation](#citation)
- [License](#license)
- [Contact](#contact)
- [한국어 안내](#한국어-안내)

---

## Overview

An Artificial Social Actor (ASA) is an LLM agent that takes part in a social interaction in place of its user. Negotiation is the hardest version of that job. The agent has to guess what the other side really wants, decide how much of its user's situation to give away, and change course as the conversation moves.

This repository is a self-contained public version of the research prototype used in a user study of how people configure such an agent. You set up your agent with four fields, pick an opponent, and watch the two agents negotiate turn by turn. Under each of your agent's messages you can see the reasoning the model produced for that turn, so you can tell whether it did what you meant or only what you wrote.

The research code ran on Supabase with study accounts. This version keeps the same prompts, model and turn structure but stores projects and dialogues in your browser. Model calls go through a small proxy that holds the demo's xAI key, so visitors need no key.

## Research background

The prototype comes from the master's thesis below.

> Hyun Seung Moon. *When I Need a Stand-in: Building Artificial Social Actors for Negotiation with User-Guided Inference and Disclosure* (대역이 필요할 때: 사용자가 조정하는 추론과 정보 공개 기반 협상 에이전트 설계 연구). Master's thesis, Department of Industrial Design, KAIST. Defended December 2025. Advisor: Tak Yeon Lee.

LLMs can now hold a strategic conversation well enough that handing one a negotiation is a real option, but we know little about how people want to hand it over. The thesis asks two questions. How should a user steer the agent's reading of the other party (inference) and its release of the user's own information (disclosure)? And how does that steering change with the kind of negotiation?

The four input fields put that question into the interface. Position and interest come from principled negotiation (Fisher and Ury's *Getting to Yes*): the position is what you ask for out loud, the interest is why you ask for it. Disclosure and inference strategy are the two things the thesis studies.

| Field | What you write | Example |
|---|---|---|
| Position (입장) | The demand you state openly | "I want 450,000 won for this laptop." |
| Interest (이해관계) | The reason behind the position | "I need to sell this week, but not too cheaply." |
| Disclosure strategy (공개 전략) | When and how much of the above the agent may reveal | "Never say that I am in a hurry." |
| Inference strategy (추론 전략) | How the agent should read the other side's real intent | "If they haggle first, ask what their budget is." |

In the study, 12 participants first wrote down negotiations they would like to hand off, then set up an ASA for three of them in this interface, ran the simulation, revised their settings and ran it again, and closed with an interview. The thesis reports the findings.

## Live demo

**Try it:** <https://able0401.github.io/artificial-social-actor-demo/>

No sign-up or API key is needed. The demo allows a fixed number of model calls per visitor per day; one negotiation is 20 calls.

## How it works

0. **Pick a language.** The EN / KO switch at the bottom right sets the interface language and the language of the prompts sent to the model, so both the dialogue and the reasoning come back in that language. English is the default; KO reproduces the Korean prompts used in the study. The choice is kept in localStorage (`asa.lang`).
1. **Start on the example.** The page opens on a filled-in scenario (selling a used laptop) with a short guide above it. There is no sign-up. **Load example** refills it; **Clear fields** empties every field.
2. **Write the dealmaking context**, the scenario both agents share.
3. **Fill in "My Agent"** with the four fields above. The Strategy Guide panel on the left explains each field with examples.
4. **Pick the opponent type.** *Cunning* plays a sly, aggressive counterpart. *Desperate* pleads and dramatises hardship. The opponent agent sees only the shared context and its persona, never your fields.
5. **Click "Run".** The agents alternate, yours first, for up to 20 turns (10 each) or until one of them ends the conversation. Each turn is a separate model call and messages appear as they arrive. **Stop** aborts mid-run.
6. **Read the reasoning.** A 💭 line under each of your agent's messages shows the reasoning the model gave for that turn. The opponent's reasoning is generated too but hidden, as it was in the study.
7. **Try another round.** When a run finishes, the round is marked complete and a new round tab appears with the same settings and an empty dialogue, so you can change your strategy and run again. **Reset** clears the current round.

| Setting | Value (same as the study) |
|---|---|
| Model | `grok-4-0709` |
| Temperature | 0.7 |
| Output | JSON with `message` and `reasoning` per turn |
| Turn limit | 20 (10 per agent), or earlier when an agent ends the talk |

## Model calls

The page sends each turn's prompts to a Firebase function (`functions/index.js`). The function adds the xAI key, the study model (`grok-4-0709`) and the response schema, and returns the model's JSON. It accepts requests only from this page's origin and counts calls per IP per UTC day (`ASA_PER_IP`, default 200) and overall (`ASA_PER_DAY`, default 1000). The key is set in `functions/.env` at deploy time and is not in git or in the page bundle.

To deploy your own proxy, put `XAI_API_KEY=...` in `functions/.env`, run `firebase deploy --only functions:asa --project <your-project>`, and point `TURN_ENDPOINT` in `src/lib/settings.js` at the function URL.

## Privacy

Nicknames, projects and dialogues live in your browser's `localStorage`. The proxy forwards each turn to the xAI API and keeps only a per-IP call count (a hashed IP, reset daily). There is no analytics. Clearing site data for the page removes everything stored in the browser.

## Run locally

Requires Node.js 20.19 or later (Vite 7).

```bash
git clone https://github.com/Able0401/artificial-social-actor-demo.git
cd artificial-social-actor-demo
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). The page opens on a filled-in example; there is no sign-up. `localhost:5173` and `localhost:4173` are allowed by the proxy.

## Deploy your own

The build is static (`dist/`). `VITE_BASE_PATH` sets the URL prefix; keep the default `/` unless you serve from a sub-path. The build also writes a copy of `index.html` to `dist/404.html` so client-side routes survive a refresh on static hosts.

**Vercel.** Import the repository. The included `vercel.json` sets the build command, output directory and SPA rewrite. No environment variables are needed.

**GitHub Pages.** The live demo is served from the `gh-pages` branch of this repository (Settings → Pages → Deploy from a branch → `gh-pages`, folder `/`). To publish a fork the same way:

```bash
VITE_BASE_PATH=/<repo-name>/ npm run build
npx gh-pages -d dist --dotfiles
```

`--dotfiles` keeps the `.nojekyll` marker so Pages serves `dist/` as is. You can put `VITE_BASE_PATH=/<repo-name>/` in a `.env` file instead (see `.env.example`).

## Project layout

```
src/
  contexts/AppContext.jsx       guest profile and project state (localStorage)
  lib/db.js                     localStorage replacement for the study database
  lib/i18n.jsx                  EN/KO switch and string helper
  lib/settings.js               proxy endpoint
  pages/StartPage.jsx           landing: guest profile and the example project
  pages/SimulationPage.jsx      negotiation interface, guide, prompts and model calls
```

## Citation

If you use this prototype or the four-field setup in your work, please cite the thesis:

```bibtex
@mastersthesis{moon2025standin,
  title  = {When I Need a Stand-in: Building Artificial Social Actors for Negotiation with User-Guided Inference and Disclosure},
  author = {Moon, Hyun Seung},
  school = {Korea Advanced Institute of Science and Technology (KAIST)},
  type   = {Master's thesis},
  note   = {Department of Industrial Design. Defended December 2025. In Korean.},
  year   = {2025}
}
```

## License

MIT. See [LICENSE](LICENSE).

## Contact

Hyun Seung Moon, Ph.D. student, KAIST Industrial Design (AI Experience Lab)
[mzes0401@kaist.ac.kr](mailto:mzes0401@kaist.ac.kr) · [hyunseungmoon.net](https://hyunseungmoon.net)

---

## 한국어 안내

ASA(Artificial Social Actor)는 협상을 AI 에이전트에게 맡기는 연구 프로토타입입니다. 문현승의 KAIST 산업디자인학과 석사논문 「대역이 필요할 때: 사용자가 조정하는 추론과 정보 공개 기반 협상 에이전트 설계 연구」(2025년 12월 심사)에서 사용자 스터디에 쓴 인터페이스를 누구나 브라우저에서 써 볼 수 있게 옮겼습니다.

협상 상황을 적고 내 에이전트의 입장, 이해관계, 공개 전략, 추론 전략을 입력한 뒤 상대 유형(Cunning / Desperate)을 고르면 두 에이전트가 실시간으로 협상합니다. 내 에이전트의 발언 아래에는 그 턴에 모델이 내놓은 판단 근거가 함께 보입니다.

- 실행: `npm install` 후 `npm run dev`.
- 언어: 오른쪽 아래 EN / KO 스위치로 화면과 모델 프롬프트 언어를 함께 바꿉니다. 기본값은 영어이고, KO는 연구 때 쓴 한국어 프롬프트 그대로입니다.
- 시작: 가입 없이 중고 노트북 판매 예시가 채워진 화면으로 바로 열립니다. 위쪽 가이드가 각 칸을 설명합니다.
- API 키: 필요 없습니다. 모델 호출은 데모용 xAI 키를 가진 Firebase 함수(`functions/index.js`)를 거칩니다. 방문자마다 하루 호출 수가 정해져 있고, 협상 한 번은 20회입니다.
- 모델, 온도, JSON 출력 형식은 연구 때와 같습니다 (`grok-4-0709`, 0.7).
- 설정과 대화는 브라우저에만 저장됩니다. 프록시는 대화를 저장하지 않습니다.
