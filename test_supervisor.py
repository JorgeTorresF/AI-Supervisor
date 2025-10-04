#!/usr/bin/env python3
"""
Test client to verify supervisor connection and establish monitoring
"""

import asyncio
import json
import websockets
from datetime import datetime

async def test_supervisor_connection():
    """Test connection to supervisor and simulate monitoring"""
    
    try:
        # Connect to supervisor
        async with websockets.connect("ws://localhost:8765") as websocket:
            print("✅ Connected to Supervisor AI!")
            
            # Start supervision session
            session_request = {
                "tool": "start_session",
                "args": {
                    "session_id": "demo_session_001",
                    "agent_name": "MiniMax_Agent",
                    "task_description": "Building modern landing page with real-time logging"
                }
            }
            
            await websocket.send(json.dumps(session_request))
            session_response = await websocket.recv()
            print(f"📋 Session started: {json.loads(session_response)}")
            
            # Test decision making with various scenarios
            test_scenarios = [
                {
                    "name": "High Performance",
                    "state": {
                        "quality_score": 0.9,
                        "error_count": 0,
                        "resource_usage": 0.2,
                        "task_progress": 0.8,
                        "drift_score": 0.05
                    }
                },
                {
                    "name": "Warning Scenario",
                    "state": {
                        "quality_score": 0.7,
                        "error_count": 1,
                        "resource_usage": 0.6,
                        "task_progress": 0.4,
                        "drift_score": 0.3
                    }
                },
                {
                    "name": "Correction Needed",
                    "state": {
                        "quality_score": 0.5,
                        "error_count": 3,
                        "resource_usage": 0.8,
                        "task_progress": 0.2,
                        "drift_score": 0.6
                    }
                },
                {
                    "name": "Critical Escalation",
                    "state": {
                        "quality_score": 0.3,
                        "error_count": 5,
                        "resource_usage": 0.95,
                        "task_progress": 0.1,
                        "drift_score": 0.8
                    }
                }
            ]
            
            print("\n🧠 Testing Supervisor Decision Making:")
            decisions = []
            
            for scenario in test_scenarios:
                decision_request = {
                    "tool": "get_minimax_decision",
                    "args": scenario["state"]
                }
                
                await websocket.send(json.dumps(decision_request))
                decision_response = await websocket.recv()
                decision = json.loads(decision_response)
                
                decisions.append({
                    "scenario": scenario["name"],
                    "decision": decision["decision"],
                    "confidence": decision["confidence"],
                    "reasoning": decision["reasoning"],
                    "timestamp": decision["timestamp"]
                })
                
                print(f"\n🎯 {scenario['name']}:")
                print(f"   Decision: {decision['decision']}")
                print(f"   Confidence: {decision['confidence']:.2f}")
                print(f"   Reasoning: {decision['reasoning']}")
            
            # Get decision log
            log_request = {
                "tool": "get_decision_log",
                "args": {"limit": 10}
            }
            
            await websocket.send(json.dumps(log_request))
            log_response = await websocket.recv()
            log_data = json.loads(log_response)
            
            print(f"\n📊 Decision Log ({len(log_data['decisions'])} entries):")
            for entry in log_data['decisions'][-3:]:  # Show last 3
                print(f"   {entry['timestamp']}: {entry['decision']} (confidence: {entry['confidence']:.2f})")
            
            # Save test results for website demo
            demo_data = {
                "test_timestamp": datetime.utcnow().isoformat(),
                "connection_status": "connected",
                "scenarios_tested": decisions,
                "total_decisions": len(log_data['decisions'])
            }
            
            with open("/workspace/supervisor_test_results.json", "w") as f:
                json.dump(demo_data, f, indent=2)
            
            print("\n✅ Supervisor AI is fully operational!")
            print("📁 Test results saved to supervisor_test_results.json")
            
            return True
            
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_supervisor_connection())
