import json
import os
import uuid
import time
from datetime import datetime
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import requests


# Azure & LangChain
from openai import AzureOpenAI
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
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
LOGIC_APP_URL = os.getenv("LOGIC_APP_URL")
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

# --- AI 모델 설정 ---
embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-3-small",
    openai_api_version="2024-02-01", # 임베딩용 버전 확인
)

chat_llm = AzureChatOpenAI(
    azure_deployment="gpt-5-mini", # 본인 챗봇 배포명 확인
    openai_api_version="2024-12-01-preview",
)

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
    question: str

# --- 내부 함수: RAG 검색 ---
def search_documents(query):
    try:
        search_client = SearchClient(SEARCH_ENDPOINT, INDEX_NAME, AzureKeyCredential(SEARCH_KEY))
        query_vector = embeddings.embed_query(query)
        results = search_client.search(
            search_text=query,
            vector_queries=[{"kind": "vector", "k": 3, "fields": "content_vector", "vector": query_vector}],
            select=["content", "source"]
        )
        found_context = ""
        for r in results:
            found_context += f"[출처: {r['source']}]\n{r['content']}\n\n"
        return found_context if found_context else "관련 정보 없음"
    except Exception as e:
        print(f"검색 에러: {e}")
        return ""

# --- 내부 함수: DB 저장 ---
def save_to_vector_db(summary_text):
    print("💾 요약본을 DB(Azure Search)에 저장 중...")
    try:
        search_client = SearchClient(SEARCH_ENDPOINT, INDEX_NAME, AzureKeyCredential(SEARCH_KEY))
        vector = embeddings.embed_query(summary_text)
        doc = {
            "id": str(uuid.uuid4()),
            "content": summary_text,
            "source": f"{datetime.now().strftime('%Y-%m-%d %H:%M')} 회의 요약",
            "content_vector": vector
        }
        search_client.upload_documents(documents=[doc])
        print("✅ DB 저장 완료!")
        return True
    except Exception as e:
        print(f"❌ DB 저장 실패: {e}")
        return False

# ===========================
# API 엔드포인트
# ===========================

# 1. 챗봇 질문
@app.post("/analyze-meeting")
async def analyze_meeting(request: EmailRequest):
    print("🧠 회의 심층 분석 (JSON) 시작...")

    if len(request.summary_text.strip()) < 10:
        return {"status": "success", "summary": "내용이 너무 짧습니다."}

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

        # 2. AI 호출 (JSON 모드 활성화)
        response = client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.summary_text}
            ],
            response_format={"type": "json_object"} # ★ 중요: JSON 강제
        )
        
        ai_response_str = response.choices[0].message.content
        
        # 3. DB 저장 (전체 데이터 저장)
        save_to_vector_db(ai_response_str)

        # 4. JSON 파싱해서 리턴 (프론트엔드가 쓰기 좋게)
        # 만약 파싱에 실패하면 에러 처리가 필요하므로 try-except 추가
        try:
            ai_data = json.loads(ai_response_str)
            # 프론트엔드는 data 객체를 통째로 원함
            return {"status": "success", "data": ai_data} 
        except json.JSONDecodeError:
            # 혹시라도 AI가 JSON을 잘못 줬을 경우 대비
            return {"status": "success", "data": {"summary": ai_response_str}}

    except Exception as e:
        print(f"❌ AI 에러: {e}")
        if "content_filter" in str(e):
            return {"status": "success", "data": {"summary": "⚠️ 보안 필터가 작동했습니다."}}
        return {"status": "error", "message": str(e)}

# 3. [실행 단계] 메일 전송 (요약 X)
# 사용자가 '승인' 버튼 누르면 실행됨
@app.post("/execute-action")
async def execute_action(request: EmailRequest):
    print("🚀 사용자 승인 완료! 메일 전송 시작...")
    
    ai_summary = request.summary_text
    formatted_summary = ai_summary.replace("\n", "<br>")

    html_body = f"""
    <div style="border: 1px solid #ddd; padding: 20px;">
        <h2>📢 AI 회의 요약</h2>
        <hr>{formatted_summary}<hr>
        <p>※ 관리자 승인 후 발송된 메일입니다.</p>
    </div>
    """

    count = 0
    for member in team_members:
        try:
            requests.post(LOGIC_APP_URL, json={"email": member, "subject": "[이음] 회의 결과 리포트", "body": html_body})
            count += 1
            time.sleep(0.3)
        except: pass

    return {"status": "success", "sent_count": count}

# --- [API 4] 대시보드 데이터 조회 (홈 화면용) ---
@app.get("/dashboard-data")
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
                if isinstance(summary_text, dict): # 가끔 summary가 dict일 때 방어
                    summary_text = str(summary_text)

                # 2. 미해결 이슈 수집 (Safe Parsing)
                issues = data.get("openIssues", []) # 키 이름 주의 (openIssues)
                if isinstance(issues, list):
                    for issue in issues:
                        # issue가 문자열일 수도 있고 객체일 수도 있음
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
                # 만약 insights 안에 없으면 루트의 suggested_agenda 확인 (구버전 호환)
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
                "title": source_str, # "2024-05-20 회의 요약"
                "date": source_str.split(" ")[0] if " " in source_str else "날짜 미상",
                "summary": summary_text,
                "participants": ["Team"],
                "actionItems": []
            })

        return {
            "status": "success", 
            "meetings": real_meetings[:5], # 최근 5개
            "open_issues": all_open_issues[:4], # 최근 4개
            "suggested_agenda": all_suggested_agendas[:4] # 최근 4개
        }

    except Exception as e:
        print(f"❌ 대시보드 조회 실패: {e}")
        return {"status": "error", "meetings": [], "open_issues": [], "suggested_agenda": []}