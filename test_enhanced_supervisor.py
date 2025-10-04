# Comprehensive Test Suite for Enhanced Supervisor Agent
# Tests task coherence protection and browser integration

import asyncio
import json
import pytest
import websockets
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.task_coherence_engine import TaskCoherenceEngine, TaskContext
from src.browser_coherence_integrator import BrowserCoherenceIntegrator
from src.websocket_server import SupervisorWebSocketServer
from src.enhanced_supervisor_agent import EnhancedSupervisorAgent

class TestTaskCoherenceEngine:
    """Test the core task coherence protection system."""
    
    def setup_method(self):
        """Setup test environment."""
        self.engine = TaskCoherenceEngine()
    
    def test_hackathon_scenario_detection(self):
        """Test the specific hackathon derailment scenario."""
        # User establishes context
        user_input = "I'm building a social media app for this hackathon"
        task_context = self.engine.initialize_task_context(user_input)
        
        # Verify context extraction
        assert task_context.primary_goal == "social media"
        assert task_context.domain == "software_development"
        assert "hackathon" in task_context.context_keywords
        assert "event planning" in task_context.forbidden_switches
        
        # Test problematic agent response
        bad_response = """
        I'd be happy to help you with this hackathon! Let me start by helping you plan the event. 
        For a successful hackathon, you'll need to consider the venue, participant registration, 
        team formation activities, and judging criteria. We should also think about prizes 
        and networking opportunities for the participants.
        """
        
        analysis = self.engine.analyze_response_coherence(bad_response, user_input)
        
        # Verify drift detection
        assert analysis.needs_intervention == True
        assert analysis.final_score < 0.5
        assert len(analysis.keyword_hijacking.hijacked_keywords) > 0
        assert analysis.keyword_hijacking.hijacked_keywords[0]['keyword'] == 'hackathon'
        
        # Test intervention generation
        strategy = self.engine.generate_intervention_strategy(analysis)
        assert strategy is not None
        assert "hackathon" in strategy.user_notification
        assert "social media" in strategy.correction_prompt
    
    def test_good_response_no_intervention(self):
        """Test that good responses don't trigger intervention."""
        user_input = "I'm building a social media app for this hackathon"
        self.engine.initialize_task_context(user_input)
        
        good_response = """
        Great! Let's work on your social media app. For a social media application, we'll need to consider 
        the core features like user profiles, posts, feeds, and interactions. Since this is for a hackathon, 
        we should focus on a minimum viable product. What specific features do you want to prioritize?
        """
        
        analysis = self.engine.analyze_response_coherence(good_response, user_input)
        
        assert analysis.needs_intervention == False
        assert analysis.final_score > 0.7
        assert len(analysis.keyword_hijacking.hijacked_keywords) == 0
    
    def test_multiple_context_keywords(self):
        """Test handling multiple contextual keywords."""
        user_input = "I'm creating a website for the conference deadline next week"
        task_context = self.engine.initialize_task_context(user_input)
        
        assert "website" in task_context.primary_goal or "creating" in task_context.primary_goal
        assert "conference" in task_context.context_keywords
        assert "deadline" in task_context.context_keywords
        
        # Test response that hijacks both keywords
        bad_response = """
        Let me help you prepare for this conference! First, we need to plan the conference schedule 
        and manage the deadline. We should create a timeline for the event planning and coordinate 
        with speakers.
        """
        
        analysis = self.engine.analyze_response_coherence(bad_response, user_input)
        assert analysis.needs_intervention == True
        assert len(analysis.keyword_hijacking.hijacked_keywords) >= 1
    
    def test_domain_consistency(self):
        """Test domain consistency checking."""
        user_input = "I want to build a data analysis tool"
        self.engine.initialize_task_context(user_input)
        
        # Response that changes domain entirely
        domain_drift_response = """
        Let me help you design a beautiful logo and create marketing materials for your business.
        We'll need to think about brand colors and typography choices.
        """
        
        analysis = self.engine.analyze_response_coherence(domain_drift_response, user_input)
        assert analysis.domain_consistency.score < 0.8
    
    def test_goal_alignment_scoring(self):
        """Test goal alignment scoring mechanism."""
        user_input = "I'm developing a mobile game"
        task_context = self.engine.initialize_task_context(user_input)
        
        # Response with no goal mention
        no_goal_response = "Let me tell you about the history of video games and industry trends."
        analysis = self.engine.analyze_response_coherence(no_goal_response, user_input)
        assert analysis.goal_alignment.score < 0.3
        
        # Response with partial goal mention
        partial_response = "Mobile development is complex. Let's discuss general programming concepts."
        analysis = self.engine.analyze_response_coherence(partial_response, user_input)
        assert 0.3 <= analysis.goal_alignment.score <= 0.7
        
        # Response with strong goal alignment
        strong_response = "Great! For your mobile game, we'll need to choose a game engine and design the core gameplay mechanics."
        analysis = self.engine.analyze_response_coherence(strong_response, user_input)
        assert analysis.goal_alignment.score > 0.7

class TestBrowserIntegration:
    """Test browser integration functionality."""
    
    def setup_method(self):
        """Setup test environment."""
        self.integrator = BrowserCoherenceIntegrator()
    
    @pytest.mark.asyncio
    async def test_user_input_analysis(self):
        """Test user input analysis workflow."""
        message = {
            'type': 'USER_INPUT_ANALYSIS',
            'data': {
                'input': "I'm building a social media app for this hackathon",
                'url': 'https://chat.example.com'
            }
        }
        
        result = await self.integrator.handle_browser_message(message, 'tab-123')
        
        assert result['status'] == 'success'
        assert 'task_context' in result
        assert result['task_context']['primary_goal'] is not None
        assert 'social media' in result['task_context']['primary_goal'].lower()
    
    @pytest.mark.asyncio
    async def test_agent_message_analysis_with_intervention(self):
        """Test agent message analysis that triggers intervention."""
        # First establish context
        setup_message = {
            'type': 'USER_INPUT_ANALYSIS',
            'data': {'input': "I'm building a social media app for this hackathon"}
        }
        await self.integrator.handle_browser_message(setup_message, 'tab-123')
        
        # Then analyze problematic agent response
        agent_message = {
            'type': 'AGENT_MESSAGE_ANALYSIS',
            'data': {
                'content': "Let me help you plan this hackathon event. We'll need venue booking and participant registration.",
                'platform': 'test_platform',
                'user_input': "I'm building a social media app for this hackathon"
            }
        }
        
        result = await self.integrator.handle_browser_message(agent_message, 'tab-123')
        
        assert result['status'] == 'success'
        assert result['coherence_analysis']['needs_intervention'] == True
        assert 'intervention' in result
        assert result['intervention'] is not None
    
    @pytest.mark.asyncio
    async def test_session_management(self):
        """Test browser session lifecycle."""
        tab_id = 'tab-test-session'
        
        # Start session
        start_message = {
            'type': 'SESSION_START',
            'data': {
                'url': 'https://chat.example.com',
                'platform': 'test_platform'
            }
        }
        
        result = await self.integrator.handle_browser_message(start_message, tab_id)
        assert result['status'] == 'success'
        
        # Check session exists
        stats = self.integrator.get_session_stats(tab_id)
        assert not stats.get('error')
        assert stats['tab_id'] == tab_id
        
        # End session
        end_message = {'type': 'SESSION_END', 'data': {}}
        result = await self.integrator.handle_browser_message(end_message, tab_id)
        assert result['status'] == 'success'
    
    def test_session_statistics(self):
        """Test session statistics collection."""
        # Test with no sessions
        stats = self.integrator.get_session_stats()
        assert stats['active_sessions'] == 0
        assert len(stats['sessions']) == 0
        
        # Test with non-existent session
        single_stats = self.integrator.get_session_stats('nonexistent')
        assert 'error' in single_stats

class TestWebSocketServer:
    """Test WebSocket server functionality."""
    
    def setup_method(self):
        """Setup test environment."""
        self.server = SupervisorWebSocketServer(host='localhost', port=8765)
    
    @pytest.mark.asyncio
    async def test_server_startup_shutdown(self):
        """Test server startup and shutdown."""
        # Start server
        await self.server.start_server()
        assert self.server.is_running == True
        
        # Stop server
        await self.server.stop_server()
        assert self.server.is_running == False
    
    def test_message_handler_registration(self):
        """Test message handler registration."""
        expected_handlers = [
            'AUTH_REQUEST',
            'EXTENSION_REGISTER',
            'USER_INPUT_ANALYSIS',
            'AGENT_MESSAGE_ANALYSIS',
            'SESSION_START',
            'SESSION_END',
            'PING'
        ]
        
        for handler in expected_handlers:
            assert handler in self.server.message_handlers
    
    def test_rate_limiting(self):
        """Test rate limiting functionality."""
        client_ip = '127.0.0.1'
        
        # Should pass initially
        result = asyncio.run(self.server._check_rate_limit(client_ip))
        assert result == True
        
        # Simulate many requests
        for _ in range(100):
            asyncio.run(self.server._check_rate_limit(client_ip))
        
        # Should be rate limited now
        result = asyncio.run(self.server._check_rate_limit(client_ip))
        assert result == False

@pytest.mark.integration
class TestEndToEndScenarios:
    """End-to-end integration tests."""
    
    def setup_method(self):
        """Setup integration test environment."""
        self.enhanced_supervisor = None
    
    @pytest.mark.asyncio
    async def test_complete_hackathon_scenario(self):
        """Test complete hackathon derailment scenario end-to-end."""
        # Create enhanced supervisor
        config = {
            'browser': {
                'websocket_host': 'localhost',
                'websocket_port': 8767,  # Different port for testing
                'enable_browser_monitoring': True,
                'task_coherence_threshold': 0.6
            }
        }
        
        self.enhanced_supervisor = EnhancedSupervisorAgent(config)
        
        try:
            # Start browser monitoring
            await self.enhanced_supervisor.start_browser_monitoring()
            
            # Simulate the problematic scenario
            tab_id = 'test-tab-hackathon'
            
            # 1. User establishes context
            user_message = {
                'type': 'USER_INPUT_ANALYSIS',
                'data': {
                    'input': "I'm building a social media app for this hackathon",
                    'url': 'https://chat.minimax.com'
                }
            }
            
            result = await self.enhanced_supervisor.browser_integrator.handle_browser_message(user_message, tab_id)
            assert result['status'] == 'success'
            
            # 2. Agent gives problematic response
            agent_message = {
                'type': 'AGENT_MESSAGE_ANALYSIS',
                'data': {
                    'content': "Great! Let me help you organize this hackathon. We'll need to plan the event schedule, book venues, and coordinate with sponsors.",
                    'platform': 'minimax',
                    'user_input': "I'm building a social media app for this hackathon"
                }
            }
            
            result = await self.enhanced_supervisor.browser_integrator.handle_browser_message(agent_message, tab_id)
            
            # 3. Verify intervention was triggered
            assert result['status'] == 'success'
            assert result['coherence_analysis']['needs_intervention'] == True
            assert 'intervention' in result
            assert 'hackathon' in result['intervention']['message']
            assert 'social media app' in result['intervention']['suggested_prompt']
            
            # 4. Verify comprehensive report includes browser data
            report = await self.enhanced_supervisor.get_comprehensive_report()
            assert 'browser_monitoring' in report
            assert report['browser_monitoring']['enabled'] == True
            assert report['browser_monitoring']['active_sessions'] >= 0
            
        finally:
            if self.enhanced_supervisor:
                await self.enhanced_supervisor.shutdown()
    
    @pytest.mark.asyncio
    async def test_browser_extension_configuration(self):
        """Test browser extension configuration generation."""
        config = {
            'browser': {
                'websocket_host': 'localhost',
                'websocket_port': 8768,
                'task_coherence_threshold': 0.7,
                'auto_intervention': True
            }
        }
        
        supervisor = EnhancedSupervisorAgent(config)
        ext_config = supervisor.get_browser_extension_config()
        
        assert ext_config['websocket_url'] == 'ws://localhost:8768'
        assert ext_config['task_coherence_threshold'] == 0.7
        assert ext_config['auto_intervention'] == True

class TestRealWorldScenarios:
    """Test real-world scenarios beyond the hackathon example."""
    
    def setup_method(self):
        self.engine = TaskCoherenceEngine()
    
    def test_school_project_scenario(self):
        """Test scenario with school project context."""
        user_input = "I need to create a website for my computer science class assignment"
        task_context = self.engine.initialize_task_context(user_input)
        
        # Agent incorrectly focuses on academic advice
        bad_response = """
        Let me help you with your computer science studies! Here are some tips for succeeding in CS classes:
        study algorithms, practice coding problems, and manage your time well. You should also consider 
        which CS specialization interests you most.
        """
        
        analysis = self.engine.analyze_response_coherence(bad_response, user_input)
        assert analysis.needs_intervention == True
    
    def test_work_project_scenario(self):
        """Test scenario with work project context."""
        user_input = "I'm developing an API for our company's new product launch"
        task_context = self.engine.initialize_task_context(user_input)
        
        # Agent incorrectly focuses on marketing
        bad_response = """
        Exciting! Product launches require careful marketing planning. Let's discuss your go-to-market strategy,
        target audience analysis, and promotional campaigns. We should also plan the launch event.
        """
        
        analysis = self.engine.analyze_response_coherence(bad_response, user_input)
        assert analysis.needs_intervention == True
        assert "marketing" in str(analysis.issues).lower() or "launch" in str(analysis.issues).lower()

def run_performance_tests():
    """Run performance tests for the coherence engine."""
    engine = TaskCoherenceEngine()
    
    # Test with various input sizes
    test_inputs = [
        "I'm building an app for this hackathon",
        "I'm building a complex social media application with real-time messaging, user profiles, content sharing, and advanced recommendation algorithms for this hackathon event",
        "I need help developing a comprehensive e-commerce platform with inventory management, payment processing, user authentication, order tracking, and analytics dashboard for our startup's upcoming product launch at the tech conference next month"
    ]
    
    import time
    
    for i, user_input in enumerate(test_inputs):
        start_time = time.time()
        
        # Initialize context
        task_context = engine.initialize_task_context(user_input)
        
        # Analyze response
        test_response = "Let me help you plan this event and organize the logistics."
        analysis = engine.analyze_response_coherence(test_response, user_input)
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        print(f"Test {i+1}: {processing_time:.4f}s for {len(user_input)} characters")
        assert processing_time < 1.0  # Should process within 1 second

if __name__ == "__main__":
    # Run performance tests
    print("Running performance tests...")
    run_performance_tests()
    
    # Run specific test
    print("\nRunning hackathon scenario test...")
    test = TestTaskCoherenceEngine()
    test.setup_method()
    test.test_hackathon_scenario_detection()
    print("✅ Hackathon scenario test passed!")
    
    print("\n✅ All manual tests completed successfully!")
    print("\nTo run full test suite with pytest:")
    print("  pip install pytest pytest-asyncio")
    print("  pytest test_enhanced_supervisor.py -v")
