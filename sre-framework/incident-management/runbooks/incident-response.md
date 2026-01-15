# Incident Response Runbook

## 🎯 Purpose

This runbook provides step-by-step procedures for responding to production incidents in the Udacity AWS Developer project workspace.

## 🚨 Initial Response (First 5 Minutes)

### 1. Acknowledge the Alert

```bash
# PagerDuty (if configured)
- Click "Acknowledge" in PagerDuty app/email
- Or reply "ack" to SMS

# CloudWatch Alarms
- Verify alert in AWS Console → CloudWatch → Alarms
- Check alarm history and current state
```

### 2. Assess Severity

Use the following criteria:

| Indicator | SEV-1 | SEV-2 | SEV-3 |
|-----------|-------|-------|-------|
| Users affected | >50% | 10-50% | <10% |
| Core functionality | Complete outage | Degraded | Minor issue |
| Data impact | Data loss | Data delay | Display issue |
| Workaround | None | Complex | Simple |

### 3. Establish Communication

**For SEV-1:**
```
1. Post in #incidents Slack channel:
   "🚨 SEV-1: [Brief description]
   IC: @yourname
   Status: Investigating
   War room: [Zoom/Teams link]"

2. Update status page (if public-facing)
3. Notify engineering manager
4. Start incident timeline doc
```

**For SEV-2/3:**
```
1. Post in #incidents Slack channel
2. Begin investigation
3. Update if escalation needed
```

## 🔍 Investigation Phase

### Step 1: Check Service Health

```bash
# Check CloudWatch Dashboard
aws cloudwatch get-dashboard --dashboard-name UdacityServiceHealth

# Check recent deployments
aws lambda list-functions --query 'Functions[?LastModified>=`2024-01-15T00:00:00`]'

# Check API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions Name=ApiName,Value=udacity-api \
  --start-time 2024-01-15T10:00:00Z \
  --end-time 2024-01-15T11:00:00Z \
  --period 300 \
  --statistics Sum
```

### Step 2: Review Logs

```bash
# CloudWatch Logs Insights queries

# Find recent errors (last 1 hour)
fields @timestamp, @message, level, error
| filter level = "ERROR"
| sort @timestamp desc
| limit 100

# Find Lambda errors
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)

# Find API Gateway errors
fields @timestamp, status, path
| filter status >= 500
| stats count() by path
```

### Step 3: Check Dependencies

```bash
# DynamoDB status
aws dynamodb describe-table --table-name UdacityUsersTable

# Check for throttling
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name UserErrors \
  --dimensions Name=TableName,Value=UdacityUsersTable \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum

# Check S3 status
aws s3api head-bucket --bucket udacity-static-assets

# Check external API dependencies
curl -I https://external-api.example.com/health
```

### Step 4: Identify Scope

Questions to answer:
- [ ] Which service is affected?
- [ ] What percentage of requests are failing?
- [ ] Are all endpoints affected or specific ones?
- [ ] Are all regions affected?
- [ ] When did the issue start?
- [ ] Was there a recent deployment?
- [ ] Are there any related alerts?

## 🛠️ Mitigation Actions

### Quick Wins (Try These First)

#### 1. Rollback Recent Deployment

```bash
# Lambda function rollback
# List versions
aws lambda list-versions-by-function --function-name udacity-user-service

# Update alias to previous version
aws lambda update-alias \
  --function-name udacity-user-service \
  --name prod \
  --function-version 23

# Verify rollback
aws lambda get-alias --function-name udacity-user-service --name prod
```

#### 2. Increase Capacity

```bash
# Increase Lambda reserved concurrency
aws lambda put-function-concurrency \
  --function-name udacity-user-service \
  --reserved-concurrent-executions 500

# Increase DynamoDB capacity (if not using on-demand)
aws dynamodb update-table \
  --table-name UdacityUsersTable \
  --provisioned-throughput ReadCapacityUnits=100,WriteCapacityUnits=100
```

#### 3. Clear Cache/Restart

```bash
# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Force ECS service deployment (restarts tasks)
aws ecs update-service \
  --cluster udacity-cluster \
  --service udacity-microservice \
  --force-new-deployment
```

#### 4. Enable Maintenance Mode

```bash
# Update API Gateway to return 503 with maintenance message
# (Prepare this Lambda in advance)
aws lambda update-function-configuration \
  --function-name udacity-api-handler \
  --environment Variables={MAINTENANCE_MODE=true}
```

### Service-Specific Procedures

#### API Gateway Issues

```bash
# Check throttling limits
aws apigateway get-account

# Increase throttle limit (if needed)
aws apigateway update-account \
  --patch-operations op=replace,path=/throttle/rateLimit,value=10000

# Check stage settings
aws apigateway get-stage \
  --rest-api-id abc123 \
  --stage-name prod
```

#### Lambda Issues

**Timeouts:**
```bash
# Increase timeout
aws lambda update-function-configuration \
  --function-name udacity-user-service \
  --timeout 30
```

**Out of Memory:**
```bash
# Increase memory (also increases CPU)
aws lambda update-function-configuration \
  --function-name udacity-user-service \
  --memory-size 1024
```

**Concurrency Issues:**
```bash
# Check current concurrency
aws lambda get-function-concurrency \
  --function-name udacity-user-service

# Increase reserved concurrency
aws lambda put-function-concurrency \
  --function-name udacity-user-service \
  --reserved-concurrent-executions 200
```

#### DynamoDB Issues

**Throttling:**
```bash
# Switch to on-demand mode (if using provisioned)
aws dynamodb update-table \
  --table-name UdacityUsersTable \
  --billing-mode PAY_PER_REQUEST

# Or increase provisioned capacity
aws dynamodb update-table \
  --table-name UdacityUsersTable \
  --provisioned-throughput ReadCapacityUnits=200,WriteCapacityUnits=200
```

**Hot Partition:**
```
1. Identify hot partition in CloudWatch metrics
2. Consider adding random suffix to partition key
3. Enable DynamoDB Accelerator (DAX) if read-heavy
```

#### S3 Issues

```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket udacity-static-assets

# Check CORS configuration
aws s3api get-bucket-cors --bucket udacity-static-assets

# Check for bucket versioning issues
aws s3api get-bucket-versioning --bucket udacity-static-assets

# List recent objects
aws s3 ls s3://udacity-static-assets/ --recursive --human-readable --summarize
```

## 📢 Communication Updates

### Status Update Template

```
⏰ [HH:MM UTC] Update

Status: [INVESTIGATING | IDENTIFIED | MONITORING | RESOLVED]

Impact: [Brief description]

Current Action: [What we're doing now]

Next Update: [Time]
```

### Example Updates

```
⏰ 10:45 UTC Update
Status: INVESTIGATING
Impact: API requests timing out for ~20% of users
Current Action: Reviewing recent Lambda deployments
Next Update: 11:00 UTC

⏰ 11:15 UTC Update
Status: IDENTIFIED
Impact: API requests timing out for ~20% of users
Root Cause: Lambda function memory limit reached due to memory leak
Current Action: Rolling back to previous version
Next Update: 11:30 UTC

⏰ 11:30 UTC Update
Status: MONITORING
Impact: Resolved - API response times back to normal
Current Action: Monitoring for 30 minutes to confirm stability
Next Update: 12:00 UTC or if issues recur
```

## ✅ Resolution and Recovery

### Verification Steps

1. **Check Metrics**
   ```bash
   # Verify error rate decreased
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ApiGateway \
     --metric-name 5XXError \
     --dimensions Name=ApiName,Value=udacity-api \
     --start-time $(date -u -d '30 minutes ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Sum
   ```

2. **Manual Testing**
   ```bash
   # Test critical endpoints
   curl -i https://api.example.com/health
   curl -i https://api.example.com/users/123
   curl -i -X POST https://api.example.com/orders
   ```

3. **Monitor for 30 Minutes**
   - Watch dashboards
   - Check error logs
   - Verify no new alerts

### Close Incident

1. **Final Status Update**
   ```
   ✅ [HH:MM UTC] RESOLVED
   
   The issue has been resolved. All services are operating normally.
   
   Root Cause: [Brief explanation]
   Resolution: [What we did]
   
   A detailed postmortem will be published within 48 hours.
   ```

2. **Update Status Page**
   - Mark as resolved
   - Add resolution summary

3. **Internal Communication**
   ```
   Incident resolved!
   Duration: [X hours Y minutes]
   Impact: [Summary]
   
   Action items:
   - [ ] Postmortem by [Owner] due [Date]
   - [ ] Fix [Specific issue] by [Owner] due [Date]
   
   Thanks to everyone who helped! 🙏
   ```

## 📋 Post-Incident Tasks

- [ ] Schedule postmortem meeting within 48 hours
- [ ] Create postmortem document from template
- [ ] Document timeline and actions taken
- [ ] Create action items with owners and due dates
- [ ] Update runbooks based on learnings
- [ ] Update monitoring/alerting if gaps identified
- [ ] Send customer communication if needed

## 📞 Escalation Contacts

| Role | Contact | When to Escalate |
|------|---------|------------------|
| Engineering Manager | [Contact] | SEV-1, can't resolve in 30 min |
| Team Lead | [Contact] | Need additional resources |
| Database Admin | [Contact] | DynamoDB/RDS issues |
| Security Team | [Contact] | Potential security incident |
| CTO | [Contact] | Major outage, media attention |

## 🔗 Quick Links

- [CloudWatch Dashboard](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:)
- [CloudWatch Logs Insights](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs-insights:)
- [X-Ray Service Map](https://console.aws.amazon.com/xray/home?region=us-east-1#/service-map)
- [Lambda Console](https://console.aws.amazon.com/lambda/home?region=us-east-1)
- [API Gateway Console](https://console.aws.amazon.com/apigateway/home?region=us-east-1)
- [DynamoDB Console](https://console.aws.amazon.com/dynamodb/home?region=us-east-1)
- [Status Page](https://status.example.com)
- [Incident Timeline Doc](https://docs.google.com/document/d/...)

## 📚 Related Runbooks

- [Lambda Runbook](lambda-runbook.md)
- [API Gateway Runbook](api-gateway-runbook.md)
- [DynamoDB Runbook](dynamodb-runbook.md)
- [S3 Runbook](s3-runbook.md)
