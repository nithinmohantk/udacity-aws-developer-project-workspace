# Incident Response Interview Questions

## 🟢 Beginner Level Questions

### 1. What is incident management and why is it important?
**Answer:**
**Incident Management** is the process of responding to, resolving, and learning from service disruptions.

**Key Components:**
- **Detection**: Identify when something goes wrong
- **Response**: Take immediate action to restore service
- **Resolution**: Fix the underlying problem
- **Post-mortem**: Learn and prevent future occurrences

**Importance:**
- Minimize service downtime
- Reduce business impact
- Improve customer experience
- Build system reliability
- Foster learning culture

### 2. What are the different severity levels for incidents?
**Answer:**
**Typical Severity Classification:**

| Severity | Impact | Response Time | Examples |
|----------|--------|---------------|----------|
| **P0/Critical** | Complete service outage | 15 minutes | Site down, payment system failure |
| **P1/High** | Major functionality impaired | 1 hour | Login issues, data corruption |
| **P2/Medium** | Minor functionality affected | 4 hours | Performance degradation, UI bugs |
| **P3/Low** | Cosmetic issues | 24 hours | Typos, minor visual glitches |

**Escalation Criteria:**
```yaml
Severity Criteria:
  P0:
    - Service completely unavailable
    - Security breach
    - Data loss
  P1:
    - Core functionality impaired
    - Affects >50% of users
    - Revenue impact >$10k/hour
  P2:
    - Non-core functionality affected
    - Affects <50% of users
    - Workaround available
```

### 3. What is the difference between an incident and a problem?
**Answer:**
**Incident**: Unplanned interruption or reduction in service quality
- Focus: Restore service quickly
- Timeline: Immediate response
- Example: Website is down

**Problem**: Root cause of one or more incidents
- Focus: Prevent future incidents
- Timeline: Longer investigation
- Example: Database server has faulty memory

**Service Request**: User request for information or access
- Focus: Fulfill request
- Timeline: Based on SLA
- Example: Password reset, access to new system

### 4. What is a runbook and why is it important?
**Answer:**
**Runbooks** are documented procedures for responding to specific incidents.

**Key Elements:**
- Symptoms and detection methods
- Step-by-step resolution procedures
- Escalation paths
- Contact information
- Related documentation

**Example Runbook Structure:**
```markdown
# High Memory Usage Alert

## Symptoms
- Memory utilization >85%
- Application response time >2s
- OOM killer activated

## Immediate Actions
1. Check memory usage: `free -h`
2. Identify memory hogs: `ps aux --sort=-%mem | head`
3. Review recent deployments
4. Scale horizontally if possible

## Escalation
- If memory >95%: Page on-call engineer
- If OOM events: Escalate to senior engineer
```

## 🟡 Intermediate Level Questions

### 5. How do you structure an incident response team?
**Answer:**

**Incident Response Roles:**

**Incident Commander (IC):**
- Overall responsibility for incident
- Coordinates response efforts
- Makes key decisions
- Communicates with stakeholders

**Technical Lead:**
- Leads technical investigation
- Coordinates with engineering teams
- Implements fixes
- Reports to IC

**Communications Manager:**
- Manages internal/external communications
- Updates status pages
- Coordinates with customer support
- Handles media relations

**Subject Matter Experts (SMEs):**
- Provide specialized knowledge
- Support technical investigation
- Implement specific fixes

**Example RACI Matrix:**
```
Role                | Declare | Investigate | Fix | Communicate
--------------------|---------|-------------|-----|-------------
Incident Commander  |    R    |      A      |  A  |      R
Technical Lead      |    C    |      R      |  R  |      C
Communications Mgr  |    C    |      C      |  C  |      R
SME                 |    I    |      R      |  R  |      I
```

### 6. What is the incident response lifecycle?
**Answer:**

**Incident Response Phases:**

1. **Detection and Analysis**
```bash
# Automated detection examples
# Monitor alerts
kubectl get events --sort-by='.lastTimestamp'

# Check application metrics
curl -s "http://prometheus:9090/api/v1/query?query=up" | jq

# Review logs
kubectl logs -f deployment/myapp --tail=100
```

2. **Containment and Mitigation**
```bash
# Immediate containment actions
# Scale up resources
kubectl scale deployment myapp --replicas=10

# Circuit breaker activation
curl -X POST "http://api/admin/circuit-breaker/enable"

# Traffic redirection
kubectl patch service myapp -p '{"spec":{"selector":{"version":"stable"}}}'
```

3. **Eradication and Recovery**
```bash
# Deploy fix
kubectl apply -f fix-deployment.yaml

# Verify fix
curl -s "http://api/health" | jq '.status'

# Gradual rollout
kubectl patch deployment myapp -p '{"spec":{"strategy":{"type":"RollingUpdate"}}}'
```

4. **Post-Incident Activities**
- Conduct blameless post-mortem
- Update documentation
- Implement preventive measures
- Share learnings

### 7. How do you conduct effective post-mortems?
**Answer:**

**Blameless Post-mortem Process:**

**Structure:**
```markdown
# Incident Post-mortem: [Service] Outage on [Date]

## Summary
- **Duration**: 2 hours 15 minutes
- **Impact**: 50% of users unable to login
- **Root Cause**: Database connection pool exhaustion

## Timeline
- 14:30 UTC: First user reports login issues
- 14:35 UTC: Monitoring alerts triggered
- 14:40 UTC: Incident declared (P1)
- 14:45 UTC: IC assigned, war room established
- 15:00 UTC: Root cause identified
- 15:30 UTC: Fix deployed to staging
- 16:00 UTC: Fix deployed to production
- 16:45 UTC: Incident resolved

## What Went Well
- Quick detection and alerting
- Effective team coordination
- Clear communication to users

## What Went Wrong
- Database monitoring insufficient
- No circuit breaker in place
- Deploy process took too long

## Action Items
1. [Owner: Jane] Implement circuit breaker by [Date]
2. [Owner: Bob] Add database connection monitoring
3. [Owner: Team] Review and update runbooks
```

**Key Principles:**
- Focus on systems, not individuals
- Encourage honest discussion
- Document thoroughly
- Follow up on action items
- Share learnings widely

### 8. How do you handle communication during incidents?
**Answer:**

**Communication Strategy:**

**Internal Communication:**
```bash
# Slack incident channel setup
/incident declare "Login service degraded" severity=P1

# Regular updates
/incident update "Investigating database connectivity issues"

# Resolution
/incident resolve "Fix deployed, monitoring recovery"
```

**External Communication:**
```markdown
# Status Page Update Template
**Investigating** - We are currently investigating reports of login issues.
Posted: 2:35 PM PST

**Identified** - We have identified the issue with our authentication service.
Posted: 2:45 PM PST

**Monitoring** - A fix has been deployed and we are monitoring the situation.
Posted: 3:30 PM PST

**Resolved** - The issue has been resolved and all services are operational.
Posted: 4:00 PM PST
```

**Communication Channels:**
- **Status page** for public updates
- **Email/SMS** for critical updates
- **Social media** for widespread issues
- **Internal chat** for team coordination

## 🔴 Advanced Level Questions

### 9. How do you implement chaos engineering for incident preparedness?
**Answer:**

**Chaos Engineering Implementation:**

**1. Chaos Testing Framework:**
```yaml
# Chaos Monkey experiment
apiVersion: chaostoolkit.org/v1
kind: ChaosToolkitExperiment
metadata:
  name: database-failure-experiment
spec:
  title: "Database Failure Impact"
  
  steady-state-hypothesis:
    title: "Application responds normally"
    probes:
    - name: "app-health-check"
      type: probe
      provider:
        type: http
        url: "http://myapp/health"
        timeout: 5
        
  method:
  - type: action
    name: "terminate-database-pod"
    provider:
      type: python
      module: chaosk8s.pod.actions
      func: terminate_pods
      arguments:
        label_selector: "app=database"
        qty: 1
        
  rollbacks:
  - type: action
    name: "restart-database"
    provider:
      type: python
      module: chaosk8s.pod.actions
      func: ensure_pods_running
```

**2. Game Day Exercises:**
```python
# Automated game day scenario
class GameDayScenario:
    def __init__(self, name, impact, duration):
        self.name = name
        self.impact = impact
        self.duration = duration
        
    def execute(self):
        """Execute chaos scenario and measure response"""
        start_time = time.time()
        
        # Inject failure
        self.inject_failure()
        
        # Monitor team response
        response_metrics = self.monitor_response()
        
        # Restore service
        self.restore_service()
        
        return {
            'scenario': self.name,
            'response_time': response_metrics.detection_time,
            'resolution_time': time.time() - start_time,
            'lessons_learned': self.capture_learnings()
        }

scenarios = [
    GameDayScenario("Database Failure", "high", "30m"),
    GameDayScenario("Network Partition", "medium", "15m"),
    GameDayScenario("Memory Leak", "low", "60m")
]
```

### 10. How do you design automated incident response?
**Answer:**

**Automated Response System:**

**1. Alert Routing and Escalation:**
```yaml
# PagerDuty integration
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
data:
  alertmanager.yml: |
    global:
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
      
    route:
      group_by: ['alertname']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'pagerduty-critical'
      routes:
      - match:
          severity: critical
        receiver: 'pagerduty-critical'
      - match:
          severity: warning
        receiver: 'slack-warnings'
        
    receivers:
    - name: 'pagerduty-critical'
      pagerduty_configs:
      - service_key: 'YOUR_SERVICE_KEY'
        description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
```

**2. Automated Remediation:**
```python
# AWS Lambda for auto-remediation
import boto3
import json

def lambda_handler(event, context):
    """Automated incident response"""
    
    # Parse CloudWatch alarm
    message = json.loads(event['Records'][0]['Sns']['Message'])
    
    if message['AlarmName'] == 'HighCPUUtilization':
        # Auto-scale EC2 instances
        autoscaling = boto3.client('autoscaling')
        autoscaling.set_desired_capacity(
            AutoScalingGroupName='web-servers-asg',
            DesiredCapacity=message['CurrentCapacity'] + 2,
            HonorCooldown=False
        )
        
    elif message['AlarmName'] == 'DatabaseConnectionsHigh':
        # Restart application servers
        ecs = boto3.client('ecs')
        ecs.update_service(
            cluster='production',
            service='web-service',
            forceNewDeployment=True
        )
        
    # Log action for audit
    cloudtrail = boto3.client('cloudtrail')
    cloudtrail.put_events(
        Records=[{
            'EventTime': datetime.utcnow(),
            'EventName': 'AutomatedRemediation',
            'EventSource': 'incident-response-system',
            'Resources': [message['AlarmName']],
            'CloudTrailEvent': json.dumps({
                'action': 'automated_remediation',
                'alarm': message['AlarmName'],
                'response': 'success'
            })
        }]
    )
    
    return {'statusCode': 200}
```

**3. Intelligent Alert Correlation:**
```python
# Alert correlation engine
class AlertCorrelationEngine:
    def __init__(self):
        self.alert_patterns = {}
        self.machine_learning_model = self.load_ml_model()
        
    def correlate_alerts(self, alerts):
        """Correlate related alerts to reduce noise"""
        
        # Group alerts by service and time window
        grouped_alerts = self.group_alerts_by_service(alerts)
        
        # Apply ML model to identify patterns
        correlated_incidents = []
        for service, service_alerts in grouped_alerts.items():
            if len(service_alerts) > 3:  # Multiple alerts for same service
                # Use ML to determine if alerts are related
                correlation_score = self.machine_learning_model.predict(
                    [self.extract_features(service_alerts)]
                )[0]
                
                if correlation_score > 0.8:
                    # Create single incident for correlated alerts
                    correlated_incidents.append({
                        'incident_id': str(uuid.uuid4()),
                        'service': service,
                        'alerts': service_alerts,
                        'correlation_score': correlation_score,
                        'probable_cause': self.predict_root_cause(service_alerts)
                    })
        
        return correlated_incidents
```

### 11. How do you measure and improve incident response effectiveness?
**Answer:**

**Key Metrics and KPIs:**

**1. Response Time Metrics:**
```python
# Incident metrics tracking
class IncidentMetrics:
    def __init__(self):
        self.metrics_db = MetricsDatabase()
        
    def calculate_mttr(self, time_period='30d'):
        """Mean Time To Recovery"""
        incidents = self.metrics_db.get_incidents(time_period)
        total_resolution_time = sum(
            i.resolved_at - i.created_at for i in incidents
        )
        return total_resolution_time / len(incidents)
        
    def calculate_mttd(self, time_period='30d'):
        """Mean Time To Detection"""
        incidents = self.metrics_db.get_incidents(time_period)
        total_detection_time = sum(
            i.detected_at - i.occurred_at for i in incidents
        )
        return total_detection_time / len(incidents)
        
    def calculate_mtbf(self, time_period='30d'):
        """Mean Time Between Failures"""
        incidents = self.metrics_db.get_incidents(time_period)
        if len(incidents) <= 1:
            return float('inf')
            
        intervals = [
            incidents[i+1].occurred_at - incidents[i].resolved_at
            for i in range(len(incidents)-1)
        ]
        return sum(intervals) / len(intervals)
```

**2. SLA/SLO Tracking:**
```yaml
# Service Level Objectives
SLOs:
  incident_response:
    P0_response_time:
      target: 15_minutes
      measurement: time_to_first_response
    
    P1_resolution_time:
      target: 4_hours
      measurement: time_to_resolution
      
    availability:
      target: 99.9%
      measurement: uptime_percentage
      window: monthly
      
  escalation_effectiveness:
    false_positive_rate:
      target: <5%
      measurement: alerts_without_incidents / total_alerts
```

**3. Continuous Improvement Process:**
```python
# Post-incident analysis automation
class PostIncidentAnalysis:
    def analyze_incident(self, incident_id):
        incident = self.get_incident(incident_id)
        
        analysis = {
            'pattern_recognition': self.identify_patterns(incident),
            'root_cause_categories': self.categorize_root_cause(incident),
            'prevention_opportunities': self.suggest_preventions(incident),
            'process_improvements': self.suggest_process_improvements(incident),
            'tooling_gaps': self.identify_tooling_gaps(incident)
        }
        
        # Generate actionable recommendations
        recommendations = self.generate_recommendations(analysis)
        
        # Create tracking items
        for rec in recommendations:
            self.create_improvement_task(rec)
            
        return analysis, recommendations
        
    def identify_patterns(self, incident):
        """Use ML to identify recurring patterns"""
        similar_incidents = self.find_similar_incidents(incident)
        
        if len(similar_incidents) >= 3:
            return {
                'pattern_type': 'recurring_issue',
                'frequency': len(similar_incidents),
                'common_factors': self.extract_common_factors(similar_incidents)
            }
        
        return {'pattern_type': 'isolated_incident'}
```

## 🛠️ Incident Response Tools

### Monitoring and Alerting
```bash
# Prometheus alerts for incidents
groups:
- name: incident.rules
  rules:
  - alert: ServiceDown
    expr: up == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Service {{ $labels.instance }} is down"
      runbook_url: "https://runbooks.company.com/service-down"

  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      description: "Error rate is {{ $value }} errors per second"
```

### Communication Tools
```bash
# Slack incident bot
/incident declare "Database connectivity issues" severity=P1 service=user-api

# StatusPage automation
curl -X POST "https://api.statuspage.io/v1/pages/PAGE_ID/incidents" \
  -H "Authorization: OAuth YOUR_API_KEY" \
  -d '{
    "incident": {
      "name": "Database Connectivity Issues",
      "status": "investigating",
      "impact_override": "major"
    }
  }'
```

### Automation Platforms
```bash
# AWS Systems Manager for automated responses
aws ssm send-command \
  --document-name "RestartService" \
  --parameters service=nginx \
  --targets Key=tag:Role,Values=webserver

# Ansible for configuration remediation
ansible-playbook -i inventory remediation.yml --extra-vars "service=nginx"
```

## 🔗 Real-world Examples

Incident response practices in this repository:
- [CI/CD Pipeline Failures](../../.github/workflows/)
- [Container Restart Scenarios](../../project/c2-microservices-v1/)
- [Monitoring and Alerting Setup](../../project/)

## 📚 Additional Resources

- [Google SRE Workbook - Incident Response](https://sre.google/workbook/incident-response/)
- [NIST Incident Handling Guide](https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final)
- [PagerDuty Incident Response Guide](https://response.pagerduty.com/)
- [Atlassian Incident Management](https://www.atlassian.com/incident-management)