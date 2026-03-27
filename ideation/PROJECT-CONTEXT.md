# Project Context: Harness Engineering Framework

> 이 문서는 어떤 AI/LLM이든 이 프로젝트를 이어서 작업할 수 있도록 전체 맥락을 정리한 것입니다.
> **반드시 이 문서를 먼저 읽고 작업을 시작하세요.**

---

## 1. 프로젝트 개요

### 무엇을 만들고 있는가?

**하네스 엔지니어링(Harness Engineering) 범용 프레임워크 템플릿**

어떤 AI 모델(Claude, GPT, Gemini, Codex 등)을 사용하더라도 **동일한 구조·품질의 코드가 나오도록 강제하는 시스템**이다.
새 프로젝트에 이 디렉토리를 복사해서 사용하는 **재사용 가능한 템플릿**이다.

### 핵심 원칙: 멱등성(Idempotency)

> 같은 입력(요구사항 + 하네스 규칙)을 주면, 어떤 AI 모델이든 구조적으로 동일한 코드를 생산한다.

---

## 2. 원본 소스 (이 프로젝트의 기원)

### 영상

- **제목**: "상위 1% AI 네이티브들은 프롬프트 안 쓰고 '하네스 깎기'에 수백시간 투자합니다"
- **채널**: 빌더 조슈 (Builder Josh) — https://www.youtube.com/@builderjoshkim
- **URL**: https://www.youtube.com/watch?v=A8PMyC7W_vg
- **출연**: 스페이스와이 황현태 대표, 김지운 FDE (Forward Deployed Engineer)
- **주제**: 엔터프라이즈 AX(AI Transformation) 구축 전략

### 영상 핵심 요약

1. **하네스 = 앞단(Front Guard) + 뒷단(Back Guard)**
   - 앞단: CLAUDE.md + 린터 + Git hooks → AI의 코드 출력을 하나의 좁은 길로 강제
   - 뒷단: 평가(Evaluation) 프레임워크 → 결과물 품질 모니터링

2. **6단계 실무 프로세스**
   - 1단계 [06:03]: 요구사항 수집 (비정형 니즈를 제한 없이 듣기)
   - 2단계 [07:08]: 회의록 정리 및 계획 (발산 → 수렴, MECE)
   - 3단계 [09:51]: CPS(Context-Problem-Solution) → PRD
   - 4단계 [27:11]: 아키텍처 설계 (DDD + 린터로 강제)
   - 5단계 [34:03]: 코드 + 커밋 검증 (린터 통과해야만 커밋 가능)
   - 6단계 [36:38]: 이밸류에이션 (조직 맞춤형 평가 지표)

3. **추가 참고 자료**
   - 문서는 마크다운으로 관리 → LaTeX/Typst 템플릿으로 PDF 빌드 [12:02]
   - Toss의 계층화 컨텍스트: Global → Domain → Local
   - OpenAI의 Harness Engineering 블로그

---

## 3. 사용자 요청 원문

> "https://www.youtube.com/watch?v=A8PMyC7W_vg 이거 영상 내용 요약하고
> 이거대로 나도 하네스 엔지니어링 틀을 짜고 싶거든? 함 확인해볼래?"

### 사용자 선택 사항

| 질문 | 선택 |
|------|------|
| 구축 방향 | **전체 통합 (6단계 + Claude Code)** |
| 적용 대상 | **범용 템플릿** (어떤 프로젝트에든 복사해서 사용) |
| 기술 스택 | **Next.js + TypeScript** |
| 우선순위 | **전체 6단계 균형적으로** |

---

## 4. 현재 구축 완료 상태

### 완료된 작업 (5 Steps 모두 완료)

| Step | 내용 | 상태 |
|------|------|------|
| Step 1 | 핵심 하네스 문서 (CLAUDE.md + front-guard + back-guard + context-layers) | ✅ 완료 |
| Step 2 | 린터 인프라 + 프로젝트 스캐폴드 (ESLint, Prettier, TypeScript, Next.js) | ✅ 완료 |
| Step 3 | Git Hooks + Claude Code 연동 (pre-commit, commit-msg, settings.json, slash commands) | ✅ 완료 |
| Step 4 | 6단계 프로세스 문서 템플릿 (docs/01~06) | ✅ 완료 |
| Step 5 | 문서 빌드 파이프라인 (Typst) + Next.js 예시 코드 | ✅ 완료 |

### 미완료 / 후속 작업

| # | 작업 | 설명 | 우선순위 |
|---|------|------|----------|
| 1 | `npm install` | 의존성 설치 미실행 (Bash 도구 제한) | 🔴 High |
| 2 | `git init` + 첫 커밋 + push | GitHub 리포: https://github.com/skaJ-ai/Harness.git | 🔴 High |
| 3 | ESLint 실행 검증 | `npm run harness:check`로 린터가 실제로 작동하는지 확인 | 🔴 High |
| 4 | Git hooks 설치 확인 | `npm run harness:install-hooks` 후 pre-commit 테스트 | 🟡 Medium |
| 5 | ESLint config 디버깅 | flat config(v9)가 모든 플러그인과 호환되는지 확인 필요 | 🟡 Medium |
| 6 | Typst/Pandoc 설치 | 문서 파이프라인 실행을 위해 Typst CLI 설치 필요 | 🟢 Low |
| 7 | 실 프로젝트 적용 테스트 | 이 템플릿을 실제 프로젝트에 복사해서 작동 확인 | 🟢 Low |
| 8 | 커스텀 ESLint 플러그인 | 멱등성 규칙 중 기존 플러그인으로 커버 안 되는 것 처리 | 🟢 Low |

---

## 5. 디렉토리 구조 설명

```
C:\dev\Harness\
│
├── CLAUDE.md                        ← 🔑 PRIMARY HARNESS (가장 중요한 파일)
│                                       AI가 가장 먼저 읽어야 하는 규칙 문서
│                                       네이밍, 임포트, 멱등성, 평가 기준 모두 포함
│
├── .claude/                         ← Claude Code 전용 설정
│   ├── settings.json                   permissions & hooks
│   └── commands/
│       ├── harness-check.md            /harness-check 슬래시 커맨드
│       └── harness-eval.md             /harness-eval 슬래시 커맨드
│
├── .harness/                        ← 🔧 하네스 엔진 (앞단 + 뒷단)
│   ├── front-guard/                    앞단: AI 출력 강제 규칙
│   │   ├── naming-conventions.md       파일/변수 네이밍 상세 명세
│   │   ├── import-order.md             임포트 5-group 순서 명세
│   │   └── idempotency-rules.md        멱등성 패턴 가이드 (금지/강제 패턴)
│   │
│   ├── back-guard/                     뒷단: AI 출력 평가
│   │   ├── eval-criteria.json          4기준 평가 루브릭 (JSON, 기계 판독 가능)
│   │   └── eval-template.md            평가 리포트 양식
│   │
│   ├── context-layers/                 계층화 컨텍스트 템플릿 (Toss 방식)
│   │   ├── global.md                   전사 공통 규정 템플릿
│   │   ├── domain-template.md          도메인별 CLAUDE.md 템플릿
│   │   └── local-template.md           디렉토리별 CLAUDE.md 템플릿
│   │
│   └── hooks/                          Git hooks
│       ├── pre-commit                  커밋 시 ESLint + Prettier 강제
│       ├── commit-msg                  커밋 메시지 포맷 검증
│       └── install-hooks.mjs           hooks 설치 스크립트 (Node.js)
│
├── docs/                            ← 📋 6단계 프로세스 문서 템플릿
│   ├── 01-requirements/                1단계: 요구사항 수집
│   │   ├── TEMPLATE.md                 요구사항 문서 양식 (MECE 분류)
│   │   └── interview-guide.md          이해관계자 인터뷰 질문 가이드
│   │
│   ├── 02-plan/                        2단계: 플랜
│   │   ├── TEMPLATE.md                 구조화된 플랜 양식
│   │   └── convergence-guide.md        발산→수렴 MECE 가이드
│   │
│   ├── 03-cps-prd/                     3단계: 기획
│   │   ├── CPS-TEMPLATE.md             Context-Problem-Solution 양식
│   │   └── PRD-TEMPLATE.md             Product Requirements Document 양식
│   │
│   ├── 04-architecture/                4단계: 아키텍처
│   │   ├── TEMPLATE.md                 Architecture Decision Record 양식
│   │   ├── DDD-TEMPLATE.md             Domain-Driven Design 양식
│   │   └── human-in-the-loop.md        HITL 설계 패턴 가이드
│   │
│   ├── 05-code-linter/                 5단계: 코드 규칙
│   │   └── CONVENTIONS.md              프로젝트별 코딩 규칙 (커스터마이즈용)
│   │
│   └── 06-evaluation/                  6단계: 평가
│       ├── SCORING-RUBRIC.md           상세 채점 기준 (0-5점 각 레벨 설명)
│       └── REPORT-TEMPLATE.md          평가 리포트 양식
│
├── doc-pipeline/                    ← 📄 문서 빌드 파이프라인
│   ├── templates/default.typ           Typst 문서 템플릿 (한국어 지원)
│   ├── build.sh                        MD → PDF 빌드 스크립트
│   └── README.md                       파이프라인 사용법
│
├── src/                             ← 🏗️ Next.js 프로젝트 스캐폴드
│   ├── app/
│   │   ├── layout.tsx                  루트 레이아웃
│   │   ├── page.tsx                    홈 페이지
│   │   ├── globals.css                 Tailwind 디렉티브
│   │   └── CLAUDE.md                   Local Layer (App Router 예외 규칙)
│   │
│   ├── components/ui/
│   │   └── button.tsx                  ⭐ 하네스 규칙 준수 참조 구현
│   │                                   (모든 규칙을 지키는 예시 컴포넌트)
│   │
│   ├── lib/utils.ts                    cn(), Result 패턴, safeFetch()
│   ├── types/index.ts                  공유 타입 (ApiResponse, Pagination)
│   │
│   └── domains/_template/              DDD 도메인 모듈 템플릿
│       ├── CLAUDE.md                   Domain Layer 하네스
│       ├── types.ts                    도메인 타입
│       ├── actions.ts                  도메인 액션 (mutations, server actions)
│       └── queries.ts                  도메인 쿼리 (reads)
│
├── eslint.config.mjs                ← ESLint v9 flat config
│                                       import/order, naming-convention,
│                                       no-default-export, 멱등성 규칙
├── .prettierrc.json                 ← Prettier (포맷 결정권 완전 제거)
├── tsconfig.json                    ← TypeScript strict 모드
├── next.config.ts                   ← Next.js 설정
├── tailwind.config.ts               ← Tailwind CSS
├── postcss.config.mjs               ← PostCSS
├── package.json                     ← 의존성 + harness:check/fix 스크립트
├── .editorconfig                    ← 에디터 무관 포맷 기준
├── .gitattributes                   ← LF 강제 (Windows CRLF 방지)
├── .gitignore                       ← Git 무시 규칙
│
├── PROJECT-CONTEXT.md               ← 📌 이 파일 (LLM 핸드오프 문서)
└── TODO.md                          ← 📌 남은 작업 목록
```

---

## 6. 핵심 설계 결정 (ADR 요약)

이 결정들을 변경하려면 반드시 이유를 기록하고 관련 파일을 모두 업데이트할 것.

| # | 결정 | 이유 | 관련 파일 |
|---|------|------|-----------|
| D-001 | 파일명 kebab-case 강제 | PascalCase는 대소문자 모호성 → 멱등성 위반 | CLAUDE.md, eslint.config.mjs |
| D-002 | default export 금지 | `import Anything from...`은 AI마다 다른 이름 선택 가능 | CLAUDE.md, eslint.config.mjs |
| D-003 | Prettier 설정 고정 | 포맷 결정권을 AI에게서 완전히 제거 | .prettierrc.json |
| D-004 | 계층화 CLAUDE.md | Toss 방식 - Global/Domain/Local 분리로 관리 가능 | CLAUDE.md, .harness/context-layers/ |
| D-005 | 평가 기준 JSON | 기계 판독 가능 → 자동화 파이프라인 구축 가능 | .harness/back-guard/eval-criteria.json |
| D-006 | Named export only | import 이름이 항상 동일 → 멱등성 보장 | CLAUDE.md, eslint.config.mjs |
| D-007 | Typst (not LaTeX) | 빌드 속도·문법 편의성 우위. 영상은 LaTeX 사용 | doc-pipeline/ |
| D-008 | Result 패턴 강제 | 모든 async 에러를 동일 구조로 처리 → 멱등성 | src/lib/utils.ts, CLAUDE.md |
| D-009 | Zustand + SWR | 상태관리/데이터페칭 패턴을 하나로 고정 | CLAUDE.md |
| D-010 | 5-group import order | AI가 생성하는 파일 상단 구조를 정규화 | CLAUDE.md, eslint.config.mjs |

---

## 7. 다른 AI/LLM을 위한 작업 가이드

### 작업 시작 전 반드시

1. **이 파일 (`PROJECT-CONTEXT.md`) 전체를 읽는다**
2. **`CLAUDE.md`를 읽는다** — 이것이 Primary Harness
3. **`TODO.md`를 읽는다** — 남은 작업 확인

### 코드 수정 시 반드시

1. CLAUDE.md의 모든 규칙을 따른다 (네이밍, 임포트, 멱등성)
2. `src/components/ui/button.tsx`를 참조 구현으로 참고한다
3. 새 도메인 추가 시 `src/domains/_template/`을 복사해서 사용한다
4. 작업 완료 후 Back Guard 평가를 수행한다 (eval-criteria.json 기준)

### 구조 변경 시 반드시

1. 이 문서(PROJECT-CONTEXT.md)의 디렉토리 구조 섹션을 업데이트한다
2. 설계 결정을 변경하면 ADR 요약 테이블을 업데이트한다
3. TODO.md를 업데이트한다

---

## 8. 참고 자료

| Resource | URL | 용도 |
|----------|-----|------|
| 원본 영상 | https://www.youtube.com/watch?v=A8PMyC7W_vg | 방법론 원천 |
| 빌더 조슈 뉴스레터 | https://maily.so/josh/posts/w6ov2vemrk5 | 하네스 엔지니어링 상세 설명 |
| 채널톡 블로그 | https://channel.io/ko/blog/articles/what-is-harness-2611ddf1 | 하네스 개념 정리 |
| Toss Tech | https://toss.tech/article/harness-for-team-productivity | 계층화 컨텍스트, 조직 생산성 |
| DIO AX | https://www.dio.so/fde | FDE 모델 설명 |
| GitHub 리포 | https://github.com/skaJ-ai/Harness.git | 이 프로젝트 원격 저장소 |
