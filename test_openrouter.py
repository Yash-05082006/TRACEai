# To install the OpenAI Python SDK, run:
#   pip install openai
#
# Or if using the virtual environment in the project:
#   backend\.venv\Scripts\pip.exe install openai
#
# How to run this script in PowerShell from the project root:
#   backend\.venv\Scripts\python.exe test_openrouter.py
#
# Or with system Python:
#   python test_openrouter.py

import sys
import os

try:
    from openai import OpenAI
except ImportError:
    print("Error: The 'openai' package is required but not installed.")
    print("Please install it by running:")
    print("  pip install openai")
    print("Or if using the project's virtual environment:")
    print("  backend\\.venv\\Scripts\\pip.exe install openai")
    sys.exit(1)

# ==============================================================================
# CONFIGURATION - PASTE YOUR KEYS HERE
# ==============================================================================

# 1. Paste your OpenRouter API Key here (e.g. sk-or-...)
OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY"

# 2. Paste your local TRACEai proxy URL here (from the Integrations page)
# For local testing, this is usually: http://127.0.0.1:8004/proxy/v1
TRACE_PROXY_URL = "http://127.0.0.1:8004/proxy/v1"

# 3. Paste the TRACE Capture Key shown in Step 3 of the Integrations flow
TRACE_CAPTURE_KEY = "YOUR_TRACE_CAPTURE_KEY"

# The free OpenRouter model to use for this test.
MODEL_NAME = "openrouter/free"

# ==============================================================================

def main():
    print("======================================================================")
    print("TRACEai - OpenRouter Connection Test Script")
    print("======================================================================\n")

    # Basic configuration check
    if not OPENROUTER_API_KEY.startswith("sk-or-"):
        print("[-] Error: Please paste a valid OpenRouter API Key starting with 'sk-or-' in OPENROUTER_API_KEY.")
        sys.exit(1)
        
    if not (TRACE_PROXY_URL.startswith("http://") or TRACE_PROXY_URL.startswith("https://")):
        print("[-] Error: Please paste a valid TRACE Proxy URL in TRACE_PROXY_URL.")
        sys.exit(1)
        
    if not TRACE_CAPTURE_KEY.startswith("trace_sk_live_"):
        print("[-] Error: Please paste a valid TRACE Capture Key starting with 'trace_sk_live_' in TRACE_CAPTURE_KEY.")
        sys.exit(1)

    print(f"[*] Proxy URL:        {TRACE_PROXY_URL}")
    print(f"[*] TRACE Key:        {TRACE_CAPTURE_KEY}")
    print(f"[*] Model:            {MODEL_NAME}")
    
    # Initialize the client pointing to TRACEai proxy
    # We pass the OpenRouter API Key as the api_key, point the base_url to our TRACE proxy,
    # and attach the TRACE capture key as a custom header 'x-trace-key'.
    client = OpenAI(
        api_key=OPENROUTER_API_KEY,
        base_url=TRACE_PROXY_URL,
        default_headers={
            "x-trace-key": TRACE_CAPTURE_KEY
        }
    )
    
    try:
        print("\n[*] Sending chat completion request via proxy...")
        
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": "Tell me a joke in one sentence."}
            ]
        )
        
        # Print output requirements: Status, Model used, Response text, and Success/Failure message.
        print("\n[+] Status: Request succeeded!")
        print(f"[+] Model Used: {response.model or MODEL_NAME}")
        print("\n--- Response Text ---")
        print(response.choices[0].message.content)
        print("----------------------\n")
        print("[SUCCESS] Connection verified! The request was successfully completed by OpenRouter and logged by TRACEai.")
        
    except Exception as e:
        print("\n[-] Status: Request failed.")
        print(f"[-] Details: {e}")
        print("\n[FAILURE] Failed to route request through TRACEai proxy.")
        print("\nTroubleshooting tips:")
        print("1. Verify your local backend is running (e.g. uvicorn on port 8004).")
        print("2. Ensure your OpenRouter API key has sufficient quota/credits.")
        print("3. Check that the TRACE Proxy URL (e.g., http://127.0.0.1:8004/proxy/v1) matches your running backend.")
        print("4. Verify the trace key in the dashboard matches TRACE_CAPTURE_KEY exactly.")

if __name__ == "__main__":
    main()
