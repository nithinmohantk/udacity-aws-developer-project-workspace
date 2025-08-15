# Security in CI/CD Pipeline Interview Questions

## 🟢 Beginner Level Questions

### 1. What is DevSecOps and how does it differ from traditional security approaches?
**Answer:**
**DevSecOps** integrates security practices into the DevOps pipeline from the beginning ("shift left" approach).

**Traditional Security:**
- Security as an afterthought
- Separate security team reviews
- Manual security testing
- Security gates at the end

**DevSecOps:**
- Security from day one
- Automated security testing
- Shared responsibility model
- Continuous security monitoring
- Security as code

**Benefits:**
- Early vulnerability detection
- Faster remediation
- Reduced security debt
- Better compliance

### 2. What are the key security practices in a CI/CD pipeline?
**Answer:**
1. **Source Code Security**:
   - Static Application Security Testing (SAST)
   - Secret scanning
   - License compliance checking

2. **Build Security**:
   - Dependency vulnerability scanning
   - Container image scanning
   - Secure build environments

3. **Deployment Security**:
   - Dynamic Application Security Testing (DAST)
   - Infrastructure security scanning
   - Runtime security monitoring

4. **Access Control**:
   - RBAC for pipeline access
   - Secure credential management
   - Audit logging

### 3. What is SAST vs DAST vs IAST?
**Answer:**
**SAST (Static Application Security Testing):**
- Analyzes source code without execution
- Finds vulnerabilities like SQL injection, XSS
- Early in development cycle
- Examples: SonarQube, Checkmarx, Semgrep

**DAST (Dynamic Application Security Testing):**
- Tests running application
- Black-box testing approach
- Finds runtime vulnerabilities
- Examples: OWASP ZAP, Burp Suite

**IAST (Interactive Application Security Testing):**
- Combines SAST and DAST
- Real-time analysis during testing
- Lower false positives
- Examples: Contrast Security, Veracode

### 4. How do you secure secrets in CI/CD pipelines?
**Answer:**
**Best Practices:**
1. **Never store secrets in code**
2. **Use dedicated secret managers**
3. **Principle of least privilege**
4. **Regular rotation**
5. **Audit access**

**Implementation:**
```yaml
# GitHub Actions example
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  run: deploy.sh
```

## 🟡 Intermediate Level Questions

### 5. Design a secure CI/CD pipeline with security gates
**Answer:**
```yaml
name: Secure CI/CD Pipeline

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      # 1. Secret Scanning
      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD

      # 2. SAST - Static Code Analysis
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

      # 3. Dependency Scanning
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build-and-scan:
    needs: security-scan
    runs-on: ubuntu-latest
    steps:
      # 4. Secure Build
      - name: Build Docker Image
        run: |
          docker build -t myapp:${{ github.sha }} .
          
      # 5. Container Scanning
      - name: Scan Docker Image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      # 6. Upload Security Results
      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  deploy:
    needs: build-and-scan
    runs-on: ubuntu-latest
    steps:
      # 7. Infrastructure Security
      - name: Terraform Security Scan
        uses: aquasecurity/tfsec-action@v1.0.0
        
      # 8. Deploy with security monitoring
      - name: Deploy to Production
        run: |
          # Deploy only if all security checks pass
          kubectl apply -f k8s/
```

### 6. How would you implement container security best practices?
**Answer:**

**1. Secure Base Images:**
```dockerfile
# Use minimal, distroless images
FROM gcr.io/distroless/java:11

# Don't run as root
USER 1000:1000

# Use multi-stage builds
FROM node:16-alpine AS builder
COPY package*.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs:16
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["dist/server.js"]
```

**2. Image Scanning:**
```bash
# Trivy scanning
trivy image myapp:latest

# Snyk container scanning
snyk container test myapp:latest

# Aqua Security scanning
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image myapp:latest
```

**3. Runtime Security:**
```yaml
# Kubernetes Pod Security Standards
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
```

### 7. What is Infrastructure as Code (IaC) security?
**Answer:**

**IaC Security Scanning:**
```bash
# Terraform security
tfsec .
checkov -f main.tf

# AWS CloudFormation
cfn-lint template.yaml
cfn_nag_scan --input-path .

# Kubernetes manifests
kube-score score k8s-manifests/
kubesec scan pod.yaml
```

**Security Policies as Code:**
```hcl
# Terraform - Security Group with restricted access
resource "aws_security_group" "web" {
  name_prefix = "web-sg"
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Deny SSH from internet
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/8"]  # Only internal network
  }
}
```

**Policy Validation:**
```yaml
# Open Policy Agent (OPA) Gatekeeper
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredsecuritycontext
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredSecurityContext
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredsecuritycontext
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot
          msg := "Container must run as non-root user"
        }
```

## 🔴 Advanced Level Questions

### 8. How do you implement zero-trust security in a CI/CD pipeline?
**Answer:**

**Zero-Trust Principles:**
1. **Never trust, always verify**
2. **Least privilege access**
3. **Assume breach**
4. **Continuous monitoring**

**Implementation:**
```yaml
# Zero-Trust CI/CD Architecture
Pipeline Security:
  Authentication:
    - OIDC tokens for cloud access
    - Mutual TLS for service communication
    - Time-bound credentials
    
  Authorization:
    - RBAC with minimal permissions
    - Resource-specific access tokens
    - Just-in-time access
    
  Network Security:
    - Private build agents
    - VPN/Private endpoints
    - Network segmentation
    
  Runtime Protection:
    - Runtime security monitoring
    - Behavioral analysis
    - Incident response automation
```

**Example Implementation:**
```yaml
# GitHub Actions with OIDC
permissions:
  id-token: write
  contents: read

steps:
  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v2
    with:
      role-to-assume: arn:aws:iam::123456789012:role/GitHubActions-Role
      role-session-name: GitHubActions-Deploy
      aws-region: us-east-1
      # No long-lived credentials needed!
```

### 9. Design a comprehensive security monitoring strategy
**Answer:**

**Multi-layer Security Monitoring:**
```yaml
Monitoring Stack:
  Infrastructure:
    - AWS CloudTrail (API calls)
    - VPC Flow Logs (network traffic)
    - GuardDuty (threat detection)
    
  Application:
    - AWS WAF (web application firewall)
    - Application logs analysis
    - User behavior analytics
    
  Container:
    - Falco (runtime security)
    - Istio security policies
    - Container image monitoring
    
  Pipeline:
    - Pipeline execution logs
    - Security scan results
    - Access audit trails
```

**Security Alerting:**
```python
# Security event correlation
import boto3
import json

def lambda_handler(event, context):
    # Parse CloudWatch security events
    for record in event['Records']:
        message = json.loads(record['Sns']['Message'])
        
        if message['eventName'] == 'ConsoleLogin':
            # Detect suspicious login patterns
            if detect_anomaly(message):
                send_alert({
                    'severity': 'HIGH',
                    'event': message,
                    'action': 'investigate'
                })
    
    return {'statusCode': 200}

def detect_anomaly(event):
    # Implement anomaly detection logic
    # - Unusual location
    # - Off-hours access
    # - Failed attempts
    pass
```

### 10. How do you implement compliance automation in DevOps?
**Answer:**

**Compliance as Code:**
```yaml
# AWS Config Rules for compliance
Resources:
  S3BucketEncryptionRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: s3-bucket-server-side-encryption-enabled
      Source:
        Owner: AWS
        SourceIdentifier: S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED

  EC2SecurityGroupRule:
    Type: AWS::Config::ConfigRule
    Properties:
      ConfigRuleName: ec2-security-group-attached-to-eni
      Source:
        Owner: AWS
        SourceIdentifier: EC2_SECURITY_GROUP_ATTACHED_TO_ENI
```

**Continuous Compliance Testing:**
```bash
#!/bin/bash
# Compliance testing script

# Test 1: Ensure all S3 buckets are encrypted
aws s3api list-buckets --query 'Buckets[*].Name' --output text | \
while read bucket; do
    encryption=$(aws s3api get-bucket-encryption --bucket $bucket 2>/dev/null)
    if [ -z "$encryption" ]; then
        echo "FAIL: Bucket $bucket is not encrypted"
        exit 1
    fi
done

# Test 2: Verify security groups don't allow 0.0.0.0/0 on SSH
aws ec2 describe-security-groups --query 'SecurityGroups[*]' | \
jq '.[] | select(.IpPermissions[]? | select(.FromPort == 22 and .IpRanges[]?.CidrIp == "0.0.0.0/0"))' | \
if [ ! -z "$(cat)" ]; then
    echo "FAIL: Security group allows SSH from anywhere"
    exit 1
fi

echo "All compliance tests passed"
```

**Automated Remediation:**
```python
# AWS Lambda for automated remediation
import boto3

def lambda_handler(event, context):
    # Parse Config rule evaluation
    config_item = event['configurationItem']
    
    if config_item['resourceType'] == 'AWS::S3::Bucket':
        if not is_bucket_encrypted(config_item['resourceId']):
            # Auto-remediate: Enable encryption
            enable_bucket_encryption(config_item['resourceId'])
            
            # Create ticket for review
            create_remediation_ticket({
                'resource': config_item['resourceId'],
                'action': 'enabled_encryption',
                'timestamp': context.aws_request_id
            })
    
    return {'statusCode': 200}
```

### 11. How do you secure microservices communication?
**Answer:**

**Service Mesh Security with Istio:**
```yaml
# Mutual TLS between services
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT

# Authorization policies
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: payment-service-policy
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment-service
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/order-service"]
  - to:
    - operation:
        methods: ["POST"]
        paths: ["/api/v1/payments"]
```

**API Gateway Security:**
```yaml
# Kong API Gateway configuration
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: rate-limiting
plugin: rate-limiting
config:
  minute: 100
  hour: 1000

---
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: jwt-auth
plugin: jwt
config:
  secret_is_base64: false
```

## 🛠️ Security Testing Tools

### SAST Tools
```bash
# Semgrep - Multiple languages
semgrep --config=auto .

# SonarQube - Code quality and security
sonar-scanner -Dsonar.projectKey=myproject

# Bandit - Python security
bandit -r ./src/
```

### DAST Tools
```bash
# OWASP ZAP
zap-baseline.py -t https://myapp.com

# Nuclei - Vulnerability scanner
nuclei -u https://myapp.com -t exposures/

# SQLMap - SQL injection testing
sqlmap -u "https://myapp.com/api/users?id=1"
```

### Container Security
```bash
# Trivy - Comprehensive scanner
trivy image nginx:latest

# Grype - Vulnerability scanner
grype nginx:latest

# Syft - SBOM generation
syft packages nginx:latest
```

## 🔗 Real-world Examples

Security implementations in this repository:
- [Semgrep Security Scanning](../../.github/workflows/semgrep.yml)
- [Container Security Examples](../../project/c2-microservices-v1/udacity-c2-deployment/docker/)
- [AWS Security Configurations](../../project/)

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [DevSecOps Manifesto](https://www.devsecops.org/)