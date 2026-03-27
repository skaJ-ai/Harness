# HARP — HR AI Report Platform

> HR 담당자가 AI와 대화하면 회사 표준 형식의 보고서 초안을 만들고, 그 과정이 다시 쓰는 자산으로 쌓이는 private-first 작업공간

People팀(AX & CI Lab)을 위한 HR 전용 AI 보고서 플랫폼입니다.
대화, 근거자료, 산출물, 자산 승격 흐름을 하나의 워크스페이스에서 관리합니다.

## Product Summary

- **대상 사용자**: HR 담당자
- **핵심 가치**: 표준 산출물 생성, private workspace, 점진적 자산화
- **MVP 산출물**: 주간 HR 현황 보고, 교육 운영 결과 요약, 제도 검토 초안
- **LLM 전략**: 사내 Qwen OpenAI-compatible endpoint 사용, 모델 교체 내성은 컨텍스트 설계로 확보

## Harness Engineering

이 프로젝트는 제품 이름과 별개로 **하네스 엔지니어링** 방식을 적용합니다.

```
앞단(Front Guard)          뒷단(Back Guard)
CLAUDE.md                  /harness-eval
ESLint + Prettier    →     4-Criteria Scoring   = 품질 하한선
Git Pre-commit Hook        (커밋 직전 수행)
```

- **Front Guard**: `npm run harness:check` — ESLint(typed) + Prettier + TypeScript 검사
- **Back Guard**: `/harness-eval` — AI 산출물을 Relevance/Faithfulness/Correctness/Quality 기준으로 평가

## Quick Start

```bash
npm install
npm run harness:check
npm run build
docker compose up --build -d
```

- 앱: `http://127.0.0.1:26000`
- 헬스체크: `http://127.0.0.1:26000/api/health`

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **UI**: Tailwind CSS + Trust within Flow design system
- **DB**: PostgreSQL + Drizzle ORM
- **Auth**: bcryptjs + JWT(httpOnly cookie)
- **AI**: Vercel AI SDK + OpenAI-compatible Qwen endpoint
- **Deployment**: Docker Compose (`26000 -> 3000`)

## Key Files

| File | Role |
|------|------|
| `CLAUDE.md` | Primary harness 규칙 |
| `docs/SDD.md` | 제품 설계 계약 문서 |
| `docs/methodology-reference.md` | 산파술 인터뷰용 방법론 참고 |
| `.harness/` | guard, hooks, context 레이어 |
| `src/lib/templates/index.ts` | 산출물 템플릿, 체크리스트, 프롬프트 정의 |
| `src/app/workspace/` | 세션, 대시보드, 산출물 UI |

## Current Scope

- 회원가입/로그인 + 개인 workspace 자동 생성
- 세션 생성 + AI 인터뷰 + 체크리스트/캔버스
- source 첨부, draft 생성, final/promoted_asset 전이
- workspace 검색, 이전 산출물 참조, 제품 랜딩 페이지

## Notes

- `.harness/`와 `harness:check`는 제품명이 아니라 개발 하네스 이름이라 유지합니다.
- 사내 LLM endpoint 접근성은 실행 환경의 네트워크 상태에 따라 달라집니다.

## License

MIT
