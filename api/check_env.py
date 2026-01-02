from dotenv import load_dotenv
import os

load_dotenv()
client_id = os.getenv("MS_CLIENT_ID")
if not client_id:
    print("MS_CLIENT_ID is MISSING or Empty")
else:
    print(f"MS_CLIENT_ID is PRESENT (length: {len(client_id)})")
