# TODO: HARP

> 마지막 업데이트: 2026-03-25
> 작업자: Claude Opus 4.6 + 사용자(jangs)

---

## 🔴 Urgent (즉시 필요)

- [ ] **Git 초기화 + 첫 커밋 + Push**
  ```bash
  cd C:/dev/HARP
  git init
  git add .
  git commit -m "feat: initialize harp platform"
  git remote add origin https://github.com/skaJ-ai/HARP.git
  git branch -M main
  git push -u origin main
  ```

- [ ] **npm install 실행**
  ```bash
  npm install
  ```

- [ ] **ESLint 작동 확인**
  ```bash
  npm run harness:check
  ```
  - 에러가 나면 eslint.config.mjs 디버깅 필요
  - flat config(v9)와 플러그인 호환성 문제 가능성 있음

---

## 🟡 Medium (안정화)

- [ ] **Git hooks 설치 확인**
  ```bash
  npm run harness:install-hooks
  ```
  - pre-commit이 실제로 린터를 실행하는지 테스트
  - 의도적으로 규칙 위반 코드를 커밋 시도해서 차단되는지 확인

- [ ] **ESLint flat config 디버깅**
  - `eslint-plugin-import`는 flat config와 호환성 이슈가 있을 수 있음
  - 대안: `eslint-plugin-import-x` 또는 `eslint-plugin-simple-import-sort`
  - `@typescript-eslint/naming-convention` Boolean prefix 규칙이 너무 엄격할 수 있음 → 필요시 완화

- [ ] **Next.js 페이지 default export 예외 확인**
  - eslint.config.mjs에 App Router 파일 예외 처리가 되어 있으나 실제 테스트 필요

- [ ] **button.tsx 예시 컴포넌트로 하네스 규칙 검증**
  - `npm run lint` 실행 시 button.tsx가 0 errors/0 warnings인지 확인
  - 아니면 규칙이나 코드 수정 필요

---

## 🟢 Low (개선/확장)

- [ ] **Typst CLI 설치 + 문서 파이프라인 테스트**
  ```bash
  # Windows
  winget install --id Typst.Typst
  # macOS
  brew install typst

  # Pandoc도 설치
  winget install --id JohnMacFarlane.Pandoc

  # 테스트
  ./doc-pipeline/build.sh
  ```

- [ ] **커스텀 ESLint 플러그인 개발** (선택)
  - "한 파일에 하나의 컴포넌트" 규칙
  - "barrel export 금지" 규칙
  - kebab-case 파일명 검증 규칙

- [ ] **실 프로젝트 적용 테스트**
  - 이 템플릿을 다른 프로젝트에 복사
  - 실제 기능 구현 후 harness:check 통과 확인
  - Back Guard 평가 수행

- [ ] **CI/CD 파이프라인 추가**
  - GitHub Actions에 harness:check 자동 실행
  - PR 시 자동 린트 검사

- [ ] **.cursorrules 파일 추가** (선택)
  - Cursor IDE 사용 시 CLAUDE.md와 동일한 규칙을 .cursorrules로도 제공
  - 내용은 CLAUDE.md를 Cursor 형식으로 변환

- [ ] **평가 자동화 스크립트**
  - eval-criteria.json을 기반으로 자동 채점 스크립트 구현
  - git diff를 입력으로 받아 점수 산출

---

## ✅ Completed

- [x] CLAUDE.md (Primary Harness) 작성
- [x] .harness/front-guard/ (네이밍, 임포트, 멱등성 규칙)
- [x] .harness/back-guard/ (평가 기준 JSON + 템플릿)
- [x] .harness/context-layers/ (Global/Domain/Local 템플릿)
- [x] .harness/hooks/ (pre-commit, commit-msg, install script)
- [x] package.json + 린터 의존성 정의
- [x] eslint.config.mjs (flat config v9)
- [x] .prettierrc.json + .prettierignore
- [x] tsconfig.json (strict mode)
- [x] next.config.ts + tailwind.config.ts + postcss.config.mjs
- [x] .editorconfig + .gitattributes + .gitignore
- [x] .claude/settings.json (permissions + hooks)
- [x] .claude/commands/ (harness-check, harness-eval)
- [x] docs/01-requirements/ (TEMPLATE + interview-guide)
- [x] docs/02-plan/ (TEMPLATE + convergence-guide)
- [x] docs/03-cps-prd/ (CPS-TEMPLATE + PRD-TEMPLATE)
- [x] docs/04-architecture/ (ADR + DDD + HITL)
- [x] docs/05-code-linter/ (CONVENTIONS)
- [x] docs/06-evaluation/ (SCORING-RUBRIC + REPORT-TEMPLATE)
- [x] doc-pipeline/ (Typst 템플릿 + build.sh + README)
- [x] src/app/ (layout, page, globals.css, Local CLAUDE.md)
- [x] src/components/ui/button.tsx (참조 구현)
- [x] src/lib/utils.ts (cn, Result, safeFetch)
- [x] src/types/index.ts (공유 타입)
- [x] src/domains/_template/ (Domain CLAUDE.md + types + actions + queries)
- [x] PROJECT-CONTEXT.md (LLM 핸드오프 문서)
- [x] TODO.md (이 파일)
