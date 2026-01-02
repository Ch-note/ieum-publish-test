import requests
import time

url = "https://prod-00.swedencentral.logic.azure.com:443/workflows/3ae2b3be15404c508e2a384e64124858/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=_nlAW0n5NARmsKkkblGf3KHHzLnm8xNYP56vZQYyy_w"

team_members = [
    "alfzm1024@naver.com",
    "parkjs801801@gmail.com",
    "hyenajeon37@gmail.com",
    "chaehun61@gmail.com",
    "kkst01221203@gmail.com",
    "hntexhibit@gmail.com"
]

html_body = """
<div style="border: 1px solid #ddd; padding: 20px; font-family: sans-serif;">
    <h2 style="color: #4b53bc;">📢 회의 결과 자동 요약</h2>
    <p>안녕하세요, <strong>팀원 여러분</strong>.</p>
    <p>Azure Logic App 테스트 메일입니다. 이제 HTML 디자인이 적용됩니다!</p>
    <hr>
    <h3>📌 요약 내용</h3>
    <ul>
        <li><strong>안건 1:</strong> 메일 연동 성공</li>
        <li><strong>안건 2:</strong> HTML 포맷팅 적용 확인</li>
    </ul>
    <div style="background-color: #f1f1f1; padding: 10px; border-radius: 5px; margin-top: 20px;">
        <p style="margin:0; font-size: 12px; color: #666;">
            ※ 이 메일은 Python과 Azure Logic Apps를 통해 자동 발송되었습니다.
        </p>
    </div>
</div>
"""

print(f"--- 총 {len(team_members)}명에게 발송을 시작합니다 ---")

for member in team_members:
    data = {
        "email": member, 
        "subject": "[이음] 회의록 리포트 양식 테스트",
        "body": html_body
    }

    try:
        response = requests.post(url, json=data)
        
        if response.status_code == 200 or response.status_code == 202:
            # 이모지 제거하고 텍스트로만 출력
            print(f"[성공] {member}")
        else:
            print(f"[실패] {member} (Error: {response.text})")
            
    except Exception as e:
        print(f"[에러] {member} - {e}")

    time.sleep(0.5)

print("--- 전체 발송 완료 ---")