# SRE Scenarios & Playbooks

Real-world reliability engineering scenarios, practice exercises, and hands-on playbooks for the Udacity AWS Developer workspace.

## 🎯 Overview

This section contains:
1. **Real-World Scenarios** - Common production incidents and their resolutions
2. **Practice Exercises** - Hands-on reliability challenges
3. **War Games** - Chaos engineering experiments
4. **Case Studies** - Post-incident learnings

## 🚨 Real-World Scenarios

### Scenario 1: Lambda Function Out of Memory

**Situation:**
```
11:23 AM - CloudWatch Alarm: Lambda function "udacity-document-processor" 
error rate > 50%

Symptoms:
- API returning 502 errors
- Lambda logs show "Process exited before completing request"
- Memory usage at 100% before crash
```

**Investigation Steps:**

1. **Check Lambda metrics**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=udacity-document-processor \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Maximum,Average
```

2. **Review logs for memory errors**
```
CloudWatch Logs Insights:
fields @timestamp, @message, @memoryUsed, @memoryLimit
| filter @message like /out of memory/
| sort @timestamp desc
```

3. **Identify memory growth pattern**
```javascript
// Found in logs:
@memoryUsed: 128MB → 256MB → 384MB → 512MB (limit) → CRASH
```

**Root Cause:**
Memory leak in document processing logic - buffers not released

**Resolution:**

```javascript
// Before (problematic):
const documents = [];
exports.handler = async (event) => {
  // Documents accumulate in module scope
  documents.push(await processDocument(event));
  return documents[documents.length - 1];
};

// After (fixed):
exports.handler = async (event) => {
  // No module-level state, garbage collected after each invocation
  const document = await processDocument(event);
  return document;
};
```

**Immediate Actions:**
1. Increase memory to 1024MB (temporary fix)
2. Deploy fix with proper memory management
3. Add memory usage alerting

**Preventive Measures:**
- Load tests that run for extended periods
- Memory profiling in CI/CD
- Periodic Lambda cold starts to clear state

---

### Scenario 2: DynamoDB Throttling During Peak Traffic

**Situation:**
```
3:15 PM - Black Friday sale starts
3:17 PM - User complaints: "Can't view shopping cart"
3:18 PM - Alarm: DynamoDB UserErrors spike
```

**Investigation:**

```bash
# Check DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=ShoppingCarts \
  --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum

# Check consumed vs provisioned capacity
aws dynamodb describe-table --table-name ShoppingCarts \
  --query 'Table.ProvisionedThroughput'
```

**Findings:**
- Provisioned: 100 RCU, 50 WCU
- Consumed: 450 RCU, 180 WCU
- Throttling: 2,500 requests in last 5 minutes

**Root Cause:**
Underprovisioned for Black Friday traffic spike

**Immediate Resolution:**

```bash
# Emergency capacity increase
aws dynamodb update-table \
  --table-name ShoppingCarts \
  --provisioned-throughput ReadCapacityUnits=1000,WriteCapacityUnits=500

# Enable auto-scaling for future
aws application-autoscaling register-scalable-target \
  --service-namespace dynamodb \
  --resource-id table/ShoppingCarts \
  --scalable-dimension dynamodb:table:ReadCapacityUnits \
  --min-capacity 100 \
  --max-capacity 2000
```

**Long-Term Solution:**

```yaml
# Switch to on-demand billing
Resources:
  ShoppingCartsTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST  # Auto-scales to any load
      TableName: ShoppingCarts
```

**Lessons Learned:**
- Capacity planning for known traffic spikes
- Use on-demand mode for unpredictable workloads
- Implement caching (ElastiCache) for read-heavy operations

---

### Scenario 3: API Gateway 5xx Errors After Deployment

**Situation:**
```
2:30 PM - Deployed new Lambda version
2:35 PM - API Gateway 5xx error rate jumps to 15%
2:36 PM - Customer complaints on social media
```

**Investigation:**

```bash
# Check API Gateway logs
aws logs tail /aws/apigateway/udacity-api \
  --since 10m \
  --filter-pattern "5??" \
  --format short

# Check Lambda errors
aws logs tail /aws/lambda/udacity-api-handler \
  --since 10m \
  --filter-pattern "ERROR"
```

**Findings:**
```
Lambda Error: "Cannot read property 'userId' of undefined"
New code expects event.body.userId but receives event.userId
```

**Root Cause:**
API Gateway integration changed from proxy to non-proxy in deployment

**Immediate Resolution:**

```bash
# Rollback Lambda to previous version
FUNCTION_NAME="udacity-api-handler"

# Get previous version
CURRENT=$(aws lambda get-alias \
  --function-name $FUNCTION_NAME \
  --name prod \
  --query 'FunctionVersion' \
  --output text)

PREVIOUS=$((CURRENT - 1))

# Rollback
aws lambda update-alias \
  --function-name $FUNCTION_NAME \
  --name prod \
  --function-version $PREVIOUS

echo "Rolled back from v$CURRENT to v$PREVIOUS"
```

**Prevention:**

```javascript
// Add input validation and defensive coding
exports.handler = async (event) => {
  // Handle both proxy and non-proxy integrations
  const body = event.body ? JSON.parse(event.body) : event;
  
  if (!body.userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing userId' })
    };
  }
  
  return processRequest(body);
};
```

**Improvements:**
1. Integration tests covering both modes
2. Gradual rollout (canary deployment)
3. Synthetic monitoring to catch issues instantly

---

### Scenario 4: S3 Bucket Accidentally Made Public

**Situation:**
```
9:15 AM - Security scan alert: "Public S3 bucket detected"
Bucket: udacity-user-documents (contains PII)
Access: Public read enabled
```

**Immediate Actions:**

```bash
# 1. Block public access immediately
aws s3api put-public-access-block \
  --bucket udacity-user-documents \
  --public-access-block-configuration \
    BlockPublicAcls=true,\
    IgnorePublicAcls=true,\
    BlockPublicPolicy=true,\
    RestrictPublicBuckets=true

# 2. Remove public ACL
aws s3api put-bucket-acl \
  --bucket udacity-user-documents \
  --acl private

# 3. Audit access logs
aws s3api get-bucket-logging \
  --bucket udacity-user-documents

# Download and analyze access logs
aws s3 sync s3://logging-bucket/udacity-user-documents/ ./audit-logs/
grep "REST.GET.OBJECT" audit-logs/* | awk '{print $3, $5}' | sort | uniq -c
```

**Investigation Results:**
- Bucket public for 2 hours
- 47 unique IP addresses accessed files
- 234 objects downloaded

**Incident Response:**

1. **Contain:**
   - ✅ Bucket made private
   - ✅ All objects checked for public ACLs
   - ✅ Bucket policy reviewed

2. **Assess:**
   - Identify affected users from access logs
   - Determine data sensitivity
   - Check for malicious access patterns

3. **Notify:**
   - Security team immediately
   - Legal team (potential data breach)
   - Affected users (if required by regulations)
   - Management

4. **Remediate:**
   ```yaml
   # Implement bucket policy
   Resources:
     BucketPolicy:
       Type: AWS::S3::BucketPolicy
       Properties:
         Bucket: !Ref UserDocumentsBucket
         PolicyDocument:
           Statement:
             - Effect: Deny
               Principal: "*"
               Action: "s3:*"
               Resource:
                 - !Sub "${UserDocumentsBucket.Arn}/*"
               Condition:
                 Bool:
                   "aws:SecureTransport": "false"
   ```

5. **Prevent:**
   - Enable AWS Config rule: `s3-bucket-public-read-prohibited`
   - Enable AWS Config rule: `s3-bucket-public-write-prohibited`
   - Implement Service Control Policy blocking public buckets
   - Automated daily security scans

---

### Scenario 5: Cascading Failure from External API

**Situation:**
```
4:45 PM - Third-party payment API experiencing issues
4:47 PM - Our checkout API latency increases 10x
4:50 PM - All API endpoints slow (even non-payment ones)
4:52 PM - Complete service outage
```

**What Happened:**

```
External API (payment) → Slow responses (30s timeout)
                       ↓
Lambda functions wait → All concurrent executions consumed
                       ↓
No available Lambda capacity → All APIs fail
```

**Immediate Response:**

```javascript
// Emergency: Reduce timeout on payment Lambda
aws lambda update-function-configuration \
  --function-name payment-processor \
  --timeout 5  # Reduce from 30s to 5s

// This freed up Lambda concurrency
```

**Root Cause:**
No circuit breaker pattern - Lambda kept trying failing API

**Proper Solution:**

```javascript
const CircuitBreaker = require('opossum');

// Circuit breaker configuration
const options = {
  timeout: 3000,        // 3s timeout
  errorThresholdPercentage: 50,  // Open after 50% errors
  resetTimeout: 30000   // Try again after 30s
};

const paymentAPI = new CircuitBreaker(callPaymentAPI, options);

// Fallback when circuit opens
paymentAPI.fallback(() => {
  return {
    status: 'queued',
    message: 'Payment processor temporarily unavailable. Your order is queued.'
  };
});

// Event handlers
paymentAPI.on('open', () => {
  console.log('Circuit breaker opened - payment API unhealthy');
  publishMetric('CircuitBreakerOpen', 1);
});

paymentAPI.on('halfOpen', () => {
  console.log('Circuit breaker half-open - testing recovery');
});

async function processPayment(orderData) {
  try {
    return await paymentAPI.fire(orderData);
  } catch (error) {
    // Queue payment for later processing
    await queuePayment(orderData);
    return {
      status: 'queued',
      orderId: orderData.orderId
    };
  }
}
```

**Additional Protections:**

```yaml
# Separate Lambda pools (bulkhead pattern)
Resources:
  PaymentFunction:
    Type: AWS::Lambda::Function
    Properties:
      ReservedConcurrentExecutions: 100  # Isolated pool
      
  CheckoutFunction:
    Type: AWS::Lambda::Function
    Properties:
      ReservedConcurrentExecutions: 200  # Separate pool
      
  BrowsingFunction:
    Type: AWS::Lambda::Function
    # No reservation - uses unreserved pool
```

**Lessons Learned:**
1. Always use circuit breakers for external dependencies
2. Implement timeouts aggressively
3. Use bulkhead pattern to isolate failures
4. Have fallback/degraded mode
5. Monitor third-party API health proactively

---

## 🎮 Practice Exercises

### Exercise 1: Implement Retry Logic

**Challenge:**
Add exponential backoff retry to a DynamoDB operation

**Starting Code:**
```javascript
async function getUser(userId) {
  const result = await dynamodb.get({
    TableName: 'Users',
    Key: { userId }
  }).promise();
  
  return result.Item;
}
```

**Your Task:**
1. Add retry logic with exponential backoff
2. Maximum 3 retries
3. Don't retry on ValidationException
4. Add jitter to prevent thundering herd

**Solution:**
```javascript
async function getUser(userId) {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const result = await dynamodb.get({
        TableName: 'Users',
        Key: { userId }
      }).promise();
      
      return result.Item;
    } catch (error) {
      // Don't retry validation errors
      if (error.code === 'ValidationException') {
        throw error;
      }
      
      attempt++;
      
      if (attempt >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, attempt) * 100;
      const jitter = Math.random() * baseDelay * 0.1;
      const delay = baseDelay + jitter;
      
      console.log(`Retry attempt ${attempt} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Exercise 2: Build a Health Check Endpoint

**Challenge:**
Create a comprehensive health check endpoint

**Requirements:**
- Check DynamoDB connection
- Check external API availability
- Return appropriate status codes
- Include response time metrics

**Solution:**
```javascript
exports.handler = async (event) => {
  const checks = await Promise.all([
    checkDynamoDB(),
    checkExternalAPI(),
    checkS3()
  ]);
  
  const allHealthy = checks.every(c => c.healthy);
  const status = allHealthy ? 200 : 503;
  
  return {
    statusCode: status,
    body: JSON.stringify({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: checks,
      version: process.env.VERSION
    })
  };
};

async function checkDynamoDB() {
  const start = Date.now();
  try {
    await dynamodb.describeTable({ TableName: 'Users' }).promise();
    return {
      service: 'DynamoDB',
      healthy: true,
      responseTime: Date.now() - start
    };
  } catch (error) {
    return {
      service: 'DynamoDB',
      healthy: false,
      error: error.message,
      responseTime: Date.now() - start
    };
  }
}
```

### Exercise 3: Implement Rate Limiting

**Challenge:**
Add rate limiting to an API endpoint using DynamoDB

**Requirements:**
- 100 requests per minute per user
- Use DynamoDB for distributed rate limiting
- Return 429 with Retry-After header

**Solution:**
```javascript
async function checkRateLimit(userId) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 60;
  
  const tableName = 'RateLimits';
  const key = `${userId}:${now}`;
  
  try {
    // Increment counter
    const result = await dynamodb.update({
      TableName: tableName,
      Key: { userId, timestamp: now },
      UpdateExpression: 'ADD #count :inc SET #ttl = :ttl',
      ExpressionAttributeNames: {
        '#count': 'count',
        '#ttl': 'ttl'
      },
      ExpressionAttributeValues: {
        ':inc': 1,
        ':ttl': now + 120  // TTL: 2 minutes
      },
      ReturnValues: 'ALL_NEW'
    }).promise();
    
    // Query total requests in window
    const requests = await dynamodb.query({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId AND #ts > :windowStart',
      ExpressionAttributeNames: {
        '#ts': 'timestamp'
      },
      ExpressionAttributeValues: {
        ':userId': userId,
        ':windowStart': windowStart
      }
    }).promise();
    
    const totalRequests = requests.Items.reduce((sum, item) => sum + item.count, 0);
    
    if (totalRequests > 100) {
      const resetTime = windowStart + 60;
      throw {
        statusCode: 429,
        message: 'Rate limit exceeded',
        headers: {
          'Retry-After': (resetTime - now).toString()
        }
      };
    }
    
    return { allowed: true, remaining: 100 - totalRequests };
  } catch (error) {
    if (error.statusCode === 429) throw error;
    // On error, allow request (fail open)
    console.error('Rate limit check failed:', error);
    return { allowed: true, remaining: null };
  }
}
```

## ⚔️ War Games

### War Game 1: Chaos Monkey Day

**Objective:** Test system resilience by randomly terminating resources

**Setup:**
1. Use existing chaos-monkey demo
2. Target: ECS tasks, Lambda functions
3. Duration: 1 hour
4. Success criteria: No user-visible impact

**Chaos Script:**
```javascript
// Based on exercises/c4-demos-master/04-chaos-monkey
const AWS = require('aws-sdk');
const ecs = new AWS.ECS();
const lambda = new AWS.Lambda();

async function chaosMonkey() {
  console.log('🐵 Chaos Monkey activated!');
  
  // Kill random ECS task
  const tasks = await ecs.listTasks({ cluster: 'udacity-cluster' }).promise();
  if (tasks.taskArns.length > 0) {
    const randomTask = tasks.taskArns[Math.floor(Math.random() * tasks.taskArns.length)];
    await ecs.stopTask({
      cluster: 'udacity-cluster',
      task: randomTask,
      reason: 'Chaos Monkey experiment'
    }).promise();
    console.log(`Killed ECS task: ${randomTask}`);
  }
  
  // Throttle random Lambda
  const functions = await lambda.listFunctions().promise();
  const randomFunc = functions.Functions[Math.floor(Math.random() * functions.Functions.length)];
  await lambda.putFunctionConcurrency({
    FunctionName: randomFunc.FunctionName,
    ReservedConcurrentExecutions: 1  // Severely limit
  }).promise();
  console.log(`Throttled Lambda: ${randomFunc.FunctionName}`);
  
  // Restore after 5 minutes
  setTimeout(async () => {
    await lambda.deleteFunctionConcurrency({
      FunctionName: randomFunc.FunctionName
    }).promise();
    console.log(`Restored Lambda: ${randomFunc.FunctionName}`);
  }, 5 * 60 * 1000);
}

// Run chaos every 10 minutes
setInterval(chaosMonkey, 10 * 60 * 1000);
```

**Metrics to Watch:**
- Error rate (should stay < 0.1%)
- Latency P99 (should stay < 2x normal)
- Auto-scaling events (should trigger)
- Alert notifications (should fire)

### War Game 2: Load Test to Failure

**Objective:** Find breaking point of the system

**Setup:**
```bash
# Install k6 load testing tool
brew install k6

# Load test script
cat > loadtest.js << 'EOF'
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Stay
    { duration: '2m', target: 200 },   // Ramp up more
    { duration: '5m', target: 200 },   // Stay
    { duration: '2m', target: 500 },   // Ramp up to failure
    { duration: '5m', target: 500 },   // Find limits
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('https://api.example.com/users');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF

# Run load test
k6 run loadtest.js
```

**Expected Outcomes:**
- Identify bottlenecks
- Trigger auto-scaling
- Test alarm thresholds
- Validate capacity planning

## 📚 Case Studies

### Case Study: AWS Region Outage

**Event:** December 7, 2021 - AWS US-EAST-1 outage

**What Happened:**
- Power loss in single AZ
- Cascading failures across services
- Many customers affected

**Lessons for Our System:**

1. **Multi-AZ is not enough**
   - Need multi-region for true HA
   - Implement Route53 failover

2. **Dependencies matter**
   - Even multi-AZ apps failed if they depended on regional services
   - Map all dependencies

3. **Static fallbacks**
   - Have static error pages in different region
   - Cache critical data locally

**Action Items:**
- [ ] Implement multi-region deployment
- [ ] Create dependency map
- [ ] Set up Route53 health checks and failover
- [ ] Test regional failover quarterly

## 🔗 Related Resources

- [Chaos Engineering on AWS](https://aws.amazon.com/blogs/architecture/chaos-engineering-on-aws/)
- [AWS Well-Architected Labs](https://wellarchitectedlabs.com/)
- [Game Day Runbook](./game-day-runbook.md)
- [Incident Response Scenarios](../incident-management/runbooks/incident-response.md)
