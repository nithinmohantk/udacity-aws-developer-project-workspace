# System Design for Reliability

Architectural patterns and practices for building scalable, reliable, and resilient systems on AWS.

## 🏗️ Design Principles

### 1. Design for Failure

**Assume everything fails:**
- Hardware fails
- Networks are unreliable
- Dependencies are unreliable
- Software has bugs
- Humans make mistakes

**Example: Lambda with Retry Logic**
```javascript
// Note: Using AWS SDK v2 for compatibility with existing codebase
// For new projects, consider AWS SDK v3: @aws-sdk/client-dynamodb
const retry = require('async-retry');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function reliableGetItem(tableName, key) {
  return await retry(
    async (bail) => {
      try {
        const result = await dynamodb.get({
          TableName: tableName,
          Key: key
        }).promise();
        
        return result.Item;
      } catch (error) {
        // Don't retry on validation errors
        if (error.code === 'ValidationException') {
          bail(error);
          return;
        }
        
        // Retry on throttling and service errors
        if (error.code === 'ProvisionedThroughputExceededException' ||
            error.code === 'ServiceUnavailable') {
          console.log(`Retrying after error: ${error.code}`);
          throw error;
        }
        
        bail(error);
      }
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 100,
      maxTimeout: 1000
    }
  );
}
```

### 2. Loose Coupling

**Use asynchronous patterns:**
- Event-driven architecture
- Message queues (SQS)
- Event buses (EventBridge)
- Streaming (Kinesis)

**Example: Event-Driven Architecture**
```yaml
Resources:
  # Producer: API Gateway + Lambda
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Environment:
        Variables:
          EVENT_BUS_NAME: !Ref AppEventBus
          
  # Event Bus
  AppEventBus:
    Type: AWS::Events::EventBus
    Properties:
      Name: udacity-app-events
      
  # Consumer 1: Email notification
  EmailRule:
    Type: AWS::Events::Rule
    Properties:
      EventBusName: !Ref AppEventBus
      EventPattern:
        source: [udacity.app]
        detail-type: [UserCreated]
      Targets:
        - Arn: !GetAtt EmailFunction.Arn
          Id: EmailTarget
          
  # Consumer 2: Analytics
  AnalyticsRule:
    Type: AWS::Events::Rule
    Properties:
      EventBusName: !Ref AppEventBus
      EventPattern:
        source: [udacity.app]
      Targets:
        - Arn: !GetAtt AnalyticsStream.Arn
          Id: AnalyticsTarget
```

### 3. Redundancy and Replication

**Multi-AZ deployment:**
```yaml
Resources:
  # Application Load Balancer (multi-AZ by default)
  LoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref SubnetAZ1
        - !Ref SubnetAZ2
        - !Ref SubnetAZ3
      Type: application
      
  # ECS Service with multi-AZ tasks
  ECSService:
    Type: AWS::ECS::Service
    Properties:
      Cluster: !Ref ECSCluster
      DesiredCount: 6  # 2 per AZ
      TaskDefinition: !Ref TaskDefinition
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets:
            - !Ref SubnetAZ1
            - !Ref SubnetAZ2
            - !Ref SubnetAZ3
          
  # DynamoDB with global tables (multi-region)
  GlobalTable:
    Type: AWS::DynamoDB::GlobalTable
    Properties:
      TableName: UdacityGlobalTable
      Replicas:
        - Region: us-east-1
        - Region: us-west-2
        - Region: eu-west-1
```

### 4. Graceful Degradation

**Implement fallbacks:**
```javascript
async function getUserData(userId) {
  try {
    // Try primary data source
    return await fetchFromDynamoDB(userId);
  } catch (error) {
    console.warn('Primary source failed, trying cache', error);
    
    try {
      // Fallback to cache
      return await fetchFromElastiCache(userId);
    } catch (cacheError) {
      console.warn('Cache failed, using default', cacheError);
      
      // Fallback to default
      return getDefaultUserData();
    }
  }
}

async function searchDocuments(query) {
  try {
    // Try full-text search service
    return await elasticsearchQuery(query);
  } catch (error) {
    console.warn('Elasticsearch unavailable, using DynamoDB scan', error);
    
    // Degraded: Use slower DynamoDB scan
    return await dynamoDBScan(query);
  }
}
```

### 5. Rate Limiting and Throttling

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// API-level rate limiting
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis.createClient({
      host: process.env.REDIS_HOST
    })
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

// Per-user rate limiting
const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: async (req) => {
    // Premium users get higher limits
    const user = await getUser(req.userId);
    return user.isPremium ? 1000 : 100;
  },
  keyGenerator: (req) => req.userId
});

app.use('/api/', apiLimiter);
app.use('/api/user/', userLimiter);
```

## 🔄 Resilience Patterns

### 1. Circuit Breaker

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }
  
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.warn(`Circuit breaker opened. Next attempt at ${new Date(this.nextAttempt)}`);
    }
  }
}

// Usage
const externalApiBreaker = new CircuitBreaker(5, 60000);

async function callExternalAPI(data) {
  return await externalApiBreaker.call(async () => {
    const response = await fetch('https://external-api.example.com', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  });
}
```

### 2. Bulkhead Pattern

Isolate resources to prevent cascading failures:

```yaml
Resources:
  # Separate Lambda functions for different operations
  CriticalFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: udacity-critical-operations
      ReservedConcurrentExecutions: 500  # Guaranteed capacity
      
  StandardFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: udacity-standard-operations
      ReservedConcurrentExecutions: 300
      
  BatchFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: udacity-batch-operations
      ReservedConcurrentExecutions: 200
      
  # No reserved concurrency - uses unreserved account pool
  LowPriorityFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: udacity-low-priority
```

### 3. Timeout and Deadline

```javascript
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

// Lambda handler with deadline tracking
exports.handler = async (event, context) => {
  const deadline = context.getRemainingTimeInMillis();
  const safetyBuffer = 1000; // Leave 1s for cleanup
  const availableTime = deadline - safetyBuffer;
  
  console.log(`Available time: ${availableTime}ms`);
  
  try {
    return await Promise.race([
      processEvent(event),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Deadline exceeded')), availableTime)
      )
    ]);
  } catch (error) {
    console.error('Error or timeout:', error);
    // Save partial results or queue for retry
    await savePartialProgress(event);
    throw error;
  }
};
```

### 4. Idempotency

```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function idempotentOperation(idempotencyKey, operation) {
  const tableName = 'IdempotencyTable';
  const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  
  // Check if already processed
  const existing = await dynamodb.get({
    TableName: tableName,
    Key: { idempotencyKey }
  }).promise();
  
  if (existing.Item) {
    console.log('Operation already processed, returning cached result');
    return existing.Item.result;
  }
  
  // Execute operation
  try {
    const result = await operation();
    
    // Store result
    await dynamodb.put({
      TableName: tableName,
      Item: {
        idempotencyKey,
        result,
        timestamp: Date.now(),
        ttl
      },
      ConditionExpression: 'attribute_not_exists(idempotencyKey)' // Prevent race conditions
    }).promise();
    
    return result;
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      // Race condition: another instance already processed
      const item = await dynamodb.get({
        TableName: tableName,
        Key: { idempotencyKey }
      }).promise();
      return item.Item.result;
    }
    throw error;
  }
}

// Usage in API handler
exports.handler = async (event) => {
  const idempotencyKey = event.headers['Idempotency-Key'] || 
                         `${event.userId}-${event.requestId}`;
  
  return await idempotentOperation(idempotencyKey, async () => {
    // Actual business logic
    return await createOrder(event.body);
  });
};
```

## 🌍 High Availability Architecture

### Multi-Region Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Route 53 (DNS)                          │
│                  Health Check + Failover                     │
└────────────┬──────────────────────────┬─────────────────────┘
             │                          │
    ┌────────▼─────────┐       ┌───────▼──────────┐
    │   us-east-1      │       │   us-west-2      │
    │   (Primary)      │       │   (Secondary)    │
    ├──────────────────┤       ├──────────────────┤
    │  CloudFront      │       │  CloudFront      │
    │  ↓               │       │  ↓               │
    │  ALB (Multi-AZ)  │       │  ALB (Multi-AZ)  │
    │  ↓               │       │  ↓               │
    │  ECS/Lambda      │       │  ECS/Lambda      │
    │  ↓               │       │  ↓               │
    │  DynamoDB        │←──────┤  DynamoDB        │
    │  (Global Table)  │       │  (Global Table)  │
    └──────────────────┘       └──────────────────┘
```

**CloudFormation for Multi-Region:**

```yaml
# Primary Region (us-east-1)
Resources:
  GlobalTable:
    Type: AWS::DynamoDB::GlobalTable
    Properties:
      TableName: UdacityApp
      AttributeDefinitions:
        - AttributeName: pk
          AttributeType: S
        - AttributeName: sk
          AttributeType: S
      KeySchema:
        - AttributeName: pk
          KeyType: HASH
        - AttributeName: sk
          KeyType: RANGE
      BillingMode: PAY_PER_REQUEST
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Replicas:
        - Region: us-east-1
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
        - Region: us-west-2
          PointInTimeRecoverySpecification:
            PointInTimeRecoveryEnabled: true
            
  HealthCheckEndpoint:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      Code:
        ZipFile: |
          exports.handler = async () => {
            // Check regional health
            const isHealthy = await checkDependencies();
            return {
              statusCode: isHealthy ? 200 : 503,
              body: JSON.stringify({ status: isHealthy ? 'healthy' : 'unhealthy' })
            };
          };
          
  Route53HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Type: HTTPS
        ResourcePath: /health
        FullyQualifiedDomainName: !GetAtt ApiDomain.RegionalDomainName
        Port: 443
        RequestInterval: 30
        FailureThreshold: 3
        
  DNSFailover:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: api.example.com
      Type: A
      SetIdentifier: us-east-1
      Failover: PRIMARY
      HealthCheckId: !Ref Route53HealthCheck
      AliasTarget:
        HostedZoneId: !GetAtt LoadBalancer.CanonicalHostedZoneID
        DNSName: !GetAtt LoadBalancer.DNSName
```

### Data Replication Strategies

#### 1. Active-Active (Both regions serve traffic)
- **Pros**: Maximum availability, load distribution
- **Cons**: Complex conflict resolution, eventual consistency
- **Use case**: Global applications, read-heavy workloads

#### 2. Active-Passive (Primary + standby)
- **Pros**: Simpler conflict resolution, strong consistency
- **Cons**: Unused capacity in secondary, longer failover
- **Use case**: Mission-critical apps, financial systems

#### 3. Active-Active with Read Replicas
- **Pros**: Fast reads globally, simpler than full active-active
- **Cons**: Write latency, replication lag
- **Use case**: Read-heavy with centralized writes

## 💾 Backup and Disaster Recovery

### Backup Strategy

```yaml
Resources:
  # DynamoDB point-in-time recovery
  BackupTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: UdacityData
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      
  # DynamoDB on-demand backups
  BackupPlan:
    Type: AWS::Backup::BackupPlan
    Properties:
      BackupPlan:
        BackupPlanName: DynamoDBDailyBackup
        BackupPlanRule:
          - RuleName: DailyBackups
            TargetBackupVault: !Ref BackupVault
            ScheduleExpression: "cron(0 2 * * ? *)"  # 2 AM daily
            StartWindowMinutes: 60
            CompletionWindowMinutes: 120
            Lifecycle:
              DeleteAfterDays: 30
              MoveToColdStorageAfterDays: 7
              
  BackupVault:
    Type: AWS::Backup::BackupVault
    Properties:
      BackupVaultName: UdacityBackups
      
  # S3 versioning and cross-region replication
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: udacity-data
      VersioningConfiguration:
        Status: Enabled
      ReplicationConfiguration:
        Role: !GetAtt ReplicationRole.Arn
        Rules:
          - Id: ReplicateAll
            Status: Enabled
            Priority: 1
            Destination:
              Bucket: !GetAtt ReplicaBucket.Arn
              StorageClass: STANDARD_IA
```

### Recovery Point Objective (RPO) / Recovery Time Objective (RTO)

| Tier | RPO | RTO | Strategy | Cost |
|------|-----|-----|----------|------|
| **Tier 1 - Critical** | < 1 minute | < 5 minutes | Multi-region active-active, sync replication | $$$$ |
| **Tier 2 - Important** | < 1 hour | < 1 hour | Multi-region active-passive, frequent backups | $$$ |
| **Tier 3 - Standard** | < 24 hours | < 4 hours | Single region multi-AZ, daily backups | $$ |
| **Tier 4 - Low Priority** | < 7 days | < 24 hours | Single AZ, weekly backups | $ |

### Disaster Recovery Runbook

See [disaster-recovery-runbook.md](./disaster-recovery-runbook.md)

## 📊 Architecture Decision Records (ADRs)

### ADR Template

```markdown
# ADR-001: Use DynamoDB for User Data Storage

## Status
Accepted

## Context
Need to choose a database for storing user profile data. Requirements:
- Millions of users
- Low latency (<10ms reads)
- Highly available (99.99%)
- Global distribution
- Flexible schema

## Options Considered
1. RDS PostgreSQL
2. Aurora Global Database
3. DynamoDB with Global Tables

## Decision
Use DynamoDB with Global Tables

## Consequences
**Positive:**
- Sub-10ms latency
- Auto-scaling included
- Multi-region replication built-in
- No server management

**Negative:**
- NoSQL requires data modeling changes
- Query flexibility limited vs SQL
- Cost per request vs RDS fixed cost

**Neutral:**
- Team needs to learn DynamoDB best practices

## Implementation
- Use single-table design
- Partition key: userId
- GSI for email lookups
- Enable PITR and global tables
```

## 🔗 Related Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [Disaster Recovery Runbook](./disaster-recovery-runbook.md)
- [Resilience Patterns Catalog](./resilience-patterns.md)
