# HARP — Software Design Document
# HR AI Report Platform

> 버전: 0.1.0 (Draft)
> 작성일: 2026-03-26
> 상태: 설계 LLM ↔ 구현 LLM 간 계약 문서

---

## 1. 이 제품은 무엇인가

### 비개발자를 위한 설명

**지금 HR 담당자가 겪는 문제:**

- 보고서를 쓸 때마다 흩어진 자료를 모으고, 처음부터 정리해야 한다
- ChatGPT 같은 AI를 써봤지만, 뭘 물어야 할지 모르겠고, 결과가 매번 다르다
- 좋은 초안을 만들어도 다음 달에 다시 쓸 때 처음부터 시작이다
- 사람마다 보고서 형식과 품질이 달라서, 팀 전체의 산출물이 들쭉날쭉하다

**HARP가 하는 일:**

1. 만들고 싶은 보고서 유형을 고른다 (클릭 한 번)
2. AI가 유능한 기획 선배처럼 질문을 던진다 — "목적이 뭔가요?", "현재 상황은요?"
3. 대화하는 동안 옆 화면에 보고서가 섹션별로 채워진다
4. 완성된 보고서는 회사 표준 형식에 맞춰져 있다
5. 이전에 만든 보고서와 자료가 쌓여서, 다음에 쓸 때 더 빠르다

**한 줄 정의:**

> 회사 표준 형식의 보고서를, AI가 대화로 이끌어내서, 더 빠르고 일관되게 만드는 작업공간

### 일반 LLM과 뭐가 다른가

| | 일반 대화형 LLM | HARP |
|---|---|---|
| **시작** | 빈 화면. 사용자가 잘 물어야 잘 나온다 | 보고서 유형을 고르면 AI가 먼저 질문한다 |
| **대화 방식** | 자유 대화. 방향이 흔들릴 수 있다 | 체크리스트 기반 산파술. 빠뜨리는 항목 없이 구조화 |
| **결과물** | 자유 텍스트. 형식이 매번 다르다 | 회사 표준 템플릿에 맞춘 구조화된 문서 |
| **품질 관리** | 없음. 프롬프트 운에 달림 | Front Guard(형식 강제) + Back Guard(품질 검증) |
| **과거 작업** | 매번 새 대화. 맥락 초기화 | 이전 보고서·근거자료가 쌓이고 재사용 가능 |
| **작업 과정** | 보이지 않음 | 캔버스에 실시간으로 문서가 채워지는 걸 본다 |

**핵심 차별점 요약:**

- **AI가 묻는다** — 사용자가 프롬프트를 잘 쓸 필요 없다
- **결과가 표준이다** — 누가 써도 같은 형식, 일정한 품질
- **작업이 쌓인다** — 쓸수록 빨라진다
- **과정이 보인다** — 대화가 실시간으로 문서가 되는 걸 눈으로 확인

---

## 2. 핵심 철학

- 이 제품은 `LLM을 믿는 제품`이 아니라 **컨텍스트를 설계하는 제품**이다
- 대화는 자산이 아니라 원재료다. 자산은 정제·승격된 결과물이다
- 모델이 기억하는 것이 아니라, 플랫폼이 맥락을 저장하고 필요할 때 공급한다
- 어떤 LLM을 써도 하네스(규칙+구조)가 품질 하한선을 보장한다

---

## 3. 대상 사용자

- HR 도메인 (People팀 AX & CI Lab)
- 주요 사용자: 수백 명 규모의 HR 담당자
- 비개발자. AI 경험은 ChatGPT 수준의 자유 대화만 해본 정도

---

## 4. MVP 범위

### 포함

| # | 기능 | 설명 |
|---|------|------|
| F1 | 산출물 유형 선택 | 3종 중 선택 (클릭) |
| F2 | 산파술 인터뷰 | 체크리스트 기반 대화. 기획 방법론 제안 포함 |
| F3 | 캔버스 실시간 문서화 | 대화 좌 + 문서 우. 섹션별 실시간 채워짐 |
| F4 | Front Guard | 시스템 프롬프트에 템플릿·필수항목·근거 요구 내장 |
| F5 | Back Guard | 생성 시 confidence/근거 메타데이터 동시 생성 |
| F6 | 산출물 뷰어 + 복사 | Markdown → HTML 렌더링. 전체 복사 기능 |
| F7 | Private Workspace | 사용자별 격리된 작업공간 |
| F8 | 세션 영구 보관 | 모든 대화·소스·산출물 영구 저장 |
| F9 | 데이터 라이프사이클 | session → source → draft → final → promoted_asset |
| F10 | Retrieval (기본) | 같은 workspace 내 문서 유형 + 최근성 + 키워드 기반 |
| F11 | 계정/인증 | self-signup (loginId, password, name, employeeNumber, knoxId) |
| F12 | 제품 소개 페이지 | 비개발자 대상 가치 전달. 기존 LLM 대비 차별점 |

### 제외 (후순위)

- Team shared / Org template workspace
- Knowledge Graph
- Office import pipeline
- PPT/DOCX/Excel 파일 내보내기 (MVP는 뷰어+복사)
- 관리자 템플릿 편집 UI
- 범용 직군 확장

---

## 5. MVP 표준 산출물 3종

### 5.1 주간 HR 현황 보고

- 반복성 높음, 표준화 쉬움, 빠른 초안 가치 분명
- 예상 섹션: 주요 이슈 요약 / 진행 현황 / 주간 지표 / 다음 주 계획 / 특이사항

### 5.2 교육 운영 결과 요약 ⭐ 기준 시나리오

- 입력 자료가 구조화되어 있음. 근거 연결 용이
- **Kirkpatrick 4단계 모델 기반 구조**:
  1. 교육 개요 (과정명, 기간, 대상, 목적)
  2. Level 1 — 반응: 참여 현황 + 만족도
  3. Level 2 — 학습: 핵심 학습 내용 + 평가 결과
  4. Level 3 — 행동: 현업 적용 계획/사례
  5. Level 4 — 결과: 기대 성과 + 측정 지표
  6. 인사이트 + 개선 제안
  7. 근거 자료

### 5.3 제도 검토 초안

- 실무 가치 큼. 다만 복잡도 높아 완성도는 제한적 명시
- 예상 섹션: 배경 / 현행 제도 분석 / 비교안 / 리스크 / 제안 / 근거 자료

> 템플릿은 코드에 하드코딩. 추후 관리자 편집 가능 구조로 확장.
> 템플릿 정의를 한 곳에 모아서, DB로 빼기 쉽게 설계한다.

---

## 6. 기준 시나리오

> **교육 담당자가 교육 결과 데이터를 붙여넣고, AI와 3분 대화했더니, 캔버스에 "교육 운영 결과 요약" 보고서가 섹션별로 채워지는 장면**

### 상세 흐름

```
1. 로그인 → 제품 소개 페이지 (첫 방문 시)
2. "새 작업" → 산출물 유형 선택: "교육 운영 결과 요약" 클릭
3. 화면 분할: 좌측 채팅 / 우측 캔버스
4. 캔버스에 체크리스트 표시:
   □ 교육 개요  □ 참여 현황  □ 주요 결과
   □ 인사이트  □ 개선 제안  □ 근거
5. AI: "어떤 교육의 결과를 정리하시려는 건가요?"
6. 사용자: 교육명, 기간, 대상 설명 + 결과 데이터 붙여넣기
7. AI: "참여율이나 만족도 수치가 있으면 알려주세요" (빠진 항목 추적)
8. 대화 진행 → 캔버스 "교육 개요" 섹션 ✓ 채워짐
9. AI: "이 교육에서 가장 인상적이었던 점은 뭐였나요?" (인사이트 유도)
10. 대화 진행 → 캔버스 섹션들이 하나씩 채워짐
11. AI: "현황 분석에 As-Is/To-Be 프레임을 적용해볼까요?" (방법론 제안)
12. 모든 체크리스트 ✓ → "정리하기" 활성화
13. "정리하기" 클릭 → 전체 문서 최종 정리 + Back Guard 메타데이터 표시
14. 캔버스에 완성 문서: 각 섹션에 confidence 표시 (✓ 근거 있음 / ⚠ 추정)
15. 사용자 검토 → 섹션 클릭으로 수정 요청 가능
16. "저장" → final_deliverable로 저장
17. 필요 시 "자산 승격" → promoted_asset으로 분류
```

---

## 7. 산파술 인터뷰 설계

### 7개 필수 항목 (체크리스트)

| # | 항목 | 질문 의도 | 추천 방법론 |
|---|------|----------|-----------|
| 1 | 목적 | 이 일을 왜 하는가? | 5 Whys, SCQA(Situation→Complication) |
| 2 | 대상 | 누구를 위한 것인가? | 이해관계자 맵, Employee Journey Map |
| 3 | 현황 | 지금 상황은 어떤가? | SWOT, As-Is/To-Be, PEST |
| 4 | 제안 | 무엇을 하고 싶은가? | MECE + Issue Tree, Design Thinking |
| 5 | 기대효과 | 성공하면 어떻게 달라지는가? | OKR, Logic Model(Input→Impact) |
| 6 | 일정 | 언제까지? | 6W2H (When/How much) |
| 7 | 근거/데이터 | 뒷받침할 자료가 있는가? | So What/Why So 검증 |

### 동작 방식

- 산출물 유형에 따라 체크리스트 항목의 **가중치가 다르다**
  - 주간 보고: 현황(높음), 목적(낮음 — 이미 정해져 있으므로)
  - 교육 결과: Kirkpatrick 4단계를 기본 구조로 제안
  - 제도 검토: 근거(높음), As-Is/To-Be + Force Field 우선 제안
- AI는 자연 대화로 진행하되, 빠진 항목을 추적하여 추가 질문
- 사용자가 항목을 건너뛸 수 있음 ("이건 나중에 채울게")
- 중간에 기획 방법론을 클릭형으로 제안 ("SWOT으로 분석해볼까요?")

### 산출물 유형별 방법론 매핑

| 산출물 | 구조화 | 분석 | 검증 |
|--------|--------|------|------|
| 주간 HR 현황 보고 | SDS (요약→상세→요약) | HR Analytics(현황 기술) | Action Title |
| 교육 운영 결과 요약 | Kirkpatrick 4단계 | Logic Model(투입→성과) | So What/Why So |
| 제도 검토 초안 | 피라미드 원칙 + SCQA | As-Is/To-Be + Force Field | MECE 검증 |

### 방법론 제안 UX

- AI가 대화 중 적절한 시점에 방법론을 **클릭 가능한 카드**로 제안
- 예: "현황을 정리하는 방법으로 다음 중 하나를 선택해볼까요?"
  - [SWOT 분석] [As-Is / To-Be] [자유 정리]
- 사용자가 선택하면 해당 프레임워크에 맞춘 후속 질문으로 전환
- 선택하지 않아도 진행 가능 (강제 아님)

> 상세 방법론 레퍼런스: `docs/methodology-reference.md` (27개 방법론 수록)

---

## 8. UI 구조

### 8.1 라우팅

```
/                       → 제품 소개 페이지 (비로그인)
/login                  → 로그인
/signup                 → 회원가입
/workspace              → 워크스페이스 대시보드 (세션/산출물 목록)
/workspace/new          → 산출물 유형 선택
/workspace/session/:id  → 캔버스 (채팅 + 문서)
/workspace/asset/:id    → 산출물 뷰어
```

### 8.2 핵심 레이아웃

**제품 소개 페이지 (`/`)**
- 비개발자 대상 제품 가치 전달
- "일반 AI와 뭐가 다른가" 비교 섹션
- 기준 시나리오 시각적 데모/GIF
- CTA: "시작하기" → 로그인/회원가입

**산출물 유형 선택 (`/workspace/new`)**
- 3종 카드: 주간 HR 현황 보고 / 교육 운영 결과 요약 / 제도 검토 초안
- 각 카드에 간단한 설명 + 예상 소요시간
- 클릭 → 세션 생성 → 캔버스로 이동

**캔버스 (`/workspace/session/:id`)**
```
┌──────────────────────┬────────────────────────┐
│  채팅 패널 (좌)        │  문서 캔버스 (우)         │
│                      │                        │
│  [AI 메시지]          │  ┌─ 체크리스트 ────────┐ │
│  [사용자 입력]         │  │ ✓ 교육 개요         │ │
│  [AI 후속 질문]        │  │ ▶ 참여 현황 (작성중) │ │
│  [방법론 제안 버튼]     │  │ ○ 주요 결과         │ │
│                      │  │ ○ 인사이트          │ │
│                      │  │ ○ 개선 제안         │ │
│                      │  │ ○ 근거             │ │
│                      │  └────────────────────┘ │
│                      │                        │
│                      │  [문서 내용 렌더링]       │
│                      │  섹션별 confidence 표시  │
│                      │                        │
│  ┌────────────────┐  │  ┌──────────────────┐  │
│  │ 메시지 입력     │  │  │ 정리하기 / 저장   │  │
│  └────────────────┘  │  └──────────────────┘  │
└──────────────────────┴────────────────────────┘
```

**워크스페이스 대시보드 (`/workspace`)**
- 최근 세션 목록 (진행 중 / 완료)
- 산출물 목록 (draft / final / promoted)
- "새 작업" 버튼
- 검색 (키워드 기반)

---

## 9. 데이터 모델

### 9.1 엔티티 관계

```
User (1) ──── (1) Workspace
                    │
                    ├── (N) Session
                    │         ├── (N) Message (채팅 기록)
                    │         └── (N) Source (붙여넣은 근거자료)
                    │
                    └── (N) Deliverable
                              │
                              ├── type: draft | final | promoted_asset
                              ├── template: 산출물 유형 참조
                              ├── sections: JSON (섹션별 내용 + confidence)
                              └── (1) Session 참조 (어떤 세션에서 생성됐는지)
```

### 9.2 핵심 테이블

```sql
-- 사용자
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  login_id       TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,
  employee_number TEXT UNIQUE NOT NULL,
  knox_id        TEXT UNIQUE NOT NULL,
  role           TEXT DEFAULT 'user',  -- user | admin
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- 워크스페이스 (1:1 with user, 추후 team 확장 대비)
CREATE TABLE workspaces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES users(id),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 세션 (대화 단위)
CREATE TABLE sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id),
  template_type TEXT NOT NULL,  -- weekly_report | training_summary | policy_review
  title         TEXT,
  status        TEXT DEFAULT 'in_progress',  -- in_progress | completed
  checklist     JSONB,  -- 7개 항목 진행 상태
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 메시지 (채팅 기록)
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  role       TEXT NOT NULL,  -- user | assistant | system
  content    TEXT NOT NULL,
  metadata   JSONB,  -- method_suggestion, checklist_update 등
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 소스 (붙여넣은 근거자료)
CREATE TABLE sources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  content    TEXT NOT NULL,
  label      TEXT,  -- 사용자가 붙인 이름
  type       TEXT,  -- text | table | data
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 산출물
CREATE TABLE deliverables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id),
  session_id    UUID REFERENCES sessions(id),
  template_type TEXT NOT NULL,
  title         TEXT NOT NULL,
  sections      JSONB NOT NULL,  -- [{name, content, confidence, cited}]
  status        TEXT DEFAULT 'draft',  -- draft | final | promoted_asset
  version       INTEGER DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 전문 검색 (PostgreSQL)
CREATE INDEX idx_deliverables_fts ON deliverables
  USING gin(to_tsvector('simple', title || ' ' || sections::text));

CREATE INDEX idx_messages_fts ON messages
  USING gin(to_tsvector('simple', content));
```

---

## 10. 시스템 아키텍처

### 10.1 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| Frontend | Next.js 15 (App Router) | 기존 코드베이스. SSR + API Routes |
| UI | Tailwind CSS + "Trust within Flow" 디자인 시스템 | 이미 구축됨 |
| DB | PostgreSQL + Drizzle ORM | 동시 접속 수백 명 대비. 타입 안전 |
| AI | Qwen3-235B-A22B (사내) | OpenAI 호환 API |
| AI SDK | Vercel AI SDK | 스트리밍, useChat, 구조화 출력 |
| 배포 | Docker Compose (사내 서버, port 26000) | HR-Coaching과 병렬 운영 |
| 인증 | 자체 구현 (bcrypt + JWT) | 사내 환경, 외부 의존성 최소화 |

### 10.2 컨테이너 구성

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["26000:3000"]
    environment:
      DATABASE_URL: postgresql://harness:***@db:5432/harness
      LLM_API_URL: http://10.240.248.157:8533/v1
      LLM_MODEL: Qwen/Qwen3-235B-A22B
    depends_on: [db]

  db:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: harness
      POSTGRES_USER: harness
      POSTGRES_PASSWORD: ***

volumes:
  pgdata:
```

### 10.3 API 구조

```
POST   /api/auth/signup          → 회원가입
POST   /api/auth/login           → 로그인
GET    /api/auth/me              → 현재 사용자

POST   /api/sessions             → 세션 생성 (template_type 지정)
GET    /api/sessions             → 세션 목록
GET    /api/sessions/:id         → 세션 상세 (messages 포함)

POST   /api/sessions/:id/chat    → 채팅 메시지 전송 (스트리밍 응답)
POST   /api/sessions/:id/source  → 근거자료 첨부

POST   /api/sessions/:id/generate   → "정리하기" → 산출물 생성
GET    /api/deliverables             → 산출물 목록
GET    /api/deliverables/:id         → 산출물 상세
PATCH  /api/deliverables/:id         → 산출물 수정/상태변경 (promote 등)

GET    /api/search?q=...         → workspace 내 검색
GET    /api/health               → 헬스체크
```

---

## 11. Front Guard 설계 (시스템 프롬프트)

모든 품질 통제는 시스템 프롬프트에 녹인다.

### 11.1 인터뷰 단계 프롬프트 구조

```
[시스템 역할]
당신은 HR 업무 전문 기획 파트너입니다.
사용자와 대화하며 {template_type}에 필요한 정보를 수집합니다.

[체크리스트]
아래 7개 항목을 대화를 통해 자연스럽게 채워주세요:
1. 목적 — ...
2. 대상 — ...
...

[규칙]
- 질문은 한 번에 하나씩
- 사용자가 애매하게 답하면 구체화 질문
- 기획 방법론(SWOT, MECE 등)을 적절히 제안
- 한국어로 자연스럽게 대화
- 각 답변 후, 체크리스트 업데이트를 JSON으로 함께 반환
```

### 11.2 생성 단계 프롬프트 구조

```
[시스템 역할]
수집된 정보를 기반으로 {template_type} 산출물을 작성합니다.

[템플릿 구조]
아래 섹션 순서를 반드시 따르세요:
1. {section_1_name}: {section_1_description}
2. {section_2_name}: {section_2_description}
...

[Front Guard 규칙]
- 근거 없이 단정적 서술 금지. 근거 부족 시 "추정" 표시
- 각 섹션에 confidence(high/medium/low)와 cited(true/false) 메타데이터 포함
- 데이터가 있으면 수치를 포함한 서술
- 비즈니스 한국어 톤. 번역체 금지

[출력 형식]
Markdown + 섹션별 메타데이터 JSON
```

---

## 12. Retrieval 설계 (MVP)

### 원칙

- 같은 workspace 내부 자료만 대상
- full RAG / vector DB 없음 (MVP)
- PostgreSQL 전문 검색(tsvector) + 필터 조합

### 검색 전략

```
1. 사용자가 새 세션 시작 시:
   - 같은 template_type의 이전 deliverable 조회 (최근순)
   - 상위 3건의 제목+요약을 AI 컨텍스트에 포함
   → "지난번 Q4 교육 결과 보고서를 참고하시겠습니까?"

2. 대화 중 근거 필요 시:
   - workspace 내 source + deliverable에서 키워드 검색
   - 관련 문서 상위 3건을 evidence bundle로 묶어 AI에 공급

3. "정리하기" 실행 시:
   - 현재 세션의 messages + sources 전체
   - 이전 동일 유형 deliverable (최신 1건) 참고용
```

---

## 13. 데이터 라이프사이클

```
session (대화)
    ↓ 사용자가 자료 붙여넣기
source (근거자료)
    ↓ "정리하기" 클릭
draft (초안)
    ↓ 사용자 검토 + 수정
final_deliverable (확정본)
    ↓ 사용자가 "자산 승격" 선택
promoted_asset (재사용 자산)
```

- 전환은 모두 **사용자의 명시적 액션**으로만 발생
- 모든 단계의 데이터는 영구 보관
- 삭제는 사용자 명시 요청 시만

---

## 14. 인증/인가

### MVP 인증

- self-signup: loginId / password / name / employeeNumber / knoxId
- loginId, employeeNumber, knoxId 각각 유니크 제약
- 비밀번호: bcrypt 해시 저장
- 세션: JWT (httpOnly cookie)

### 인가

- 기본값: private. 본인 workspace만 접근 가능
- 관리자(admin): 사용자 목록, 계정 상태, 내역 확인 가능
- 추후: team shared workspace, 자산 승격 승인 워크플로우

---

## 15. 의사결정 기록 (ADR)

| # | 결정 | 근거 |
|---|------|------|
| D-001 | 메인 화면: 산출물 유형 선택 | "기존 LLM과 다른 경험"을 첫 화면에서 보여줘야 함 |
| D-002 | 산파술: 혼합형 (체크리스트 + 자유 대화) | 구조 보장 + 자연스러운 UX |
| D-003 | 캔버스: 채팅 좌 + 문서 우 실시간 | 과정이 보여야 차별점이 됨 |
| D-004 | 산출물: Markdown → HTML 렌더링 | LLM이 가장 잘 만드는 형태 + 자유도 높음 |
| D-005 | LLM: Qwen3-235B (사내) | 외부 API 불가. 성능은 충분 |
| D-006 | Front Guard: 시스템 프롬프트 내장 | 추가 LLM 호출 없이 품질 강제 |
| D-007 | Back Guard: 생성 시 메타데이터 동시 생성 | 추가 호출 없이 confidence/cited 태깅 |
| D-008 | 템플릿: 하드코딩 → 점차 DB로 | MVP 단순성 + 확장 경로 확보 |
| D-009 | DB: PostgreSQL + Drizzle | 동시 접속 수백 명 대비 |
| D-010 | 배포: Docker Compose, port 26000 | 사내 서버 운영 |
| D-011 | 세션: 전 데이터 영구 보관 | 점진적 자산화 + 고도화 데이터 |
| D-012 | 계정: self-signup + 5필드 | 사용자 강제 요구사항 |
| D-013 | Coaching AI: 완전 별개 | 기술/기능 공유 없음 |
| D-014 | 디자인 시스템: Trust within Flow | Pretendard + Core Blue + Teal. 이미 구축됨 |

---

## 16. 구현 페이즈

### Phase A: 인프라 기반

- Docker Compose (app + postgres)
- next.config standalone
- DB 스키마 + Drizzle 마이그레이션
- Health API

### Phase B: 인증 + 워크스페이스

- 회원가입 / 로그인 API
- JWT 미들웨어
- 워크스페이스 자동 생성
- 기본 라우팅 (/, /login, /signup, /workspace)

### Phase C: 캔버스 코어

- 세션 생성 + 채팅 API (스트리밍)
- Qwen3 연동 (Vercel AI SDK + OpenAI 호환)
- 캔버스 UI (채팅 좌 + 문서 우)
- 체크리스트 상태 관리
- 산파술 시스템 프롬프트 (인터뷰 단계)

### Phase D: 산출물 생성

- "정리하기" → 산출물 생성 API
- 생성 단계 시스템 프롬프트 (Front Guard + Back Guard)
- 섹션별 렌더링 + confidence 표시
- 산출물 저장 (draft → final → promoted)

### Phase E: Retrieval + 제품 완성

- workspace 내 전문 검색
- 이전 산출물 참조 기능
- 제품 소개 페이지
- 워크스페이스 대시보드

---

## 17. 아직 열린 질문

1. 각 산출물 3종의 실제 템플릿 세부 섹션 확정
2. promoted_asset 승격 UX 상세
3. 장기: shared workspace 열기 시점과 방식
4. 장기: 파일 내보내기 (DOCX/PPT) 우선순위
5. LLM API endpoint 최종 확인 (IP, 포트, 모델명)
