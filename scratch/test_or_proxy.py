import urllib.request
import json
import os

API_KEY = "YOUR_OPENROUTER_API_KEY"
TRACE_KEY = "trace_sk_live_ac6b89cf16989f7f3b0590c487c13737"

url = "http://127.0.0.1:8004/proxy/v1/chat/completions"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}",
    "x-trace-key": TRACE_KEY,
    "x-trace-endpoint": "/chat",
    "x-trace-feature": "Website Assistant"
}

data = {
    "model": "meta-llama/llama-3-8b-instruct",
    "messages": [
        {"role": "system", "content": "You are a helpful website assistant."},
        {"role": "user", "content": "Hello! What is your name?"}
    ],
    "max_tokens": 50
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError: {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
