# User Guide - Web Application

## Overview

The AI Agent Supervisor Web Application is a cloud-hosted React application that provides a comprehensive dashboard for monitoring and supervising AI agents. It's the most accessible deployment mode, requiring only a web browser and internet connection.

**Access URL**: https://ncczq77atgsg.space.minimax.io

## Getting Started

### 1. First Visit

1. Navigate to the web application URL
2. Create an account or sign in with existing credentials
3. Complete the initial setup wizard
4. Configure your supervision preferences

### 2. Dashboard Overview

The main dashboard consists of five key sections:

#### Navigation Menu
- **Dashboard**: Main overview and statistics
- **Idea Validator**: Test and validate project ideas
- **Task Monitoring**: Monitor active AI agent tasks
- **Intervention Center**: View and manage interventions
- **Analytics**: Usage statistics and insights
- **Settings**: Configuration and preferences

#### Status Panel
Displays real-time information about:
- Active AI agent sessions
- Recent interventions
- Sync status with other deployment modes
- System health indicators

## Core Features

### Idea Validation

1. **Access**: Click "Idea Validator" in the navigation menu
2. **Input**: Enter your project idea in the text area
3. **Analyze**: Click "Validate Idea" button
4. **Review**: Examine the feasibility score, warnings, and suggestions

#### Example Validation
```
Idea: "Build a social media app like Facebook"

Result:
⚠️ Risk Level: HIGH
📊 Feasibility Score: 4/10

⚠️ Warnings:
- Highly competitive market with established players
- Requires significant resources and funding
- Legal and privacy compliance challenges

💡 Suggestions:
- Consider targeting a specific niche market
- Focus on unique features competitors lack
- Start with MVP and iterate based on feedback
```

### Task Monitoring

1. **Start Monitoring**: Begin an AI agent session
2. **Set Context**: Define your current task or project
3. **Real-time Tracking**: Monitor agent responses for coherence
4. **Intervention Alerts**: Receive notifications when issues are detected

#### Task Context Setup
```json
{
  "task_title": "Develop a mobile app backend",
  "task_description": "Create REST API for a fitness tracking app",
  "expected_deliverables": [
    "API endpoints documentation",
    "Database schema",
    "Authentication system"
  ],
  "time_limit": "4 hours"
}
```

### Intervention Center

View and manage all intervention events:

#### Intervention Types
- **Warning**: Low-priority alerts about potential issues
- **Redirect**: Suggestions to refocus on the main task
- **Block**: High-priority alerts about serious problems
- **Suggest**: Recommendations for improvement

#### Sample Intervention
```
🎯 TASK FOCUS ALERT
Time: 2:34 PM
Type: Redirect
Confidence: 85%

The agent seems to be deviating from the main task.

Current Task: Develop REST API endpoints
Detected Issue: Off-topic discussion about UI design

Suggested Action: 
"Please focus on the backend API development as specified. 
UI design can be addressed in a separate task."
```

## Advanced Features

### Real-time Collaboration

When multiple deployment modes are connected:

1. **Sync Status**: Green indicator shows active connections
2. **Cross-platform Updates**: Changes sync across all modes
3. **Conflict Resolution**: Handle configuration conflicts
4. **Activity Sharing**: View activities from other deployment modes

### Analytics Dashboard

Track your supervision effectiveness:

#### Key Metrics
- **Task Completion Rate**: Percentage of successfully completed tasks
- **Intervention Effectiveness**: How often interventions prevent derailment
- **Idea Validation Usage**: Number of ideas validated and outcomes
- **Response Time**: Average time to detect and respond to issues

#### Weekly Report Example
```
📈 Weekly Supervision Report

Tasks Monitored: 24
Successful Completions: 20 (83%)
Interventions Triggered: 12
Ideas Validated: 8
Average Task Duration: 2.5 hours

Top Issues:
1. Scope creep (5 occurrences)
2. Technical rabbit holes (3 occurrences)
3. Unclear requirements (2 occurrences)

Recommendations:
- Set clearer task boundaries
- Use time-boxing techniques
- Improve requirement gathering
```

## Configuration

### System Settings

Access via Settings menu:

#### Appearance
- **Theme**: Dark, Light, or Auto
- **Language**: Interface language preference
- **Notifications**: Enable/disable different alert types
- **Dashboard Layout**: Customize widget arrangement

#### Supervision Settings
- **Intervention Level**: Low, Medium, High
- **Auto-interventions**: Enable automatic responses
- **Idea Validation**: Enable/disable idea analysis
- **Task Coherence**: Enable/disable task monitoring

#### Integration Settings
- **Hybrid Mode**: Enable cross-deployment synchronization
- **Browser Extension**: Connection status and settings
- **Local Installation**: Sync with local deployment

### User Profile

#### Personal Information
- Update name, email, and preferences
- Change password and security settings
- Configure notification preferences
- Export personal data

#### Usage Statistics
- View detailed usage analytics
- Download activity logs
- Generate supervision reports
- Track improvement metrics

## Troubleshooting

### Common Issues

#### 1. Slow Loading
**Symptoms**: Dashboard takes long to load
**Solutions**:
- Clear browser cache and cookies
- Disable browser extensions temporarily
- Check internet connection speed
- Try different browser

#### 2. Sync Issues
**Symptoms**: Settings don't sync across devices
**Solutions**:
- Verify hybrid gateway connection status
- Check network connectivity
- Manually trigger sync from settings
- Contact support if issues persist

#### 3. Missing Interventions
**Symptoms**: No intervention alerts when expected
**Solutions**:
- Check intervention level settings
- Verify task context is properly set
- Ensure WebSocket connection is active
- Review notification settings

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| **AUTH001** | Authentication failed | Re-login with correct credentials |
| **SYNC002** | Synchronization timeout | Check network and retry |
| **TASK003** | Task context invalid | Reset task context |
| **IDEA004** | Idea validation failed | Retry with simpler input |

## Best Practices

### Effective Task Monitoring

1. **Set Clear Context**: Always define specific task goals
2. **Use Time Limits**: Set realistic time boundaries
3. **Regular Check-ins**: Review progress every 30-60 minutes
4. **Document Interventions**: Keep notes on intervention effectiveness

### Idea Validation Workflow

1. **Start Simple**: Begin with basic idea description
2. **Iterative Refinement**: Use suggestions to improve ideas
3. **Risk Assessment**: Pay attention to risk levels
4. **Alternative Exploration**: Consider suggested alternatives

### Configuration Management

1. **Regular Backups**: Export configuration periodically
2. **Test Changes**: Verify settings in low-risk scenarios
3. **Document Customizations**: Keep notes on custom configurations
4. **Stay Updated**: Review and update settings monthly

## Security & Privacy

### Data Protection
- All data encrypted in transit and at rest
- Regular security audits and updates
- GDPR compliance for EU users
- No data sharing with third parties

### Access Control
- Strong password requirements
- Two-factor authentication available
- Session timeout after inactivity
- Audit logs for security events

### Privacy Controls
- Data retention settings
- Right to data export
- Account deletion options
- Privacy preference management

---

**Need Help?** Contact support or check the [troubleshooting guide](../troubleshooting/web_app_issues.md).