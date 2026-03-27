import type { SessionChecklist, TemplateType } from '@/lib/db/schema';

type MethodologyCategory = 'analysis' | 'structure' | 'validation';

interface TemplateSectionDefinition {
  description: string;
  name: string;
  required: boolean;
}

interface TemplateChecklistItem {
  id: string;
  intent: string;
  label: string;
  weight: number;
}

interface MethodologyCard {
  category: MethodologyCategory;
  description: string;
  id: string;
  name: string;
}

interface TemplateMethodologyMap {
  analysis: MethodologyCard[];
  structure: MethodologyCard[];
  validation: MethodologyCard[];
}

interface TemplatePromptSet {
  generate: string;
  interview: string;
}

interface TemplateDefinition {
  checklist: TemplateChecklistItem[];
  description: string;
  estimatedMinutes: number;
  methodologyMap: TemplateMethodologyMap;
  name: string;
  sections: TemplateSectionDefinition[];
  starterMessage: string;
  systemPrompt: TemplatePromptSet;
  type: TemplateType;
}

type TemplateDefinitionMap = Record<TemplateType, Omit<TemplateDefinition, 'systemPrompt'>>;

const CHECKLIST_ITEMS: TemplateChecklistItem[] = [
  { id: '1', intent: '이 문서를 왜 작성하는지 명확히 한다.', label: '목적', weight: 2 },
  { id: '2', intent: '누구를 위한 보고서인지와 독자를 분명히 한다.', label: '대상', weight: 1 },
  { id: '3', intent: '현재 상황과 주요 사실을 구조화한다.', label: '현황', weight: 3 },
  { id: '4', intent: '제안, 시사점, 개선안의 방향을 정리한다.', label: '제안', weight: 2 },
  {
    id: '5',
    intent: '기대효과와 의미를 숫자나 결과 중심으로 정리한다.',
    label: '기대효과',
    weight: 2,
  },
  { id: '6', intent: '일정과 후속 조치를 분명히 한다.', label: '일정', weight: 1 },
  { id: '7', intent: '근거 자료와 데이터 유무를 확인한다.', label: '근거/데이터', weight: 3 },
];

const METHODOLOGY_LIBRARY: Record<string, MethodologyCard> = {
  action_title: {
    category: 'validation',
    description: '섹션 제목을 행동 문장으로 정리해 핵심 메시지를 분명히 합니다.',
    id: 'action_title',
    name: 'Action Title',
  },
  as_is_to_be: {
    category: 'analysis',
    description: '현재 상태와 목표 상태를 비교해 변화 포인트를 선명하게 만듭니다.',
    id: 'as_is_to_be',
    name: 'As-Is / To-Be',
  },
  force_field: {
    category: 'analysis',
    description: '변화를 밀어주는 힘과 막는 힘을 나눠 리스크를 드러냅니다.',
    id: 'force_field',
    name: 'Force Field',
  },
  hr_analytics: {
    category: 'analysis',
    description: '현황 기술, 원인, 시사점을 HR 지표 중심으로 정리합니다.',
    id: 'hr_analytics',
    name: 'HR Analytics',
  },
  kirkpatrick: {
    category: 'structure',
    description: '반응-학습-행동-결과 순으로 교육 성과를 구조화합니다.',
    id: 'kirkpatrick',
    name: 'Kirkpatrick 4단계',
  },
  logic_model: {
    category: 'analysis',
    description: '투입-활동-산출-성과 흐름으로 교육/제도 효과를 설명합니다.',
    id: 'logic_model',
    name: 'Logic Model',
  },
  mece: {
    category: 'validation',
    description: '빠진 항목과 중복된 항목이 없는지 점검합니다.',
    id: 'mece',
    name: 'MECE 검증',
  },
  pyramid_scqa: {
    category: 'structure',
    description: '결론과 배경을 먼저 세워 임원 보고형 구조를 만듭니다.',
    id: 'pyramid_scqa',
    name: '피라미드 원칙 + SCQA',
  },
  sds: {
    category: 'structure',
    description: '요약-상세-요약 흐름으로 짧고 읽기 쉬운 보고를 만듭니다.',
    id: 'sds',
    name: 'SDS',
  },
  so_what_why_so: {
    category: 'validation',
    description: '데이터의 의미와 근거를 교차 점검해 논리적 허점을 줄입니다.',
    id: 'so_what_why_so',
    name: 'So What / Why So',
  },
};

const ACTION_TITLE = METHODOLOGY_LIBRARY.action_title!;
const AS_IS_TO_BE = METHODOLOGY_LIBRARY.as_is_to_be!;
const FORCE_FIELD = METHODOLOGY_LIBRARY.force_field!;
const HR_ANALYTICS = METHODOLOGY_LIBRARY.hr_analytics!;
const KIRKPATRICK = METHODOLOGY_LIBRARY.kirkpatrick!;
const LOGIC_MODEL = METHODOLOGY_LIBRARY.logic_model!;
const MECE = METHODOLOGY_LIBRARY.mece!;
const PYRAMID_SCQA = METHODOLOGY_LIBRARY.pyramid_scqa!;
const SDS = METHODOLOGY_LIBRARY.sds!;
const SO_WHAT_WHY_SO = METHODOLOGY_LIBRARY.so_what_why_so!;

const RAW_TEMPLATE_DEFINITIONS: TemplateDefinitionMap = {
  policy_review: {
    checklist: CHECKLIST_ITEMS,
    description: '배경, 현행 분석, 비교안, 리스크, 제안까지 한 번에 정리하는 정책 검토 초안입니다.',
    estimatedMinutes: 12,
    methodologyMap: {
      analysis: [AS_IS_TO_BE, FORCE_FIELD],
      structure: [PYRAMID_SCQA],
      validation: [MECE],
    },
    name: '제도 검토 초안',
    sections: [
      { description: '검토 배경과 문제의식을 간결하게 정리합니다.', name: '배경', required: true },
      {
        description: '현재 제도 상태와 운영상의 이슈를 분석합니다.',
        name: '현행 제도 분석',
        required: true,
      },
      { description: '대안별 특징과 선택지를 비교합니다.', name: '비교안', required: true },
      {
        description: '도입 시 예상되는 저항, 운영 부담, 법/제도 리스크를 정리합니다.',
        name: '리스크',
        required: true,
      },
      { description: '권고안과 필요한 후속 액션을 제안합니다.', name: '제안', required: true },
      {
        description: '내부 규정, 데이터, 벤치마크 등 근거를 정리합니다.',
        name: '근거 자료',
        required: true,
      },
    ],
    starterMessage:
      '제도 검토 초안을 함께 정리해보겠습니다. 먼저 어떤 제도를 왜 검토하려는지부터 들려주세요.',
    type: 'policy_review',
  },
  training_summary: {
    checklist: CHECKLIST_ITEMS,
    description:
      '교육 개요부터 Kirkpatrick 4단계, 인사이트와 개선 제안까지 표준 구조로 정리합니다.',
    estimatedMinutes: 8,
    methodologyMap: {
      analysis: [LOGIC_MODEL],
      structure: [KIRKPATRICK],
      validation: [SO_WHAT_WHY_SO],
    },
    name: '교육 운영 결과 요약',
    sections: [
      { description: '과정명, 대상, 기간, 목적을 정리합니다.', name: '교육 개요', required: true },
      {
        description: '참여율, 만족도, 반응 데이터를 정리합니다.',
        name: 'Level 1 — 반응',
        required: true,
      },
      {
        description: '학습 내용과 평가 결과를 요약합니다.',
        name: 'Level 2 — 학습',
        required: true,
      },
      {
        description: '현업 적용 계획과 실제 행동 변화를 정리합니다.',
        name: 'Level 3 — 행동',
        required: true,
      },
      {
        description: '기대 성과와 측정 지표를 정리합니다.',
        name: 'Level 4 — 결과',
        required: true,
      },
      {
        description: '핵심 인사이트와 개선 제안을 정리합니다.',
        name: '인사이트 + 개선 제안',
        required: true,
      },
      { description: '근거가 된 데이터와 출처를 정리합니다.', name: '근거 자료', required: true },
    ],
    starterMessage:
      '교육 운영 결과 요약을 시작하겠습니다. 어떤 교육을 정리하려는지와 기본 개요부터 알려주세요.',
    type: 'training_summary',
  },
  weekly_report: {
    checklist: CHECKLIST_ITEMS,
    description: '한 주의 주요 이슈, 진행 현황, 지표, 다음 주 계획을 빠르게 정리하는 보고서입니다.',
    estimatedMinutes: 6,
    methodologyMap: {
      analysis: [HR_ANALYTICS],
      structure: [SDS],
      validation: [ACTION_TITLE],
    },
    name: '주간 HR 현황 보고',
    sections: [
      {
        description: '이번 주에 가장 중요한 이슈와 요약 메시지를 정리합니다.',
        name: '주요 이슈 요약',
        required: true,
      },
      {
        description: '업무 진행 상태와 핵심 경과를 정리합니다.',
        name: '진행 현황',
        required: true,
      },
      { description: '주요 수치나 KPI를 정리합니다.', name: '주간 지표', required: true },
      {
        description: '다음 주에 이어갈 과업과 일정, 의사결정 포인트를 정리합니다.',
        name: '다음 주 계획',
        required: true,
      },
      {
        description: '특이사항, 리스크, 지원 요청 사항을 정리합니다.',
        name: '특이사항',
        required: true,
      },
    ],
    starterMessage:
      '주간 HR 현황 보고를 시작하겠습니다. 이번 주에 꼭 담아야 할 주요 이슈부터 말씀해주세요.',
    type: 'weekly_report',
  },
};

function buildChecklistJsonTemplate(checklist: TemplateChecklistItem[]): string {
  return `{${checklist.map((item) => `"${item.id}": boolean`).join(', ')}}`;
}

function buildCanvasJsonTemplate(template: Omit<TemplateDefinition, 'systemPrompt'>): string {
  const sectionTemplate = template.sections
    .map((section) => `{"name":"${section.name}","content":"..."}`)
    .join(', ');
  const methodologyIds = Object.values(template.methodologyMap)
    .flat()
    .map((methodology: MethodologyCard) => `"${methodology.id}"`)
    .join(', ');

  return `{"title":"${template.name}","sections":[${sectionTemplate}],"methodologySuggestionIds":[${methodologyIds}]}`;
}

function buildInterviewPrompt(template: Omit<TemplateDefinition, 'systemPrompt'>): string {
  const checklistGuide = template.checklist
    .map((item) => `- ${item.id}. ${item.label} (가중치 ${item.weight}) — ${item.intent}`)
    .join('\n');
  const methodologyGuide = Object.entries(template.methodologyMap)
    .map(([category, methodologies]) => {
      const cards = methodologies
        .map((methodology: MethodologyCard) => `${methodology.name}: ${methodology.description}`)
        .join(' / ');

      return `- ${category}: ${cards}`;
    })
    .join('\n');
  const sectionGuide = template.sections
    .map((section, index) => `${index + 1}. ${section.name} — ${section.description}`)
    .join('\n');

  return [
    '당신은 HR 업무 전문 기획 파트너입니다.',
    `현재 작업은 "${template.name}"입니다.`,
    '사용자와 한국어로 자연스럽게 대화하며, 산출물에 필요한 정보를 채워야 합니다.',
    '한 번에 질문은 하나만 하고, 답변을 들은 뒤 다음 질문으로 넘어갑니다.',
    '답변 앞부분에는 지금까지 파악한 내용을 1~2문장으로 짧게 정리합니다.',
    '근거가 부족하면 단정하지 말고, 필요한 자료를 다시 요청합니다.',
    '필요할 때만 방법론을 1~2개 제안하고, 강요하지 않습니다.',
    '체크리스트가 덜 채워진 항목을 우선 추적합니다.',
    '',
    '[섹션 구조]',
    sectionGuide,
    '',
    '[필수 체크리스트]',
    checklistGuide,
    '',
    '[허용된 방법론 카드]',
    methodologyGuide,
    '',
    '[출력 규칙]',
    '- 사용자에게 보이는 본문은 자연스러운 한국어 대화만 작성합니다.',
    '- 본문 뒤에는 숨김 메타데이터 주석을 정확히 두 개만 추가합니다.',
    '- 첫 번째 주석은 checklist JSON이고, 두 번째 주석은 canvas JSON입니다.',
    `- checklist 형식: <!-- checklist:${buildChecklistJsonTemplate(template.checklist)} -->`,
    `- canvas 형식: <!-- canvas:${buildCanvasJsonTemplate(template)} -->`,
    '- checklist 값은 true/false만 사용합니다.',
    '- canvas.sections는 반드시 위 섹션 순서와 이름을 그대로 유지합니다.',
    '- canvas.content에는 현재까지 수집된 내용을 짧게 누적 요약합니다.',
    '- 아직 정보가 없으면 빈 문자열을 사용합니다.',
    '- methodologySuggestionIds에는 지금 시점에 유용한 방법론 id만 0~3개 넣습니다.',
    '- 주석 외에는 JSON, 코드블록, 마크다운 제목을 출력하지 않습니다.',
  ].join('\n');
}

function buildGeneratePrompt(template: Omit<TemplateDefinition, 'systemPrompt'>): string {
  const sectionGuide = template.sections
    .map((section, index) => `${index + 1}. ${section.name} — ${section.description}`)
    .join('\n');
  const sectionExample = template.sections[0] ?? {
    description: '내용을 작성합니다.',
    name: '섹션명',
    required: true,
  };

  return [
    '당신은 HR 보고서를 작성하는 전문 에디터입니다.',
    `현재 작성 대상은 "${template.name}"입니다.`,
    '수집된 대화와 자료를 바탕으로, 아래 섹션 순서를 반드시 지켜 Markdown 문서를 작성합니다.',
    '[섹션 구조]',
    sectionGuide,
    '[규칙]',
    '- 근거가 없는 내용은 추정으로 표시합니다.',
    '- 비즈니스 한국어 톤으로 작성합니다.',
    '- 출력은 Markdown만 사용합니다.',
    '- 반드시 정의된 섹션 수만큼만 작성하고, 순서와 섹션명을 바꾸지 않습니다.',
    '- 각 섹션은 `## 섹션명` 헤딩으로 시작합니다.',
    '- 각 헤딩 바로 아래 줄에 `<!-- section-meta:{"confidence":"high","cited":true} -->` 형식의 숨김 주석을 정확히 1개 둡니다.',
    '- confidence는 high | medium | low 중 하나만 사용합니다.',
    '- cited는 true | false만 사용합니다.',
    '- 코드블록, JSON 블록, 서론/결론 문단, 섹션 외 추가 제목을 출력하지 않습니다.',
    '- 데이터가 있으면 수치와 근거를 반영하고, 불충분하면 content 안에 추정임을 드러냅니다.',
    '[출력 예시]',
    `## ${sectionExample.name}`,
    '<!-- section-meta:{"confidence":"high","cited":true} -->',
    `${sectionExample.description}에 해당하는 내용을 2~4문장으로 작성합니다.`,
  ].join('\n');
}

const TEMPLATE_DEFINITIONS: Record<TemplateType, TemplateDefinition> = {
  policy_review: {
    ...RAW_TEMPLATE_DEFINITIONS.policy_review,
    systemPrompt: {
      generate: buildGeneratePrompt(RAW_TEMPLATE_DEFINITIONS.policy_review),
      interview: buildInterviewPrompt(RAW_TEMPLATE_DEFINITIONS.policy_review),
    },
  },
  training_summary: {
    ...RAW_TEMPLATE_DEFINITIONS.training_summary,
    systemPrompt: {
      generate: buildGeneratePrompt(RAW_TEMPLATE_DEFINITIONS.training_summary),
      interview: buildInterviewPrompt(RAW_TEMPLATE_DEFINITIONS.training_summary),
    },
  },
  weekly_report: {
    ...RAW_TEMPLATE_DEFINITIONS.weekly_report,
    systemPrompt: {
      generate: buildGeneratePrompt(RAW_TEMPLATE_DEFINITIONS.weekly_report),
      interview: buildInterviewPrompt(RAW_TEMPLATE_DEFINITIONS.weekly_report),
    },
  },
};

function createInitialChecklist(templateType: TemplateType): SessionChecklist {
  const template = TEMPLATE_DEFINITIONS[templateType];

  return Object.fromEntries(template.checklist.map((item) => [item.id, false]));
}

function getTemplateByType(templateType: TemplateType): TemplateDefinition {
  return TEMPLATE_DEFINITIONS[templateType];
}

function getTemplateCatalog(): TemplateDefinition[] {
  return Object.values(TEMPLATE_DEFINITIONS);
}

export { createInitialChecklist, getTemplateByType, getTemplateCatalog };
export type {
  MethodologyCard,
  MethodologyCategory,
  TemplateChecklistItem,
  TemplateDefinition,
  TemplateMethodologyMap,
  TemplateSectionDefinition,
};
