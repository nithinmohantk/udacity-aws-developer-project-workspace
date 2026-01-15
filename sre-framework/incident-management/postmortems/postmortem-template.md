# Postmortem Template

**Incident Date:** [YYYY-MM-DD]  
**Incident Duration:** [X hours Y minutes]  
**Severity:** [SEV-1 | SEV-2 | SEV-3]  
**Status:** [Draft | Under Review | Published]  
**Authors:** [Names]  
**Reviewers:** [Names]

---

## Executive Summary

Brief 2-3 sentence summary of what happened, the impact, and the resolution.

**Example:**
> On January 15, 2024, between 10:15-11:45 UTC, our API experienced elevated error rates affecting approximately 15% of requests. The issue was caused by a Lambda function exceeding its memory limit due to a memory leak introduced in a recent deployment. The problem was resolved by rolling back to the previous version.

---

## Impact

### User Impact
- **Affected Users:** [Number or percentage of users]
- **Affected Regions:** [Geographic regions or all]
- **Duration:** [Start time - End time in UTC]
- **Functionality Affected:** [List of features/endpoints]

### Business Impact
- **Failed Requests:** [Number]
- **Revenue Impact:** [Estimated $ or "Not applicable"]
- **SLO Impact:** [How much error budget consumed]
- **Customer Complaints:** [Number of support tickets]

### Example
```
User Impact:
- Affected Users: ~5,000 users (15% of active users)
- Affected Regions: US-East-1 (primary region)
- Duration: 10:15 UTC - 11:45 UTC (1 hour 30 minutes)
- Functionality Affected: User authentication, document uploads

Business Impact:
- Failed Requests: 12,450 API calls
- Revenue Impact: Estimated $3,500 in lost premium subscriptions
- SLO Impact: Consumed 65% of monthly error budget
- Customer Complaints: 23 support tickets
```

---

## Timeline

All times in UTC. Include both automated and manual events.

| Time | Event | Type |
|------|-------|------|
| 10:05 | Deployment of v2.4.5 to production started | Change |
| 10:10 | Deployment completed | Change |
| 10:15 | First 5xx errors detected | Detection |
| 10:18 | CloudWatch alarm triggered for high error rate | Detection |
| 10:20 | On-call engineer acknowledged alert | Response |
| 10:25 | Incident declared SEV-2, war room established | Response |
| 10:30 | Status page updated - "Investigating" | Communication |
| 10:35 | Root cause identified: Lambda OOM errors | Investigation |
| 10:40 | Decision made to rollback deployment | Mitigation |
| 10:45 | Rollback initiated | Mitigation |
| 10:50 | Rollback completed | Mitigation |
| 10:55 | Error rates returning to normal | Recovery |
| 11:15 | Monitoring period started | Recovery |
| 11:45 | Incident declared resolved | Resolution |
| 11:50 | Status page updated - "Resolved" | Communication |

---

## Root Cause Analysis

### What Happened

Detailed technical explanation of the root cause. Include:
- The specific component that failed
- Why it failed
- Why it wasn't caught earlier

**Example:**
```
The Lambda function udacity-user-service was updated in v2.4.5 to include 
a new feature for caching user sessions. The implementation had a memory 
leak where session objects were stored in a module-level cache but never 
cleaned up.

As the function processed requests, memory usage grew continuously. After 
approximately 5 minutes of production traffic, functions began hitting the 
512MB memory limit and crashing with OOM errors.

The issue wasn't caught in testing because:
1. Load tests only ran for 2 minutes (not long enough for leak to manifest)
2. Memory monitoring was not part of the test suite
3. The function memory limit in staging (1GB) masked the issue
```

### Contributing Factors

List factors that made this incident more likely or severe:

1. **Inadequate Testing:** Load tests duration too short to catch memory leaks
2. **Configuration Drift:** Production and staging had different memory limits
3. **Monitoring Gap:** No alerting on Lambda memory usage trends
4. **Deployment Process:** No gradual rollout or canary deployment

---

## What Went Well

Positive aspects of the response:

✅ Alert fired within 3 minutes of first errors  
✅ On-call engineer responded in under 5 minutes  
✅ Root cause identified quickly using CloudWatch Logs  
✅ Rollback procedure was smooth and well-documented  
✅ Communication cadence was consistent  
✅ No data loss or corruption  

---

## What Went Wrong

Issues that made the incident worse or slowed response:

❌ Memory leak not caught in testing  
❌ Different configuration between staging and production  
❌ No memory usage alerting  
❌ Deployment went straight to 100% of traffic  
❌ Initial alert description was vague ("High error rate")  
❌ Rollback required manual steps (not automated)  

---

## Action Items

All action items must have an owner and due date. Prioritize by impact.

### Prevent

Actions to prevent this specific issue from happening again:

| Action | Owner | Due Date | Priority | Status |
|--------|-------|----------|----------|--------|
| Add memory usage monitoring and alerting to all Lambda functions | @engineer1 | 2024-01-22 | P0 | ✅ Done |
| Extend load test duration to 15 minutes minimum | @engineer2 | 2024-01-20 | P0 | 🟡 In Progress |
| Implement memory profiling in CI/CD pipeline | @engineer3 | 2024-01-25 | P1 | ⬜ To Do |
| Standardize memory limits across environments | @engineer1 | 2024-01-18 | P0 | ✅ Done |

### Detect

Actions to detect similar issues faster:

| Action | Owner | Due Date | Priority | Status |
|--------|-------|----------|----------|--------|
| Add Lambda memory usage to main dashboard | @engineer2 | 2024-01-19 | P0 | ✅ Done |
| Create composite alarm for Lambda health (errors + memory + duration) | @engineer1 | 2024-01-20 | P1 | 🟡 In Progress |
| Improve alert descriptions with direct links to dashboards | @engineer3 | 2024-01-22 | P2 | ⬜ To Do |

### Respond

Actions to improve incident response:

| Action | Owner | Due Date | Priority | Status |
|--------|-------|----------|----------|--------|
| Automate Lambda rollback procedure | @engineer2 | 2024-01-25 | P0 | 🟡 In Progress |
| Update Lambda runbook with memory troubleshooting | @engineer1 | 2024-01-17 | P1 | ✅ Done |
| Create Lambda deployment checklist | @engineer3 | 2024-01-20 | P2 | ⬜ To Do |

### Improve

General improvements not specific to this incident:

| Action | Owner | Due Date | Priority | Status |
|--------|-------|----------|----------|--------|
| Implement canary deployments for all Lambda functions | @engineer2 | 2024-02-01 | P1 | ⬜ To Do |
| Create memory leak detection tool for Node.js | @engineer3 | 2024-02-10 | P2 | ⬜ To Do |

---

## Lessons Learned

### Technical Learnings

1. **Memory leaks manifest differently under load**
   - Short tests won't catch gradual leaks
   - Need long-running tests with realistic traffic patterns

2. **Configuration consistency is critical**
   - Production environment should match staging
   - Document and validate environment parity

3. **Defensive programming for Lambda**
   - Always implement cleanup in module scope
   - Consider memory constraints in design
   - Use WeakMap for caching when appropriate

### Process Learnings

1. **Testing must include resource monitoring**
   - CPU, memory, and disk should be validated
   - Thresholds should trigger test failures

2. **Gradual rollouts are essential**
   - Even "small" changes can have big impacts
   - Canary deployments catch issues early

3. **Alerts need context**
   - "High error rate" doesn't tell the full story
   - Include affected service, recent changes, quick links

---

## Follow-up

### Postmortem Review Meeting

**Date:** 2024-01-17  
**Attendees:** Engineering team, Product Manager, Engineering Manager  
**Recording:** [Link to recording]  

**Key Discussion Points:**
- Agreement on P0 action items
- Decision to implement canary deployments for all services
- Quarterly review of environment configurations

### Knowledge Sharing

- [ ] Postmortem shared in #engineering Slack channel
- [ ] Added to postmortem library with tags: `lambda`, `memory-leak`, `deployment`
- [ ] Presented in weekly engineering all-hands
- [ ] Added to onboarding materials for new engineers

### Success Metrics

How we'll know our action items were effective:

1. **Prevention:** Zero memory-related incidents in next 90 days
2. **Detection:** MTTD for Lambda issues < 3 minutes
3. **Response:** All Lambda rollbacks automated within 60 days
4. **Impact:** Lambda-related incidents don't exceed SEV-3

---

## References

- [Incident Timeline Document](https://docs.google.com/document/d/...)
- [CloudWatch Logs During Incident](https://console.aws.amazon.com/cloudwatch/...)
- [X-Ray Traces](https://console.aws.amazon.com/xray/...)
- [Related Deployment](https://github.com/org/repo/releases/tag/v2.4.5)
- [Slack Incident Channel Archive](https://slack.com/archives/...)

---

## Appendix

### Detailed Metrics

```
Total Requests During Incident: 82,450
Failed Requests: 12,450 (15.1%)
Average Error Rate: 15.1%
Peak Error Rate: 28.3% (at 10:25 UTC)
Average Latency (successful): 245ms (normal: 180ms)
P99 Latency (successful): 1,250ms (normal: 450ms)
```

### Code Changes

The problematic code in v2.4.5:

```javascript
// Module-level cache (the problem)
const sessionCache = {};

exports.handler = async (event) => {
  const userId = event.userId;
  
  // Store in cache but never clean up
  sessionCache[userId] = {
    data: event.sessionData,
    timestamp: Date.now()
  };
  
  // ... rest of handler
};
```

The fix in v2.4.6:

```javascript
// Use WeakMap for automatic garbage collection
const sessionCache = new WeakMap();

// Or implement TTL-based cleanup
const sessionCache = {};
setInterval(() => {
  const now = Date.now();
  Object.keys(sessionCache).forEach(key => {
    if (now - sessionCache[key].timestamp > 300000) { // 5 min TTL
      delete sessionCache[key];
    }
  });
}, 60000); // Clean up every minute
```

---

**Document Status:** Published  
**Last Updated:** 2024-01-17  
**Next Review:** 2024-04-17 (Quarterly)
