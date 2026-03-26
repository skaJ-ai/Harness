# Harness — AI 문서 생성 플랫폼

> 아이디어를 넣으면 보고서, PPT, 엑셀이 나옵니다. 어떤 AI를 써도 같은 품질로.

People팀(AX & CI Lab)을 위한 AI 문서 생성 플랫폼.
[AI-Native 업무 환경 전환 전략](../AI-Native-Working-Way/)의 Phase 1 실행 산출물입니다.

## Harness Engineering

이 프로젝트는 **하네스 엔지니어링**을 적용합니다.

```
앞단(Front Guard)          뒷단(Back Guard)
CLAUDE.md                  /harness-eval
ESLint + Prettier    →     4-Criteria Scoring   = 멱등성
Git Pre-commit Hook        (커밋 직전 수행)
```

- **Front Guard**: `npm run harness:check` — ESLint(typed) + Prettier + TypeScript 검사
- **Back Guard**: `/harness-eval` — AI가 Relevance/Faithfulness/Correctness/Quality 4기준 평가

## Quick Start

```bash
npm install
npm run harness:check   # Front Guard 통과 확인
npm run dev             # 개발 서버 시작
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, standalone Docker)
- **Language**: TypeScript (strict)
- **DB**: SQLite (better-sqlite3) + Drizzle ORM
- **AI**: Vercel AI SDK + Mastra (Agent orchestration)
- **LLM**: Qwen3-Next (로컬) + GAUSS (사내)
- **Export**: Marp (PPT), PptxGenJS (PPTX), ExcelJS (엑셀)
- **Design**: "Trust within Flow" — Pretendard, Core Blue #0F4C81, Teal #00BFA5

## Key Files

| File | Role |
|------|------|
| `CLAUDE.md` | **Primary Harness** — AI 에이전트 출력 제어 규칙 |
| `PLAN.md` | 구현 계획 (Phase A~E) |
| `eslint.config.mjs` | Front Guard — 멱등성 강제 린터 |
| `.harness/` | 하네스 설정 (hooks, guard configs) |
| `src/app/globals.css` | 디자인 토큰 |

## Implementation Phases

| Phase | 내용 | 상태 |
|-------|------|------|
| A | Docker 서빙 (port 26000) | 대기 |
| B | 문서 DB + REST API | 대기 |
| C | 채팅 UI (AI 인터뷰) | 대기 |
| D | Agent 파이프라인 | 대기 |
| E | 산출물 변환 (PPT/엑셀) | 대기 |

## Credits

Harness Engineering methodology:
- **김지운** (FDE, SpaceWhy/DIO), **황현태** (CEO, SpaceWhy), **빌더 조슈** — [YouTube](https://www.youtube.com/@builderjoshkim)

## License

MIT
