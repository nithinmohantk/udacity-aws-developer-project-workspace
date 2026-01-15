# Change Management & Safe Deployments

Comprehensive guide to safe deployment practices, rollback strategies, and change control processes.

## 🎯 Deployment Philosophy

**Core Principles:**
1. **Small batches** - Deploy frequently, small changes
2. **Gradual rollout** - Increase traffic incrementally
3. **Fast rollback** - Revert quickly if issues arise
4. **Automated gates** - Let metrics decide success
5. **Zero downtime** - Users never experience outages

## 🚀 Deployment Strategies

### 1. Blue-Green Deployment

**Concept:** Maintain two identical environments, switch traffic atomically

```
┌──────────────┐
│  Route 53    │
└──────┬───────┘
       │
       ├─────────┐
       │         │
   ┌───▼───┐ ┌──▼────┐
   │ Blue  │ │ Green │
   │ (Old) │ │ (New) │
   └───────┘ └───────┘
   
Switch traffic → Blue to Green
Rollback → Green back to Blue
```

**Implementation with Lambda Aliases:**

```yaml
Resources:
  ProductionAlias:
    Type: AWS::Lambda::Alias
    Properties:
      FunctionName: !Ref MyFunction
      FunctionVersion: !GetAtt MyFunctionVersion.Version
      Name: production
      
  # Deploy new version
  NewVersion:
    Type: AWS::Lambda::Version
    Properties:
      FunctionName: !Ref MyFunction
      
  # Weighted alias for blue-green
  BlueGreenAlias:
    Type: AWS::Lambda::Alias
    Properties:
      FunctionName: !Ref MyFunction
      Name: live
      FunctionVersion: !GetAtt NewVersion.Version
      RoutingConfig:
        AdditionalVersionWeights:
          - FunctionVersion: "$LATEST"  # Reference to previous version
            FunctionWeight: 0  # 100% to new version
```

**Automation Script:**

```bash
#!/bin/bash
# blue-green-deploy.sh

FUNCTION_NAME=$1
NEW_VERSION=$2
ALIAS_NAME="production"

echo "Starting blue-green deployment"
echo "Function: $FUNCTION_NAME"
echo "New version: $NEW_VERSION"

# Get current version
CURRENT_VERSION=$(aws lambda get-alias \
  --function-name $FUNCTION_NAME \
  --name $ALIAS_NAME \
  --query 'FunctionVersion' \
  --output text)

echo "Current version: $CURRENT_VERSION"

# Update alias to new version
aws lambda update-alias \
  --function-name $FUNCTION_NAME \
  --name $ALIAS_NAME \
  --function-version $NEW_VERSION

echo "Switched traffic to version $NEW_VERSION"
echo "Monitoring for 10 minutes..."

# Monitor for issues
sleep 600

# Check metrics
ERROR_COUNT=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=$FUNCTION_NAME \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 600 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text)

# Convert to integer for comparison, default to 0 if None
ERROR_COUNT_INT=$(echo "$ERROR_COUNT" | grep -E '^[0-9]+(\.[0-9]+)?$' | awk '{print int($1+0.5)}')
ERROR_COUNT_INT=${ERROR_COUNT_INT:-0}

if [ "$ERROR_COUNT_INT" -gt 0 ]; then
  echo "❌ Errors detected! Rolling back..."
  aws lambda update-alias \
    --function-name $FUNCTION_NAME \
    --name $ALIAS_NAME \
    --function-version $CURRENT_VERSION
  echo "Rolled back to version $CURRENT_VERSION"
  exit 1
fi

echo "✅ Deployment successful!"
```

### 2. Canary Deployment

**Concept:** Route small percentage of traffic to new version, gradually increase

```
Traffic Distribution:
┌─────────────────────────────────────────┐
│ 95% → Version 1 (Stable)                │
│ 5%  → Version 2 (Canary)                │
└─────────────────────────────────────────┘

If successful:
┌─────────────────────────────────────────┐
│ 50% → Version 1                          │
│ 50% → Version 2                          │
└─────────────────────────────────────────┘

Then:
┌─────────────────────────────────────────┐
│ 0%   → Version 1                         │
│ 100% → Version 2                         │
└─────────────────────────────────────────┘
```

**AWS SAM Implementation:**

```yaml
Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      AutoPublishAlias: live
      DeploymentPreference:
        Type: Canary10Percent5Minutes  # 10% for 5 min, then 100%
        Alarms:
          - !Ref ErrorRateAlarm
          - !Ref LatencyAlarm
        Hooks:
          PreTraffic: !Ref PreTrafficHook
          PostTraffic: !Ref PostTrafficHook
          
  ErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-ErrorRate
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref MyFunction
          
  PreTrafficHook:
    Type: AWS::Serverless::Function
    Properties:
      Handler: hooks.preTraffic
      Runtime: nodejs18.x
      Environment:
        Variables:
          NEW_VERSION: !Ref MyFunction.Version
          
  PostTrafficHook:
    Type: AWS::Serverless::Function
    Properties:
      Handler: hooks.postTraffic
      Runtime: nodejs18.x
```

**Canary Stages:**

```yaml
Deployment Types:
  Canary10Percent30Minutes:  # 10% for 30 min
  Canary10Percent5Minutes:   # 10% for 5 min
  Canary10Percent10Minutes:  # 10% for 10 min
  Linear10PercentEvery10Minutes:  # +10% every 10 min
  Linear10PercentEvery1Minute:    # +10% every minute
  AllAtOnce:  # 100% immediately (not recommended)
```

### 3. Rolling Deployment

**Concept:** Update instances/tasks one at a time

```yaml
Resources:
  ECSService:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref ECSCluster
      DesiredCount: 10
      TaskDefinition: !Ref TaskDefinition
      DeploymentConfiguration:
        MaximumPercent: 150        # Allow 5 extra during deploy
        MinimumHealthyPercent: 100 # Keep all 10 healthy
        DeploymentCircuitBreaker:
          Enable: true
          Rollback: true
      HealthCheckGracePeriodSeconds: 60
```

**Deployment Process:**
```
Initial: 10 tasks on v1
Step 1:  10 tasks v1, 1 task v2 (11 total)
Step 2:  9 tasks v1, 2 tasks v2 (11 total)
...
Step 10: 0 tasks v1, 10 tasks v2 (10 total)
```

### 4. Feature Flags

**Concept:** Deploy code but control feature activation

```javascript
// feature-flags.js
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

class FeatureFlags {
  constructor() {
    this.cache = {};
    this.cacheTimeout = 60000; // 1 minute
  }
  
  async isEnabled(featureName, userId = null) {
    const flag = await this.getFlag(featureName);
    
    if (!flag.enabled) {
      return false;
    }
    
    // Check percentage rollout
    if (flag.percentage < 100) {
      if (!userId) return false;
      const hash = this.hashUserId(userId);
      return (hash % 100) < flag.percentage;
    }
    
    // Check whitelist
    if (flag.whitelist && flag.whitelist.length > 0) {
      return flag.whitelist.includes(userId);
    }
    
    return true;
  }
  
  async getFlag(featureName) {
    const cacheKey = `feature_${featureName}`;
    
    // Check cache
    if (this.cache[cacheKey] && 
        Date.now() - this.cache[cacheKey].timestamp < this.cacheTimeout) {
      return this.cache[cacheKey].value;
    }
    
    // Fetch from Parameter Store
    try {
      const param = await ssm.getParameter({
        Name: `/features/${featureName}`,
        WithDecryption: false
      }).promise();
      
      const value = JSON.parse(param.Parameter.Value);
      this.cache[cacheKey] = {
        value,
        timestamp: Date.now()
      };
      
      return value;
    } catch (error) {
      console.error(`Feature flag ${featureName} not found`, error);
      return { enabled: false, percentage: 0 };
    }
  }
  
  hashUserId(userId) {
    // Simple hash for consistent percentage rollout
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Usage
const flags = new FeatureFlags();

exports.handler = async (event) => {
  const userId = event.userId;
  
  // Check if new search feature is enabled
  if (await flags.isEnabled('advanced-search', userId)) {
    return await advancedSearch(event.query);
  } else {
    return await basicSearch(event.query);
  }
};
```

**Feature Flag Configuration (SSM Parameter Store):**

```json
{
  "enabled": true,
  "percentage": 25,
  "whitelist": ["user123", "user456"],
  "description": "Advanced search with ML ranking",
  "createdAt": "2024-01-15T00:00:00Z",
  "createdBy": "engineering-team"
}
```

## ⏮️ Rollback Procedures

### Automated Rollback

```yaml
Resources:
  DeploymentAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: AutoRollback-HighErrors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref RollbackTopic
        
  RollbackTopic:
    Type: AWS::SNS::Topic
    Properties:
      Subscription:
        - Endpoint: !GetAtt RollbackFunction.Arn
          Protocol: lambda
          
  RollbackFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      Code:
        ZipFile: |
          const AWS = require('aws-sdk');
          const lambda = new AWS.Lambda();
          const codedeploy = new AWS.CodeDeploy();
          
          exports.handler = async (event) => {
            const message = JSON.parse(event.Records[0].Sns.Message);
            const alarmName = message.AlarmName;
            
            console.log(`Alarm triggered: ${alarmName}`);
            
            // Get ongoing CodeDeploy deployment
            const deployments = await codedeploy.listDeployments({
              applicationName: 'UdacityApp',
              deploymentGroupName: 'production',
              includeOnlyStatuses: ['InProgress']
            }).promise();
            
            if (deployments.deployments.length > 0) {
              const deploymentId = deployments.deployments[0];
              
              // Stop deployment (triggers automatic rollback)
              await codedeploy.stopDeployment({
                deploymentId,
                autoRollbackEnabled: true
              }).promise();
              
              console.log(`Stopped deployment ${deploymentId}`);
              
              // Notify team
              await notifySlack(`🔴 Automatic rollback triggered due to ${alarmName}`);
            }
          };
```

### Manual Rollback Procedures

```bash
#!/bin/bash
# rollback.sh - Manual rollback script

FUNCTION_NAME=$1
ALIAS_NAME="production"

echo "=== Rollback Procedure ==="
echo "Function: $FUNCTION_NAME"
echo

# Get current version
CURRENT=$(aws lambda get-alias \
  --function-name $FUNCTION_NAME \
  --name $ALIAS_NAME \
  --query 'FunctionVersion' \
  --output text)

echo "Current version: $CURRENT"

# List recent versions
echo -e "\nRecent versions:"
aws lambda list-versions-by-function \
  --function-name $FUNCTION_NAME \
  --max-items 10 \
  --query 'Versions[*].[Version,LastModified,Description]' \
  --output table

# Prompt for version
read -p "Enter version to rollback to: " TARGET_VERSION

# Confirm
read -p "Rollback from v$CURRENT to v$TARGET_VERSION? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Rollback cancelled"
  exit 0
fi

# Execute rollback
echo "Rolling back..."
aws lambda update-alias \
  --function-name $FUNCTION_NAME \
  --name $ALIAS_NAME \
  --function-version $TARGET_VERSION

echo "✅ Rollback complete!"
echo "Verify: Check metrics and logs"
echo

# Show recent invocations
echo "Recent invocations:"
aws lambda get-function \
  --function-name $FUNCTION_NAME \
  --query 'Configuration.[FunctionName,Version,LastModified]' \
  --output table
```

## 📋 Change Control Process

### Change Request Template

```markdown
## Change Request #CR-2024-001

### Summary
Update Lambda function memory from 512MB to 1024MB to reduce duration and cost

### Type
- [ ] Feature
- [x] Performance Improvement
- [ ] Bug Fix
- [ ] Security Fix
- [ ] Infrastructure Change

### Risk Level
- [ ] High (requires approval, after-hours deployment)
- [x] Medium (requires approval, business hours OK)
- [ ] Low (automatic approval)

### Impact
- **Services Affected:** udacity-user-service
- **Users Affected:** None (transparent change)
- **Downtime Required:** No
- **Rollback Plan:** Reduce memory back to 512MB

### Implementation Plan
1. Update Lambda configuration via CloudFormation
2. Deploy during business hours
3. Monitor for 1 hour
4. Verify cost savings in Cost Explorer

### Testing
- [x] Tested in development
- [x] Tested in staging
- [x] Load tested with 2x production traffic
- [x] Verified metrics and alarms

### Rollback Procedure
```bash
aws lambda update-function-configuration \
  --function-name udacity-user-service \
  --memory-size 512
```

### Approvals
- [ ] Engineering Lead: __________
- [ ] SRE Team: __________
- [ ] Product Manager: __________

### Deployment Window
- **Planned Date:** 2024-01-20
- **Planned Time:** 10:00 AM EST
- **Duration:** 15 minutes
- **On-Call Engineer:** @engineer1
```

### Change Advisory Board (CAB)

**Weekly Meeting:**
- **When:** Every Wednesday, 2-3 PM
- **Who:** Engineering leads, SRE, Product, Security
- **Agenda:**
  1. Review upcoming changes (15 min)
  2. Discuss high-risk changes (20 min)
  3. Review previous week's changes (15 min)
  4. Incident retrospective (10 min)

**Approval Criteria:**

| Risk | Approval Required | Testing Required | Deployment Window |
|------|------------------|------------------|-------------------|
| **High** | CAB + CTO | Full test suite + load testing + security scan | After hours, on-call present |
| **Medium** | CAB | Full test suite + smoke tests | Business hours, on-call available |
| **Low** | Automated (CI/CD) | Unit tests + integration tests | Anytime |

### Emergency Changes

**Process:**
1. Declare incident (SEV-1 or SEV-2)
2. Get verbal approval from Engineering Manager
3. Document change in incident timeline
4. Deploy fix
5. Retrospective change approval in next CAB

## 🧪 Testing Gates

### Pre-Deployment Checks

```yaml
# .github/workflows/pre-deploy-checks.yml
name: Pre-Deployment Checks

on:
  pull_request:
    branches: [main]

jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Unit Tests
        run: npm test
        
      - name: Integration Tests
        run: npm run test:integration
        
      - name: Code Coverage
        run: npm run coverage
        
      - name: Coverage Gate
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
          
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Dependency Scan
        run: npm audit --audit-level=moderate
        
      - name: SAST Scan
        run: npm run security:scan
        
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Load Test
        run: |
          npm run build
          npm run test:load
          
      - name: Performance Gate
        run: |
          P95=$(jq '.metrics.http_req_duration.p95' load-test-results.json)
          if (( $(echo "$P95 > 500" | bc -l) )); then
            echo "P95 latency $P95ms exceeds 500ms"
            exit 1
          fi
```

### Post-Deployment Validation

```javascript
// post-deploy-validation.js
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

async function validateDeployment(functionName, durationMinutes = 10) {
  const checks = [
    checkErrorRate(functionName, durationMinutes),
    checkLatency(functionName, durationMinutes),
    checkThrottles(functionName, durationMinutes),
    checkInvocations(functionName, durationMinutes)
  ];
  
  const results = await Promise.all(checks);
  
  const failed = results.filter(r => !r.passed);
  
  if (failed.length > 0) {
    console.error('❌ Deployment validation failed:');
    failed.forEach(f => console.error(`  - ${f.check}: ${f.message}`));
    return false;
  }
  
  console.log('✅ Deployment validation passed');
  return true;
}

async function checkErrorRate(functionName, minutes) {
  const metrics = await getMetrics(functionName, 'Errors', minutes);
  const errorRate = calculateRate(metrics);
  
  return {
    check: 'Error Rate',
    passed: errorRate < 0.1,
    value: errorRate,
    message: `Error rate: ${errorRate.toFixed(2)}%`
  };
}

async function checkLatency(functionName, minutes) {
  const metrics = await getMetrics(functionName, 'Duration', minutes, 'p99');
  const p99 = metrics.Datapoints[0]?.ExtendedStatistics?.p99 || 0;
  
  return {
    check: 'Latency P99',
    passed: p99 < 1000,
    value: p99,
    message: `P99 latency: ${p99.toFixed(0)}ms`
  };
}

// Run validation
if (require.main === module) {
  const functionName = process.argv[2];
  validateDeployment(functionName).then(success => {
    process.exit(success ? 0 : 1);
  });
}
```

## 📊 Deployment Metrics

### Key Metrics

```yaml
Deployment Frequency:
  Target: "> 10 per week"
  Measure: Successful production deployments
  
Lead Time for Changes:
  Target: "< 1 day"
  Measure: Commit to production
  
Deployment Success Rate:
  Target: "> 95%"
  Measure: Successful / Total deployments
  
Mean Time to Rollback:
  Target: "< 10 minutes"
  Measure: Issue detection to rollback complete
  
Change Failure Rate:
  Target: "< 5%"
  Measure: Deployments requiring rollback or hotfix
```

### Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "Deployment Metrics",
        "metrics": [
          ["Udacity/Deployments", "Success", {"stat": "Sum", "color": "#2ca02c"}],
          [".", "Failed", {"stat": "Sum", "color": "#d62728"}],
          [".", "RolledBack", {"stat": "Sum", "color": "#ff7f0e"}]
        ],
        "period": 86400,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Daily Deployments"
      }
    }
  ]
}
```

## 🔗 Related Resources

- [Deployment Checklist](./deployment-checklist.md)
- [Rollback Runbook](./rollback-runbook.md)
- [Change Request Template](./change-request-template.md)
- [Feature Flag Guide](./feature-flags.md)
