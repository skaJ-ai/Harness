import Link from 'next/link';

const COMPARISON_ROWS = [
  {
    general: '빈 화면에서 직접 프롬프트를 잘 써야 합니다.',
    harp: '산출물 유형을 고르면 AI가 먼저 질문을 시작합니다.',
    label: '시작 방식',
  },
  {
    general: '자유 대화라서 빠지는 항목이 생기기 쉽습니다.',
    harp: '체크리스트 기반 산파술 인터뷰로 누락을 줄입니다.',
    label: '대화 구조',
  },
  {
    general: '답변 형식이 매번 달라 보고서로 옮겨 적어야 합니다.',
    harp: '회사 표준 템플릿 구조로 바로 초안을 만듭니다.',
    label: '결과물',
  },
  {
    general: '이전 대화가 자산으로 남지 않아 다시 처음부터 시작합니다.',
    harp: '세션, 근거자료, 산출물이 작업공간에 축적됩니다.',
    label: '재사용성',
  },
];

const HERO_PROOF_POINTS = ['private-first 작업공간', '표준 산출물 3종', '컨텍스트 재활용'];

const HOW_IT_WORKS_STEPS = [
  {
    description: '주간 HR 현황 보고, 교육 운영 결과 요약, 제도 검토 초안 중 하나를 고릅니다.',
    title: '1. 산출물 유형 선택',
  },
  {
    description: 'AI가 빠진 항목을 추적하며 질문하고, 필요한 프레임워크를 대화 중 제안합니다.',
    title: '2. 인터뷰 진행',
  },
  {
    description: '오른쪽 캔버스에 섹션별 초안이 쌓이고, 정리하기로 draft를 완성합니다.',
    title: '3. 초안 생성',
  },
  {
    description: 'final과 promoted asset으로 승격하며 다음 작업의 참고 자산으로 남깁니다.',
    title: '4. 자산화',
  },
];

const HERO_CHAT_LINES = [
  '이번 교육은 신임 리더 42명을 대상으로 진행했고 만족도는 4.6점이었습니다.',
  '사전·사후 테스트는 평균 17% 상승했고, 현업 적용 사례는 9건이 확인됐습니다.',
  '좋습니다. Kirkpatrick 기준으로 반응, 학습, 행동, 결과를 나눠서 정리하겠습니다.',
];

const HERO_CHECKLIST = ['교육 목적과 대상 정의', '정량 결과 수집', '후속 액션 정리'];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(212,228,247,0.85),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(224,250,246,0.7),_transparent_28%),var(--color-bg)] px-6 py-6 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="surface flex flex-col gap-4 px-6 py-4 shadow-[var(--shadow-1)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold tracking-tight text-[var(--color-accent)]">
              HARP
            </span>
            <p className="text-sm text-[var(--color-text-secondary)]">HR AI Report Platform</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link className="btn-secondary focus-ring" href="/login">
              로그인
            </Link>
            <Link className="btn-primary focus-ring" href="/signup">
              시작하기
            </Link>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[32px] border border-[var(--color-border)] bg-[linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(246,250,255,0.98))] px-8 py-10 shadow-[var(--shadow-4)] lg:px-10 lg:py-12">
          <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(0,191,165,0.18),_transparent_70%)]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(15,76,129,0.14),_transparent_70%)]" />

          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.96fr)]">
            <div className="flex flex-col gap-6">
              <span className="badge badge-accent w-fit">HR AI Report Platform</span>
              <div className="flex flex-col gap-4">
                <h1 className="max-w-4xl text-balance text-4xl font-bold leading-tight text-[var(--color-text)] lg:text-6xl">
                  HR 담당자가 대화만으로 표준 보고서를 만드는 작업공간
                </h1>
                <p className="max-w-3xl text-base leading-8 text-[var(--color-text-secondary)] lg:text-lg">
                  HARP는 흩어진 HR 자료를 바탕으로 대화를 구조화하고, 문서 캔버스에 초안을
                  실시간으로 정리하며, 쓸수록 다음 업무에 다시 꺼내 쓸 수 있는 자산을 남깁니다.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-[var(--color-bg-elevated)]/80 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-4 shadow-[var(--shadow-1)]">
                  <p className="meta">Private Workspace</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    내 작업 맥락과 초안을 private하게 축적합니다.
                  </p>
                </div>
                <div className="bg-[var(--color-bg-elevated)]/80 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-4 shadow-[var(--shadow-1)]">
                  <p className="meta">Standard Output</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    보고서 형식이 매번 흔들리지 않도록 템플릿을 고정합니다.
                  </p>
                </div>
                <div className="bg-[var(--color-bg-elevated)]/80 rounded-[var(--radius-lg)] border border-[var(--color-border)] px-4 py-4 shadow-[var(--shadow-1)]">
                  <p className="meta">Context Reuse</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                    이전 산출물과 근거자료를 다시 불러와 다음 작업을 빠르게 시작합니다.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link className="btn-primary focus-ring" href="/signup">
                  지금 시작하기
                </Link>
                <Link className="btn-secondary focus-ring" href="/workspace">
                  작업공간 열기
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                {HERO_PROOF_POINTS.map((point) => (
                  <span className="badge badge-neutral" key={point}>
                    {point}
                  </span>
                ))}
              </div>
            </div>

            <div className="surface relative overflow-hidden border-white/80 bg-white/90 p-6 shadow-[var(--shadow-3)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
                <div className="flex flex-col gap-2">
                  <span className="badge badge-teal w-fit">교육 운영 결과 요약</span>
                  <h2 className="text-xl font-semibold text-[var(--color-text)]">
                    인터뷰에서 초안까지 이어지는 하나의 화면
                  </h2>
                </div>
                <span className="badge badge-neutral">draft ready</span>
              </div>

              <div className="mt-5 flex flex-col gap-4">
                <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-sunken)] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="meta">Interview Feed</p>
                    <span className="badge badge-accent">AI + 담당자</span>
                  </div>
                  <div className="grid gap-3">
                    {HERO_CHAT_LINES.map((line, index) => (
                      <div
                        className={`rounded-[var(--radius-md)] px-4 py-3 text-sm leading-6 ${
                          index === 2
                            ? 'border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text)]'
                            : 'bg-[var(--color-accent-light)] text-[var(--color-text)]'
                        }`}
                        key={line}
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-1)]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="meta">Checklist Progress</p>
                      <span className="badge badge-success">3 / 7 완료</span>
                    </div>
                    <div className="grid gap-3">
                      {HERO_CHECKLIST.map((item) => (
                        <div
                          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] px-3 py-3"
                          key={item}
                        >
                          <span className="status-dot status-dot-success" />
                          <span className="text-sm text-[var(--color-text-secondary)]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(212,228,247,0.3))] p-4 shadow-[var(--shadow-1)]">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="meta">Draft Snapshot</p>
                      <span className="badge badge-neutral">confidence attached</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-4">
                        <p className="text-sm font-semibold text-[var(--color-text)]">교육 개요</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                          대상 42명, 만족도 4.6점, 사전·사후 테스트 평균 17% 상승.
                        </p>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-4 py-4">
                        <p className="text-sm font-semibold text-[var(--color-text)]">결과 요약</p>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                          반응과 학습 수준은 검증되었고, 행동/결과 지표는 후속 추적 과제로 정리.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface flex flex-col gap-6 p-8 shadow-[var(--shadow-2)]">
          <div className="flex flex-col gap-2">
            <p className="meta">Why HARP</p>
            <h2 className="text-3xl font-semibold text-[var(--color-text)]">
              일반 대화형 LLM과 무엇이 다른가
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-secondary)]">
              HARP는 모델을 바꾸는 도구가 아니라, HR 업무에 필요한 질문 순서와 결과물 형식을
              고정하는 작업 시스템입니다.
            </p>
          </div>

          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--color-bg-sunken)]">
                  <th className="px-5 py-4 text-sm font-semibold text-[var(--color-text)]">항목</th>
                  <th className="px-5 py-4 text-sm font-semibold text-[var(--color-text)]">
                    일반 LLM
                  </th>
                  <th className="px-5 py-4 text-sm font-semibold text-[var(--color-text)]">HARP</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    className="border-t border-[var(--color-border-subtle)] align-top"
                    key={row.label}
                  >
                    <td className="px-5 py-4 text-sm font-semibold text-[var(--color-text)]">
                      {row.label}
                    </td>
                    <td className="px-5 py-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {row.general}
                    </td>
                    <td className="px-5 py-4 text-sm leading-6 text-[var(--color-text-secondary)]">
                      {row.harp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <article className="doc-card flex flex-col gap-3" key={step.title}>
              <span className="badge badge-accent w-fit">{step.title}</span>
              <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                {step.description}
              </p>
            </article>
          ))}
        </section>

        <section className="surface flex flex-col gap-5 p-8 shadow-[var(--shadow-2)]">
          <div className="flex flex-col gap-3">
            <p className="meta">Core Principle</p>
            <h2 className="text-3xl font-semibold text-[var(--color-text)]">
              HARP는 LLM을 믿는 제품이 아니라 컨텍스트를 설계하는 제품입니다
            </h2>
            <p className="max-w-4xl text-sm leading-7 text-[var(--color-text-secondary)]">
              모델이 기억하는 것이 아니라, 작업공간이 이전 세션, 근거자료, 산출물을 저장하고 필요한
              만큼 다시 꺼내 공급합니다. 그래서 대화는 원재료가 되고, final과 promoted asset은 다음
              업무의 출발점이 됩니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="btn-primary focus-ring" href="/signup">
              지금 시작하기
            </Link>
            <Link className="btn-secondary focus-ring" href="/workspace">
              작업공간 보기
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
