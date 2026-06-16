import os
import sys
import httpx
import asyncio
import json
from datetime import datetime

API_BASE = "http://127.0.0.1:8004"
PROXY_URL = f"{API_BASE}/proxy/v1/chat/completions"

async def verify():
    print(f"[{datetime.now().isoformat()}] Starting End-to-End Verification...")
    
    async with httpx.AsyncClient() as client:
        # 1. Application Creation Flow
        print("\n--- 1. Testing Application Creation ---")
        app_payload = {
            "application_name": "AiGENTThix Assistant",
            "provider": "openrouter",
            "base_url": "https://aigenthix.com",
            "description": "AI-powered customer assistant",
            "upstream_base_url": "https://openrouter.ai/api/v1",
        }
        resp = await client.post(f"{API_BASE}/applications", json=app_payload)
        assert resp.status_code == 201, f"Failed to create app: {resp.text}"
        app_data = resp.json()
        app_id = app_data["id"]
        trace_key = app_data["trace_key"]
        print(f"✅ Application created successfully. ID: {app_id}")
        
        # 3. Trace Key Generation
        print("\n--- 3. Testing Trace Key Generation ---")
        assert trace_key.startswith("trace_sk_live_"), "Invalid trace key format"
        print(f"✅ Trace key generated correctly: {trace_key}")
        
        # 2. Endpoint CRUD Flow
        print("\n--- 2. Testing Endpoint CRUD Flow ---")
        ep_payload = {
            "endpoint_name": "Chat API",
            "endpoint_path": "/chat",
            "feature": "Website Assistant",
            "description": "Main customer chat"
        }
        resp = await client.post(f"{API_BASE}/applications/{app_id}/endpoints", json=ep_payload)
        assert resp.status_code == 201, f"Failed to create endpoint: {resp.text}"
        ep_data = resp.json()
        print(f"✅ Endpoint created successfully. ID: {ep_data['id']}, Path: {ep_data['endpoint_path']}")
        
        # 4. Proxy Telemetry Capture
        print("\n--- 4. Testing Proxy Telemetry Capture ---")
        proxy_headers = {
            "x-trace-key": trace_key,
            "x-trace-endpoint": ep_data["endpoint_path"],
            "x-trace-feature": ep_data["feature"],
            "authorization": "Bearer your-openrouter-key-here", # Fake key, will return 401 but still capture telemetry
            "content-type": "application/json",
            "http-referer": "http://localhost:8080",
            "x-title": "TRACEai",
        }
        proxy_payload = {
            "model": "meta-llama/llama-3-8b-instruct:free",
            "messages": [{"role": "user", "content": "Hello!"}]
        }
        resp = await client.post(PROXY_URL, headers=proxy_headers, json=proxy_payload)
        print(f"Proxy Response Status: {resp.status_code} (Expected 401 from OpenRouter due to dummy key)")
        
        # Wait a moment for async db inserts if any
        await asyncio.sleep(2)
        
        # 5. Request Explorer Displays
        print("\n--- 5. Testing Request Explorer API ---")
        resp = await client.get(f"{API_BASE}/analytics/requests?limit=10")
        assert resp.status_code == 200, f"Failed to fetch requests: {resp.text}"
        reqs_data = resp.json()
        assert reqs_data["total"] > 0, "No requests found"
        
        # Find our request
        our_req = reqs_data["items"][0]
        print(f"✅ Request Found!")
        print(f"  - Endpoint: {our_req['endpoint']}")
        print(f"  - Feature: {our_req['feature']}")
        print(f"  - Provider: {our_req['provider']}")
        print(f"  - Model: {our_req['model']}")
        print(f"  - Tokens: {our_req['total_tokens']}")
        print(f"  - Cost: {our_req['cost']}")
        print(f"  - Latency: {our_req['latency_ms']}ms")
        print(f"  - Status: {our_req['status']}")
        
        assert our_req["endpoint"] == "/chat", "Endpoint mismatch"
        assert our_req["feature"] == "Website Assistant", "Feature mismatch"
        
        # 6. Dashboard endpoint analytics
        print("\n--- 6. Testing Dashboard Endpoint Analytics ---")
        resp = await client.get(f"{API_BASE}/analytics/endpoints")
        assert resp.status_code == 200, f"Failed to fetch endpoints analytics: {resp.text}"
        eps_analytics = resp.json()
        found_ep = next((ep for ep in eps_analytics if ep["endpoint"] == "/chat"), None)
        assert found_ep is not None, "Endpoint '/chat' not found in analytics"
        print(f"✅ Endpoint Analytics OK! Requests: {found_ep['requests']}")
        
        # 7. Analytics API responses
        print("\n--- 7. Testing Other Analytics API Responses ---")
        resp = await client.get(f"{API_BASE}/analytics/features")
        assert resp.status_code == 200, "Failed to fetch features analytics"
        features_analytics = resp.json()
        found_feature = next((f for f in features_analytics if f["feature"] == "Website Assistant"), None)
        assert found_feature is not None, "Feature 'Website Assistant' not found"
        print(f"✅ Feature Analytics OK! Requests: {found_feature['requests']}")
        
        resp = await client.get(f"{API_BASE}/applications/{app_id}/overview")
        assert resp.status_code == 200, f"Failed to fetch application overview: {resp.text}"
        app_overview = resp.json()
        print(f"✅ Application Overview OK! Application Name: {app_overview['application_name']}, Top Endpoints: {len(app_overview['top_endpoints'])}")

        print("\n🎉 All End-to-End Tests Passed Successfully!")

if __name__ == "__main__":
    asyncio.run(verify())
