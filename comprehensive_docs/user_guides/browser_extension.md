# User Guide - Browser Extension

## Overview

The AI Agent Supervisor Browser Extension provides real-time monitoring and supervision of AI agents across web platforms. It seamlessly integrates with ChatGPT, Claude, Gemini, and other AI tools to ensure task coherence and provide intelligent interventions.

## Installation

### Chrome/Chromium Browsers

1. **Download Extension**:
   - Navigate to the `/browser_extension/` directory
   - Or download from the project releases

2. **Install Extension**:
   ```bash
   # Open Chrome
   chrome://extensions/
   
   # Enable Developer Mode (top-right toggle)
   # Click "Load unpacked"
   # Select the browser_extension folder
   ```

3. **Verify Installation**:
   - Look for the AI Supervisor icon in the toolbar
   - Click the icon to open the popup interface
   - Verify "Extension Status: Active" is displayed

### Firefox

1. **Temporary Installation** (Development):
   ```bash
   # Open Firefox
   about:debugging#/runtime/this-firefox
   
   # Click "Load Temporary Add-on"
   # Select manifest.json from browser_extension folder
   ```

2. **Permanent Installation**:
   - Package extension as .xpi file
   - Install through Firefox Add-ons manager

## Getting Started

### First-Time Setup

1. **Open Extension Popup**:
   - Click the extension icon in the browser toolbar
   - The popup window will display current status

2. **Initial Configuration**:
   ```json
   {
     "supervision": {
       "enabled": true,
       "intervention_level": "medium",
       "auto_detect_agents": true
     },
     "platforms": {
       "chatgpt": true,
       "claude": true,
       "gemini": true,
       "minimax": true
     }
   }
   ```

3. **Grant Permissions**:
   - Allow access to AI platform websites
   - Enable notifications for interventions
   - Confirm WebSocket connections

### Interface Overview

#### Extension Popup
The main popup interface includes:

- **Status Indicator**: Green (active), Yellow (warning), Red (error)
- **Current Task**: Display of active monitoring task
- **Quick Actions**: Start/stop monitoring, open settings
- **Recent Activity**: Last few intervention events
- **Sync Status**: Connection to other deployment modes

#### Activity Log
Detailed view of all supervision events:
- Access via "View Full Log" button
- Exportable activity history
- Filterable by platform, type, and time
- Search functionality for specific events

## Core Features

### Automatic Agent Detection

The extension automatically detects when you're using supported AI platforms:

#### Supported Platforms
- **ChatGPT** (chat.openai.com)
- **Claude** (claude.ai)
- **Gemini** (gemini.google.com)
- **MiniMax** (*.minimax.chat)
- **Custom** (configurable patterns)

#### Detection Indicators
```
🟢 Platform Detected: ChatGPT
📋 Context: Code review task
⏱️ Duration: 23 minutes
📊 Coherence Score: 92%
```

### Real-time Task Monitoring

1. **Task Context Setting**:
   - Click "Set Task Context" in the popup
   - Define your current objective
   - Set expected deliverables and timeline

2. **Conversation Analysis**:
   - Real-time analysis of AI responses
   - Detection of topic drift and derailment
   - Context coherence scoring
   - Intervention recommendations

3. **Progress Tracking**:
   - Visual progress indicators
   - Time tracking and milestones
   - Completion percentage estimates
   - Productivity metrics

### Intervention System

#### Intervention Types

1. **Gentle Nudge** (Low Priority):
   ```
   💬 Suggestion: Consider returning to the main topic
   Confidence: 65%
   
   The conversation has slightly drifted from your 
   original task. Would you like to refocus?
   ```

2. **Focus Alert** (Medium Priority):
   ```
   🎯 Focus Alert: Task coherence declining
   Confidence: 82%
   
   The AI agent seems to be exploring tangential topics.
   Consider redirecting with: "Let's get back to [task]."
   ```

3. **Strong Intervention** (High Priority):
   ```
   ⚠️ Strong Intervention Required
   Confidence: 94%
   
   The conversation has significantly derailed from your 
   objective. Immediate course correction recommended.
   
   Suggested prompt: "Please focus specifically on [task] 
   and ignore the tangential discussion."
   ```

### Idea Validation Integration

When you start discussing a new project idea:

1. **Automatic Detection**:
   - Extension detects project-planning language
   - Prompts for idea validation
   - One-click analysis option

2. **Quick Validation**:
   ```
   💡 New Idea Detected
   
   "Build a mobile app for pet owners"
   
   [Validate Idea] [Ignore] [Settings]
   ```

3. **Inline Results**:
   - Feasibility score displayed as overlay
   - Warning indicators for high-risk ideas
   - Suggestion tooltips for improvements

## Advanced Configuration

### Supervision Settings

#### Intervention Sensitivity
```json
{
  "intervention_thresholds": {
    "low": {
      "confidence_threshold": 0.9,
      "time_threshold": 600
    },
    "medium": {
      "confidence_threshold": 0.7,
      "time_threshold": 300
    },
    "high": {
      "confidence_threshold": 0.5,
      "time_threshold": 120
    }
  }
}
```

#### Platform-Specific Settings
```json
{
  "platform_configs": {
    "chatgpt": {
      "monitoring_enabled": true,
      "response_analysis": true,
      "context_injection": false
    },
    "claude": {
      "monitoring_enabled": true,
      "response_analysis": true,
      "context_injection": true
    }
  }
}
```

### Custom Detection Rules

Add custom patterns for task detection:

```javascript
// Custom task detection patterns
const customPatterns = {
  codeReview: {
    keywords: ["review code", "check implementation", "audit"],
    context: "code_review",
    timeout: 3600 // 1 hour
  },
  dataAnalysis: {
    keywords: ["analyze data", "statistical analysis", "trends"],
    context: "data_analysis",
    timeout: 7200 // 2 hours
  }
};
```

### Integration with Other Modes

#### Hybrid Synchronization
1. **Enable Hybrid Mode**: Toggle in extension settings
2. **Gateway Configuration**: Set WebSocket URL
3. **Authentication**: Provide user credentials or token
4. **Sync Verification**: Check connection status

#### Local Installation Connection
```json
{
  "local_connection": {
    "enabled": true,
    "url": "ws://localhost:8889/ws",
    "auto_connect": true,
    "fallback_offline": true
  }
}
```

## Workflow Examples

### Example 1: Code Development Task

1. **Task Setup**:
   ```
   Task: "Develop a user authentication system"
   Platform: ChatGPT
   Expected Duration: 2 hours
   Deliverables: ["API endpoints", "Database schema", "Tests"]
   ```

2. **Monitoring Process**:
   - Extension detects ChatGPT session
   - Analyzes each AI response for relevance
   - Tracks progress toward deliverables
   - Provides gentle guidance when needed

3. **Sample Intervention**:
   ```
   📉 Progress Update (45 min in)
   
   ✅ API endpoints: 80% complete
   🟡 Database schema: 20% complete
   ❌ Tests: Not started
   
   💡 Suggestion: Consider starting on database 
   schema to maintain balanced progress.
   ```

### Example 2: Research and Analysis

1. **Context Setting**:
   ```
   Task: "Research market trends for renewable energy"
   Platform: Claude
   Focus Areas: ["Solar", "Wind", "Investment"]
   Time Limit: 90 minutes
   ```

2. **Coherence Monitoring**:
   - Tracks discussion relevance to renewable energy
   - Flags when conversation drifts to unrelated topics
   - Maintains focus on specified areas

3. **Intervention Example**:
   ```
   🎯 Refocus Needed
   
   The discussion has shifted to cryptocurrency mining.
   This seems unrelated to renewable energy trends.
   
   Suggested redirect: "Let's return to analyzing 
   solar energy investment trends."
   ```

## Troubleshooting

### Common Issues

#### 1. Extension Not Detecting AI Platforms
**Symptoms**:
- No monitoring indicators on AI websites
- Status shows "No active sessions"

**Solutions**:
1. Refresh the AI platform page
2. Check extension permissions
3. Verify platform is in supported list
4. Clear browser cache and reload extension

#### 2. No Interventions Appearing
**Symptoms**:
- Task monitoring active but no intervention alerts

**Solutions**:
1. Lower intervention threshold in settings
2. Verify task context is properly set
3. Check notification permissions
4. Test with deliberately off-topic conversation

#### 3. Sync Issues with Other Modes
**Symptoms**:
- Settings not syncing across deployment modes
- Connection status shows "Disconnected"

**Solutions**:
1. Verify hybrid gateway is running
2. Check WebSocket URL configuration
3. Confirm authentication credentials
4. Test network connectivity

### Debug Mode

Enable debug mode for detailed troubleshooting:

1. **Activate Debug Mode**:
   ```javascript
   // In extension popup, press Ctrl+Shift+D
   // Or set in options page
   {
     "debug": {
       "enabled": true,
       "verbose_logging": true,
       "console_output": true
     }
   }
   ```

2. **View Debug Information**:
   - Browser Developer Tools > Console
   - Extension activity log
   - Background service worker logs

3. **Common Debug Messages**:
   ```
   [AI-Supervisor] Platform detected: ChatGPT
   [AI-Supervisor] Task context updated
   [AI-Supervisor] Intervention threshold: 0.7
   [AI-Supervisor] WebSocket connected
   [AI-Supervisor] Sync status: Connected
   ```

## Performance Optimization

### Resource Usage
- **Memory**: 20-50 MB typical usage
- **CPU**: <2% background processing
- **Network**: Minimal, only for sync operations
- **Battery**: Negligible impact on mobile devices

### Optimization Settings
```json
{
  "performance": {
    "analysis_frequency": "medium", // high, medium, low
    "background_sync": true,
    "cache_responses": true,
    "batch_interventions": false
  }
}
```

## Privacy & Security

### Data Handling
- **Local Processing**: All analysis done locally
- **No Data Storage**: Conversations not stored permanently
- **Encrypted Sync**: Secure transmission to other modes
- **Permission Control**: Granular access controls

### Privacy Controls
```json
{
  "privacy": {
    "store_conversations": false,
    "anonymous_analytics": false,
    "data_retention_days": 7,
    "export_data_available": true
  }
}
```

---

**Next Steps**: Try the [Local Installation Guide](local_installation.md) for offline usage.