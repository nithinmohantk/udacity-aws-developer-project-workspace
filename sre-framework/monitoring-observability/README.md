# Monitoring & Observability

Comprehensive monitoring and observability strategy for AWS applications in the Udacity developer workspace.

## 📊 Overview

This guide covers the four pillars of observability:
1. **Metrics** - Quantitative measurements of system behavior
2. **Logs** - Discrete events with context
3. **Traces** - Request flow through distributed systems
4. **Alerts** - Automated notifications for anomalies

## 🎯 Metrics Strategy

### Application Metrics

#### Lambda Functions
```javascript
// Enhanced metrics for Lambda functions
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function publishMetric(metricName, value, unit = 'Count') {
  const params = {
    Namespace: 'Udacity/Lambda',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'FunctionName', Value: process.env.AWS_LAMBDA_FUNCTION_NAME },
        { Name: 'Environment', Value: process.env.ENVIRONMENT || 'dev' }
      ]
    }]
  };
  
  await cloudwatch.putMetricData(params).promise();
}

// Usage examples
await publishMetric('BusinessTransactionSuccess', 1);
await publishMetric('ProcessingTime', 150, 'Milliseconds');
await publishMetric('ItemsProcessed', 42, 'Count');
```

#### API Gateway Metrics
```yaml
# CloudFormation template for API Gateway metrics
Resources:
  ApiGateway:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: UdacityAPI
      
  ApiStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      RestApiId: !Ref ApiGateway
      StageName: prod
      MetricsEnabled: true
      DataTraceEnabled: true
      TracingEnabled: true # Enable X-Ray
```

### Key Metrics to Track

#### Golden Signals
1. **Latency** - Response time distribution
   - P50, P95, P99 percentiles
   - Target: P95 < 500ms, P99 < 1000ms

2. **Traffic** - Request rate
   - Requests per second
   - Concurrent executions

3. **Errors** - Error rate
   - 4xx errors (client errors)
   - 5xx errors (server errors)
   - Target: < 0.1% error rate

4. **Saturation** - Resource utilization
   - Lambda concurrent executions
   - DynamoDB consumed capacity
   - API Gateway throttles

### CloudWatch Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
          [".", "Errors", {"stat": "Sum"}],
          [".", "Duration", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda Performance"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApiGateway", "Count", {"stat": "Sum"}],
          [".", "4XXError", {"stat": "Sum"}],
          [".", "5XXError", {"stat": "Sum"}],
          [".", "Latency", {"stat": "Average"}]
        ],
        "period": 300,
        "region": "us-east-1",
        "title": "API Gateway Metrics"
      }
    }
  ]
}
```

## 📝 Logging Strategy

### Structured Logging

```javascript
// Structured logging wrapper
const logLevels = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(context) {
    this.context = context;
    this.minLevel = logLevels[process.env.LOG_LEVEL || 'INFO'];
  }
  
  log(level, message, metadata = {}) {
    if (logLevels[level] < this.minLevel) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      ...metadata,
      requestId: process.env.AWS_REQUEST_ID,
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME
    };
    
    console.log(JSON.stringify(logEntry));
  }
  
  debug(message, metadata) { this.log('DEBUG', message, metadata); }
  info(message, metadata) { this.log('INFO', message, metadata); }
  warn(message, metadata) { this.log('WARN', message, metadata); }
  error(message, metadata) { this.log('ERROR', message, metadata); }
}

// Usage
const logger = new Logger('UserService');
logger.info('User created', { userId: '123', email: 'user@example.com' });
logger.error('Database connection failed', { error: err.message, retries: 3 });
```

### Log Groups Organization

```
/aws/lambda/udacity-user-service-dev
/aws/lambda/udacity-user-service-prod
/aws/apigateway/udacity-api-dev
/aws/apigateway/udacity-api-prod
/aws/ecs/udacity-microservice-dev
/aws/ecs/udacity-microservice-prod
```

### Log Retention Policy

| Environment | Retention Period | Reason |
|-------------|------------------|--------|
| Development | 7 days | Cost optimization |
| Staging | 30 days | Testing validation |
| Production | 90 days | Compliance & debugging |

### CloudWatch Logs Insights Queries

```sql
-- Find all errors in the last hour
fields @timestamp, @message, level, context
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

-- Calculate average duration by function
fields @timestamp, functionName, duration
| stats avg(duration) as avgDuration by functionName

-- Find slow requests (> 1 second)
fields @timestamp, @message, requestId, duration
| filter duration > 1000
| sort duration desc

-- Error rate by endpoint
fields @timestamp, endpoint, status
| filter status >= 400
| stats count(*) as errorCount by endpoint
```

## 🔍 Distributed Tracing

### AWS X-Ray Integration

```javascript
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
const https = AWSXRay.captureHTTPs(require('https'));

// Lambda handler with X-Ray
exports.handler = async (event, context) => {
  const segment = AWSXRay.getSegment();
  const subsegment = segment.addNewSubsegment('BusinessLogic');
  
  try {
    // Add annotations (indexed for filtering)
    subsegment.addAnnotation('userId', event.userId);
    subsegment.addAnnotation('operation', 'createOrder');
    
    // Add metadata (not indexed, for details)
    subsegment.addMetadata('orderDetails', {
      items: event.items,
      total: event.total
    });
    
    // Your business logic here
    const result = await processOrder(event);
    
    subsegment.close();
    return result;
  } catch (error) {
    subsegment.addError(error);
    subsegment.close();
    throw error;
  }
};

// Tracing external HTTP calls
async function callExternalAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}
```

### X-Ray Service Map

X-Ray automatically creates a service map showing:
- API Gateway → Lambda → DynamoDB
- Lambda → External APIs
- Request counts and error rates
- Latency distribution

## 🚨 Alerting Strategy

### CloudWatch Alarms

```yaml
# High error rate alarm
Resources:
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Lambda-HighErrorRate
      AlarmDescription: Alert when error rate exceeds 1%
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref AlertSNSTopic
      Dimensions:
        - Name: FunctionName
          Value: !Ref MyLambdaFunction

  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Lambda-HighLatency
      AlarmDescription: Alert when P99 latency exceeds 1 second
      MetricName: Duration
      Namespace: AWS/Lambda
      ExtendedStatistic: p99
      Period: 300
      EvaluationPeriods: 2
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertSNSTopic

  DynamoDBThrottleAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: DynamoDB-Throttling
      AlarmDescription: Alert on DynamoDB throttling
      MetricName: UserErrors
      Namespace: AWS/DynamoDB
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertSNSTopic

  AlertSNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: SRE-Alerts
      Subscription:
        - Endpoint: sre-team@example.com
          Protocol: email
        - Endpoint: !GetAtt AlertLambda.Arn
          Protocol: lambda
```

### Alert Severity Levels

| Severity | Response Time | Notification | Examples |
|----------|--------------|--------------|----------|
| P0 - Critical | Immediate | PagerDuty, SMS, Phone | Complete service outage, data loss |
| P1 - High | 15 minutes | PagerDuty, Email | Elevated error rates, major feature down |
| P2 - Medium | 1 hour | Email, Slack | Performance degradation, minor errors |
| P3 - Low | Next business day | Email | Warnings, capacity approaching limits |

### Alerting Best Practices

1. **Alert on symptoms, not causes**
   - ✅ "Error rate > 1%" 
   - ❌ "CPU > 80%"

2. **Make alerts actionable**
   - Include runbook links
   - Provide context (affected users, time range)
   - Add quick remediation steps

3. **Avoid alert fatigue**
   - Set appropriate thresholds
   - Use composite alarms
   - Implement maintenance windows

4. **Test your alerts**
   - Regular fire drills
   - Verify notification delivery
   - Validate escalation paths

## 📈 Observability Checklist

- [ ] All Lambda functions emit custom metrics
- [ ] Structured logging implemented across all services
- [ ] X-Ray tracing enabled for all APIs
- [ ] CloudWatch dashboards created for each service
- [ ] Alarms configured for golden signals
- [ ] SNS topics configured for alert routing
- [ ] Runbooks linked from alarm descriptions
- [ ] Log retention policies set appropriately
- [ ] Cost alarms configured for monitoring spend
- [ ] Regular review of metrics and logs

## 🔗 Related Resources

- [CloudWatch Logs Insights Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- [X-Ray SDK for Node.js](https://docs.aws.amazon.com/xray/latest/devguide/xray-sdk-nodejs.html)
- [CloudWatch Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html)
- [Existing HTTP Metrics Demo](../../exercises/c4-demos-master/05-http-metrics)
