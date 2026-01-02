import os
import uuid
import time
import asyncio
import httpx
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests
from typing import List

# 모듈 import
import outlook_service
import llm_agent
import rag_service

# Azure & LangChain
from openai import AzureOpenAI
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

# 환경변수 로드
load_dotenv()

app = FastAPI()

# CORS 설정
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 설정값 ---
LOGIC_APP_URL_MAIL = os.getenv("LOGIC_APP_URL_MAIL")
SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
SEARCH_KEY = os.getenv("AZURE_SEARCH_API_KEY")
INDEX_NAME = os.getenv("AZURE_SEARCH_INDEX_NAME")

# 팀원 리스트
team_members = [
    "alfzm1024@naver.com",
    "parkjs801801@gmail.com",
    "hyenajeon37@gmail.com",
    "chaehun61@gmail.com",
    "kkst01221203@gmail.com",
    "hntexhibit@gmail.com"
]

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

# --- 데이터 모델 ---
class EmailRequest(BaseModel):
    summary_text: str

class ChatRequest(BaseModel):
    message: str

class CalendarRequest(BaseModel):
    title: str
    date: str
    time: str
    attendees: List[str]

class TodoRequest(BaseModel):
    title: str
    content: str = None
    due_date: str = None

# ===========================
# API 엔드포인트
# ===========================

# 1. 챗봇 질문
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    print(f"💬 질문: {request.message}")
    try:
        # llm_agent에게 질문을 넘기면 llm_agent가 내부적으로 판단하도록 코드 수정
        answer = llm_agent.process_chat_request(request.message)
        return {"answer": answer}
    except Exception as e:
        print(f"에러: {e}")
        return {"answer": "죄송합니다. 처리 중 오류가 발생했습니다."}

# [API 4] 대시보드 데이터 조회 (홈 화면용)
@app.get("/dashboard-data") # <-- URL 수정: /api prefix 추가 권장
async def get_dashboard_data():
    print("📊 대시보드 데이터 조회 중...")
    try:
        search_client = SearchClient(SEARCH_ENDPOINT, INDEX_NAME, AzureKeyCredential(SEARCH_KEY))
        
        # 최근 10개 조회
        results = search_client.search(
            search_text="*", 
            select=["content", "source", "id"],
            top=10 
        )
        
        real_meetings = []
        all_open_issues = []
        all_suggested_agendas = []

        for r in results:
            content_str = r.get("content", "")
            source_str = r.get("source", "날짜 미상")
            
            summary_text = ""
            
            # JSON 파싱 시도
            try:
                data = json.loads(content_str)
                
                # 1. 요약본 추출
                summary_text = data.get("summary", "")
                if isinstance(summary_text, dict):
                    summary_text = str(summary_text)

                # 2. 미해결 이슈 수집
                issues = data.get("openIssues", [])
                if isinstance(issues, list):
                    for issue in issues:
                        if isinstance(issue, dict):
                            all_open_issues.append({
                                "id": str(uuid.uuid4()),
                                "title": issue.get("title", "제목 없음"),
                                "lastMentioned": issue.get("lastMentioned", "최근"),
                                "owner": issue.get("owner", "미정")
                            })
                        elif isinstance(issue, str):
                            all_open_issues.append({
                                "id": str(uuid.uuid4()),
                                "title": issue,
                                "lastMentioned": "최근",
                                "owner": "미정"
                            })

                # 3. 추천 안건 수집
                agendas = data.get("insights", {}).get("recommendations", [])
                if not agendas:
                    agendas = data.get("suggested_agenda", [])
                
                if isinstance(agendas, list):
                    all_suggested_agendas.extend(agendas)

            except json.JSONDecodeError:
                # JSON 아니면 그냥 텍스트로 취급
                summary_text = content_str[:100] + "..."

            # 회의 목록에 추가
            real_meetings.append({
                "id": r.get("id", str(uuid.uuid4())),
                "title": source_str,
                "date": source_str.split(" ")[0] if " " in source_str else "날짜 미상",
                "summary": summary_text,
                "participants": ["Team"],
                "actionItems": []
            })

        return {
            "status": "success", 
            "meetings": real_meetings[:5], 
            "open_issues": all_open_issues[:4], 
            "suggested_agenda": all_suggested_agendas[:4] 
        }

    except Exception as e:
        print(f"❌ 대시보드 조회 실패: {e}")
        return {"status": "error", "meetings": [], "open_issues": [], "suggested_agenda": []}

# 2. [분석 단계] 심층 분석 + DB저장
@app.post("/analyze-meeting")
async def analyze_meeting(request: EmailRequest):
    print("🧠 회의 심층 분석 (JSON) 시작...")

    if len(request.summary_text.strip()) < 5:
        return {"status": "success", "data": {"summary": "내용이 너무 짧습니다."}}

    try:
        # 1. 시스템 프롬프트: JSON 구조를 명확히 정의
        system_prompt = """
        너는 수석 비즈니스 분석가야. 회의 스크립트를 분석해서 아래 JSON 포맷으로 완벽하게 구조화해.
        
        [필수 포함 항목 및 규칙]
        1. summary: 전체 내용을 3줄 요약 (HTML <br> 태그 사용 가능)
        2. decisions: 확정된 결정 사항 리스트 (문자열 배열)
        3. actionItems: 구체적인 할 일 리스트. 각 항목은 {"task": "할일내용", "assignee": "담당자(없으면 '미정')", "deadline": "기한(없으면 '추후 협의')", "status": "active"} 형태여야 함.
        4. openIssues: 해결되지 않은 이슈 리스트. 각 항목은 {"title": "이슈명", "lastMentioned": "오늘", "owner": "관련자"} 형태.
        5. insights: 심층 분석 객체
           - meetingType: 회의 성격 (예: 주간보고, 아이디어회의, 긴급점검 등)
           - sentiment: 전체 분위기 (긍정적/중립적/부정적)
           - keyTopics: 핵심 키워드 5개 이내
           - risks: 잠재적 리스크 리스트. {"description": "내용", "level": "high/medium/low"}
           - recommendations: AI가 제안하는 개선점 리스트
        
        반드시 JSON 형식만 출력해. 마크다운(```json) 쓰지 마.
        """

        # 2. AI 호출 (JSON 모드)
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.summary_text}
            ],
            response_format={"type": "json_object"} 
        )
        ai_response_str = response.choices[0].message.content
        
        # 3. DB 저장 (전체 데이터 저장)
        # rag_service.save_to_vector_db 는 원래 텍스트만 받지만, JSON String도 텍스트이므로 저장 가능
        rag_service.save_to_vector_db(ai_response_str)

        # 4. JSON 파싱해서 리턴
        try:
            ai_data = json.loads(ai_response_str)
            return {"status": "success", "data": ai_data} 
        except json.JSONDecodeError:
            return {"status": "success", "data": {"summary": ai_response_str}}

    except Exception as e:
        print(f"❌ AI 에러: {e}")
        if "content_filter" in str(e):
            return {"status": "success", "data": {"summary": "⚠️ 보안 필터가 작동했습니다."}}
        return {"status": "error", "message": str(e)}

# [자동화 기능 탭] 메일 전송 (Bulk Send 최적화)
@app.post("/execute-action")
async def execute_action(request: EmailRequest):
    print("🚀 사용자 승인 완료! 메일 전송 시작...")
    
    # 1. 이메일 리스트를 세미콜론(;)으로 연결 (Azure Logic App 표준)
    all_recipients = ";".join(team_members)
    
    ai_summary = request.summary_text
    formatted_summary = ai_summary.replace("\n", "<br>")

    html_body = f"""
    <div style="border: 1px solid #ddd; padding: 20px;">
        <h2>📢 AI 회의 요약</h2>
        <hr>{formatted_summary}<hr>
        <p>※ 관리자 승인 후 발송된 메일입니다.</p>
    </div>
    """

    try:
        # 2. 반복문 삭제 -> 단 1번만 요청
        # (주의: Logic App 디자이너에서 'email' 변수를 CC 또는 BCC에 연결해뒀어야 함!)
        requests.post(LOGIC_APP_URL_MAIL, json={
            "email": all_recipients, 
            "subject": "[이음] 회의 결과 리포트 (전체 공유)", 
            "body": html_body
        })
        
        print(f"✅ 전체 발송 완료 (총 {len(team_members)}명)")
        return {"status": "success", "sent_count": len(team_members)}

    except Exception as e:
        print(f"❌ 발송 실패: {e}")
        return {"status": "error", "message": str(e)}

# [추가] Outlook Todo 생성 엔드포인트
@app.post("/create-outlook-task")
async def create_outlook_task(request: TodoRequest):
    print(f"📝 Outlook Todo 생성 요청: {request.title} (기한: {request.due_date})")
    success, msg = outlook_service.create_todo_task(request.title, request.content, request.due_date)
    
    if success:
        return {"status": "success", "message": "작업이 등록되었습니다."}
    else:
        raise HTTPException(status_code=500, detail=msg)

# [실행 단계] 일정 자동화 기능
@app.post("/approve-calendar")
async def approve_calendar(item: CalendarRequest):
    try:
        # 1. 문자열 데이터를 datetime 객체로 변환
        start_str = f"{item.date}T{item.time}:00"
        start_dt = datetime.strptime(start_str, "%Y-%m-%dT%H:%M:%S")
        
        # 2. 종료 시간 계산 (기본 1시간 추가)
        end_dt = start_dt + timedelta(hours=1)
        
        # 3. 다시 문자열로 변환 (ISO 8601 형식)
        end_str = end_dt.strftime("%Y-%m-%dT%H:%M:%S")

        event_body = {
            "subject": item.title,
            "body": {
                "contentType": "Text", 
                "content": f"참석자: {', '.join(item.attendees)}"
            },
            "start": {
                "dateTime": start_str, 
                "timeZone": "Korea Standard Time"
            },
            "end": {
                "dateTime": end_str, 
                "timeZone": "Korea Standard Time"
            }, 
        }
        
        # 5. 공통 모듈 호출
        success, msg = outlook_service.send_event_to_logic_app(event_body)
        
        if not success:
            raise HTTPException(status_code=500, detail=f"Outlook 연동 실패: {msg}")
            
        return {"status": "success", "message": "일정이 정상적으로 등록되었습니다."}

    except ValueError:
        raise HTTPException(status_code=400, detail="날짜/시간 형식이 올바르지 않습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))