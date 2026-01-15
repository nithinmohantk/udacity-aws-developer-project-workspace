# Incident Management

Comprehensive incident management framework including runbooks, postmortems, and learning processes.

## 📋 Overview

Effective incident management requires:
1. **Prevention** - Proactive measures to avoid incidents
2. **Detection** - Early identification of issues
3. **Response** - Rapid and effective mitigation
4. **Recovery** - Return to normal operations
5. **Learning** - Continuous improvement

## 🚨 Incident Response Process

### Incident Severity Levels

| Severity | Definition | Response | Examples |
|----------|------------|----------|----------|
| **SEV-1** | Critical business impact | All hands, immediate response | Complete outage, data breach, major security incident |
| **SEV-2** | Significant degradation | On-call engineer + manager | Elevated errors, partial outage, significant slowdown |
| **SEV-3** | Minor impact | On-call engineer | Intermittent errors, minor performance issues |
| **SEV-4** | Minimal impact | Normal priority | Cosmetic issues, logging errors |

### Response Timeline

```
Detection → Triage → Investigation → Mitigation → Recovery → Postmortem

SEV-1: <5 min → <10 min → Ongoing → <1 hour → Document
SEV-2: <15 min → <30 min → Ongoing → <4 hours → Document  
SEV-3: <1 hour → <2 hours → Next day OK → <24 hours → Optional
```

### Incident Roles

#### Incident Commander (IC)
- Overall incident coordination
- Communication with stakeholders
- Decision-making authority
- Declares incident severity
- Calls for additional resources

#### Subject Matter Expert (SME)
- Technical investigation
- Implements fixes
- Provides status updates
- Documents actions taken

#### Communications Lead
- Status page updates
- Customer communications
- Internal stakeholder updates
- Creates communication templates

#### Scribe
- Documents timeline
- Records actions and decisions
- Captures chat/call highlights
- Prepares postmortem draft

## 📞 On-Call Guidelines

### On-Call Schedule

```
Primary On-Call: 7-day rotation
Secondary On-Call: Escalation backup
Manager On-Call: SEV-1 escalation

Rotation Schedule:
Week 1: Engineer A (primary), Engineer B (secondary)
Week 2: Engineer B (primary), Engineer C (secondary)
Week 3: Engineer C (primary), Engineer A (secondary)
```

### Escalation Path

```
1. Alert triggers → Primary On-Call (5 min timeout)
2. No acknowledgment → Secondary On-Call (5 min timeout)
3. No acknowledgment → Engineering Manager
4. SEV-1 incidents → Immediately escalate to Manager + Team Lead
```

### On-Call Best Practices

1. **Before Your Shift**
   - Review recent incidents
   - Test alert notifications
   - Ensure VPN and access working
   - Review runbooks

2. **During Your Shift**
   - Respond within 5 minutes
   - Follow runbooks
   - Document all actions
   - Escalate when needed
   - Take breaks on long incidents

3. **After Your Shift**
   - Hand off ongoing issues
   - Update runbooks
   - Complete postmortems

### On-Call Compensation
- Additional pay for on-call hours
- Time off after major incidents
- Rotation limits (max 1 week/month)

## 📚 Runbook Index

| Service | Runbook | Severity | Common Issues |
|---------|---------|----------|---------------|
| API Gateway | [api-gateway-runbook.md](runbooks/api-gateway-runbook.md) | SEV-1/2 | 5xx errors, throttling |
| Lambda | [lambda-runbook.md](runbooks/lambda-runbook.md) | SEV-1/2 | Timeouts, out of memory |
| DynamoDB | [dynamodb-runbook.md](runbooks/dynamodb-runbook.md) | SEV-1/2 | Throttling, capacity |
| S3 | [s3-runbook.md](runbooks/s3-runbook.md) | SEV-2/3 | Access errors, missing objects |
| CloudFront | [cloudfront-runbook.md](runbooks/cloudfront-runbook.md) | SEV-2 | Cache issues, origin errors |
| ECS | [ecs-runbook.md](runbooks/ecs-runbook.md) | SEV-1/2 | Task failures, scaling issues |

## 📝 Postmortem Process

### When to Write a Postmortem

**Always required:**
- SEV-1 incidents (within 48 hours)
- SEV-2 incidents (within 1 week)
- Any customer data impact
- Security incidents

**Optional:**
- SEV-3 incidents with learning value
- Near-misses that could have been severe

### Postmortem Template

See [postmortem-template.md](postmortems/postmortem-template.md)

### Postmortem Meeting

**Attendees:**
- Incident responders
- Team lead
- Engineering manager
- Product stakeholder (if customer impact)

**Agenda (60 minutes):**
1. Timeline review (15 min)
2. What went well (10 min)
3. What went wrong (15 min)
4. Action items (15 min)
5. Lessons learned (5 min)

**Principles:**
- **Blameless** - Focus on systems, not people
- **Factual** - Stick to timeline and data
- **Actionable** - Concrete improvements
- **Learning** - Share knowledge

### Action Items

All action items must have:
- Clear owner
- Due date
- Priority (P0-P3)
- Success criteria

Track in project management tool and review weekly.

## 📊 Incident Metrics

### Key Metrics

1. **MTTD** (Mean Time To Detect)
   - Time from incident start to detection
   - Target: < 5 minutes

2. **MTTA** (Mean Time To Acknowledge)
   - Time from alert to engineer acknowledgment
   - Target: < 5 minutes

3. **MTTI** (Mean Time To Investigate)
   - Time from acknowledgment to root cause
   - Target: < 30 minutes (SEV-1)

4. **MTTR** (Mean Time To Resolve)
   - Time from detection to resolution
   - Target: < 1 hour (SEV-1), < 4 hours (SEV-2)

5. **MTBF** (Mean Time Between Failures)
   - Time between incidents
   - Target: Increasing trend

### Monthly Incident Review

Track and review:
- Incident count by severity
- Top 5 root causes
- Action item completion rate
- MTTR trends
- Repeat incidents (same root cause)

### Incident Dashboard

```sql
-- CloudWatch Logs Insights query for incident metrics
fields @timestamp, severity, duration, rootCause
| filter eventType = "incident"
| stats count() as incidents by severity
| sort incidents desc

-- Calculate MTTR by severity
fields @timestamp, severity, detectionTime, resolutionTime
| filter eventType = "incident"
| stats avg(resolutionTime - detectionTime) as avgMTTR by severity
```

## 🎓 Learning and Improvement

### Incident Review Cadence

- **Daily**: Active incident updates
- **Weekly**: Review new postmortems, track action items
- **Monthly**: Metrics review, trend analysis
- **Quarterly**: Process improvements, training updates

### Knowledge Sharing

1. **Postmortem Library**
   - Searchable repository
   - Tag by service, root cause
   - Reference in runbooks

2. **Incident Simulations**
   - Quarterly game days
   - Practice with runbooks
   - Test escalations
   - Chaos engineering

3. **Runbook Maintenance**
   - Update after each use
   - Quarterly review
   - Archive outdated runbooks
   - Add screenshots/diagrams

### Continuous Improvement

**Prevention Focus:**
- What can we automate?
- What monitoring was missing?
- What documentation would have helped?
- What testing would have caught this?

**Detection Focus:**
- Were our alerts effective?
- Did we detect quickly enough?
- Were symptoms clear?
- Do we need better dashboards?

**Response Focus:**
- Were runbooks helpful?
- Was communication effective?
- Did we have the right tools?
- Was escalation smooth?

## 🔗 Communication Templates

### Status Page Update

```
[INVESTIGATING] Service Degradation - API Response Times

We are currently investigating elevated API response times affecting 
approximately 15% of requests. Our team is actively working to identify 
and resolve the issue.

Posted: 2024-01-15 10:30 UTC
Next update: 2024-01-15 11:00 UTC
```

### Customer Email Template

```
Subject: [Resolved] Service Disruption - January 15, 2024

Dear Customer,

We experienced a service disruption today between 10:15 UTC and 11:45 UTC 
that may have affected your ability to access our API.

What happened:
A configuration change caused elevated error rates in our authentication service.

Impact:
Approximately 15% of API requests failed during this window.

Resolution:
The configuration was rolled back and service is now fully restored.

Next steps:
We are conducting a full investigation and will implement additional 
safeguards to prevent similar issues.

We sincerely apologize for the inconvenience.

- The Engineering Team
```

## 📋 Incident Checklist

### During Incident
- [ ] Incident severity assigned
- [ ] Incident commander identified
- [ ] War room/bridge established
- [ ] Status page updated
- [ ] Timeline being documented
- [ ] Actions being recorded
- [ ] Stakeholders notified

### After Resolution
- [ ] Resolution confirmed
- [ ] Status page updated
- [ ] Customer communication sent (if applicable)
- [ ] Postmortem scheduled
- [ ] Action items created
- [ ] Runbook updated

### Postmortem
- [ ] Postmortem written within SLA
- [ ] Review meeting held
- [ ] Action items assigned with owners
- [ ] Lessons learned documented
- [ ] Knowledge base updated

## 🔗 Related Resources

- [Incident Response Runbook](runbooks/incident-response.md)
- [Postmortem Template](postmortems/postmortem-template.md)
- [Communication Templates](communication-templates.md)
- [PagerDuty Integration](tools/pagerduty-integration.md)
