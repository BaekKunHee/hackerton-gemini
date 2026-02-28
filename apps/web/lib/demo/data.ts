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
  // 새로운 분리된 구조 (데모 시나리오 기준)
  biases: [
    {
      type: 'confirmation_bias',
      score: 82,
      reason: '자신의 의견을 뒷받침하는 정보만 선택적으로 인용했습니다. 반대 의견이나 맥락을 제공하는 데이터는 생략되었습니다.',
      label: '확증편향',
    },
    {
      type: 'anchoring_bias',
      score: 45,
      reason: '초반에 제시된 "25%"라는 숫자가 이후 논의의 기준점이 되어, 실제 수치와의 차이를 희석시키고 있습니다.',
      label: '고정편향',
    },
    {
      type: 'outcome_bias',
      score: 38,
      reason: '현재 결과만으로 과거 정책을 평가하며, 당시 맥락이나 외부 요인은 고려하지 않았습니다.',
      label: '결과편향',
    },
  ],
  instincts: [
    {
      type: 'blame_instinct',
      score: 71,
      reason: '복잡한 사회 현상을 "정부의 무능"이라는 단일 원인에 귀속시키고 있습니다. 인구구조, 글로벌 경제, 기술 변화 등 다른 요인은 무시됩니다.',
      label: '비난 본능',
    },
    {
      type: 'single_perspective_instinct',
      score: 58,
      reason: '문제를 오직 "정책 실패" 프레임으로만 바라보고 있습니다. 시장, 인구, 글로벌 요인 등 다른 관점은 배제되었습니다.',
      label: '단일관점 본능',
    },
    {
      type: 'negativity_instinct',
      score: 52,
      reason: '개선된 지표(예: 전체 고용률 증가)는 언급하지 않고, 부정적인 측면만 강조하고 있습니다.',
      label: '부정 본능',
    },
    {
      type: 'gap_instinct',
      score: 48,
      reason: '"청년 vs 기성세대", "정부 vs 국민"처럼 이분법적 구도로 복잡한 현실을 단순화하고 있습니다.',
      label: '간극 본능',
    },
    {
      type: 'generalization_instinct',
      score: 35,
      reason: '특정 지역이나 직군의 사례를 전체 청년 세대로 일반화하는 경향이 있습니다.',
      label: '일반화 본능',
    },
  ],
  // Legacy support (기존 호환성)
  biasScores: [
    { type: 'blame_instinct', score: 0.71 },
    { type: 'single_perspective_instinct', score: 0.58 },
    { type: 'negativity_instinct', score: 0.52 },
    { type: 'gap_instinct', score: 0.48 },
    { type: 'generalization_instinct', score: 0.35 },
    { type: 'fear_instinct', score: 0.28 },
    { type: 'size_instinct', score: 0.25 },
    { type: 'straight_line_instinct', score: 0.2 },
    { type: 'urgency_instinct', score: 0.18 },
    { type: 'destiny_instinct', score: 0.15 },
  ],
  dominantBiases: [
    'blame_instinct',
    'single_perspective_instinct',
    'negativity_instinct',
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
      biasType: 'confirmation_bias',
      explanation:
        '확장실업률(21.3%)보다 높은 수치를 사용하여 주장을 뒷받침하려는 확증편향이 보입니다.',
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
  expandedTopics: [
    {
      topic: '인구 정책',
      description:
        '저출산·고령화와 청년 문제는 밀접하게 연결됩니다. 인구 정책 관점에서 청년 지원은 미래 세대 확보의 핵심입니다.',
      relevance: 'high',
    },
    {
      topic: '노동 시장 이중구조',
      description:
        '정규직/비정규직 격차, 대기업/중소기업 임금 차이가 청년 고용 질을 결정짓는 핵심 요인입니다.',
      relevance: 'high',
    },
    {
      topic: '주거 정책',
      description:
        '주거비 부담은 결혼·출산을 미루는 주요 원인 중 하나로, 청년 문제와 직결됩니다.',
      relevance: 'medium',
    },
    {
      topic: '교육과 취업 미스매치',
      description:
        '대학 졸업자 증가와 노동 시장 수요 불일치가 청년 실업의 구조적 원인으로 지목됩니다.',
      relevance: 'medium',
    },
    {
      topic: '세대 간 자산 불평등',
      description:
        '부동산 등 자산 축적 기회의 세대 간 격차가 청년의 경제적 자립을 어렵게 만듭니다.',
      relevance: 'low',
    },
  ],
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

// Y/N 분기 후 응답 (Yes: 검색 트리거, No: 피드백 요청)
export const DEMO_CONFIRMATION_RESPONSES = {
  confirmation:
    '지금까지 분석 결과를 살펴봤는데요, 제 분석에 대해 동의하시나요?',
  yes: '좋아요! 그렇다면 기존 정보의 편향성을 보정할 수 있는 다른 정보들을 찾아볼게요. 잠시만 기다려주세요...',
  no: '아, 그렇군요. 어떤 부분이 부족했는지 알려주시면 더 나은 분석을 제공할 수 있을 것 같아요. 어떤 점이 아쉬웠나요?',
  searchResult: `좋은 소식이에요! 편향성을 보정할 수 있는 추가 정보를 찾았습니다:

📊 **통계청 확장실업률 해석 가이드**
- 확장실업률(21.3%)과 공식실업률(6.8%)의 차이는 "잠재구직자"와 "불완전취업자"를 포함하기 때문입니다.
- 25%라는 수치는 어떤 공식 통계에서도 확인되지 않습니다.

🔍 **OECD 청년고용 비교 보고서**
- 한국의 청년 고용률은 OECD 평균과 비슷한 수준입니다.
- 다만 "질 좋은 일자리" 비중은 상대적으로 낮은 편입니다.

이 정보들을 참고하시면 기사의 주장을 더 객관적으로 평가할 수 있을 거예요. 분석 카드에서 최종 결과를 확인해보세요!`,
  feedbackThanks:
    '소중한 피드백 감사합니다. 다음 분석에 반영하겠습니다. 분석 카드에서 최종 결과를 확인해보세요!',
};
