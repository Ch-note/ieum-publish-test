# Backend 주요 변경사항

2025-12-30 
- 일정 자동화 기능 
- 메일 전송 자동화 기능 통합

2025-12-31 
 - 프론트엔드 변경 사항 반영(develop 브랜치)
 - Todo 자동화 기능 추가(자동화 승인 탭 > To Do 기능)

### 1. main2.py  
: 원하는 요청에 맞게 서비스 또는 에이전트로 전달하는 역할

/api/chat : 사용자 입력을 llm_agent로 넘겨 처리 결과 반환

/analyze-meeting : 회의록 텍스트를 요약하고 rag_service를 통해 Vector DB에 저장

/api/execute-action : 비동기 형식으로 Logic App에 메일 발송 요청

### 2. llm_agent.py 
: 사용자의 입력메시지를 해석하여 “검색이 필요한지”, “일정 등록이 필요한지”, “단순 대화인지” 판단

tools 정의를 통해 OpenAI에게 사용 가능한 함수를 알려주는 역할

(register_calendar_event, search_knowledge_base)

주요 로직 : tool_choice=”auto”를 통해 AI가 스스로 도구 사용 여부 결정

### 3. rag_service.py 
: RAG(검색 증강 생성)관련 기능을 전담하는 모듈

주요 로직 : 

search_documents : Azure AI Search에서 하이브리드 검색 수행

save_to_vector_db : 텍스트 임베딩 후 DB 저장

ask_bot : 검색된 문서를 바탕으로 답변 생성(Generation)

### 4. outlook_service.py

: Calendar 관련 Logic App 및 Microsoft Graph API 통신 담당

주요 로직 : 

MSAL 인증 & 캐싱 : token_cache.bin을 사용하여 불필요한 재로그인 을 방지하고 토큰을 효율적으로 관리

send_event_to_logic_app : Outlook 일정 등록을 위한 Logic App 호출

효율성 : 인증 로직이 모듈화 되어있기 때문에 다른 파일에서 쉽게 사용 가능
# 🚀 이음 (Ieum) - 회의와 실행을 잇는 AI 파트너

## 📌 프로젝트 소개

**이음(Ieum)**은 회의를 단순히 기록하는 것을 넘어, **기억(RAG)하고 실행까지 자동화**하는 차세대 회의 관리 서비스입니다.

### 🎯 핵심 차별화 포인트

| 기능 | Notion AI | 이음 (Ieum) |
|------|-----------|-------------|
| 회의록 작성 | ✅ | ✅ |
| 액션 아이템 추출 | ✅ | ✅ |
| **RAG 기반 과거 회의 검색** | ❌ | ✅ |
| **미해결 이슈 자동 리마인드** | ❌ | ✅ |
| **자동화 실행 (캘린더/메일/To-do)** | ❌ | ✅ |
| **승인 센터 (사용자 승인 후 실행)** | ❌ | ✅ |

---

## 🛠️ 기술 스택

- **Frontend**: React 18 + Vite
- **UI Library**: Chakra UI
- **Routing**: React Router v6
- **State Management**: Context API
- **Icons**: React Icons
- **Animation**: Framer Motion

---

## 📦 설치 및 실행

### 1️⃣ 사전 준비

- Node.js 18+ 설치 (https://nodejs.org)
- npm 또는 yarn 설치

### 2️⃣ 프로젝트 설치

\`\`\`bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
\`\`\`

브라우저에서 `http://localhost:5173` 접속

### 3️⃣ 빌드 및 배포

\`\`\`bash
# 프로덕션 빌드
npm run build

# 로컬 미리보기
npm run preview
\`\`\`

---

## 📂 폴더 구조

\`\`\`
ieum-frontend/
├── src/
│   ├── components/          # 공통 컴포넌트
│   │   ├── AppLayout.jsx    # 레이아웃 (Header + Sidebar)
│   │   ├── Header.jsx       # 상단 헤더
│   │   ├── Sidebar.jsx      # 사이드바 메뉴
│   │   ├── Card.jsx         # 카드 컴포넌트
│   │   └── ApprovalCenter.jsx  # 승인 센터 (핵심!)
│   ├── pages/               # 페이지
│   │   ├── Login.jsx        # 로그인 화면
│   │   ├── Home.jsx         # 홈 대시보드
│   │   ├── Meeting.jsx      # 회의 녹음 화면
│   │   └── Result.jsx       # 회의 결과 (3개 탭)
│   ├── context/             # Context API
│   │   └── AppContext.jsx   # 전역 상태 관리
│   ├── data/                # 더미 데이터
│   │   └── mockData.js      # Mock 회의 데이터
│   ├── App.jsx              # 라우터 설정
│   └── main.jsx             # 진입점 (Chakra Provider)
├── index.html
├── package.json
└── vite.config.js
\`\`\`

---

## 🎬 데모 시나리오 (2분)

### **Scenario: 전체 플로우 시연**

| 시간 | 화면 | 동작 | 차별화 포인트 |
|------|------|------|---------------|
| **0:00-0:15** | 로그인 | 로그인 버튼 클릭 → 홈으로 이동 | 브랜딩 (∞ 이음) |
| **0:15-0:30** | 홈 | "새 회의 시작하기" 버튼 클릭 | **미해결 이슈 카드**, **다음 안건 제안** (RAG 차별화) |
| **0:30-0:50** | 회의 녹음 | 타이머 작동 → 15초 후 "회의 종료" 클릭 | 녹음 중 애니메이션 |
| **0:50-1:00** | 처리 중 | "회의록 생성 중..." 화면 | AI 처리 시각화 |
| **1:00-1:30** | 결과 Tab 1 | 회의록/결정사항/액션 아이템 확인 | 자동 분류 및 구조화 |
| **1:30-2:00** | 결과 Tab 3 | **승인센터에서 3개 항목 체크** → "실행하기" 클릭 → **진행률 애니메이션** → "완료!" 토스트 | **🔥 핵심 차별화! Notion AI 대비 자동화 실행** |

### **시연 멘트 (30초 버전)**

> "회의가 끝났습니다. Notion AI는 여기서 끝나지만, 이음은 지금부터 시작합니다.  
> 
> [Tab 3 클릭]  
> 
> 승인 센터에서 자동으로 Outlook 일정 등록, 회의록 메일 발송, To-do 생성을 체크하고 실행 버튼만 누르면...  
> 
> [진행률 애니메이션 → 완료]  
> 
> 3초 만에 완료! 수동으로 하면 15분 걸리던 작업을 자동화했습니다.  
> 이것이 이음의 차별화 포인트입니다."

---

## 🎨 디자인 시스템

### 색상 팔레트

\`\`\`js
Primary: #4811BF     // 메인 보라색
Secondary: #8C5CF2   // 연한 보라색
Success: #09A603     // 초록색
Background: #F2F2F2  // 배경색
\`\`\`

### 폰트

- **제목**: 20-24px, Bold
- **본문**: 14-16px, Regular
- **보조**: 12px, Light

---

## ✅ 체크리스트 (제출 전 확인)

- [x] 로그인 → 홈 → 회의 → 결과 페이지 전체 흐름 작동
- [x] 미해결 이슈 카드 표시 (RAG 차별화)
- [x] 승인센터 체크박스 + 실행 애니메이션 (핵심 차별화)
- [x] 3개 탭 (회의록/심층 분석/자동화 승인) 구성
- [x] 색상 팔레트 (#4811BF 등) 적용
- [x] 더미 데이터로 데모 가능
- [x] npm run dev로 로컬 실행 확인
- [x] npm run build로 빌드 성공 확인

---

## 🚀 향후 확장 계획

### Phase 1 (현재 MVP)
- ✅ 프론트엔드 UI/UX 완성
- ✅ 더미 데이터 기반 데모

### Phase 2 (백엔드 연동)
- [ ] Python 백엔드 API 연동
- [ ] 실제 STT (OpenAI Whisper) 구현
- [ ] RAG 파이프라인 (Pinecone) 구축
- [ ] Outlook API 실제 연동

### Phase 3 (고도화)
- [ ] 화자 분리 (Speaker Diarization)
- [ ] 실시간 회의 중 AI 챗봇
- [ ] 대시보드 통계 및 인사이트
- [ ] MS To Do / Planner 연동

---

## 📞 문의

- **프로젝트명**: 이음 (Ieum)
- **슬로건**: "말과 행동을 잇는 가장 쉬운 방법"
- **이메일**: demo@ieum.ai

---

## 📄 라이센스

© 2025 이음 (Ieum) - All rights reserved

---

## 🎉 마지막 메시지

**26일 자정까지 완성 목표 달성! 🔥**

이 코드는 **24시간 안에 실제 동작하는 프로토타입**을 만들 수 있도록 최적화되었습니다.

**핵심 차별화 포인트 (승인센터 자동화)**가 명확히 보이도록 설계되었으니,  
발표 시 **Tab 3 (자동화 승인)**을 반드시 강조하세요!

**화이팅! 🚀💜**
\`\`\`
