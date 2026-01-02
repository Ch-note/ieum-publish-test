import os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv
from openai import AzureOpenAI

# 모듈 import 
import outlook_service 
import rag_service

load_dotenv()

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)
# ---------------------------------------------------------
# [1] 도구 정의: 대화를 도구로 정의합니다.
# ---------------------------------------------------------
tools = [
    # 도구 1: 일정 등록
    {
        "type": "function",
        "function": {
            "name": "register_calendar_event",
            "description": "이 도구는 사용자가 구체적인 날짜나 시간에 회의, 일정, 약속을 잡아달라고 명시적으로 요청할 때 사용하세요.",
            "parameters": {
                "type": "object",
                "properties": {
                    "subject": {"type": "string", "description": "Subject of the meeting"},
                    "start_offset": {"type": "integer", "description": "Days from today to start (0=today, 1=tomorrow)"},
                    "duration_days": {"type": "integer", "description": "Duration in days (default 1)"},
                    "attendees": {"type": "array", "items": {"type": "string"}, "description": "List of attendee emails"},
                    "specific_time": {"type": "string", "description": "HH:MM format time (e.g. '14:00'). null if not specified."},
                    "location": {"type": "string", "description": "Location of the meeting (e.g. 'Busan', 'Conference Room 1')"}
                },
                "required": ["subject", "start_offset"]
            }
        }
    },
    # 추가 : 도구 2: RAG 검색 도구 정의
    {
        "type": "function",
        "function": {
            "name": "search_knowledge_base",
            "description": "이 도구를 사용하여 과거 회의록, 회사 정책 또는 데이터베이스에 저장된 특정 정보를 검색할 수 있습니다.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search keywords or question."
                    }
                },
                "required": ["query"]
            }
        }
    }
]

# --------------------------------------
# 메인 로직
# --------------------------------------

def process_chat_request(user_message):
    """React에서 온 메시지를 처리하고 응답을 반환"""
    today = datetime.now().strftime("%Y-%m-%d")
    
    # [2] 시스템 프롬프트 대폭 축소
    # 이제 복잡한 조건문("만약 대화라면...")이 필요 없습니다. 도구 설명이 그 역할을 대신합니다.
    system_instruction = f"""
    Current Date: {today}
    1. '일정', '예약', '잡아줘', '스케줄' 등의 요청이 오면 [register_calendar_event]를 사용하세요.
    - 날짜가 '내일', '다음주 월요일' 등으로 들어오면 오늘 날짜 기준으로 YYYY-MM-DD로 변환해서 넣으세요.
    
    2. '회의록', '요약해줘', '뭐라고 했어?', '기록' 등의 과거 정보 요청이 오면 [search_knowledge_base]를 사용하세요.
    
    3. 그 외 단순한 인사는 도구 없이 친절하게 답변하세요.
    """
    
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": user_message}
    ]
    
    try:
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
            messages=messages,
            tools=tools,
            # 반드시 함수 중 하나를 쓰도록 강제 (required)
            tool_choice="auto" 
        )
    
        msg = response.choices[0].message

        # [디버깅 로그] LLM의 응답 상태 확인
        # print(f"🤖 LLM 응답: Tool Calls={msg.tool_calls is not None}, Content={msg.content}")

        # LLM이 선택한 도구 확인
        if msg.tool_calls:
            for tool in msg.tool_calls:
                args = json.loads(tool.function.arguments)
                tool_name = tool.function.name

                # print(f"🔧 도구 호출 감지: {function_name}") # [디버깅] 어떤 함수를 불렀는지 확인

                # [Case A] 일정 등록 도구를 선택했을 때
                if tool.function.name == "register_calendar_event":
                    print("일정 등록 감지")
                    
                    # 1. 날짜/시간 계산 로직
                    target_date = datetime.now() + timedelta(days=args.get('start_offset', 0))
                    duration = args.get('duration_days', 1)
                    specific_time = args.get('specific_time')

                    if specific_time:
                        is_all_day = False
                        start_dt_str = target_date.strftime("%Y-%m-%d") + f"T{specific_time}:00"
                        start_dt_obj = datetime.strptime(start_dt_str, "%Y-%m-%dT%H:%M:%S")
                        end_dt_obj = start_dt_obj + timedelta(hours=1)
                        end_dt_str = end_dt_obj.strftime("%Y-%m-%dT%H:%M:%S")
                    else:
                        is_all_day = True
                        start_dt_str = target_date.strftime("%Y-%m-%d") + "T00:00:00"
                        end_date_obj = target_date + timedelta(days=duration)
                        end_dt_str = end_date_obj.strftime("%Y-%m-%d") + "T00:00:00"

                    # 2. Logic App 전송
                    event_body = {
                        "subject": args.get("subject"),
                        "body": {"contentType": "Text", "content": f"요청 원문: {user_message}"},
                        "isAllDay": is_all_day,
                        "start": {"dateTime": start_dt_str, "timeZone": "Korea Standard Time"},
                        "end": {"dateTime": end_dt_str, "timeZone": "Korea Standard Time"},
                    }

                    # 위치 정보가 있으면 추가
                    location = args.get('location')
                    if location:
                        event_body["location"] = {
                            "displayName": location
                        }
                
                    success, result_msg = outlook_service.send_event_to_logic_app(event_body)
                    return f"✅ 일정 등록 결과: {result_msg} (제목: {args.get('subject')})"
                
                # [Case B] RAG 검색(rag_chat.py반영)
                elif tool_name == "search_knowledge_base":
                    query = args.get("query")
                    print(f"🔍 DB 검색 수행: {query}")
                    
                    # 변경 : 기존 ask_bot 함수를 호출
                    answer = rag_service.ask_bot(user_message)

                    return answer
            # else:
        print(f"{msg.content}")
        return msg.content
            
    except Exception as e:
        print(f"시스템 에러: {e}")
        return "시스템 내부 오류가 발생했습니다."