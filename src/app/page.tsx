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

const HOW_IT_WORKS_STEPS = [
  {
    description: '주간 HR 현황 보고, 교육 운영 결과 요약, 제도 검토 초안 중 하나를 고릅니다.',
    title: '1. 산출물 유형 선택',
  },
  {
    description: 'AI가 빠진 항목을 추적하며 질문하고, 필요한 프레임워크도 중간에 제안합니다.',
    title: '2. 대화로 정보 수집',
  },
  {
    description: '오른쪽 캔버스에 섹션별 초안이 쌓이고, 정리하기로 draft를 완성합니다.',
    title: '3. 표준 초안 생성',
  },
  {
    description: 'final과 promoted asset으로 승격하며 다음 업무의 참고 자산으로 남깁니다.',
    title: '4. 작업 축적',
  },
];

const VALUE_CARDS = [
  {
    badge: 'Private Workspace',
    description:
      '개인 작업 맥락과 근거자료를 분리 저장해 매번 같은 배경설명을 다시 하지 않아도 됩니다.',
    title: '내 작업공간이 기억을 대신합니다',
  },
  {
    badge: 'Standard Output',
    description: '자유 채팅이 아니라 회사 표준 산출물 구조로 결과를 고정해 품질 하한선을 만듭니다.',
    title: '결과물이 흔들리지 않습니다',
  },
  {
    badge: 'Context Engineering',
    description: '모델 자체를 믿는 대신, 이전 산출물과 근거자료를 필요한 만큼만 다시 공급합니다.',
    title: 'LLM이 바뀌어도 방식은 유지됩니다',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="surface grid gap-8 overflow-hidden p-8 shadow-[var(--shadow-2)] lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:p-10">
          <div className="flex flex-col gap-5">
            <span className="section-label">HARP</span>
            <div className="flex flex-col gap-4">
              <h1 className="max-w-4xl text-4xl font-bold leading-tight text-[var(--color-text)] lg:text-5xl">
                HR 담당자가 AI와 대화하며 회사 표준 형식의 보고서를 만드는 작업공간
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">
                HARP는 흩어진 HR 자료를 바탕으로 대화를 구조화하고, 캔버스에 산출물 초안을
                실시간으로 정리하며, 쓸수록 다시 참조 가능한 자산을 쌓는 HR 전용 플랫폼입니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="btn-primary focus-ring" href="/signup">
                시작하기
              </Link>
              <Link className="btn-secondary focus-ring" href="/login">
                로그인
              </Link>
              <Link
                className="rounded-full border border-[var(--color-border)] px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
                href="/workspace"
              >
                작업공간 열기
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {VALUE_CARDS.map((card) => (
              <article className="doc-card flex flex-col gap-3 p-6" key={card.title}>
                <span className="badge badge-accent">{card.badge}</span>
                <h2 className="text-xl font-semibold text-[var(--color-text)]">{card.title}</h2>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface flex flex-col gap-6 p-8 shadow-[var(--shadow-2)]">
          <div className="flex flex-col gap-2">
            <span className="section-label">Why HARP</span>
            <h2 className="text-3xl font-semibold text-[var(--color-text)]">
              일반 대화형 LLM과 무엇이 다른가
            </h2>
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

        <section className="surface flex flex-col gap-6 p-8 shadow-[var(--shadow-2)]">
          <div className="flex flex-col gap-2">
            <span className="section-label">Scenario</span>
            <h2 className="text-3xl font-semibold text-[var(--color-text)]">
              교육 결과 보고를 만드는 기본 흐름
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
              HR 담당자가 결과 데이터를 붙여넣고 3분 정도 대화하면, 캔버스에 구조화된 초안이
              섹션별로 채워집니다.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <article className="doc-card flex flex-col gap-3 p-6" key={step.title}>
                <span className="badge badge-teal">{step.title}</span>
                <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface flex flex-col gap-5 p-8 shadow-[var(--shadow-2)]">
          <div className="flex flex-col gap-2">
            <span className="section-label">Core Principle</span>
            <h2 className="text-3xl font-semibold text-[var(--color-text)]">
              HARP는 LLM을 믿는 제품이 아니라 컨텍스트를 설계하는 제품입니다
            </h2>
            <p className="max-w-4xl text-sm leading-7 text-[var(--color-text-secondary)]">
              모델이 기억하는 것이 아니라, 작업공간이 사용자의 이전 세션, 근거자료, 산출물을
              저장하고 필요할 때 다시 꺼내 공급합니다. 그래서 대화는 원재료가 되고, final과 promoted
              asset은 다음 작업의 출발점이 됩니다.
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
