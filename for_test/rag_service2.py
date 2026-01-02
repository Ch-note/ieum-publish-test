# RAG 기능 담당 모듈 생성
# RAG 검색/ DB 저장
import os
import uuid
import time
from datetime import datetime
from dotenv import load_dotenv
from langchain_openai import AzureOpenAIEmbeddings, AzureChatOpenAI
from azure.search.documents import SearchClient
from azure.core.credentials import AzureKeyCredential

load_dotenv()

# 환경변수 로드
SEARCH_ENDPOINT = os.getenv("AZURE_SEARCH_ENDPOINT")
SEARCH_KEY = os.getenv("AZURE_SEARCH_API_KEY")
INDEX_NAME = os.getenv("AZURE_SEARCH_INDEX_NAME")

embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-3-small",
    openai_api_version="AZURE_OPENAI_API_VERSION",
)

# 추가 : rag_chat.py에서 가져온 GPT 모델 설정 코드
llm = AzureChatOpenAI(
    azure_deployment="AZURE_OPENAI_DEPLOYMENT_NAME", # 본인 배포 이름 확인 (gpt-4o)
    openai_api_version="AZURE_OPENAI_API_VERSION",
        # 사실 기반 답변을 위해 0으로 설정
)

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

# 추가 : rag_chat.py에서 가져온 ask_bot 함수(그대로 사용)
def ask_bot(user_question):
    print(f"User: {user_question}")
    
    # 1) 지식 검색
    context = search_documents(user_question)
    print(f"--- [검색된 지식] ---\n{context[:100]}...\n---------------------")
    
    # 2) GPT에게 질문 + 지식 전달
    prompt = f"""
    당신은 회의록 기반 AI 비서입니다. 아래 [회의 내용]을 바탕으로 질문에 답하세요.
    내용에 없는 내용은 "회의록에 없는 내용입니다"라고 답하세요.
    
    [회의 내용]
    {context}
    
    [질문]
    {user_question}
    """
    
    response = llm.invoke(prompt)
    print(f"Bot: {response.content}\n")
    return response.content