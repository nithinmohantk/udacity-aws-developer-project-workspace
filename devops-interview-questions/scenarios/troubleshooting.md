# Troubleshooting Common Issues

## 🚨 Common DevOps Scenarios and Solutions

### Scenario 1: CI/CD Pipeline Failures

#### Problem: "Pipeline Randomly Fails with Network Timeouts"
**Symptoms:**
- Intermittent build failures
- Network connection errors
- Dependency download timeouts

**Troubleshooting Steps:**
```bash
# 1. Check network connectivity
curl -I https://registry.npmjs.org/
ping 8.8.8.8

# 2. Review DNS resolution
nslookup registry.npmjs.org
dig registry.npmjs.org

# 3. Check for rate limiting
curl -I https://api.github.com/rate_limit

# 4. Validate proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY
```

**Solutions:**
1. **Implement retry logic:**
```yaml
# GitHub Actions with retry
- name: Install dependencies
  uses: nick-invision/retry@v2
  with:
    timeout_minutes: 10
    max_attempts: 3
    command: npm install
```

2. **Use dependency caching:**
```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

3. **Configure timeouts:**
```yaml
jobs:
  build:
    timeout-minutes: 30
    steps:
      - name: Install with timeout
        run: timeout 600 npm install
```

#### Problem: "Tests Pass Locally but Fail in CI"
**Root Causes:**
- Environment differences
- Time zone issues
- File system case sensitivity
- Race conditions

**Investigation:**
```bash
# Compare environments
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "OS: $(uname -a)"
echo "Time zone: $(date)"
echo "Environment variables:"
env | grep -E "^(NODE_|NPM_|PATH)"

# Check for timing issues
npm test -- --verbose --detectOpenHandles
```

**Solutions:**
```yaml
# Standardize environment
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '16.x'
    registry-url: 'https://registry.npmjs.org'

# Set timezone
- name: Set timezone
  run: |
    sudo timedatectl set-timezone UTC
    
# Run tests with debugging
- name: Run tests
  run: |
    npm test -- --verbose --forceExit
  env:
    NODE_ENV: test
    TZ: UTC
```

### Scenario 2: Container and Kubernetes Issues

#### Problem: "Pod Stuck in Pending State"
**Troubleshooting Commands:**
```bash
# Check pod status
kubectl describe pod <pod-name>

# Check node resources
kubectl top nodes
kubectl describe nodes

# Check resource quotas
kubectl describe resourcequota -n <namespace>

# Check persistent volume claims
kubectl get pvc -n <namespace>
```

**Common Causes and Solutions:**
1. **Insufficient Resources:**
```yaml
# Resource requests too high
resources:
  requests:
    memory: "64Mi"    # Reduced from 2Gi
    cpu: "250m"       # Reduced from 1000m
  limits:
    memory: "128Mi"
    cpu: "500m"
```

2. **Node Selector Issues:**
```bash
# Check node labels
kubectl get nodes --show-labels

# Fix node selector
kubectl patch deployment myapp -p '{"spec":{"template":{"spec":{"nodeSelector":null}}}}'
```

3. **Pod Security Policy:**
```yaml
# Fix security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  allowPrivilegeEscalation: false
```

#### Problem: "Container Keeps Restarting (CrashLoopBackOff)"
**Investigation:**
```bash
# Check logs
kubectl logs <pod-name> --previous
kubectl logs <pod-name> -c <container-name>

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp

# Check resource usage
kubectl top pod <pod-name>
```

**Common Issues:**
1. **Application Startup Issues:**
```dockerfile
# Fix health checks
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD curl -f http://localhost:8080/health || exit 1
```

2. **Resource Limits:**
```yaml
# Increase memory limits
resources:
  limits:
    memory: "1Gi"     # Increased from 512Mi
    cpu: "1000m"
```

3. **Configuration Issues:**
```yaml
# Fix environment variables
env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: db-secret
      key: url
```

### Scenario 3: Database and Storage Issues

#### Problem: "Database Connection Pool Exhaustion"
**Symptoms:**
- "Too many connections" errors
- Application timeouts
- High database CPU usage

**Investigation:**
```sql
-- Check active connections
SELECT COUNT(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Check connection by application
SELECT application_name, count(*) 
FROM pg_stat_activity 
GROUP BY application_name;

-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

**Solutions:**
1. **Optimize connection pooling:**
```javascript
// Node.js with proper connection pooling
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Always release connections
app.get('/users', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } finally {
    client.release();
  }
});
```

2. **Database optimization:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Update table statistics
ANALYZE users;

-- Check for table bloat
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Problem: "S3 Performance Issues"
**Symptoms:**
- Slow upload/download speeds
- HTTP 503 errors
- Request timeouts

**Troubleshooting:**
```bash
# Test S3 performance
aws s3 cp test-file.txt s3://bucket/test/ --debug

# Check S3 metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --dimensions Name=BucketName,Value=my-bucket \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

**Solutions:**
1. **Optimize request patterns:**
```python
# Use S3 Transfer Manager for large files
import boto3
from boto3.s3.transfer import TransferConfig

s3_client = boto3.client('s3')

# Configure multipart upload
config = TransferConfig(
    multipart_threshold=1024 * 25,  # 25MB
    max_concurrency=10,
    multipart_chunksize=1024 * 25,
    use_threads=True
)

# Upload with optimized settings
s3_client.upload_file(
    'large-file.zip', 
    'my-bucket', 
    'uploads/large-file.zip',
    Config=config
)
```

2. **Use CloudFront for better performance:**
```yaml
# CloudFormation template
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
        - DomainName: !GetAtt S3Bucket.DomainName
          Id: S3Origin
          S3OriginConfig:
            OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${OriginAccessIdentity}'
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # Managed-CachingOptimized
```

### Scenario 4: Performance and Scaling Issues

#### Problem: "Application Slow Under Load"
**Investigation Steps:**
```bash
# Check system resources
top
htop
iostat -x 1
sar -u 1 10

# Application profiling
# Node.js
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Check database performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user@example.com';
```

**Performance Optimization:**
1. **Application-level caching:**
```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient();

async function getUser(id) {
  // Check cache first
  const cached = await client.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Get from database
  const user = await database.getUser(id);
  
  // Cache for 5 minutes
  await client.setex(`user:${id}`, 300, JSON.stringify(user));
  
  return user;
}
```

2. **Database query optimization:**
```sql
-- Add appropriate indexes
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);

-- Use query optimization
EXPLAIN (ANALYZE, BUFFERS) 
SELECT o.*, u.name 
FROM orders o 
JOIN users u ON o.user_id = u.id 
WHERE o.created_at > NOW() - INTERVAL '30 days';
```

#### Problem: "Auto Scaling Not Working Properly"
**Troubleshooting:**
```bash
# Check Auto Scaling Groups
aws autoscaling describe-auto-scaling-groups \
  --auto-scaling-group-names my-asg

# Check scaling policies
aws autoscaling describe-policies \
  --auto-scaling-group-name my-asg

# Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=AutoScalingGroupName,Value=my-asg \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-01T01:00:00Z \
  --period 300 \
  --statistics Average
```

**Solutions:**
```yaml
# Improved Auto Scaling configuration
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    MinSize: 2
    MaxSize: 20
    DesiredCapacity: 3
    HealthCheckType: ELB
    HealthCheckGracePeriod: 300
    DefaultCooldown: 300

ScaleUpPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    PolicyType: StepScaling
    StepAdjustments:
    - MetricIntervalLowerBound: 0
      MetricIntervalUpperBound: 50
      ScalingAdjustment: 1
    - MetricIntervalLowerBound: 50
      ScalingAdjustment: 2

CPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmActions:
    - !Ref ScaleUpPolicy
    ComparisonOperator: GreaterThanThreshold
    EvaluationPeriods: 2
    MetricName: CPUUtilization
    Namespace: AWS/EC2
    Period: 60
    Statistic: Average
    Threshold: 70
```

### Scenario 5: Security Incidents

#### Problem: "Suspicious Network Activity Detected"
**Immediate Actions:**
```bash
# Check active connections
netstat -tulpn | grep ESTABLISHED
ss -tulpn

# Check for unusual processes
ps aux | sort -k3 -nr | head -10
top -c

# Check system logs
journalctl -f
tail -f /var/log/auth.log
tail -f /var/log/secure
```

**Investigation:**
```bash
# Network traffic analysis
tcpdump -i eth0 -n -c 100
iftop
nethogs

# Check for malware
rkhunter --check
chkrootkit

# File integrity check
aide --check
tripwire --check
```

**Containment and Response:**
1. **Isolate affected systems:**
```bash
# Block suspicious IPs
iptables -A INPUT -s SUSPICIOUS_IP -j DROP

# Disable compromised accounts
usermod -L suspicious_user
passwd -l suspicious_user
```

2. **Secure the environment:**
```bash
# Update systems
apt update && apt upgrade -y
yum update -y

# Change passwords
passwd root
passwd admin

# Review sudo access
visudo
```

#### Problem: "Secrets Exposed in Repository"
**Immediate Response:**
```bash
# Remove secrets from history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch config/secrets.yml' \
  --prune-empty --tag-name-filter cat -- --all

# Alternative: Use BFG Repo-Cleaner
java -jar bfg.jar --delete-files secrets.yml

# Force push to overwrite history
git push --force --all
git push --force --tags
```

**Prevention:**
```bash
# Install git-secrets
git secrets --register-aws
git secrets --install

# Pre-commit hooks
echo '#!/bin/bash
git secrets --scan' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 🛠️ Essential Troubleshooting Tools

### System Monitoring
```bash
# System performance
htop, top, atop
iotop, iftop, nethogs
vmstat, iostat, sar

# Network diagnostics
tcpdump, wireshark
nmap, ncat, netstat
dig, nslookup, host

# Log analysis
tail, grep, awk, sed
journalctl, logrotate
rsyslog, syslog-ng
```

### Container Tools
```bash
# Docker debugging
docker logs <container>
docker exec -it <container> /bin/bash
docker stats
docker system df

# Kubernetes debugging
kubectl logs, kubectl describe
kubectl exec, kubectl port-forward
kubectl top, kubectl get events
```

### Performance Profiling
```bash
# Application profiling
strace, ltrace
perf, gprof
valgrind, massif

# Database profiling
pg_stat_statements
slow query log
EXPLAIN ANALYZE
```

## 📊 Troubleshooting Methodologies

### 1. USE Method (Utilization, Saturation, Errors)
- Check resource utilization
- Identify saturation points
- Count error events

### 2. RED Method (Rate, Errors, Duration)
- Monitor request rate
- Track error rates
- Measure response duration

### 3. Scientific Method
1. **Observe** symptoms
2. **Hypothesize** causes
3. **Test** hypotheses
4. **Analyze** results
5. **Conclude** and document

## 🔗 Real-world Examples

Practice troubleshooting with examples from this repository:
- [CI/CD Pipeline Issues](../../.github/workflows/)
- [Container Deployment Problems](../../project/c2-microservices-v1/)
- [Application Performance](../../project/)

## 📚 Troubleshooting Resources

- [Linux Performance Tools](http://www.brendangregg.com/linuxperf.html)
- [Kubernetes Troubleshooting Guide](https://kubernetes.io/docs/tasks/debug-application-cluster/)
- [AWS Troubleshooting Guides](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-troubleshoot.html)
- [Docker Debug Guide](https://docs.docker.com/config/containers/logging/)