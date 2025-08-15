# Monitoring and Observability Interview Questions

## 🟢 Beginner Level Questions

### 1. What is the difference between monitoring and observability?
**Answer:**

**Monitoring:**
- Watching known failure modes
- Predefined metrics and alerts
- Reactive approach
- Answers "What is happening?"

**Observability:**
- Understanding system behavior from outputs
- Ability to debug unknown problems
- Proactive approach
- Answers "Why is this happening?"

**Three Pillars of Observability:**
1. **Metrics**: Numerical data over time
2. **Logs**: Discrete events with context
3. **Traces**: Request flow through distributed systems

### 2. What are the key metrics to monitor in a web application?
**Answer:**

**Application Metrics:**
- **Response Time**: How fast requests are processed
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Availability**: Uptime percentage

**Infrastructure Metrics:**
- **CPU Utilization**: Processor usage
- **Memory Usage**: RAM consumption
- **Disk I/O**: Read/write operations
- **Network I/O**: Bandwidth utilization

**Business Metrics:**
- **User Activity**: Active users, sessions
- **Conversion Rate**: Business goal completion
- **Revenue Impact**: Financial indicators

### 3. What is an SLA, SLO, and SLI?
**Answer:**

**SLI (Service Level Indicator):**
- Quantitative measure of service quality
- Example: API response time, error rate

**SLO (Service Level Objective):**
- Target value for SLI
- Example: 99.9% availability, <200ms response time

**SLA (Service Level Agreement):**
- Business contract with consequences
- Example: 99.9% uptime or customer gets refund

**Example:**
```
SLI: HTTP request success rate
SLO: 99.9% of requests succeed (measured monthly)
SLA: 99.5% uptime or 10% service credit
```

### 4. How do you set up effective alerting?
**Answer:**

**Alerting Best Practices:**
1. **Alert on symptoms, not causes**
2. **Reduce alert fatigue**
3. **Make alerts actionable**
4. **Use severity levels**
5. **Set appropriate thresholds**

**Example Alert Rules:**
```yaml
# Prometheus alerting rules
groups:
- name: application.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} requests/sec"

  - alert: HighLatency
    expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected"
```

## 🟡 Intermediate Level Questions

### 5. Design a comprehensive monitoring stack for a microservices application
**Answer:**

**Monitoring Architecture:**
```
┌─────────────────────────────────────────────────┐
│                Applications                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │Service A│  │Service B│  │Service C│         │
│  └─────────┘  └─────────┘  └─────────┘         │
└─────────────────┬─────────────┬─────────────────┘
                  │             │
          ┌───────▼─────────────▼─────────┐
          │         Data Collection       │
          │  ┌─────────┐  ┌─────────┐     │
          │  │ Metrics │  │  Logs   │     │
          │  │(Prom.)  │  │(Fluent) │     │
          │  └─────────┘  └─────────┘     │
          │  ┌─────────┐                  │
          │  │ Traces  │                  │
          │  │(Jaeger) │                  │
          │  └─────────┘                  │
          └─────────────┬───────────────────┘
                        │
          ┌─────────────▼───────────────────┐
          │       Storage & Analysis        │
          │  ┌─────────┐  ┌─────────┐       │
          │  │Prometheus│  │Elasticsearch│   │
          │  │   TSDB   │  │     ELK     │   │
          │  └─────────┘  └─────────┘       │
          └─────────────┬───────────────────┘
                        │
          ┌─────────────▼───────────────────┐
          │     Visualization & Alerts      │
          │  ┌─────────┐  ┌─────────┐       │
          │  │ Grafana │  │AlertMgr │       │
          │  │Dashboard│  │ Pager   │       │
          │  └─────────┘  └─────────┘       │
          └─────────────────────────────────┘
```

**Implementation:**
```yaml
# Docker Compose monitoring stack
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"
      - "14268:14268"

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
```

### 6. How do you implement distributed tracing in microservices?
**Answer:**

**Distributed Tracing Concepts:**
- **Trace**: Complete request journey
- **Span**: Individual operation within trace
- **Context Propagation**: Passing trace info between services

**Implementation with OpenTelemetry:**
```javascript
// Node.js microservice instrumentation
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://jaeger:14268/api/traces',
});

const sdk = new NodeSDK({
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'user-service',
});

sdk.start();

// Application code
const express = require('express');
const app = express();

app.get('/users/:id', async (req, res) => {
  const trace = require('@opentelemetry/api').trace;
  const span = trace.getActiveSpan();
  
  span.setAttributes({
    'user.id': req.params.id,
    'operation': 'get_user'
  });
  
  try {
    const user = await getUserFromDatabase(req.params.id);
    span.setStatus({ code: trace.SpanStatusCode.OK });
    res.json(user);
  } catch (error) {
    span.setStatus({
      code: trace.SpanStatusCode.ERROR,
      message: error.message
    });
    res.status(500).json({ error: error.message });
  }
});
```

**Service Map Visualization:**
```
Frontend → API Gateway → User Service → Database
    ↓           ↓            ↓            ↓
  100ms       50ms         30ms        20ms
   2%          1%           0%          0%
```

### 7. What is the USE method and RED method for monitoring?
**Answer:**

**USE Method (Infrastructure):**
- **Utilization**: % time resource was busy
- **Saturation**: Amount of queued work
- **Errors**: Count of error events

**RED Method (Applications):**
- **Rate**: Requests per second
- **Errors**: Number of failed requests
- **Duration**: Time to process requests

**Implementation:**
```yaml
# Prometheus queries for USE method
# CPU Utilization
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memory Utilization
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disk Saturation
node_disk_io_time_seconds_total

# RED method queries
# Rate
rate(http_requests_total[5m])

# Errors
rate(http_requests_total{status=~"5.."}[5m])

# Duration
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### 8. How do you monitor Kubernetes clusters effectively?
**Answer:**

**Kubernetes Monitoring Stack:**
```yaml
# Prometheus configuration for Kubernetes
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    
    rule_files:
      - "k8s.rules"
    
    scrape_configs:
    - job_name: 'kubernetes-apiservers'
      kubernetes_sd_configs:
      - role: endpoints
      scheme: https
      tls_config:
        ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
      bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
      
    - job_name: 'kubernetes-nodes'
      kubernetes_sd_configs:
      - role: node
      
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
```

**Key Kubernetes Metrics:**
```yaml
# Resource utilization
kube_pod_container_resource_requests_cpu_cores
kube_pod_container_resource_limits_memory_bytes

# Pod health
kube_pod_status_phase{phase="Running"}
kube_pod_container_status_restarts_total

# Node status
kube_node_status_condition{condition="Ready"}
kube_node_status_allocatable_cpu_cores
```

## 🔴 Advanced Level Questions

### 9. How do you implement chaos engineering and observability?
**Answer:**

**Chaos Engineering with Monitoring:**
```yaml
# Chaos Monkey experiment
apiVersion: chaostoolkit.org/v1
kind: ChaosToolkitExperiment
metadata:
  name: pod-failure-experiment
spec:
  title: "Pod Failure Impact Analysis"
  
  steady-state-hypothesis:
    title: "Application is healthy"
    probes:
    - name: "application-available"
      type: probe
      provider:
        type: http
        url: "http://myapp/health"
        timeout: 5
        
  method:
  - type: action
    name: "terminate-random-pod"
    provider:
      type: python
      module: chaosk8s.pod.actions
      func: terminate_pods
      arguments:
        label_selector: "app=myapp"
        rand: true
        qty: 1
        
  rollbacks:
  - type: action
    name: "ensure-pods-running"
    provider:
      type: python
      module: chaosk8s.pod.actions
      func: ensure_pods_running
```

**Observability During Chaos:**
```javascript
// Automated chaos testing with monitoring
const chaosMonitor = {
  async runExperiment(experiment) {
    const startTime = Date.now();
    
    // Capture baseline metrics
    const baseline = await this.captureMetrics();
    
    // Execute chaos experiment
    await experiment.execute();
    
    // Monitor during experiment
    const results = await this.monitorDuringChaos(startTime);
    
    // Generate report
    return this.generateChaosReport(baseline, results);
  },
  
  async captureMetrics() {
    return {
      errorRate: await prometheus.query('rate(http_requests_total{status=~"5.."}[5m])'),
      latency: await prometheus.query('histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))'),
      availability: await prometheus.query('up')
    };
  }
};
```

### 10. Design an SLI/SLO framework for a complex system
**Answer:**

**SLI/SLO Framework:**
```yaml
# Service Level Objectives Configuration
services:
  user-api:
    slis:
      availability:
        query: 'rate(http_requests_total{job="user-api"}[5m]) > 0'
        objective: 99.9%
        window: 30d
        
      latency:
        query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="user-api"}[5m]))'
        threshold: 0.1  # 100ms
        objective: 99.0%
        window: 30d
        
      error_rate:
        query: 'rate(http_requests_total{job="user-api",status=~"5.."}[5m]) / rate(http_requests_total{job="user-api"}[5m])'
        threshold: 0.01  # 1%
        objective: 99.9%
        window: 30d

  payment-service:
    slis:
      availability:
        query: 'up{job="payment-service"}'
        objective: 99.95%
        window: 30d
        
      transaction_success:
        query: 'rate(payment_transactions_total{status="success"}[5m]) / rate(payment_transactions_total[5m])'
        objective: 99.99%
        window: 30d
```

**Error Budget Implementation:**
```python
# Error budget calculation and alerting
class ErrorBudgetMonitor:
    def __init__(self, slo_config):
        self.slo_config = slo_config
        self.prometheus = PrometheusClient()
    
    def calculate_error_budget(self, service, window="30d"):
        slo = self.slo_config[service]
        
        # Calculate current SLI performance
        current_sli = self.prometheus.query(slo['availability']['query'])
        
        # Calculate error budget
        target_slo = slo['availability']['objective']
        error_budget = 1 - target_slo
        
        # Calculate burn rate
        current_error_rate = 1 - current_sli
        burn_rate = current_error_rate / error_budget
        
        return {
            'service': service,
            'error_budget_remaining': max(0, error_budget - current_error_rate),
            'burn_rate': burn_rate,
            'alert_needed': burn_rate > 2.0  # Alert if burning budget 2x faster
        }
    
    def generate_error_budget_report(self):
        report = {}
        for service in self.slo_config.keys():
            report[service] = self.calculate_error_budget(service)
        return report
```

### 11. How do you implement observability in serverless architectures?
**Answer:**

**Serverless Observability Challenges:**
- Cold starts and function lifecycle
- Distributed tracing across functions
- Cost optimization vs. observability
- Vendor-specific monitoring tools

**AWS Lambda Observability:**
```python
# AWS Lambda with X-Ray tracing
import json
import boto3
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK
patch_all()

@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    # Custom subsegment for business logic
    subsegment = xray_recorder.begin_subsegment('process_user_data')
    
    try:
        user_id = event['user_id']
        
        # Add metadata to trace
        subsegment.put_metadata('user_id', user_id)
        subsegment.put_annotation('function_version', context.function_version)
        
        # Process user data
        result = process_user(user_id)
        
        # Custom metrics
        cloudwatch = boto3.client('cloudwatch')
        cloudwatch.put_metric_data(
            Namespace='MyApp/Lambda',
            MetricData=[
                {
                    'MetricName': 'ProcessedUsers',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {
                            'Name': 'FunctionName',
                            'Value': context.function_name
                        }
                    ]
                }
            ]
        )
        
        xray_recorder.end_subsegment()
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
        
    except Exception as e:
        xray_recorder.end_subsegment()
        raise e
```

**Serverless Monitoring Stack:**
```yaml
# Serverless Framework monitoring
service: serverless-monitoring

provider:
  name: aws
  runtime: python3.9
  tracing:
    lambda: true
    apiGateway: true
  environment:
    DD_TRACE_ENABLED: true
    DD_SERVICE: my-serverless-app

plugins:
  - serverless-plugin-datadog

custom:
  datadog:
    forwarder: arn:aws:lambda:us-east-1:123456789012:function:datadog-forwarder
    enableXrayTracing: true
    enableDDTracing: true

functions:
  processUser:
    handler: handler.process_user
    events:
      - http:
          path: /users/{id}
          method: get
    alarms:
      - functionErrors
      - functionDuration
```

## 🛠️ Monitoring Tools and Technologies

### Time Series Databases
```bash
# Prometheus - Open source monitoring
prometheus --config.file=prometheus.yml

# InfluxDB - Time series database
influx write -b mybucket -o myorg 'cpu,host=server01 usage=0.64'

# Victoria Metrics - High-performance TSDB
victoria-metrics-prod -storageDataPath=/var/lib/victoria-metrics
```

### Log Management
```bash
# ELK Stack
elasticsearch & 
logstash -f logstash.conf &
kibana &

# Fluentd for log collection
fluentd -c fluent.conf

# Loki for log aggregation
loki -config.file=loki.yml
```

### APM Solutions
```bash
# Datadog APM
DD_TRACE_ENABLED=true node app.js

# New Relic
NEW_RELIC_APP_NAME="My App" node app.js

# Dynatrace OneAgent
wget -O Dynatrace-OneAgent.sh "https://your-environment.live.dynatrace.com/installer"
```

## 🔗 Real-world Examples

Monitoring implementations in this repository:
- [CI/CD Pipeline Monitoring](../../.github/workflows/)
- [Application Monitoring Setup](../../project/c2-microservices-v1/)
- [Serverless Monitoring](../../project/c4-serverless-app/)

## 📊 Sample Dashboards

Create comprehensive monitoring dashboards:
- **Infrastructure**: CPU, Memory, Disk, Network
- **Application**: Response time, Throughput, Errors
- **Business**: User activity, Conversion rates
- **Security**: Failed logins, Anomalies

## 📚 Additional Resources

- [SRE Workbook](https://sre.google/workbook/table-of-contents/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [OpenTelemetry](https://opentelemetry.io/)
- [Grafana Tutorials](https://grafana.com/tutorials/)