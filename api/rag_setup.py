# rag_setup.py
import os
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex,
    SimpleField,
    SearchableField,
    SearchField,
    VectorSearch,
    HnswAlgorithmConfiguration,
    VectorSearchProfile
)
from langchain_openai import AzureOpenAIEmbeddings

# 환경변수 로드
load_dotenv()

# 설정값 가져오기
service_endpoint = os.getenv("AZURE_SEARCH_ENDPOINT")
key = os.getenv("AZURE_SEARCH_API_KEY")
index_name = os.getenv("AZURE_SEARCH_INDEX_NAME")

# 1. 임베딩 모델 준비 (텍스트 -> 벡터 변환기)
# 주의: Azure OpenAI에서 'text-embedding-3-small' 또는 'text-embedding-ada-002' 모델을 배포해야 합니다!
# 배포 이름이 다르다면 아래 deployment를 수정하세요.
embeddings = AzureOpenAIEmbeddings(
    azure_deployment="text-embedding-3-small", # 본인의 임베딩 배포 이름
    openai_api_version="2023-05-15",
)

# 2. 인덱스(저장소) 스키마 정의 및 생성 함수
def create_index():
    client = SearchIndexClient(service_endpoint, AzureKeyCredential(key))
    
    # 벡터 검색 설정 (HNSW 알고리즘 사용)
    vector_search = VectorSearch(
        algorithms=[HnswAlgorithmConfiguration(name="my-hnsw")],
        profiles=[VectorSearchProfile(name="my-vector-profile", algorithm_configuration_name="my-hnsw")]
    )

    # 필드 정의 (ID, 내용, 벡터)
    fields = [
        SimpleField(name="id", type="Edm.String", key=True),
        SearchableField(name="content", type="Edm.String"), # 검색될 텍스트
        SearchableField(name="source", type="Edm.String"),  # 출처 (예: 5월 20일 회의)
        SearchField(
            name="content_vector", 
            type="Edm.Collection(Edm.Single)", 
            searchable=True, 
            vector_search_dimensions=1536, # ada-002 모델은 1536차원
            vector_search_profile_name="my-vector-profile"
        )
    ]

    index = SearchIndex(name=index_name, fields=fields, vector_search=vector_search)
    
    try:
        client.create_or_update_index(index)
        print(f" 인덱스 '{index_name}' 생성 완료!")
    except Exception as e:
        print(f" 인덱스 생성 실패: {e}")

# 3. 데이터 주입 (어제 회의 내용)
from azure.search.documents import SearchClient

def upload_documents():
    client = SearchClient(service_endpoint, index_name, AzureKeyCredential(key))
    
    # 어제 우리가 만든 가상 회의록
    meeting_text = """
    [5월 20일 정기 회의 요약]
    1. 다음 주 워크숍 일정이 26일에서 25일 목요일 오후 2시로 변경되었습니다.
    2. 워크숍 장소는 회사 앞 고깃집에서 삼겹살 회식으로 결정했습니다.
    3. 로그인 페이지 404 에러 원인은 App 주소 오기입이었으며, 이영희 님이 수정 후 내일 오전 10시까지 배포하기로 했습니다.
    4. 김철수 님은 오늘 중으로 식당 예약을 완료해야 합니다.
    """
    
    # 텍스트를 벡터로 변환 (Embedding)
    print(" 텍스트를 벡터로 변환 중...")
    vector = embeddings.embed_query(meeting_text)
    
    # 업로드할 문서 객체
    doc = {
        "id": "meeting-20240520", # 고유 ID
        "content": meeting_text,
        "source": "2024-05-20 회의록",
        "content_vector": vector
    }
    
    try:
        client.upload_documents(documents=[doc])
        print(" 데이터 업로드 및 벡터 저장 완료!")
    except Exception as e:
        print(f" 업로드 실패: {e}")

if __name__ == "__main__":
    create_index()     # 1. 저장소 만들고
    upload_documents() # 2. 데이터 넣기