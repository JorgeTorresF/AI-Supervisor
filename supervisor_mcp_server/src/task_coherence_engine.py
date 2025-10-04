# Task Coherence Protection System
# Advanced algorithms to prevent AI agents from switching tasks due to contextual keywords

class TaskCoherenceEngine:
    """
    Core engine for maintaining task coherence and preventing context drift.
    Specifically designed to handle scenarios like:
    - User: "I'm building a social media app for this hackathon"
    - Agent incorrectly switches to: "Let me help you plan the hackathon event..."
    """
    
    def __init__(self):
        self.task_context = None
        self.context_anchors = []
        self.drift_patterns = self._load_drift_patterns()
        self.intervention_history = []
        
    def initialize_task_context(self, user_input, agent_response=None):
        """
        Extract and establish the primary task context from initial interaction.
        """
        self.task_context = TaskContext(
            primary_goal=self._extract_primary_goal(user_input),
            domain=self._identify_domain(user_input),
            context_keywords=self._extract_context_keywords(user_input),
            forbidden_switches=self._identify_forbidden_switches(user_input),
            establishment_timestamp=time.time()
        )
        
        # Add initial anchor
        self.context_anchors.append(ContextAnchor(
            text=user_input,
            goal_strength=1.0,
            timestamp=time.time(),
            anchor_type='initial_establishment'
        ))
        
        return self.task_context
    
    def _extract_primary_goal(self, text):
        """
        Extract the main task/goal from user input.
        Example: "building a social media app" from "I'm building a social media app for this hackathon"
        """
        # Primary goal patterns (what user wants to accomplish)
        goal_patterns = [
            r"(?:build|create|develop|make|design)\s+(?:a|an)?\s+([\w\s]+?)(?:\s+(?:app|application|system|tool|website|platform|software))",
            r"(?:working on|building|creating|developing)\s+([\w\s]+?)(?:\s+(?:for|to|that|which))",
            r"(?:my|our|the)\s+([\w\s]+?)\s+(?:project|app|system|platform)",
            r"(?:project|task|goal)\s+(?:is|involves|includes)\s+([\w\s]+)"
        ]
        
        for pattern in goal_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                goal = match.group(1).strip()
                # Clean up common artifacts
                goal = re.sub(r'\b(for|to|that|which|the|a|an)\b', '', goal).strip()
                return goal
        
        return None
    
    def _identify_domain(self, text):
        """
        Identify the primary domain/field of the task.
        """
        domain_keywords = {
            'software_development': ['app', 'application', 'software', 'code', 'programming', 'development'],
            'web_development': ['website', 'web', 'frontend', 'backend', 'html', 'css', 'javascript'],
            'mobile_development': ['mobile', 'ios', 'android', 'smartphone'],
            'data_science': ['data', 'analysis', 'machine learning', 'ai', 'algorithm'],
            'design': ['design', 'ui', 'ux', 'interface', 'visual'],
            'business': ['business', 'startup', 'company', 'strategy', 'marketing'],
            'research': ['research', 'study', 'analysis', 'investigation']
        }
        
        text_lower = text.lower()
        domain_scores = {}
        
        for domain, keywords in domain_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                domain_scores[domain] = score
        
        return max(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else 'general'
    
    def _extract_context_keywords(self, text):
        """
        Extract contextual keywords that provide setting but should not become the focus.
        Example: 'hackathon' in "I'm building a social media app for this hackathon"
        """
        # Contextual patterns (setting/circumstance, not the goal)
        context_patterns = [
            r"(?:for|at|during|in)\s+(?:this|the|a|an)?\s+(hackathon|competition|contest|event|conference|workshop|class|course|project)",
            r"(?:because of|due to|for)\s+(?:the|a|an)?\s+(deadline|timeline|schedule|presentation|demo)",
            r"(?:as part of|for)\s+(?:my|our|the)?\s+(work|job|assignment|homework|task)"
        ]
        
        context_keywords = []
        for pattern in context_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            context_keywords.extend(matches)
        
        return list(set(context_keywords))  # Remove duplicates
    
    def _identify_forbidden_switches(self, text):
        """
        Identify topics that agents commonly but incorrectly switch to.
        """
        # Based on context keywords, predict likely wrong switches
        forbidden_switches = []
        
        if 'hackathon' in text.lower():
            forbidden_switches.extend([
                'event planning', 'hackathon organization', 'team formation',
                'pitch preparation', 'competition strategy', 'networking'
            ])
        
        if 'competition' in text.lower():
            forbidden_switches.extend([
                'contest rules', 'judging criteria', 'competitor analysis'
            ])
        
        if 'deadline' in text.lower():
            forbidden_switches.extend([
                'time management', 'project planning', 'schedule optimization'
            ])
        
        return forbidden_switches
    
    def analyze_response_coherence(self, agent_response, user_input=None):
        """
        Analyze agent response for task coherence issues.
        Returns CoherenceAnalysis object with drift detection and intervention recommendations.
        """
        if not self.task_context:
            return CoherenceAnalysis(score=1.0, issues=[], needs_intervention=False)
        
        analysis = CoherenceAnalysis(
            primary_goal_alignment=self._check_goal_alignment(agent_response),
            context_keyword_hijacking=self._detect_keyword_hijacking(agent_response),
            forbidden_topic_switching=self._detect_forbidden_switching(agent_response),
            domain_consistency=self._check_domain_consistency(agent_response),
            response_relevance=self._assess_response_relevance(agent_response, user_input)
        )
        
        # Calculate overall coherence score
        analysis.calculate_final_score()
        
        # Determine intervention needs
        analysis.determine_intervention_needs(self.task_context)
        
        return analysis
    
    def _check_goal_alignment(self, response):
        """
        Check if response maintains focus on the primary goal.
        """
        if not self.task_context.primary_goal:
            return GoalAlignmentResult(score=1.0, issues=[])
        
        goal_words = self.task_context.primary_goal.lower().split()
        response_words = response.lower().split()
        
        # Calculate goal word presence
        goal_mentions = sum(1 for word in goal_words if any(word in resp_word or resp_word in word for resp_word in response_words))
        goal_coverage = goal_mentions / len(goal_words) if goal_words else 0
        
        issues = []
        score = goal_coverage
        
        # Check for complete goal abandonment
        if goal_coverage == 0 and len(response) > 100:
            issues.append(f"No mention of primary goal: '{self.task_context.primary_goal}'")
            score = 0.0
        elif goal_coverage < 0.3:
            issues.append(f"Weak connection to primary goal: '{self.task_context.primary_goal}'")
            score = 0.3
        
        return GoalAlignmentResult(score=score, issues=issues, goal_coverage=goal_coverage)
    
    def _detect_keyword_hijacking(self, response):
        """
        Detect when agent focuses too much on contextual keywords instead of the main goal.
        This is the core function to prevent the "hackathon" derailment issue.
        """
        if not self.task_context.context_keywords:
            return KeywordHijackingResult(score=1.0, hijacked_keywords=[])
        
        hijacked_keywords = []
        total_hijacking_score = 0
        
        for keyword in self.task_context.context_keywords:
            keyword_analysis = self._analyze_keyword_focus(keyword, response)
            
            if keyword_analysis['is_hijacked']:
                hijacked_keywords.append({
                    'keyword': keyword,
                    'focus_percentage': keyword_analysis['focus_percentage'],
                    'hijacking_indicators': keyword_analysis['indicators']
                })
                total_hijacking_score += keyword_analysis['hijacking_severity']
        
        # Normalize score (lower is better for hijacking)
        final_score = max(0, 1.0 - (total_hijacking_score / len(self.task_context.context_keywords)))
        
        return KeywordHijackingResult(
            score=final_score,
            hijacked_keywords=hijacked_keywords,
            total_context_keywords=len(self.task_context.context_keywords)
        )
    
    def _analyze_keyword_focus(self, keyword, response):
        """
        Analyze how much focus the agent is putting on a specific contextual keyword.
        """
        keyword_lower = keyword.lower()
        response_lower = response.lower()
        
        # Count direct mentions
        direct_mentions = len(re.findall(rf'\b{re.escape(keyword_lower)}\b', response_lower))
        
        # Count related terms and concepts
        related_terms = self._get_related_terms(keyword)
        related_mentions = sum(len(re.findall(rf'\b{re.escape(term)}\b', response_lower)) for term in related_terms)
        
        # Analyze sentence-level focus
        sentences = re.split(r'[.!?]+', response)
        keyword_sentences = [s for s in sentences if keyword_lower in s.lower() or any(term in s.lower() for term in related_terms)]
        
        total_sentences = len([s for s in sentences if s.strip()])
        keyword_sentence_ratio = len(keyword_sentences) / total_sentences if total_sentences > 0 else 0
        
        # Check for topic switching indicators
        hijacking_indicators = []
        
        # Pattern 1: Agent starts talking about the keyword as the main topic
        if re.search(rf'let.?s\s+(?:talk about|discuss|focus on)\s+(?:the\s+)?{re.escape(keyword_lower)}', response_lower):
            hijacking_indicators.append('explicit_topic_switch')
        
        # Pattern 2: Agent provides detailed information about the contextual keyword
        if keyword_sentence_ratio > 0.4 and total_sentences > 3:
            hijacking_indicators.append('excessive_detail_focus')
        
        # Pattern 3: Agent suggests actions related to the keyword instead of main goal
        action_patterns = [
            rf'(?:help|assist).*?(?:with|for).*?{re.escape(keyword_lower)}',
            rf'(?:plan|organize|prepare).*?{re.escape(keyword_lower)}',
            rf'{re.escape(keyword_lower)}.*?(?:strategy|planning|preparation)'
        ]
        
        for pattern in action_patterns:
            if re.search(pattern, response_lower):
                hijacking_indicators.append('action_redirection')
                break
        
        # Calculate hijacking severity
        hijacking_severity = 0
        if direct_mentions > 2: hijacking_severity += 0.3
        if keyword_sentence_ratio > 0.3: hijacking_severity += 0.4
        if len(hijacking_indicators) > 0: hijacking_severity += 0.5
        
        return {
            'direct_mentions': direct_mentions,
            'related_mentions': related_mentions,
            'focus_percentage': keyword_sentence_ratio * 100,
            'hijacking_indicators': hijacking_indicators,
            'hijacking_severity': min(hijacking_severity, 1.0),
            'is_hijacked': hijacking_severity > 0.4
        }
    
    def _get_related_terms(self, keyword):
        """
        Get terms related to a contextual keyword to detect broader focus drift.
        """
        related_terms_map = {
            'hackathon': ['event', 'competition', 'contest', 'participants', 'teams', 'judges', 'prizes', 'networking', 'presentation', 'pitch'],
            'competition': ['contest', 'rivals', 'competitors', 'judging', 'winners', 'prizes', 'ranking'],
            'deadline': ['timeline', 'schedule', 'due date', 'time management', 'urgency', 'calendar'],
            'conference': ['event', 'speakers', 'sessions', 'networking', 'attendees', 'schedule'],
            'workshop': ['training', 'learning', 'instructor', 'participants', 'hands-on']
        }
        
        return related_terms_map.get(keyword.lower(), [])
    
    def _detect_forbidden_switching(self, response):
        """
        Detect if agent is switching to topics that are known to be incorrect interpretations.
        """
        if not self.task_context.forbidden_switches:
            return ForbiddenSwitchingResult(score=1.0, detected_switches=[])
        
        detected_switches = []
        response_lower = response.lower()
        
        for forbidden_topic in self.task_context.forbidden_switches:
            topic_words = forbidden_topic.lower().split()
            
            # Check if multiple words from forbidden topic appear
            word_matches = sum(1 for word in topic_words if word in response_lower)
            match_ratio = word_matches / len(topic_words)
            
            if match_ratio > 0.5:  # More than half the words match
                detected_switches.append({
                    'topic': forbidden_topic,
                    'match_ratio': match_ratio,
                    'confidence': match_ratio
                })
        
        # Calculate score (lower is worse)
        score = 1.0 - (len(detected_switches) / len(self.task_context.forbidden_switches)) if detected_switches else 1.0
        
        return ForbiddenSwitchingResult(
            score=max(score, 0.0),
            detected_switches=detected_switches
        )
    
    def _check_domain_consistency(self, response):
        """
        Check if response stays within the expected domain.
        """
        response_domain = self._identify_domain(response)
        
        if response_domain == self.task_context.domain or response_domain == 'general':
            return DomainConsistencyResult(score=1.0, current_domain=response_domain, issues=[])
        else:
            return DomainConsistencyResult(
                score=0.3,
                current_domain=response_domain,
                expected_domain=self.task_context.domain,
                issues=[f"Domain drift from {self.task_context.domain} to {response_domain}"]
            )
    
    def _assess_response_relevance(self, response, user_input):
        """
        Assess overall relevance of response to user's input and established context.
        """
        if not user_input:
            return RelevanceResult(score=0.8, issues=[])  # Default if no user input
        
        # Simple relevance check - could be enhanced with more sophisticated NLP
        user_words = set(user_input.lower().split())
        response_words = set(response.lower().split())
        
        common_words = user_words.intersection(response_words)
        relevance_score = len(common_words) / len(user_words) if user_words else 0.5
        
        issues = []
        if relevance_score < 0.2:
            issues.append("Response seems unrelated to user input")
        
        return RelevanceResult(score=min(relevance_score, 1.0), issues=issues)
    
    def generate_intervention_strategy(self, coherence_analysis):
        """
        Generate intervention strategy based on coherence analysis.
        """
        if not coherence_analysis.needs_intervention:
            return None
        
        strategy = InterventionStrategy(
            severity=coherence_analysis.get_severity_level(),
            intervention_type=self._determine_intervention_type(coherence_analysis),
            user_notification=self._generate_user_notification(coherence_analysis),
            correction_prompt=self._generate_correction_prompt(coherence_analysis),
            preventive_measures=self._suggest_preventive_measures(coherence_analysis)
        )
        
        return strategy
    
    def _determine_intervention_type(self, analysis):
        """
        Determine the type of intervention needed.
        """
        if analysis.final_score < 0.3:
            return 'CRITICAL_CORRECTION'
        elif analysis.final_score < 0.6:
            return 'GUIDED_REDIRECTION'
        else:
            return 'GENTLE_REMINDER'
    
    def _generate_user_notification(self, analysis):
        """
        Generate user-friendly notification about the drift.
        """
        if analysis.keyword_hijacking.hijacked_keywords:
            hijacked = analysis.keyword_hijacking.hijacked_keywords[0]
            return f"🚨 Agent is focusing too much on '{hijacked['keyword']}' instead of your main task: '{self.task_context.primary_goal}'"
        elif analysis.forbidden_switching.detected_switches:
            switch = analysis.forbidden_switching.detected_switches[0]
            return f"⚠️ Agent is switching to '{switch['topic']}' instead of focusing on '{self.task_context.primary_goal}'"
        elif analysis.goal_alignment.score < 0.3:
            return f"📍 Agent lost track of your main goal: '{self.task_context.primary_goal}'"
        else:
            return f"🔄 Agent is drifting from the main task: '{self.task_context.primary_goal}'"
    
    def _generate_correction_prompt(self, analysis):
        """
        Generate a suggested correction prompt for the user.
        """
        base_prompt = f"Please refocus on {self.task_context.primary_goal}."
        
        if analysis.keyword_hijacking.hijacked_keywords:
            hijacked = analysis.keyword_hijacking.hijacked_keywords[0]
            return f"{base_prompt} I mentioned '{hijacked['keyword']}' as context, not as the main focus. Let's get back to working on {self.task_context.primary_goal}."
        elif analysis.forbidden_switching.detected_switches:
            return f"{base_prompt} I need help with the actual development work, not planning or organization."
        else:
            return f"{base_prompt} Please continue with the original requirements."
    
    def _suggest_preventive_measures(self, analysis):
        """
        Suggest preventive measures to avoid future drift.
        """
        measures = []
        
        if analysis.keyword_hijacking.hijacked_keywords:
            measures.append("Add explicit context separation in future prompts")
            measures.append("Use phrases like 'focus only on the development' to clarify intent")
        
        if analysis.goal_alignment.score < 0.5:
            measures.append("Restate the main goal periodically")
            measures.append("Ask agent to confirm understanding of the primary objective")
        
        return measures


# Data structures for analysis results
class TaskContext:
    def __init__(self, primary_goal, domain, context_keywords, forbidden_switches, establishment_timestamp):
        self.primary_goal = primary_goal
        self.domain = domain
        self.context_keywords = context_keywords
        self.forbidden_switches = forbidden_switches
        self.establishment_timestamp = establishment_timestamp

class ContextAnchor:
    def __init__(self, text, goal_strength, timestamp, anchor_type):
        self.text = text
        self.goal_strength = goal_strength
        self.timestamp = timestamp
        self.anchor_type = anchor_type

class CoherenceAnalysis:
    def __init__(self, primary_goal_alignment=None, context_keyword_hijacking=None, 
                 forbidden_topic_switching=None, domain_consistency=None, response_relevance=None):
        self.goal_alignment = primary_goal_alignment
        self.keyword_hijacking = context_keyword_hijacking
        self.forbidden_switching = forbidden_topic_switching
        self.domain_consistency = domain_consistency
        self.response_relevance = response_relevance
        self.final_score = 0.0
        self.needs_intervention = False
        self.issues = []
    
    def calculate_final_score(self):
        scores = []
        weights = []
        
        if self.goal_alignment:
            scores.append(self.goal_alignment.score)
            weights.append(0.4)  # Highest weight for goal alignment
        
        if self.keyword_hijacking:
            scores.append(self.keyword_hijacking.score)
            weights.append(0.3)  # High weight for keyword hijacking
        
        if self.forbidden_switching:
            scores.append(self.forbidden_switching.score)
            weights.append(0.2)
        
        if self.domain_consistency:
            scores.append(self.domain_consistency.score)
            weights.append(0.05)
        
        if self.response_relevance:
            scores.append(self.response_relevance.score)
            weights.append(0.05)
        
        if scores:
            self.final_score = sum(s * w for s, w in zip(scores, weights)) / sum(weights)
        
        # Collect all issues
        for component in [self.goal_alignment, self.keyword_hijacking, self.forbidden_switching, self.domain_consistency, self.response_relevance]:
            if component and hasattr(component, 'issues'):
                self.issues.extend(component.issues)
    
    def determine_intervention_needs(self, task_context):
        # Intervention thresholds
        critical_threshold = 0.3
        warning_threshold = 0.6
        
        if self.final_score < critical_threshold:
            self.needs_intervention = True
        elif self.final_score < warning_threshold:
            # Additional checks for borderline cases
            if self.keyword_hijacking and self.keyword_hijacking.hijacked_keywords:
                self.needs_intervention = True
            elif self.forbidden_switching and self.forbidden_switching.detected_switches:
                self.needs_intervention = True
    
    def get_severity_level(self):
        if self.final_score < 0.3:
            return 'CRITICAL'
        elif self.final_score < 0.6:
            return 'MODERATE'
        else:
            return 'LOW'

class GoalAlignmentResult:
    def __init__(self, score, issues, goal_coverage=0):
        self.score = score
        self.issues = issues
        self.goal_coverage = goal_coverage

class KeywordHijackingResult:
    def __init__(self, score, hijacked_keywords, total_context_keywords=0):
        self.score = score
        self.hijacked_keywords = hijacked_keywords
        self.total_context_keywords = total_context_keywords
        self.issues = [f"Keyword hijacking detected: {kw['keyword']}" for kw in hijacked_keywords]

class ForbiddenSwitchingResult:
    def __init__(self, score, detected_switches):
        self.score = score
        self.detected_switches = detected_switches
        self.issues = [f"Forbidden topic switch: {switch['topic']}" for switch in detected_switches]

class DomainConsistencyResult:
    def __init__(self, score, current_domain, expected_domain=None, issues=None):
        self.score = score
        self.current_domain = current_domain
        self.expected_domain = expected_domain
        self.issues = issues or []

class RelevanceResult:
    def __init__(self, score, issues):
        self.score = score
        self.issues = issues

class InterventionStrategy:
    def __init__(self, severity, intervention_type, user_notification, correction_prompt, preventive_measures):
        self.severity = severity
        self.intervention_type = intervention_type
        self.user_notification = user_notification
        self.correction_prompt = correction_prompt
        self.preventive_measures = preventive_measures


if __name__ == "__main__":
    # Example usage for the hackathon scenario
    engine = TaskCoherenceEngine()
    
    # User establishes context
    user_input = "I'm building a social media app for this hackathon"
    task_context = engine.initialize_task_context(user_input)
    
    print(f"Task Context Established:")
    print(f"Primary Goal: {task_context.primary_goal}")
    print(f"Domain: {task_context.domain}")
    print(f"Context Keywords: {task_context.context_keywords}")
    print(f"Forbidden Switches: {task_context.forbidden_switches}")
    
    # Simulate problematic agent response
    bad_response = """
    I'd be happy to help you with this hackathon! Let me start by helping you plan the event. 
    For a successful hackathon, you'll need to consider the venue, participant registration, 
    team formation activities, and judging criteria. We should also think about prizes 
    and networking opportunities for the participants.
    """
    
    analysis = engine.analyze_response_coherence(bad_response, user_input)
    print(f"\nCoherence Analysis:")
    print(f"Final Score: {analysis.final_score:.2f}")
    print(f"Needs Intervention: {analysis.needs_intervention}")
    print(f"Issues: {analysis.issues}")
    
    if analysis.needs_intervention:
        strategy = engine.generate_intervention_strategy(analysis)
        print(f"\nIntervention Strategy:")
        print(f"User Notification: {strategy.user_notification}")
        print(f"Correction Prompt: {strategy.correction_prompt}")
