# PLAN: HARP — AI 문서 생성 플랫폼

> 작성일: 2026-03-25
> 상태: **승인 대기**

---

## 1. 비전

> "아이디어를 넣으면 보고서/PPT/엑셀이 나오는 도구, 어떤 AI를 써도 같은 품질로."

HARP 플랫폼을 사내 도커로 서빙하고, MD 문서를 DB화하여
AI-Native 업무 환경 전략의 Phase 1 "기반 구축" 파일럿을 구현한다.

### 핵심 가치
- **파일 → 자산**: 로컬 MD를 검색/태깅/버전관리 가능한 DB 자산으로 전환
- **AI 공통 언어**: MD 원문 저장 → AI 분석/요약 즉시 가능한 구조
- **올리면 이득**: 문서 등록 시 즉시 AI 피드백 반환
- **LLM 멱등성**: 역할별 하네스(시스템 프롬프트)로 어떤 LLM이든 동일 품질 보장

### 사용자 여정
```
아이디어 입력 → AI 인터뷰 → 기획서(MD) → 보고서/PPT/엑셀 → AI 리뷰 → DB 저장
```

### 대상 사용자
People팀 (AX & CI Lab)

---

## 2. 기능 목록

### 코어 파이프라인
| # | 기능 | 설명 | 우선순위 |
|---|------|------|---------|
| F1 | 아이디어 입력 | 자유 텍스트 입력 (한 줄~한 문단) | P0 |
| F2 | AI 인터뷰 | 목적/대상/범위/기대효과 등 구조화 질문 | P0 |
| F3 | 기획서 자동생성 | 인터뷰 결과 → MD 기획서 (하네스 템플릿) | P0 |
| F7 | 문서 DB | 저장/검색/태깅/버전관리 (SQLite + FTS5) | P0 |

### 산출물 변환
| # | 기능 | 설명 | 우선순위 |
|---|------|------|---------|
| F4 | 보고서 변환 | MD → 구조화된 보고서 포맷 | P1 |
| F5 | PPT 변환 | MD → HTML 슬라이드 (Marp) + PPTX (PptxGenJS) | P1 |
| F6 | 엑셀 변환 | 구조화 데이터 → XLSX (차트/피벗 포함) | P1 |

### 품질 강화
| # | 기능 | 설명 | 우선순위 |
|---|------|------|---------|
| F8 | 톤 변환 | 경영진 보고 / 실무 공유 / 발표용 3벌 자동 생성 | P1 |
| F9 | AI 리뷰어 | 팀장/임원 관점 피드백 + 근거 최신성 체크 | P1 |
| F10 | 문서 임포트 | Word/PPT 업로드 → MD 자동변환 → DB 저장 | P2 |

### 지식 그래프 (Graph-Lite)
| # | 기능 | 설명 | 우선순위 |
|---|------|------|---------|
| F13 | 문서 간 관계 | 참조/파생/후속 관계 추적 (SQLite 관계 테이블) | P2 |
| F12 | 엔티티 추출 | 문서 저장 시 LLM이 사람/프로세스/지표 자동 추출 | P2 |
| F15 | 관계 시각화 | 문서 관계 그래프 (react-force-graph) | P2 |

### 부가 기능
| # | 기능 | 설명 | 우선순위 |
|---|------|------|---------|
| F11 | 반복 보고서 | 주간/월간 템플릿 + 이전 보고서 참조 자동생성 | P2 |
| F14 | 한/영 동시생성 | 같은 내용 한국어+영어 동시 출력 | P3 |

---

## 3. 기술 스택

### 핵심 런타임
| 항목 | 선택 | 이유 |
|------|------|------|
| Runtime | Next.js 15 (기존) | API Routes + SSR 단일 앱 |
| DB | SQLite (better-sqlite3) | 도커 볼륨 1개로 영속화, HR-Coaching 검증 패턴 |
| ORM | Drizzle ORM | 타입 안전, SQLite 네이티브, 경량 |
| Docker | node:20-slim + standalone | Next.js output: standalone 최적화 |
| 포트 | 26000 | HR-Coaching이 25000 사용 중 |
| AI | 사내 Qwen3-Next (10.240.248.157:8533) | OpenAI 호환 API |

### 오픈소스 의존성 (npm install)
| 패키지 | Stars | 용도 | 참고 |
|--------|-------|------|------|
| `ai` (Vercel AI SDK) | 23k | AI 스트리밍, useChat 훅, 구조화 출력 | [vercel/ai](https://github.com/vercel/ai) |
| `@mastra/core` | 22k | Agent 파이프라인 (인터뷰어/기획자/작성자/리뷰어) | [mastra-ai/mastra](https://github.com/mastra-ai/mastra) |
| `@marp-team/marp-core` | 10k | MD → HTML 슬라이드 / PPTX / PDF | [marp-team/marp](https://github.com/marp-team/marp) |
| `pptxgenjs` | 4.8k | 프로그래밍 방식 PPTX 생성 (차트/표/이미지) | [gitbrent/PptxGenJS](https://github.com/gitbrent/PptxGenJS) |
| `exceljs` | 15k | XLSX 생성 (스타일/차트/수식/피벗) | [exceljs/exceljs](https://github.com/exceljs/exceljs) |
| `mammoth` | 6.2k | DOCX → HTML/MD 변환 (순수 JS) | [mwilliamson/mammoth.js](https://github.com/mwilliamson/mammoth.js) |
| `react-force-graph-2d` | 3k | 문서 관계 그래프 시각화 | [vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph) |

### 참고 프로젝트 (아키텍처 학습)
| 프로젝트 | Stars | 배울 점 |
|---------|-------|--------|
| [CrewAI](https://github.com/crewAIInc/crewAI) | 47k | 역할/목표/도구 분리 패턴, 태스크 위임 |
| [GPT-Researcher](https://github.com/assafelovic/gpt-researcher) | 26k | Plan-Execute 보고서 생성 파이프라인 |
| [MarkItDown](https://github.com/microsoft/markitdown) (MS) | 92k | Office→MD 변환 (Python, 필요 시 서브프로세스) |
| [Vercel Chatbot](https://github.com/vercel/chatbot) | 20k | Next.js + AI SDK 채팅 UI 레퍼런스 |
| [Slidev](https://github.com/slidevjs/slidev) | 45k | MD 슬라이드 문법, 테마 시스템 |

---

## 4. Agent 하네스 설계

### 역할 분리 (gstack 패턴 적용)
```
[인터뷰어 Agent] → [기획자 Agent] → [작성자 Agent] → [리뷰어 Agent]
    ↓                   ↓                ↓                ↓
 질문 템플릿         문서구조 템플릿     톤/포맷 템플릿    Back Guard 평가
 (7개 필수 항목)     (기획서 골격)      (경영진/실무/발표)  (4기준 채점)
```

### 각 Agent 하네스 명세

| Agent | 역할 | 입력 | 출력 | Temperature |
|-------|------|------|------|-------------|
| **인터뷰어** | 아이디어 구체화 질문 | 사용자 자유입력 | 구조화된 응답 (7항목) | 0.7 |
| **기획자** | 기획서 MD 생성 | 인터뷰 결과 | 기획서 MD | 0.3 |
| **작성자** | 산출물 변환 | 기획서 + 포맷 지정 | 보고서/PPT/엑셀 | 0.5 |
| **리뷰어** | 품질 검토 + 피드백 | 산출물 + 평가기준 | 점수 + 개선안 | 0.2 |

### 인터뷰어 필수 질문 항목
1. 목적 (이 일을 왜 하는가?)
2. 대상 (누구를 위한 것인가?)
3. 현황 (지금 상황은 어떤가?)
4. 제안 (무엇을 하고 싶은가?)
5. 기대효과 (성공하면 어떻게 달라지는가?)
6. 일정 (언제까지?)
7. 산출물 (보고서? PPT? 엑셀? 어떤 형태?)

---

## 5. DB 스키마

```sql
-- 핵심: 문서 저장
CREATE TABLE documents (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,              -- MD 원문
  type       TEXT NOT NULL,              -- plan | report | ppt | excel | ideation | prd
  project    TEXT DEFAULT 'harp',        -- harp | hr-coaching | ai-native
  tags       TEXT DEFAULT '[]',          -- JSON array
  tone       TEXT DEFAULT 'standard',    -- executive | working | presentation
  version    INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 전문 검색
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_project ON documents(project);
CREATE VIRTUAL TABLE documents_fts USING fts5(title, content);

-- Graph-Lite: 문서 간 관계
CREATE TABLE document_relations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id     INTEGER NOT NULL REFERENCES documents(id),
  target_id     INTEGER NOT NULL REFERENCES documents(id),
  relation_type TEXT NOT NULL,  -- references | derived_from | supersedes | related_to
  created_at    TEXT DEFAULT (datetime('now'))
);

-- Graph-Lite: 엔티티 추출
CREATE TABLE entities (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES documents(id),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,  -- person | team | process | metric | project
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_name ON entities(name);
```

---

## 6. 실행 계획

### Phase A: Docker 서빙 기반
| # | 작업 | 파일 |
|---|------|------|
| A1 | next.config.ts에 `output: 'standalone'` 추가 | `next.config.ts` |
| A2 | Dockerfile 작성 (프록시 하드코딩, standalone) | `Dockerfile` |
| A3 | docker-compose.yml (port 26000, 볼륨, healthcheck) | `docker-compose.yml` |

### Phase B: DB + API
| # | 작업 | 파일 |
|---|------|------|
| B1 | better-sqlite3, drizzle-orm 설치 | `package.json` |
| B2 | DB 스키마 (documents + relations + entities) | `src/lib/db/schema.ts` |
| B3 | DB 연결 싱글턴 | `src/lib/db/connection.ts` |
| B4 | Documents CRUD API | `src/app/api/documents/route.ts` |
| B5 | Documents 단건 API | `src/app/api/documents/[id]/route.ts` |
| B6 | Health API | `src/app/api/health/route.ts` |
| B7 | 검색 API (FTS5) | `src/app/api/search/route.ts` |

### Phase C: 채팅 + 문서 관리 UI
| # | 작업 | 파일 | 참고 오픈소스 |
|---|------|------|-------------|
| C1 | 채팅 UI (인터뷰어 Agent) | `src/app/chat/page.tsx` | Vercel AI SDK `useChat` |
| C2 | 문서 목록 페이지 | `src/app/documents/page.tsx` | |
| C3 | 문서 상세/편집 | `src/app/documents/[id]/page.tsx` | |
| C4 | MD 렌더러 | `src/components/ui/markdown-renderer.tsx` | |
| C5 | 문서 관계 그래프 | `src/components/ui/document-graph.tsx` | react-force-graph-2d |

### Phase D: Agent 파이프라인 + AI
| # | 작업 | 파일 | 참고 오픈소스 |
|---|------|------|-------------|
| D1 | Agent 하네스 정의 (4역할) | `src/lib/ai/agents.ts` | Mastra / CrewAI 패턴 |
| D2 | AI 클라이언트 (Qwen3 호환) | `src/lib/ai/client.ts` | Vercel AI SDK |
| D3 | 인터뷰 → 기획서 생성 API | `src/app/api/ai/generate/route.ts` | |
| D4 | AI 리뷰 API | `src/app/api/ai/review/route.ts` | Back Guard 기준 |
| D5 | 톤 변환 API | `src/app/api/ai/tone/route.ts` | |
| D6 | 엔티티 자동추출 (저장 시) | `src/lib/ai/extract-entities.ts` | |

### Phase E: 산출물 변환
| # | 작업 | 파일 | 참고 오픈소스 |
|---|------|------|-------------|
| E1 | MD → HTML 슬라이드 | `src/lib/export/to-slides.ts` | Marp |
| E2 | MD → PPTX | `src/lib/export/to-pptx.ts` | PptxGenJS |
| E3 | 데이터 → XLSX (차트/피벗) | `src/lib/export/to-excel.ts` | ExcelJS |
| E4 | 산출물 다운로드 API | `src/app/api/export/route.ts` | |
| E5 | Word/PPT 임포트 | `src/lib/import/from-office.ts` | Mammoth.js |

---

## 7. 실행 순서 및 마일스톤

```
Phase A (Docker)     → docker compose up 확인
Phase B (DB + API)   → curl로 문서 CRUD 확인
Phase C (UI)         → 웹에서 채팅 + 문서 관리
Phase D (AI Agent)   → 아이디어 → 기획서 자동생성
Phase E (산출물)     → 보고서/PPT/엑셀 다운로드
```

---

## 8. 참고

### 사내 참조
- Docker 프록시 패턴: `C:\dev\HR-Process-Coaching-AI\Dockerfile`
- AI-Native 전략: `C:\dev\AI-Native-Working-Way\` (Phase 1 파일럿)
- 하네스 규칙: `CLAUDE.md` 전체 적용

### 영감 출처
- Manifest (AI 기획 에이전트): 아이디어→기획→산출물 파이프라인
- GraphRAG: 문서 간 관계 + 엔티티 추출 → Graph-Lite로 경량 구현
- gstack (YC CEO): 역할 분리 Agent 파이프라인 → 문서 하네스로 적용
