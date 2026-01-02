import os
import msal
import requests
from dotenv import load_dotenv

load_dotenv()

MS_CLIENT_ID = os.getenv("MS_CLIENT_ID")
# [수정] 권한 범위에 'Tasks.ReadWrite' 추가 (할 일 접근용)
SCOPES = ["Calendars.ReadWrite", "Tasks.ReadWrite"]
AUTHORITY_URL = "https://login.microsoftonline.com/common"
LOGIC_APP_URL_CALENDAR = os.getenv("LOGIC_APP_URL_CALENDAR")

# 최초 로그인을 진행한 후에는 자동으로 저장된 토큰을 사용하도록 설정
CACHE_FILE = 'token_cache.bin'

def _load_cache():
    cache = msal.SerializableTokenCache()
    if os.path.exists(CACHE_FILE):
        with open(CACHE_FILE, "r") as f:
            cache.deserialize(f.read())
    return cache

def _save_cache(cache):
    if cache.has_state_changed:
        with open(CACHE_FILE, "w") as f:
            f.write(cache.serialize())

def get_access_token():
    # MSAL 인증 토큰 발급(캐시 기능 추가)
    cache = _load_cache()
    app = msal.PublicClientApplication(
        MS_CLIENT_ID, 
        authority=AUTHORITY_URL,
        token_cache=cache # 캐시 연결
    )
    result = None
    accounts = app.get_accounts()
    
    if accounts:
        result = app.acquire_token_silent(SCOPES, account=accounts[0])
    
    if not result:
        # 주의: 서버 환경에서는 Interactive 로그인이 어려울 수 있습니다.
        print("최초 인증이 필요합니다. 브라우저에서 로그인을 완료해주세요.") 
        result = app.acquire_token_interactive(scopes=SCOPES)
        
    # 변경된 캐시 내용 저장
    _save_cache(cache)

    return result.get("access_token") if result else None

def send_event_to_logic_app(event_body):
    """(기존 유지) 준비된 JSON Body를 받아 Logic App으로 전송 - 달력용"""
    token = get_access_token()
    if not token:
        return False, "인증 실패"

    payload = {
        "access_token": token,
        "event_body": event_body
    }

    try:
        res = requests.post(LOGIC_APP_URL_CALENDAR, json=payload)
        if res.status_code in [200, 202]:
            return True, "성공"
        else:
            return False, f"Logic App 오류: {res.text}"
    except Exception as e:
        return False, str(e)

# Microsoft Graph API를 이용한 To-Do 생성 함수 (Microsoft To Do API 사용)
def create_todo_task(title, content=None, due_date=None):
    """Microsoft Do Do(Tasks)에 작업을 추가하는 함수"""
    token = get_access_token()
    if not token:
        return False, "인증 실패"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        # 1. 기본 Task List ID 가져오기
        lists_url = "https://graph.microsoft.com/v1.0/me/todo/lists"
        list_resp = requests.get(lists_url, headers=headers)
        
        if list_resp.status_code != 200:
             return False, f"Task List 조회 실패: {list_resp.text}"
        
        lists_data = list_resp.json()
        default_list_id = None
        
        # wellknownListName이 defaultList인 것 찾기
        for lst in lists_data.get("value", []):
            if lst.get("wellknownListName") == "defaultList":
                default_list_id = lst.get("id")
                break
        
        # 없으면 첫 번째 리스트 사용
        if not default_list_id and lists_data.get("value"):
            default_list_id = lists_data["value"][0]["id"]
            
        if not default_list_id:
            return False, "사용 가능한 Task List가 없습니다."
            
        # 2. 해당 리스트에 Task 생성
        tasks_url = f"https://graph.microsoft.com/v1.0/me/todo/lists/{default_list_id}/tasks"
        
        payload = {
            "title": title,  # 작업 제목
            "body": {
                "contentType": "text",
                "content": content if content else "자동 생성된 작업입니다."
            }
        }

        # 마감기한이 있으면 추가 (형식: YYYY-MM-DD)
        if due_date:
            try:
                # Microsoft Graph API의 dueDateTime 형식에 맞춤
                # 시간은 해당 날짜의 자정(00:00:00)이나 
                # 또는 편의상 다음날 0시로 잡기도 하지만, 
                # 여기서는 단순히 날짜 + UTC 자정으로 설정
                payload["dueDateTime"] = {
                    "dateTime": f"{due_date}T00:00:00",
                    "timeZone": "Korea Standard Time"
                }
            except Exception:
                pass # 날짜 형식이 안 맞으면 생략
        
        response = requests.post(tasks_url, headers=headers, json=payload)
        
        # 201 Created: 성공적으로 생성됨
        if response.status_code == 201:
            return True, "성공"
        else:
            return False, f"Graph API 오류: {response.text}"
            
    except Exception as e:
        return False, str(e)
    