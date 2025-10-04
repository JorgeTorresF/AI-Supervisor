import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Database, Zap, Globe, Copy, Check } from 'lucide-react';

const ArchitectureSection: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  
  const codeExamples = [
    {
      id: 'websocket',
      title: 'WebSocket Integration',
      language: 'javascript',
      code: `// Connect to AI Supervisor WebSocket
const ws = new WebSocket('ws://localhost:8765');

// Send decision request
ws.send(JSON.stringify({
  "tool": "get_minimax_decision",
  "args": {
    "quality_score": 0.9,
    "error_count": 0,
    "resource_usage": 0.2,
    "task_progress": 0.8,
    "drift_score": 0.05
  }
}));

// Handle supervisor response
ws.onmessage = (event) => {
  const decision = JSON.parse(event.data);
  console.log('Decision:', decision.decision);
  console.log('Confidence:', decision.confidence);
};`
    },
    {
      id: 'python',
      title: 'Python Integration',
      language: 'python',
      code: `from supervisor_core import SupervisorCore

# Initialize supervisor
supervisor = SupervisorCore()

# Monitor agent task
task_id = await supervisor.monitor_agent(
    agent_name="GPT-4",
    framework="OpenAI",
    task_input="Build a web application",
    instructions=["Use React", "Include tests"]
)

# Validate output
result = await supervisor.validate_output(
    task_id=task_id,
    output="<!DOCTYPE html>...",
    output_type="html"
)

print(f"Decision: {result['intervention_result']['level']}")
print(f"Quality: {result['quality_metrics']['confidence_score']}")`
    },
    {
      id: 'api',
      title: 'REST API Usage',
      language: 'javascript',
      code: `// Start monitoring session
const response = await fetch('/api/supervisor/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: 'demo_001',
    agent_name: 'Claude',
    task_description: 'Code generation task'
  })
});

// Get decision log
const decisions = await fetch('/api/supervisor/decisions?limit=50');
const log = await decisions.json();

console.log('Recent decisions:', log.decisions);`
    }
  ];
  
  const architectureFeatures = [
    {
      icon: <Database className="w-8 h-8" />,
      title: "Core Engine",
      description: "Python-based supervisor core with Expectimax algorithm",
      details: [
        "Multi-factor state evaluation",
        "Pattern learning and recognition",
        "Audit logging and analytics",
        "Knowledge base management"
      ]
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Communication",
      description: "WebSocket server for instant decision delivery",
      details: [
        "Sub-100ms response times",
        "Bi-directional communication",
        "Auto-reconnection handling",
        "Message queuing and reliability"
      ]
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Web Interface",
      description: "React-based dashboard for monitoring and control",
      details: [
        "Real-time data visualization",
        "Interactive decision testing",
        "Session management",
        "Responsive design"
      ]
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Integration APIs",
      description: "Multiple integration options for different platforms",
      details: [
        "WebSocket protocol",
        "REST API endpoints",
        "Python SDK",
        "JavaScript client library"
      ]
    }
  ];
  
  return (
    <section id="architecture" className="py-20 bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Technical <span className="text-blue-400">Architecture</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built with modern technologies and designed for scalability, reliability, and ease of integration.
            Get started with our comprehensive APIs and SDKs.
          </p>
        </motion.div>
        
        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">System Architecture</h3>
            
            <div className="grid lg:grid-cols-4 gap-8">
              {architectureFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="bg-blue-500/20 text-blue-400 rounded-xl p-4 inline-flex mb-4">
                    {feature.icon}
                  </div>
                  <h4 className="text-white font-bold text-lg mb-3">{feature.title}</h4>
                  <p className="text-gray-300 text-sm mb-4">{feature.description}</p>
                  
                  <div className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center justify-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-400 text-xs">{detail}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
        
        {/* Code Integration Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-white mb-8 text-center">
            Integration <span className="text-green-400">Examples</span>
          </h3>
          
          <div className="grid lg:grid-cols-1 gap-8">
            {codeExamples.map((example, index) => (
              <motion.div
                key={example.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <h4 className="text-white font-semibold">{example.title}</h4>
                  <button
                    onClick={() => copyToClipboard(example.code, example.id)}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg text-sm transition-all duration-200"
                  >
                    {copiedCode === example.id ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="p-4">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    <code className={`language-${example.language}`}>
                      {example.code}
                    </code>
                  </pre>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* Architecture Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold text-white mb-6">Decision Tree Visualization</h3>
            <img 
              src="/ai_decision_tree_supervised_learning_flowchart_dark_tech.jpg" 
              alt="AI Decision Tree Architecture"
              className="w-full max-w-4xl mx-auto rounded-xl shadow-lg"
            />
            <p className="text-gray-400 mt-4">
              Visual representation of the AI Supervisor's decision-making process with 
              supervised learning algorithms and multi-factor evaluation.
            </p>
          </div>
        </motion.div>
        
        {/* Getting Started */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Integrate AI Supervisor into your workflow with our comprehensive documentation, 
              SDK libraries, and example implementations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105">
                Download SDK
              </button>
              <button className="border border-blue-500 text-blue-400 hover:bg-blue-500/10 px-8 py-3 rounded-xl font-semibold transition-all duration-200">
                View Documentation
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ArchitectureSection;