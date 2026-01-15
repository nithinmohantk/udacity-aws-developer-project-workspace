# Performance & Reliability

Comprehensive guide to Service Level Indicators (SLIs), Service Level Objectives (SLOs), error budgets, and capacity planning for AWS applications.

## 📊 Overview

Performance and reliability are measured through:
1. **SLIs** - What we measure (metrics)
2. **SLOs** - Our targets for those metrics
3. **SLAs** - Contractual guarantees (external commitments)
4. **Error Budgets** - Acceptable failure rate
5. **Capacity Planning** - Ensuring resources meet demand

## 🎯 Service Level Indicators (SLIs)

### What Makes a Good SLI?

A good SLI is:
- **User-centric**: Measures user experience, not internal metrics
- **Measurable**: Can be quantified accurately
- **Actionable**: Can be improved through engineering work
- **Understandable**: Clear to both engineers and stakeholders

### Golden Signals as SLIs

#### 1. Availability SLI

**Definition:** Percentage of successful requests

```
Availability = (Successful Requests / Total Requests) × 100%

Successful = HTTP 200-399
Failed = HTTP 500-599, timeouts, network errors
```

**Measurement:**
```sql
-- CloudWatch Logs Insights query
fields @timestamp, status
| filter status >= 200 and status < 600
| stats 
    count(*) as total,
    sum(status >= 200 and status < 500) as successful
| extend availability = (successful / total) * 100
```

**Target SLI:** 99.9% (three nines)
- Allows 43.2 minutes downtime per month
- 8.76 hours downtime per year

#### 2. Latency SLI

**Definition:** Request response time at specific percentiles

```
Latency P50 = 50th percentile (median)
Latency P95 = 95th percentile
Latency P99 = 99th percentile
```

**Why percentiles matter:**
- **P50**: Typical user experience
- **P95**: Most users' experience (excludes outliers)
- **P99**: Worst case for 1% of requests

**Measurement:**
```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function trackLatency(operationName, durationMs) {
  await cloudwatch.putMetricData({
    Namespace: 'Udacity/Application',
    MetricData: [{
      MetricName: 'Latency',
      Value: durationMs,
      Unit: 'Milliseconds',
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Operation', Value: operationName }
      ]
    }]
  }).promise();
}
```

**Target SLIs:**
- P50 < 200ms
- P95 < 500ms
- P99 < 1000ms

#### 3. Error Rate SLI

**Definition:** Percentage of requests that result in errors

```
Error Rate = (Failed Requests / Total Requests) × 100%

Failed = HTTP 500-599 or application exceptions
```

**Measurement:**
```sql
fields @timestamp, status
| filter status >= 400
| stats 
    count(*) as total,
    sum(status >= 500) as server_errors,
    sum(status >= 400 and status < 500) as client_errors
| extend error_rate = (server_errors / total) * 100
```

**Target SLI:** < 0.1% error rate

#### 4. Throughput SLI

**Definition:** Successful requests per second

```
Throughput = Successful Requests / Time Period (seconds)
```

**Target SLI:** Sustain 1000 requests/second

### Service-Specific SLIs

#### Lambda Functions

```yaml
SLIs:
  Availability:
    Metric: (Invocations - Errors) / Invocations
    Target: 99.9%
    
  Latency:
    Metric: Duration P99
    Target: < 1000ms
    
  Throttle Rate:
    Metric: Throttles / Invocations
    Target: < 0.01%
    
  Cold Start Rate:
    Metric: Cold Starts / Invocations
    Target: < 1%
```

#### API Gateway

```yaml
SLIs:
  Availability:
    Metric: (Count - 5XXError) / Count
    Target: 99.95%
    
  Latency:
    Metric: Latency P95
    Target: < 500ms
    
  Cache Hit Rate:
    Metric: CacheHitCount / (CacheHitCount + CacheMissCount)
    Target: > 80%
```

#### DynamoDB

```yaml
SLIs:
  Read Availability:
    Metric: Successful Reads / Total Reads
    Target: 99.99%
    
  Write Availability:
    Metric: Successful Writes / Total Writes
    Target: 99.99%
    
  Read Latency:
    Metric: SuccessfulRequestLatency P99
    Target: < 10ms
    
  Throttle Rate:
    Metric: UserErrors / (SuccessfulRequests + UserErrors)
    Target: 0%
```

## 🎯 Service Level Objectives (SLOs)

### SLO Framework

```
SLO = SLI + Target + Time Window

Example:
"99.9% of requests will complete successfully over a rolling 30-day window"

Where:
- SLI: Request success rate
- Target: 99.9%
- Time Window: Rolling 30 days
```

### SLO Tiers

| Service Tier | Availability | Latency P95 | Error Budget | Use Case |
|--------------|--------------|-------------|--------------|----------|
| **Critical** | 99.95% | 200ms | 0.05% | User-facing APIs, authentication |
| **High** | 99.9% | 500ms | 0.1% | Core features, data access |
| **Standard** | 99.5% | 1000ms | 0.5% | Background jobs, analytics |
| **Low** | 99.0% | 2000ms | 1.0% | Internal tools, batch processes |

### Example SLOs by Service

#### User Authentication Service
```yaml
Service: user-authentication
Tier: Critical
SLOs:
  - Metric: Availability
    Target: 99.95%
    Window: 30 days
    Reason: Authentication is critical path for all user actions
    
  - Metric: Latency P95
    Target: 300ms
    Window: 30 days
    Reason: Login should feel instant to users
    
  - Metric: Error Rate
    Target: < 0.05%
    Window: 30 days
    Reason: Auth errors directly block user access
```

#### Document Upload Service
```yaml
Service: document-upload
Tier: High
SLOs:
  - Metric: Availability
    Target: 99.9%
    Window: 30 days
    Reason: Core feature but not blocking
    
  - Metric: Latency P99
    Target: 5000ms
    Window: 30 days
    Reason: Large file uploads take time, users understand wait
    
  - Metric: Success Rate (Complete Upload)
    Target: 99.5%
    Window: 30 days
    Reason: Some failures acceptable if retries work
```

#### Analytics Pipeline
```yaml
Service: analytics-pipeline
Tier: Standard
SLOs:
  - Metric: Processing Completion
    Target: 99.5%
    Window: 7 days
    Reason: Analytics can be eventually consistent
    
  - Metric: Processing Delay
    Target: < 1 hour
    Window: 7 days
    Reason: Near real-time analytics preferred but not critical
```

## 💰 Error Budgets

### What is an Error Budget?

```
Error Budget = 100% - SLO

If SLO is 99.9%, error budget is 0.1%

For 30 days with 1M requests:
- Error budget = 1,000 failed requests
- Or 43.2 minutes of downtime
```

### Error Budget Policy

#### When Error Budget is Healthy (>25% remaining)

✅ **Allowed:**
- Deploy new features
- Experiment with new tech
- Aggressive optimization
- Reduced testing in some cases

**Focus:** Innovation and velocity

#### When Error Budget is Low (<25% remaining)

⚠️ **Actions:**
- Increase testing rigor
- Require more thorough code review
- Focus on stability over features
- Delay risky deployments

**Focus:** Reliability improvements

#### When Error Budget is Exhausted (0% remaining)

🚫 **Mandatory:**
- Feature freeze (except reliability fixes)
- No non-critical deployments
- All hands on reliability
- Daily review meetings

**Focus:** Restore service health

### Error Budget Tracking

```javascript
// Calculate error budget consumption
function calculateErrorBudget(slo, windowDays) {
  // Get metrics from CloudWatch
  const totalRequests = getTotalRequests(windowDays);
  const failedRequests = getFailedRequests(windowDays);
  
  const actualAvailability = 
    ((totalRequests - failedRequests) / totalRequests) * 100;
  
  const allowedFailures = totalRequests * (1 - slo / 100);
  const remainingBudget = allowedFailures - failedRequests;
  const budgetPercent = (remainingBudget / allowedFailures) * 100;
  
  return {
    slo: slo,
    actual: actualAvailability.toFixed(3),
    totalRequests: totalRequests,
    failedRequests: failedRequests,
    allowedFailures: Math.floor(allowedFailures),
    remainingBudget: Math.floor(remainingBudget),
    budgetPercent: budgetPercent.toFixed(1),
    status: budgetPercent > 25 ? 'HEALTHY' : 
            budgetPercent > 0 ? 'WARNING' : 'EXHAUSTED'
  };
}

// Example output
{
  slo: 99.9,
  actual: "99.94",
  totalRequests: 1000000,
  failedRequests: 600,
  allowedFailures: 1000,
  remainingBudget: 400,
  budgetPercent: "40.0",
  status: "HEALTHY"
}
```

### Error Budget Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "Error Budget Remaining (30 days)",
        "metrics": [
          ["Udacity/SLO", "ErrorBudgetPercent", {"stat": "Average"}]
        ],
        "yAxis": {
          "left": {
            "min": 0,
            "max": 100
          }
        },
        "annotations": {
          "horizontal": [
            {
              "value": 25,
              "label": "Warning Threshold",
              "color": "#ff9900"
            },
            {
              "value": 0,
              "label": "Feature Freeze",
              "color": "#d13212"
            }
          ]
        }
      }
    }
  ]
}
```

## 📈 Capacity Planning

### Capacity Metrics

#### Current Capacity

```yaml
API Gateway:
  Current RPS: 450
  Throttle Limit: 1000 RPS
  Utilization: 45%
  
Lambda:
  Current Concurrent: 120
  Reserved Concurrent: 500
  Account Limit: 1000
  Utilization: 24% (reserved), 12% (account)
  
DynamoDB:
  Current Read Units: 450
  Provisioned Read Units: 1000
  Utilization: 45%
  Mode: On-Demand (auto-scaling)
```

#### Growth Projection

```
Current: 1M requests/day
Monthly Growth: 15%
Projection (6 months): 2.3M requests/day

Capacity Needed:
- API Gateway: 1,600 RPS (current: 1,000 RPS)
- Lambda: 800 concurrent (current: 500)
- DynamoDB: 2M RCU/day (current: on-demand)
```

### Capacity Planning Process

#### 1. Gather Data (Monthly)

```bash
# Get average and peak usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name ConcurrentExecutions \
  --dimensions Name=FunctionName,Value=udacity-api \
  --start-time $(date -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Average,Maximum
```

#### 2. Analyze Trends

```sql
-- CloudWatch Logs Insights: Calculate growth rate
fields @timestamp, request_count
| stats sum(request_count) as daily_requests by bin(1d)
| sort @timestamp asc
```

#### 3. Project Future Needs

```
Method 1: Linear Growth
Future = Current × (1 + growth_rate) ^ months

Method 2: Seasonal Adjustment
Future = Baseline × Seasonal_Factor

Method 3: Event-Based
Future = Current + Expected_Event_Traffic
```

#### 4. Add Buffer

```
Safety Buffer: 20-30% above projected need

If projection = 1600 RPS:
Provisioned = 1600 × 1.25 = 2000 RPS
```

#### 5. Set Alarms

```yaml
Capacity Alarms:
  - Name: High Lambda Concurrency
    Threshold: 80% of reserved
    Action: Alert team + auto-scale if possible
    
  - Name: API Gateway Throttling
    Threshold: Any throttles
    Action: Immediate alert
    
  - Name: DynamoDB Throttling
    Threshold: Any throttles
    Action: Immediate alert
```

### Scaling Strategies

#### Vertical Scaling (Scale Up)

```bash
# Increase Lambda memory (also increases CPU)
aws lambda update-function-configuration \
  --function-name udacity-api \
  --memory-size 2048

# Increase DynamoDB capacity
aws dynamodb update-table \
  --table-name UdacityTable \
  --provisioned-throughput ReadCapacityUnits=2000,WriteCapacityUnits=1000
```

#### Horizontal Scaling (Scale Out)

```bash
# Increase Lambda concurrency limit
aws lambda put-function-concurrency \
  --function-name udacity-api \
  --reserved-concurrent-executions 1000

# Add read replicas
aws dynamodb create-global-table \
  --global-table-name UdacityTable \
  --replication-group RegionName=us-west-2
```

#### Auto-Scaling

```yaml
Resources:
  DynamoDBAutoScaling:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 10000
      MinCapacity: 100
      ResourceId: table/UdacityTable
      RoleARN: !GetAtt ScalingRole.Arn
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb
      
  ScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyName: DynamoDB-ReadCapacity-ScalingPolicy
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref DynamoDBAutoScaling
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization
```

### Cost Optimization

```
Right-sizing Checklist:
- [ ] Lambda memory matches actual usage
- [ ] DynamoDB using on-demand vs provisioned appropriately
- [ ] API Gateway caching enabled for cacheable endpoints
- [ ] CloudFront caching configured
- [ ] Unused resources identified and terminated
- [ ] Reserved capacity for predictable workloads
- [ ] Savings Plans evaluated
```

## 📋 Monitoring SLOs

### SLO Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "SLO Compliance - Last 30 Days",
        "metrics": [
          ["Udacity/SLO", "Availability", {"stat": "Average"}],
          [".", "LatencyP95", {"stat": "Average"}],
          [".", "ErrorRate", {"stat": "Average"}]
        ],
        "annotations": {
          "horizontal": [
            {"value": 99.9, "label": "SLO Target", "color": "#2ca02c"}
          ]
        }
      }
    }
  ]
}
```

### Weekly SLO Review

**Agenda:**
1. Review current SLO compliance (15 min)
2. Analyze any SLO violations (15 min)
3. Review error budget status (10 min)
4. Discuss upcoming changes impacting reliability (10 min)
5. Review capacity planning (10 min)

**Attendees:**
- SRE team
- Engineering leads
- Product manager

## 🔗 Related Resources

- [SLO Definitions](./slos.md)
- [Error Budget Policy](./error-budget-policy.md)
- [Capacity Planning Template](./capacity-planning-template.md)
- [Google SRE Book - Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
