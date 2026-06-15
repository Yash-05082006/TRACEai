# To install the OpenAI Python SDK, run:
#   pip install openai
#
# Or if using the virtual environment in the project:
#   backend\.venv\Scripts\pip.exe install openai

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
# CONFIGURATION
# ==============================================================================

# 1. Paste your Gemini API key in this variable.
# NOTE: The client-side OpenAI SDK requires an API key to initialize.
# The TRACEai proxy will use this key (or the server's GEMINI_API_KEY from backend/.env)
# to authenticate with the upstream Google Gemini API.
GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"

# 2. TRACEAI proxy URL.
# Point to the local backend proxy endpoint running on port 8004.
TRACE_PROXY_URL = "http://127.0.0.1:8004/proxy/v1"

# 3. TRACEAI capture key from the Integrations configuration.
# This matches the generated 'gemini-dev' Google integration in the database.
TRACE_CAPTURE_KEY = "trace_sk_live_dc2011ea296551c3fcf617cf3f83ea29"

# Model name to use (the proxy forwards this model identifier to Google Gemini)
MODEL_NAME = "gemini-2.0-flash"

# ==============================================================================

def main():
    print("Initializing OpenAI client pointing to TRACEai Proxy...")
    print(f"Proxy URL: {TRACE_PROXY_URL}")
    print(f"Trace Key: {TRACE_CAPTURE_KEY}")
    print(f"Model:     {MODEL_NAME}")
    
    # Initialize the client pointing to our proxy
    client = OpenAI(
        api_key=GEMINI_API_KEY,
        base_url=TRACE_PROXY_URL,
        default_headers={
            "x-trace-key": TRACE_CAPTURE_KEY
        }
    )
    
    try:
        print("\nSending chat completion request via proxy...")
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": "Tell me a joke in one sentence."}
            ]
        )
        
        print("\n--- Model Response ---")
        print(response.choices[0].message.content)
        print("----------------------")
        print("\nSuccess! The request has been routed through TRACEai.")
        
    except Exception as e:
        print("\n[ERROR] Failed to execute LLM request through TRACEai proxy.")
        print(f"Details: {e}")
        print("\nTroubleshooting tips:")
        print("1. Ensure your backend is running (e.g. uvicorn on port 8004).")
        print("2. Make sure you pasted a valid Gemini API key in the GEMINI_API_KEY variable at the top.")
        print("3. Check backend/.env contains a valid GEMINI_API_KEY if the server is overriding it.")

if __name__ == "__main__":
    main()
