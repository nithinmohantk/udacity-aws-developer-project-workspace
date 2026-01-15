# Automation & Toil Reduction

Strategies and tools for eliminating manual work, automating operations, and building self-healing systems.

## 📊 Understanding Toil

### What is Toil?

Toil is operational work that is:
- **Manual** - Requires human intervention
- **Repetitive** - Done over and over
- **Automatable** - Can be automated
- **Tactical** - Reactive rather than proactive
- **No lasting value** - Doesn't improve the system
- **Scales linearly** - Grows with service size

### Toil vs. Overhead

| Toil | Legitimate Overhead |
|------|---------------------|
| Manually restarting failed services | Incident response and investigation |
| Copying data between environments | Architecture design discussions |
| Running deployment scripts manually | Code reviews |
| Manually provisioning resources | Capacity planning |
| Resetting user passwords | Writing postmortems |

### Toil Budget

**Target:** <50% of SRE time on toil

If team spends >50% on toil:
1. Identify top sources of toil
2. Prioritize automation projects
3. Consider staffing adjustments
4. Review service architecture

## 🎯 Identifying Toil

### Toil Audit Process

#### 1. Track All Operational Tasks (1 Week)

```markdown
| Date | Task | Duration | Frequency | Could Automate? |
|------|------|----------|-----------|-----------------|
| Mon | Restart Lambda | 5 min | 2x/week | Yes |
| Mon | Check logs for errors | 15 min | Daily | Yes |
| Mon | Deploy to staging | 10 min | 3x/week | Yes |
| Tue | Respond to incident | 2 hours | 1x/month | Partial |
| Tue | Scale DynamoDB | 5 min | 1x/week | Yes |
| Wed | Update SSL certificate | 30 min | 1x/quarter | Yes |
```

#### 2. Calculate Toil Impact

```
Weekly Time on Toil = Sum of (Task Duration × Weekly Frequency)

Example:
- Restart Lambda: 5 min × 1 = 5 min/week
- Check logs: 15 min × 7 = 105 min/week
- Deploy staging: 10 min × 3 = 30 min/week
- Scale DynamoDB: 5 min × 1 = 5 min/week

Total: 145 minutes/week = 2.4 hours/week per engineer
```

#### 3. Prioritize by ROI

```
ROI Score = (Time Saved per Week × 52) / Automation Effort

Example:
Task: Manual deployments (30 min/week, 2 days to automate)

ROI = (30 min × 52 weeks) / (2 days × 8 hours × 60 min)
ROI = 1560 / 960 = 1.62

If ROI > 1: Worth automating
```

### Common Sources of Toil

1. **Manual Deployments** - 20-30% of toil
2. **Incident Response** - 15-25% (partially automatable)
3. **Monitoring and Alerting** - 10-15%
4. **Capacity Management** - 10-15%
5. **User Access Management** - 5-10%
6. **Data Operations** - 5-10%
7. **Environment Management** - 5-10%

## 🤖 Automation Strategies

### 1. Deployment Automation

#### Before: Manual Deployment

```bash
# Engineer runs these commands manually
aws lambda update-function-code \
  --function-name udacity-api \
  --zip-file fileb://function.zip

aws lambda publish-version \
  --function-name udacity-api

aws lambda update-alias \
  --function-name udacity-api \
  --name prod \
  --function-version 42

# Wait and monitor...
# If issues, manually rollback
```

**Toil:** 15 minutes per deployment, 3x/week = 45 min/week

#### After: CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Run Tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Lambda
        run: |
          aws lambda update-function-code \
            --function-name udacity-api \
            --zip-file fileb://dist/function.zip
          
      - name: Run Smoke Tests
        run: npm run test:smoke
        
      - name: Gradual Rollout
        run: |
          # Deploy to 10% of traffic
          ./scripts/canary-deploy.sh --percent 10
          sleep 300
          
          # Check metrics
          if ./scripts/check-metrics.sh; then
            # Deploy to 100%
            ./scripts/canary-deploy.sh --percent 100
          else
            # Rollback
            ./scripts/rollback.sh
            exit 1
          fi
          
      - name: Notify Success
        if: success()
        run: |
          curl -X POST $SLACK_WEBHOOK \
            -d '{"text":"✅ Deployment successful"}'
```

**Time Saved:** 45 min/week → 0 min/week (fully automated)

### 2. Auto-Scaling and Self-Healing

#### Lambda Auto-Scaling

```yaml
Resources:
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: udacity-api
      AutoPublishAlias: live
      DeploymentPreference:
        Type: Canary10Percent5Minutes
        Alarms:
          - !Ref ErrorRateAlarm
          - !Ref LatencyAlarm
      ReservedConcurrentExecutions: 500
      
  # Auto-scaling based on provisioned concurrency
  ProvisionedConcurrency:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 500
      MinCapacity: 50
      ResourceId: !Sub function:${ApiFunction}:live
      ScalableDimension: lambda:function:ProvisionedConcurrentExecutions
      ServiceNamespace: lambda
      
  ScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ProvisionedConcurrency
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 0.7
        PredefinedMetricSpecification:
          PredefinedMetricType: LambdaProvisionedConcurrencyUtilization
```

#### DynamoDB Auto-Scaling

```yaml
Resources:
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: UdacityUsers
      BillingMode: PROVISIONED
      ProvisionedThroughput:
        ReadCapacityUnits: 100
        WriteCapacityUnits: 50
      
  ReadScalingTarget:
    Type: AWS::ApplicationAutoScaling::ScalableTarget
    Properties:
      MaxCapacity: 1000
      MinCapacity: 100
      ResourceId: !Sub table/${UsersTable}
      RoleARN: !GetAtt ScalingRole.Arn
      ScalableDimension: dynamodb:table:ReadCapacityUnits
      ServiceNamespace: dynamodb
      
  ReadScalingPolicy:
    Type: AWS::ApplicationAutoScaling::ScalingPolicy
    Properties:
      PolicyType: TargetTrackingScaling
      ScalingTargetId: !Ref ReadScalingTarget
      TargetTrackingScalingPolicyConfiguration:
        TargetValue: 70.0
        PredefinedMetricSpecification:
          PredefinedMetricType: DynamoDBReadCapacityUtilization
        ScaleInCooldown: 60
        ScaleOutCooldown: 60
```

### 3. Automated Remediation

#### Lambda Function for Auto-Remediation

```javascript
// auto-remediate-lambda.js
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
const ecs = new AWS.ECS();

exports.handler = async (event) => {
  // Parse CloudWatch Alarm
  const message = JSON.parse(event.Records[0].Sns.Message);
  const alarmName = message.AlarmName;
  
  console.log(`Triggered by alarm: ${alarmName}`);
  
  // Route to appropriate remediation
  if (alarmName.includes('HighErrorRate')) {
    await remediateLambdaErrors(message);
  } else if (alarmName.includes('ECSTaskFailed')) {
    await remediateECSTask(message);
  } else if (alarmName.includes('HighMemory')) {
    await remediateLambdaMemory(message);
  }
};

async function remediateLambdaErrors(alarm) {
  // Extract function name from alarm dimensions
  const functionName = alarm.Trigger.Dimensions.find(
    d => d.name === 'FunctionName'
  ).value;
  
  console.log(`Remediating Lambda function: ${functionName}`);
  
  // Get current alias configuration
  const alias = await lambda.getAlias({
    FunctionName: functionName,
    Name: 'prod'
  }).promise();
  
  const currentVersion = parseInt(alias.FunctionVersion);
  
  // Rollback to previous version
  if (currentVersion > 1) {
    const previousVersion = currentVersion - 1;
    
    await lambda.updateAlias({
      FunctionName: functionName,
      Name: 'prod',
      FunctionVersion: previousVersion.toString()
    }).promise();
    
    console.log(`Rolled back to version ${previousVersion}`);
    
    // Notify team
    await notifySlack(
      `🔄 Auto-remediation: Rolled back ${functionName} from v${currentVersion} to v${previousVersion} due to high error rate`
    );
  }
}

async function remediateECSTask(alarm) {
  const clusterName = 'udacity-cluster';
  const serviceName = 'udacity-service';
  
  console.log(`Restarting ECS service: ${serviceName}`);
  
  // Force new deployment (restarts tasks)
  await ecs.updateService({
    cluster: clusterName,
    service: serviceName,
    forceNewDeployment: true
  }).promise();
  
  console.log(`Initiated restart of ${serviceName}`);
  
  await notifySlack(
    `🔄 Auto-remediation: Restarted ECS service ${serviceName} due to task failures`
  );
}

async function remediateLambdaMemory(alarm) {
  const functionName = alarm.Trigger.Dimensions.find(
    d => d.name === 'FunctionName'
  ).value;
  
  console.log(`Increasing memory for: ${functionName}`);
  
  // Get current configuration
  const config = await lambda.getFunctionConfiguration({
    FunctionName: functionName
  }).promise();
  
  const currentMemory = config.MemorySize;
  const newMemory = Math.min(currentMemory * 1.5, 3008); // Max 3008 MB
  
  // Increase memory
  await lambda.updateFunctionConfiguration({
    FunctionName: functionName,
    MemorySize: Math.floor(newMemory)
  }).promise();
  
  console.log(`Increased memory from ${currentMemory}MB to ${newMemory}MB`);
  
  await notifySlack(
    `⚡ Auto-remediation: Increased ${functionName} memory from ${currentMemory}MB to ${newMemory}MB`
  );
}

async function notifySlack(message) {
  // Implement Slack notification
  const https = require('https');
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ text: message });
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(webhookUrl, options, (res) => {
      resolve();
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
```

#### CloudWatch Alarm with Auto-Remediation

```yaml
Resources:
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: Lambda-HighErrorRate-AutoRemediate
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ApiFunction
      AlarmActions:
        - !Ref RemediationTopic  # Triggers auto-remediation
        - !Ref AlertTopic         # Also alerts team
          
  RemediationTopic:
    Type: AWS::SNS::Topic
    Properties:
      Subscription:
        - Endpoint: !GetAtt AutoRemediateLambda.Arn
          Protocol: lambda
          
  RemediationTopicPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref AutoRemediateLambda
      Action: lambda:InvokeFunction
      Principal: sns.amazonaws.com
      SourceArn: !Ref RemediationTopic
```

### 4. Automated Testing and Validation

#### Synthetic Monitoring

```javascript
// synthetic-monitor.js
// Runs every 5 minutes via CloudWatch Events

const AWS = require('aws-sdk');
const https = require('https');
const cloudwatch = new AWS.CloudWatch();

const ENDPOINTS = [
  { name: 'Login', url: 'https://api.example.com/auth/login', method: 'POST' },
  { name: 'GetUser', url: 'https://api.example.com/users/me', method: 'GET' },
  { name: 'ListDocuments', url: 'https://api.example.com/documents', method: 'GET' }
];

exports.handler = async () => {
  const results = await Promise.all(
    ENDPOINTS.map(endpoint => testEndpoint(endpoint))
  );
  
  // Publish metrics
  for (const result of results) {
    await publishMetrics(result);
  }
  
  // Alert if any failures
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    await alertFailures(failures);
  }
};

async function testEndpoint(endpoint) {
  const start = Date.now();
  
  try {
    const response = await makeRequest(endpoint);
    const duration = Date.now() - start;
    
    return {
      name: endpoint.name,
      success: response.statusCode < 400,
      duration: duration,
      statusCode: response.statusCode
    };
  } catch (error) {
    const duration = Date.now() - start;
    return {
      name: endpoint.name,
      success: false,
      duration: duration,
      error: error.message
    };
  }
}

async function publishMetrics(result) {
  await cloudwatch.putMetricData({
    Namespace: 'Udacity/Synthetic',
    MetricData: [
      {
        MetricName: 'Availability',
        Value: result.success ? 1 : 0,
        Unit: 'None',
        Dimensions: [
          { Name: 'Endpoint', Value: result.name }
        ]
      },
      {
        MetricName: 'Latency',
        Value: result.duration,
        Unit: 'Milliseconds',
        Dimensions: [
          { Name: 'Endpoint', Value: result.name }
        ]
      }
    ]
  }).promise();
}

function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint.url);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SyntheticMonitor/1.0'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    if (endpoint.method === 'POST') {
      req.write(JSON.stringify(endpoint.body || {}));
    }
    
    req.end();
  });
}
```

## 🛠️ Operational Tooling

### 1. Runbook Automation

Convert runbooks to executable scripts:

```bash
#!/bin/bash
# automated-runbook-lambda-troubleshoot.sh

set -e

FUNCTION_NAME=$1
REGION=${2:-us-east-1}

echo "=== Lambda Function Troubleshooting Tool ==="
echo "Function: $FUNCTION_NAME"
echo "Region: $REGION"
echo

# 1. Get function status
echo "1. Function Status:"
aws lambda get-function \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --query '{State:Configuration.State,LastModified:Configuration.LastModified,Runtime:Configuration.Runtime,Memory:Configuration.MemorySize,Timeout:Configuration.Timeout}' \
  --output table

# 2. Get recent errors
echo -e "\n2. Recent Errors (last 1 hour):"
aws logs tail /aws/lambda/$FUNCTION_NAME \
  --since 1h \
  --filter-pattern "ERROR" \
  --format short \
  --region $REGION

# 3. Get invocation metrics
echo -e "\n3. Invocation Metrics (last 1 hour):"
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)
START_TIME=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)

aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output table

# 4. Get error metrics
echo -e "\n4. Error Metrics (last 1 hour):"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output table

# 5. Get concurrent executions
echo -e "\n5. Concurrent Executions:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name ConcurrentExecutions \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Maximum,Average \
  --region $REGION \
  --query 'Datapoints[*].[Timestamp,Maximum,Average]' \
  --output table

# 6. Check for throttling
echo -e "\n6. Throttling:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Throttles \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --query 'Datapoints[*].[Timestamp,Sum]' \
  --output table

# 7. Get recent versions
echo -e "\n7. Recent Versions:"
aws lambda list-versions-by-function \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --max-items 5 \
  --query 'Versions[*].[Version,LastModified,Description]' \
  --output table

# 8. Get alias configuration
echo -e "\n8. Aliases:"
aws lambda list-aliases \
  --function-name $FUNCTION_NAME \
  --region $REGION \
  --query 'Aliases[*].[Name,FunctionVersion,Description]' \
  --output table

echo -e "\n=== Troubleshooting Complete ==="
echo "Next steps:"
echo "1. Review error logs above"
echo "2. Check if recent deployment caused issues"
echo "3. Consider rollback if errors started after deployment"
echo "4. Check for throttling or concurrency limits"
echo
echo "To rollback: aws lambda update-alias --function-name $FUNCTION_NAME --name prod --function-version <previous-version>"
```

### 2. Batch Operations Tool

```python
#!/usr/bin/env python3
# batch-operations.py

import boto3
import concurrent.futures
from typing import List, Dict
import time

lambda_client = boto3.client('lambda')

def update_lambda_config(function_name: str, **kwargs) -> Dict:
    """Update Lambda configuration with rate limiting"""
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = lambda_client.update_function_configuration(
                FunctionName=function_name,
                **kwargs
            )
            return {
                'function': function_name,
                'status': 'success',
                'message': f'Updated {function_name}'
            }
        except lambda_client.exceptions.TooManyRequestsException:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 0.5  # Exponential backoff
                time.sleep(wait_time)
                continue
            return {
                'function': function_name,
                'status': 'error',
                'message': 'Rate limited after retries'
            }
        except Exception as e:
            return {
                'function': function_name,
                'status': 'error',
                'message': str(e)
            }

def bulk_update_memory(functions: List[str], memory_size: int):
    """Update memory for multiple Lambda functions"""
    print(f"Updating memory to {memory_size}MB for {len(functions)} functions...")
    
    # Limit concurrency to avoid rate limits (default: 5)
    max_workers = min(5, len(functions))
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(update_lambda_config, func, MemorySize=memory_size)
            for func in functions
        ]
        
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    
    # Summary
    successes = [r for r in results if r['status'] == 'success']
    errors = [r for r in results if r['status'] == 'error']
    
    print(f"\n✅ Successful: {len(successes)}")
    print(f"❌ Failed: {len(errors)}")
    
    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  - {error['function']}: {error['message']}")
    
    return results

def bulk_update_timeout(functions: List[str], timeout: int):
    """Update timeout for multiple Lambda functions"""
    print(f"Updating timeout to {timeout}s for {len(functions)} functions...")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(update_lambda_config, func, Timeout=timeout)
            for func in functions
        ]
        
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    
    return results

def list_functions_by_runtime(runtime: str) -> List[str]:
    """List all functions using a specific runtime"""
    functions = []
    paginator = lambda_client.get_paginator('list_functions')
    
    for page in paginator.paginate():
        for func in page['Functions']:
            if func['Runtime'] == runtime:
                functions.append(func['FunctionName'])
    
    return functions

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Batch Lambda operations')
    parser.add_argument('--operation', choices=['update-memory', 'update-timeout', 'list-runtime'])
    parser.add_argument('--runtime', help='Runtime to filter (e.g., nodejs14.x)')
    parser.add_argument('--memory', type=int, help='Memory size in MB')
    parser.add_argument('--timeout', type=int, help='Timeout in seconds')
    parser.add_argument('--functions', nargs='+', help='List of function names')
    
    args = parser.parse_args()
    
    if args.operation == 'list-runtime':
        functions = list_functions_by_runtime(args.runtime)
        print(f"Functions using {args.runtime}:")
        for func in functions:
            print(f"  - {func}")
    
    elif args.operation == 'update-memory':
        bulk_update_memory(args.functions, args.memory)
    
    elif args.operation == 'update-timeout':
        bulk_update_timeout(args.functions, args.timeout)
```

## 📊 Measuring Automation Success

### Metrics to Track

```yaml
Automation Metrics:
  Toil Percentage:
    Target: < 50%
    Current: Calculate monthly
    
  Deployment Frequency:
    Target: > 10/week
    Measure: Successful production deployments
    
  Deployment Duration:
    Target: < 15 minutes
    Measure: Commit to production
    
  MTTR:
    Target: < 1 hour
    Impact: Automation speeds recovery
    
  Manual Intervention Rate:
    Target: < 10% of deploys
    Measure: Deploys requiring human action
```

## 🔗 Related Resources

- [Toil Audit Template](./toil-audit-template.md)
- [Automation Project Prioritization](./automation-priority.md)
- [Self-Healing Patterns](./self-healing-patterns.md)
- [Google SRE Book - Eliminating Toil](https://sre.google/sre-book/eliminating-toil/)
