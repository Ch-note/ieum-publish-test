export const mockMeetings = [
  {
    id: 1,
    title: 'Q1 마케팅 전략 회의',
    date: '2025-12-24',
    duration: '35분',
    participants: ['김철수', '이영희', '박민수', '최지은', '정다은'],
    summary: '2025년 Q1 마케팅 전략 및 예산 배분에 대한 논의를 진행했습니다.',
    decisions: [
      'Instagram 광고 예산 30% 증액',
      '인플루언서 마케팅 3월부터 시작',
      '브랜드 리뉴얼 4월 완료 목표'
    ],
    actionItems: [
      { task: '광고 소재 제작', assignee: '김철수', deadline: '2025-12-30' },
      { task: '인플루언서 리스트 작성', assignee: '이영희', deadline: '2025-12-28' },
      { task: '예산안 최종 승인', assignee: '박민수', deadline: '2025-12-27' },
      { task: '경쟁사 분석 보고서', assignee: '최지은', deadline: '2025-12-29' },
      { task: '브랜드 가이드 초안', assignee: '정다은', deadline: '2025-12-31' }
    ],
    openIssues: [
      { title: '브랜드 로고 최종안 검토', lastMentioned: '2025-12-20' },
      { title: '예산 초과 시 대응 방안', lastMentioned: '2025-12-18' }
    ]
  },
  {
    id: 2,
    title: '개발 스프린트 회고',
    date: '2025-12-22',
    duration: '50분',
    participants: ['홍길동', '김개발', '이백엔드', '박프론트', '최풀스택', '정데브옵스', '한QA', '송디자인'],
    summary: '지난 2주 스프린트 회고 및 다음 스프린트 계획을 논의했습니다.',
    decisions: [
      '다음 스프린트 기간 3주로 조정',
      '코드 리뷰 프로세스 개선',
      '테스트 커버리지 80% 목표',
      'Docker 컨테이너 환경 구축',
      'CI/CD 파이프라인 최적화'
    ],
    actionItems: [
      { task: 'API 문서 업데이트', assignee: '홍길동', deadline: '2025-12-26' },
      { task: '데이터베이스 마이그레이션', assignee: '김개발', deadline: '2025-12-28' },
      { task: '프론트엔드 리팩토링', assignee: '이백엔드', deadline: '2025-12-30' },
      { task: '보안 취약점 점검', assignee: '박프론트', deadline: '2025-12-27' },
      { task: '성능 테스트 시나리오 작성', assignee: '최풀스택', deadline: '2025-12-29' },
      { task: '배포 자동화 스크립트', assignee: '정데브옵스', deadline: '2025-12-31' },
      { task: '통합 테스트 케이스 추가', assignee: '한QA', deadline: '2025-12-28' },
      { task: 'UI/UX 개선안 제안', assignee: '송디자인', deadline: '2025-12-30' },
      { task: '모니터링 대시보드 구축', assignee: '홍길동', deadline: '2026-01-02' },
      { task: '장애 대응 매뉴얼 작성', assignee: '김개발', deadline: '2026-01-03' },
      { task: '코드 품질 리포트 생성', assignee: '이백엔드', deadline: '2026-01-05' },
      { task: '백로그 우선순위 재조정', assignee: '박프론트', deadline: '2026-01-04' }
    ],
    openIssues: [
      { title: 'API 응답 속도 개선 방안', lastMentioned: '2025-12-15' }
    ]
  },
  {
    id: 3,
    title: '제품 런칭 준비 회의',
    date: '2025-12-20',
    duration: '42분',
    participants: ['강PM', '윤마케터', '서개발자', '양디자이너'],
    summary: '신제품 런칭 일정 및 마케팅 전략을 최종 점검했습니다.',
    decisions: [
      '런칭일 2026년 1월 15일 확정',
      '프리런칭 이벤트 1월 5일 진행'
    ],
    actionItems: [
      { task: '랜딩페이지 최종 검수', assignee: '서개발자', deadline: '2025-12-28' },
      { task: '프레스 릴리스 작성', assignee: '윤마케터', deadline: '2025-12-30' },
      { task: '런칭 영상 제작', assignee: '양디자이너', deadline: '2026-01-03' }
    ],
    openIssues: [
      { title: '배송 파트너 최종 선정', lastMentioned: '2025-12-18' },
      { title: '초기 재고 수량 결정', lastMentioned: '2025-12-19' }
    ]
  }
]

export const mockOpenIssues = [
  {
    id: 1,
    title: '브랜드 로고 최종안 검토',
    description: '3개 후보안 중 최종 선택 필요',
    project: 'Q1 마케팅',
    status: 'open',
    lastMentioned: '2025-12-20',
    owner: '김철수',
    linkedMeetings: ['Q1 마케팅 전략 회의']
  },
  {
    id: 2,
    title: 'API 응답 속도 개선 방안',
    description: '평균 응답 시간 500ms → 200ms 목표',
    project: '개발 스프린트',
    status: 'open',
    lastMentioned: '2025-12-15',
    owner: '홍길동',
    linkedMeetings: ['개발 스프린트 회고']
  },
  {
    id: 3,
    title: '배송 파트너 최종 선정',
    description: 'A사 vs B사 비교 검토 후 결정',
    project: '제품 런칭',
    status: 'open',
    lastMentioned: '2025-12-18',
    owner: '강PM',
    linkedMeetings: ['제품 런칭 준비 회의']
  }
]

export const mockSuggestedAgenda = [
  '브랜드 로고 최종안 투표',
  'API 성능 개선 기술 검토',
  '배송 파트너 계약 조건 협의'
]

// 결과 화면용 상세 데이터
export const mockMeetingResult = {
  id: 999,
  title: '이음 서비스 MVP 기획 회의',
  date: '2025-12-26',
  startTime: '14:00',
  endTime: '14:35',
  duration: '35분',
  participants: ['김프로', '이기획', '박개발', '최디자인', '정마케팅'],
  transcript: `
[김프로] 안녕하세요, 오늘은 이음 서비스 MVP 핵심 기능에 대해 논의하겠습니다.

[이기획] 네, 먼저 RAG 기반 회의 기억 기능부터 시작할까요?

[박개발] RAG 구현은 벡터 DB로 Pinecone을 사용하면 빠르게 구축할 수 있습니다. 회의록을 자동으로 임베딩해서 저장하는 파이프라인을 만들겠습니다.

[최디자인] UI는 미해결 이슈를 카드 형태로 보여주고, 클릭하면 관련 회의 기록을 바로 볼 수 있게 하면 좋겠어요.

[김프로] 좋습니다. 그럼 자동화 기능은 어떻게 할까요?

[정마케팅] 회의 끝나면 자동으로 캘린더에 일정 추가하고, 회의록 메일 발송하는 게 핵심이죠. Notion AI와 차별화되는 포인트입니다.

[박개발] Outlook API 연동은 Microsoft Graph API를 사용하면 됩니다. 승인 센터를 만들어서 사용자가 체크하고 실행하는 방식으로 하겠습니다.

[이기획] 완벽해요. 그럼 26일까지 프론트엔드 MVP 완성하고, 백엔드는 1월 첫 주에 연동하는 걸로 하죠.

[김프로] 네, 그럼 오늘 회의는 여기까지 하겠습니다. 수고하셨습니다!
  `,
  summary: '이음 서비스 MVP 핵심 기능(RAG 기반 회의 기억, 자동화 실행)을 논의하고 개발 일정을 확정했습니다.',
  decisions: [
    'RAG 구현에 Pinecone 벡터 DB 사용',
    '자동화 승인 센터 UI 우선 개발',
    '프론트엔드 MVP 26일까지 완성'
  ],
  actionItems: [
    { task: 'RAG 파이프라인 설계', assignee: '박개발', deadline: '2025-12-27', status: 'pending' },
    { task: '승인센터 UI 디자인', assignee: '최디자인', deadline: '2025-12-26', status: 'pending' },
    { task: 'Outlook API 연동 가이드 작성', assignee: '박개발', deadline: '2025-12-28', status: 'pending' },
    { task: '데모 시나리오 스크립트 작성', assignee: '정마케팅', deadline: '2025-12-26', status: 'pending' },
    { task: '백엔드 API 엔드포인트 정의', assignee: '박개발', deadline: '2025-12-30', status: 'pending' }
  ],
  openIssues: [
    { title: 'RAG 검색 정확도 테스트 방법', lastMentioned: '2025-12-26' },
    { title: '보안 및 데이터 암호화 정책', lastMentioned: '2025-12-26' }
  ],
  insights: {
    meetingType: '기획 회의',
    sentiment: 'positive',
    keyTopics: ['RAG 기술', '자동화', 'MVP 개발', 'API 연동'],
    risks: [
      { level: 'medium', description: '백엔드 API 일정 지연 가능성' },
      { level: 'low', description: 'RAG 검색 품질 최적화 필요' }
    ],
    recommendations: [
      '프론트엔드 우선 완성 후 백엔드 연동 전략 유지',
      'RAG 검색 품질 개선을 위한 임베딩 모델 비교 테스트 필요',
      '보안 정책 수립을 위한 별도 회의 예정'
    ]
  },
  approvalItems: [
    {
      id: 'approve-1',
      type: 'calendar',
      title: 'Outlook 일정 등록',
      description: '다음 회의 일정을 자동으로 등록합니다',
      details: {
        title: '이음 백엔드 연동 회의',
        date: '2026-01-02',
        time: '15:00',
        duration: '1시간',
        attendees: ['김프로', '박개발', '이기획']
      },
      estimatedTime: '2초',
      status: 'pending'
    },
    {
      id: 'approve-2',
      type: 'email',
      title: '회의록 메일 발송',
      description: '참석자 전원에게 회의록을 자동 발송합니다',
      details: {
        recipients: ['김프로', '이기획', '박개발', '최디자인', '정마케팅'],
        subject: '[이음] 이음 서비스 MVP 기획 회의 - 회의록',
        preview: '안녕하세요, 2025-12-26 진행된 회의록을 공유드립니다...'
      },
      estimatedTime: '3초',
      status: 'pending'
    },
    {
      id: 'approve-3',
      type: 'todo',
      title: 'TO-DO LIST 등록',
      description: '담당자별 TO-DO LIST를 Outlook에 자동 등록합니다',
      details: {
        count: 5,
        assignees: ['박개발', '최디자인', '정마케팅'],
        todoItems: [
          { task: 'RAG 파이프라인 설계', assignee: '박개발', deadline: '2025-12-27' },
          { task: '승인센터 UI 디자인', assignee: '최디자인', deadline: '2025-12-26' },
          { task: 'Outlook API 연동 가이드 작성', assignee: '박개발', deadline: '2025-12-28' },
          { task: '데모 시나리오 스크립트 작성', assignee: '정마케팅', deadline: '2025-12-26' },
          { task: '백엔드 API 엔드포인트 정의', assignee: '박개발', deadline: '2025-12-30' }
        ]
      },
      estimatedTime: '2초',
      status: 'pending'
    },
    {
      id: 'approve-4',
      type: 'report',
      title: '자동 보고',
      description: '회의록과 심층 분석 내용을 상사에게 자동으로 보고합니다',
      details: {
        recipient: '김사장 (상사)',
        contents: ['회의록 요약', '심층 분석', '리스크 분석', 'AI 추천사항']
      },
      estimatedTime: '3초',
      status: 'pending'
    }
  ]
}
