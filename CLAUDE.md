# Harness Engineering Rules

> 이 문서는 AI 에이전트의 출력을 제어하는 PRIMARY HARNESS입니다.
> 어떤 AI 모델을 사용하더라도 동일한 구조·품질의 결과물(멱등성)을 보장합니다.

---

## 1. Process: 4-Step Execution Protocol

모든 작업은 아래 순서를 따른다:

1. **Plan**: 작업 계획 수립 → 사용자 승인 후 진행
2. **Execute**: 계획 기반으로 단계별 구현
3. **Self-Check**: 아래 Back Guard 기준으로 자체 평가 (실행 시점: 커밋 직전, `/harness-eval` 명령 시)
4. **Report**: 평가 결과를 `.harness/back-guard/eval-template.md` 양식으로 정리

**절대 Plan 없이 코드를 작성하지 않는다.**
**Front Guard(`npm run harness:check`)는 ts/tsx 코드 품질을, Back Guard는 AI 산출물 품질을 담당한다.**

---

## 2. Context Hierarchy (계층화 컨텍스트)

컨텍스트는 3개 레이어로 구성된다. 충돌 시 **Local > Domain > Global** 우선:

| Layer | 위치 | 역할 |
|-------|------|------|
| **Global** | `/CLAUDE.md` (이 파일) | 전사 공통 규정 |
| **Domain** | `src/domains/<name>/CLAUDE.md` | 도메인별 규칙 |
| **Local** | 각 디렉토리의 `CLAUDE.md` | 디렉토리별 세부 규칙 |

---

## 3. Front Guard: Naming Conventions

### 3.1 파일명

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | `kebab-case.tsx` | `user-profile-card.tsx` |
| 유틸리티 | `kebab-case.ts` | `format-date.ts` |
| 타입 정의 | `kebab-case.ts` (types/ 하위) | `user-types.ts` |
| 상수 파일 | `kebab-case.ts` | `api-endpoints.ts` |
| 테스트 | `*.test.ts` or `*.test.tsx` (소스와 동일 위치) | `format-date.test.ts` |
| 페이지 (App Router) | `page.tsx`, `layout.tsx`, `loading.tsx` 등 Next.js 규칙 | `page.tsx` |

### 3.2 코드 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase (파일명에서 파생) | `user-profile-card.tsx` → `UserProfileCard` |
| Props 인터페이스 | `{ComponentName}Props` | `UserProfileCardProps` |
| 함수/변수 | camelCase | `getUserData`, `isLoading` |
| 상수 | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Boolean | `is*`, `has*`, `should*`, `can*` 접두사 | `isVisible`, `hasPermission` |
| 이벤트 핸들러 (내부) | `handle*` | `handleSubmit`, `handleClick` |
| 이벤트 핸들러 (Props) | `on*` | `onClick`, `onSubmit` |
| 커스텀 훅 | `use*` | `useAuth`, `useDebounce` |
| 타입/인터페이스 | PascalCase | `UserProfile`, `ApiResponse` |

### 3.3 Export 규칙

- **Named export만 사용한다.** Default export 금지.
- 예외: Next.js App Router의 `page.tsx`, `layout.tsx`, `route.ts`는 default export 허용.
- 한 파일에 하나의 컴포넌트만 정의한다.
- 컴포넌트 디렉토리에서 barrel export (`index.ts`) 사용하지 않는다.

---

## 4. Front Guard: Import Order

임포트는 아래 5개 그룹 순서를 따르며, 그룹 간 빈 줄로 구분한다:

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { clsx } from 'clsx';
import { z } from 'zod';

// 3. Internal imports (@/ alias) - types → lib → components → domains 순
import type { User } from '@/types';
import { formatDate } from '@/lib/format-date';
import { Button } from '@/components/ui/button';

// 4. Relative imports (../ 먼저, ./ 나중)
import { parentUtil } from '../utils';
import { localHelper } from './helper';

// 5. Style imports
import './styles.css';
```

각 그룹 내에서는 알파벳 순으로 정렬한다.

---

## 5. Front Guard: Idempotency Rules (멱등성 규칙)

아래 규칙은 **어떤 AI 모델이든 동일한 코드를 생성하도록** 강제한다:

### 금지 패턴

| 규칙 | 이유 |
|------|------|
| `Date.now()`, `new Date()` 렌더 스코프 내 사용 금지 | 비결정적 출력 발생 |
| `Math.random()` 키/ID 생성 금지 | 비결정적 식별자 |
| JSX 내 인라인 익명 함수 금지 | return 전에 선언할 것 |
| 조건부 import 금지 | 모든 import는 최상단, 무조건적 |
| 모듈 스코프 side effect 금지 | 타입 선언 제외 |
| `any` 타입 사용 금지 | `unknown` 사용 후 타입 가드 |
| magic string/number 금지 | 상수로 추출 |

### 강제 패턴

| 규칙 | 이유 |
|------|------|
| 기존 패턴 존재 시 반드시 따를 것 | 일관성 = 멱등성 |
| 명시적(explicit) > 암묵적(implicit) | 추론 여지 제거 |
| 서버 컴포넌트가 기본 | `'use client'`는 필요시에만 |
| Props는 함수 시그니처에서 destructure | `props.xxx` 사용 금지 |
| 글로벌 상태: Zustand | 로컬 상태만 useState |
| 데이터 페칭: 서버 → async 직접, 클라이언트 → SWR | 패턴 통일 |

---

## 6. Front Guard: Component Patterns

```typescript
// CORRECT: 하네스 규칙 준수 컴포넌트 예시
import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import type { ButtonVariant } from '@/types';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  isDisabled?: boolean;
  onClick?: () => void;
}

function Button({ children, variant = 'primary', isDisabled = false, onClick }: ButtonProps) {
  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      className={clsx('btn', `btn-${variant}`, { 'btn-disabled': isDisabled })}
      disabled={isDisabled}
      onClick={handleClick}
      type="button"
    >
      {children}
    </button>
  );
}

export { Button };
export type { ButtonProps };
```

---

## 7. Front Guard: Commit Message Format

```
type(scope): concise description

[optional body]
```

**Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`
**Scope**: 도메인명 또는 모듈명 (예: `auth`, `payment`, `ui`)

예시:
- `feat(auth): add social login with Google OAuth`
- `fix(payment): handle timeout on card verification`
- `refactor(ui): extract shared form field component`

---

## 8. Back Guard: Self-Evaluation Protocol

모든 작업 완료 후 아래 4기준으로 자체 평가를 수행한다:

| 기준 | 가중치 | 평가 질문 |
|------|--------|-----------|
| **Relevance** (연관성) | 25% | 요구사항을 정확히 충족하는가? 불필요한 코드가 없는가? |
| **Faithfulness** (충실도) | 30% | 이 문서(CLAUDE.md)의 모든 규칙을 준수하는가? |
| **Correctness** (정확성) | 25% | 컴파일되는가? 엣지 케이스를 처리하는가? 버그가 없는가? |
| **Source Quality** (품질) | 20% | 가독성이 좋은가? 유지보수 가능한가? 구조가 깔끔한가? |

### 채점 기준
- 각 항목 0~5점
- 가중 평균 **3.2/5.0 이상** = PASS
- 미달 시 자체 수정 후 재평가

### 평가 보고 형식

```
## Self-Evaluation
| Criterion     | Score | Notes |
|---------------|-------|-------|
| Relevance     | ?/5   |       |
| Faithfulness  | ?/5   |       |
| Correctness   | ?/5   |       |
| Source Quality | ?/5   |       |
| **Weighted**  | ?/5.0 | PASS/FAIL |
```

---

## 9. Directory Structure Convention

```
src/
├── app/                    # Next.js App Router pages
├── components/
│   └── ui/                 # 공유 UI 프리미티브
├── lib/                    # 유틸리티, 헬퍼 함수
├── types/                  # 공유 타입 정의
└── domains/                # DDD 도메인 모듈
    └── <domain-name>/
        ├── CLAUDE.md       # Domain Layer 하네스
        ├── types.ts        # 도메인 타입
        ├── actions.ts      # 도메인 액션 (mutations)
        ├── queries.ts      # 도메인 쿼리 (read)
        └── components/     # 도메인 전용 컴포넌트
```

---

## 10. Forbidden Actions

- `rm -rf` 또는 대규모 삭제 금지
- `git push --force` 금지
- `.env`, 시크릿 파일 커밋 금지
- 기존 코드 읽지 않고 수정 금지
- Plan 없이 3개 이상 파일 동시 수정 금지
