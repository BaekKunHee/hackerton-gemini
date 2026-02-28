import type {
  SourcePanelData,
  PerspectivePanelData,
  BiasPanelData,
  SteelManOutput,
  AnalysisResult,
} from '../types';

export const demoSourceData: SourcePanelData = {
  originalSources: [
    {
      originalClaim: '한국의 청년 실업률이 25%에 달한다',
      originalSource: {
        url: 'https://kostat.go.kr/example',
        title: '2025년 고용동향',
        publisher: '통계청',
        date: '2025-12',
        relevantQuote:
          '15-29세 청년 실업률은 6.8%이며, 확장실업률(체감실업률)은 21.3%입니다.',
      },
      verification: {
        status: 'distorted',
        explanation:
          '공식 실업률 6.8%를 25%로 과장했습니다. 확장실업률(21.3%)과도 차이가 있으며, 기사에서는 출처를 명시하지 않았습니다.',
        comparison: {
          claimed: '청년 실업률 25%',
          actual: '공식 실업률 6.8%, 확장실업률 21.3%',
        },
      },
      trustScore: 35,
    },
    {
      originalClaim: 'OECD 국가 중 최하위 수준의 출산율',
      originalSource: {
        url: 'https://oecd.org/example',
        title: 'OECD Family Database',
        publisher: 'OECD',
        date: '2025-06',
        relevantQuote: '한국의 합계출산율은 0.72로 OECD 38개국 중 최하위입니다.',
      },
      verification: {
        status: 'verified',
        explanation:
          'OECD 데이터와 일치합니다. 한국은 실제로 OECD 국가 중 가장 낮은 출산율을 기록하고 있습니다.',
        comparison: {
          claimed: 'OECD 최하위 출산율',
          actual: 'OECD 38개국 중 최하위 (0.72)',
        },
      },
      trustScore: 95,
    },
    {
      originalClaim: '정부 정책으로 주거비가 50% 상승했다',
      originalSource: {
        url: 'https://kab.co.kr/example',
        title: '주택가격동향',
        publisher: '한국부동산원',
        date: '2025-11',
        relevantQuote:
          '최근 5년간 전국 아파트 매매가격은 약 28% 상승했으며, 서울은 35% 상승했습니다.',
      },
      verification: {
        status: 'context_missing',
        explanation:
          '50% 상승은 특정 지역·유형에 한정된 수치입니다. 전국 평균은 28%이며, 상승 원인을 단일 정책으로 귀속하는 것은 맥락이 누락된 주장입니다.',
        comparison: {
          claimed: '정부 정책으로 50% 상승',
          actual: '전국 28%, 서울 35% 상승. 복합적 원인.',
        },
      },
      trustScore: 45,
    },
  ],
  verificationStatus: 'distorted',
  trustScore: 58,
};

export const demoPerspectiveData: PerspectivePanelData = {
  perspectives: [
    {
      id: 1,
      source: {
        url: 'https://example.com/progressive',
        title: '구조적 불평등이 청년 문제의 핵심',
        publisher: '한겨레',
      },
      mainClaim: '노동시장 이중구조와 자산 불평등이 청년 문제의 근본 원인이다',
      frame: '구조적·제도적 관점',
      keyPoints: [
        '비정규직 비율 증가가 청년 고용 질 악화의 주요 원인',
        '자산 기반 불평등이 세대 간 이동성을 저하',
        '공공 주거 확대가 해결책',
      ],
      spectrum: { political: -0.6, emotional: -0.2, complexity: 0.7 },
    },
    {
      id: 2,
      source: {
        url: 'https://example.com/conservative',
        title: '과도한 규제가 일자리 창출을 막는다',
        publisher: '조선일보',
      },
      mainClaim: '규제 완화와 시장 활성화가 청년 고용 해법이다',
      frame: '시장 경제 관점',
      keyPoints: [
        '기업 규제 완화로 투자·고용 확대 유도',
        '최저임금 급등이 소규모 사업장 고용 위축',
        '창업 생태계 지원 확대 필요',
      ],
      spectrum: { political: 0.6, emotional: 0.1, complexity: 0.5 },
    },
    {
      id: 3,
      source: {
        url: 'https://example.com/academic',
        title: '인구구조 변화와 청년 정책의 재설계',
        publisher: 'KDI 경제정책연구',
      },
      mainClaim:
        '인구 감소 시대에 맞는 새로운 사회 계약이 필요하다',
      frame: '학술·데이터 기반 관점',
      keyPoints: [
        '2030년까지 생산가능인구 300만 감소 전망',
        '청년 정책을 인구 정책과 통합 설계 필요',
        '단기 처방보다 장기 구조 전환이 핵심',
      ],
      spectrum: { political: 0.0, emotional: 0.4, complexity: 0.9 },
    },
  ],
  commonFacts: [
    '한국의 출산율이 OECD 최하위인 것은 모든 관점이 동의',
    '청년 고용의 질이 악화되고 있다는 점은 공통 인식',
    '주거비 부담이 청년에게 큰 문제라는 점에 합의',
  ],
  divergencePoints: [
    {
      topic: '핵심 원인',
      positions: {
        진보: '구조적 불평등과 제도적 실패',
        보수: '과도한 규제와 시장 왜곡',
        학술: '인구구조 변화와 복합적 요인',
      },
    },
    {
      topic: '해결 방향',
      positions: {
        진보: '공공 부문 확대, 재분배 강화',
        보수: '규제 완화, 시장 자율성 확대',
        학술: '장기 구조 전환, 통합적 접근',
      },
    },
  ],
};

export const demoBiasData: BiasPanelData = {
  biasScores: [
    { type: 'blame_instinct', score: 0.85 },
    { type: 'size_instinct', score: 0.72 },
    { type: 'single_perspective_instinct', score: 0.68 },
    { type: 'negativity_instinct', score: 0.61 },
    { type: 'urgency_instinct', score: 0.55 },
    { type: 'gap_instinct', score: 0.48 },
    { type: 'generalization_instinct', score: 0.35 },
    { type: 'fear_instinct', score: 0.28 },
    { type: 'straight_line_instinct', score: 0.2 },
    { type: 'destiny_instinct', score: 0.15 },
  ],
  dominantBiases: [
    'blame_instinct',
    'size_instinct',
    'single_perspective_instinct',
  ],
  textExamples: [
    {
      text: '이 모든 것은 정부의 무능한 정책 때문이다',
      biasType: 'blame_instinct',
      explanation:
        '복잡한 사회 현상을 단일 원인(정부)에 귀속시키는 비난 본능이 작동하고 있습니다.',
    },
    {
      text: '청년 실업률이 25%에 달한다',
      biasType: 'size_instinct',
      explanation:
        '실제 수치(6.8%)를 맥락 없이 과장하여 문제의 크기를 부풀리고 있습니다.',
    },
  ],
  alternativeFraming:
    '이 기사는 청년 문제를 정부 실패의 프레임으로만 다루고 있지만, 인구구조 변화, 글로벌 경기 둔화, 기술 변화 등 복합적 요인을 함께 고려하면 더 정확한 그림을 볼 수 있습니다.',
};

export const demoSteelMan: SteelManOutput = {
  opposingArgument:
    '이 기사의 주장이 과장된 부분이 있지만, 핵심 우려는 타당합니다. 확장실업률 21.3%는 공식 통계만으로 포착되지 않는 청년의 실질적 어려움을 반영하며, 주거비 상승과 저출산 문제는 실제로 심각한 사회적 과제입니다.',
  strengthenedArgument:
    '정확한 데이터를 기반으로 주장하면 더 설득력이 높아집니다. "실업률 25%"보다 "확장실업률 21.3%, 이는 5명 중 1명이 사실상 제대로 된 일자리를 못 구하고 있다는 뜻"이라고 말하면, 과장이라는 반론을 방어하면서도 문제의 심각성을 전달할 수 있습니다.',
};

export const demoResult: AnalysisResult = {
  source: demoSourceData,
  perspective: demoPerspectiveData,
  bias: demoBiasData,
  steelMan: demoSteelMan,
};

export const DEMO_SOCRATES_QUESTIONS = [
  '이 기사를 읽으면서 가장 "말이 안 된다"고 느낀 부분이 어디였어요?',
  '원본 데이터를 보니까 어떤 생각이 들어요? 기사의 숫자와 꽤 차이가 있죠.',
  '3개 관점 중에서 가장 일리 있다고 생각하는 건 어떤 거예요?',
  '처음에 이 기사를 읽었을 때랑 지금, 생각이 달라진 부분이 있어요?',
];
