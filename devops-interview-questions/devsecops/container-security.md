# Container and Image Security Interview Questions

## 🟢 Beginner Level Questions

### 1. What are the main security concerns with containers?
**Answer:**
**Container Security Challenges:**
1. **Shared Kernel**: Containers share the host OS kernel
2. **Image Vulnerabilities**: Base images may contain security flaws
3. **Runtime Security**: Malicious code execution in containers
4. **Network Isolation**: Container-to-container communication risks
5. **Privilege Escalation**: Containers running with excessive privileges
6. **Data Persistence**: Sensitive data in container layers

### 2. How do you secure Docker images?
**Answer:**
**Image Security Best Practices:**

1. **Use Official Base Images:**
```dockerfile
# Good: Official minimal image
FROM node:16-alpine

# Better: Distroless image
FROM gcr.io/distroless/nodejs:16

# Avoid: Latest tags
FROM node:latest  # Don't do this
```

2. **Minimize Attack Surface:**
```dockerfile
# Multi-stage build to reduce image size
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM gcr.io/distroless/nodejs:16
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["dist/server.js"]
```

3. **Don't Run as Root:**
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Switch to non-root user
USER nodejs
```

### 3. What tools can you use to scan container images for vulnerabilities?
**Answer:**
**Container Scanning Tools:**

1. **Trivy (Aqua Security):**
```bash
# Scan image for vulnerabilities
trivy image nginx:latest

# Scan with specific severity
trivy image --severity HIGH,CRITICAL nginx:latest

# Generate report
trivy image --format json --output report.json nginx:latest
```

2. **Snyk:**
```bash
# Container scanning
snyk container test nginx:latest

# Monitor for new vulnerabilities
snyk container monitor nginx:latest
```

3. **Clair:**
```bash
# Run Clair scanner
clairctl analyze nginx:latest
```

## 🟡 Intermediate Level Questions

### 4. How do you implement container runtime security?
**Answer:**

**Runtime Security Measures:**

1. **Security Contexts in Kubernetes:**
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
        add:
        - NET_BIND_SERVICE
    resources:
      limits:
        memory: "128Mi"
        cpu: "500m"
```

2. **Pod Security Standards:**
```yaml
# Namespace with Pod Security Standards
apiVersion: v1
kind: Namespace
metadata:
  name: secure-namespace
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

3. **Network Policies:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### 5. What is Falco and how does it help with container security?
**Answer:**
**Falco** is a runtime security monitoring tool that detects anomalous behavior in containers.

**Key Features:**
- Kernel-level monitoring
- Real-time threat detection
- Custom rule engine
- Integration with SIEM systems

**Installation:**
```bash
# Install Falco on Kubernetes
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm install falco falcosecurity/falco \
  --set falco.grpc.enabled=true \
  --set falco.grpcOutput.enabled=true
```

**Custom Rules:**
```yaml
# Custom Falco rule
- rule: Detect crypto mining
  desc: Detect cryptocurrency mining activities
  condition: >
    spawned_process and
    (proc.name in (xmrig, minergate, cpuminer) or
     proc.cmdline contains "stratum+tcp")
  output: >
    Crypto mining detected (user=%user.name command=%proc.cmdline 
    container=%container.name image=%container.image.repository)
  priority: CRITICAL
  tags: [cryptocurrency, mining, security]
```

### 6. How do you implement image signing and verification?
**Answer:**

**Docker Content Trust:**
```bash
# Enable Docker Content Trust
export DOCKER_CONTENT_TRUST=1

# Push signed image
docker push myregistry/myapp:v1.0

# Verify signature on pull
docker pull myregistry/myapp:v1.0
```

**Notary for Image Signing:**
```bash
# Initialize repository
notary init myregistry/myapp

# Add targets
notary add myregistry/myapp v1.0 --roles targets

# Publish changes
notary publish myregistry/myapp
```

**Cosign (Sigstore):**
```bash
# Generate key pair
cosign generate-key-pair

# Sign container image
cosign sign --key cosign.key myregistry/myapp:v1.0

# Verify signature
cosign verify --key cosign.pub myregistry/myapp:v1.0
```

## 🔴 Advanced Level Questions

### 7. Design a comprehensive container security strategy
**Answer:**

**Multi-layered Container Security:**

```yaml
# Security Pipeline Integration
name: Container Security Pipeline

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      # 1. Code security scanning
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
      
      # 2. Build secure image
      - name: Build Docker image
        run: |
          docker build -t myapp:${{ github.sha }} .
          
      # 3. Vulnerability scanning
      - name: Run Trivy scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      # 4. Upload security results
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
      # 5. Sign image
      - name: Install Cosign
        uses: sigstore/cosign-installer@v2
        
      - name: Sign container image
        run: |
          cosign sign --key ${{ secrets.COSIGN_PRIVATE_KEY }} \
            myapp:${{ github.sha }}
            
      # 6. Security policy validation
      - name: Validate security policies
        run: |
          opa test security-policies/
```

**Runtime Security Architecture:**
```yaml
# Kubernetes security stack
Security Layers:
  1. Admission Controllers:
     - Pod Security Standards
     - OPA Gatekeeper
     - Falco Admission Controller
     
  2. Runtime Monitoring:
     - Falco (behavioral monitoring)
     - Sysdig Secure
     - Aqua Security
     
  3. Network Security:
     - Calico Network Policies
     - Istio Service Mesh
     - Zero-trust networking
     
  4. Image Security:
     - Harbor Registry with vulnerability scanning
     - Notary for image signing
     - Admission webhooks for image validation
```

### 8. How do you implement zero-trust container security?
**Answer:**

**Zero-Trust Container Security Model:**

1. **Identity-based Security:**
```yaml
# Service Account with RBAC
apiVersion: v1
kind: ServiceAccount
metadata:
  name: myapp-sa
  namespace: production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: myapp-role
rules:
- apiGroups: [""]
  resources: ["configmaps"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: myapp-binding
subjects:
- kind: ServiceAccount
  name: myapp-sa
roleRef:
  kind: Role
  name: myapp-role
  apiGroup: rbac.authorization.k8s.io
```

2. **Workload Identity:**
```yaml
# Azure Workload Identity
apiVersion: v1
kind: ServiceAccount
metadata:
  name: myapp-sa
  annotations:
    azure.workload.identity/client-id: 12345678-1234-1234-1234-123456789012
  labels:
    azure.workload.identity/use: "true"
```

3. **Mutual TLS with Service Mesh:**
```yaml
# Istio PeerAuthentication
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
  namespace: production
spec:
  mtls:
    mode: STRICT
---
# AuthorizationPolicy
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: myapp-authz
  namespace: production
spec:
  selector:
    matchLabels:
      app: myapp
  rules:
  - from:
    - source:
        principals: ["cluster.local/ns/production/sa/frontend-sa"]
  - to:
    - operation:
        methods: ["GET", "POST"]
```

### 9. How do you handle secrets in containerized applications?
**Answer:**

**Secrets Management Strategies:**

1. **Kubernetes Secrets with External Secret Operator:**
```yaml
# External Secret
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  refreshInterval: 1m
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: app-secrets
    creationPolicy: Owner
  data:
  - secretKey: database-password
    remoteRef:
      key: secret/myapp
      property: db_password
---
# SecretStore configuration
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: "https://vault.company.com"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "myapp-role"
```

2. **Init Containers for Secret Retrieval:**
```yaml
apiVersion: v1
kind: Pod
spec:
  initContainers:
  - name: secret-fetcher
    image: vault:latest
    command:
    - sh
    - -c
    - |
      vault auth -method=kubernetes role=myapp
      vault kv get -field=password secret/myapp > /shared/db-password
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  containers:
  - name: app
    image: myapp:latest
    env:
    - name: DB_PASSWORD_FILE
      value: /shared/db-password
    volumeMounts:
    - name: shared-data
      mountPath: /shared
  volumes:
  - name: shared-data
    emptyDir: {}
```

3. **Sidecar Pattern:**
```yaml
# Vault Agent Sidecar
containers:
- name: vault-agent
  image: vault:latest
  command:
  - vault
  - agent
  - -config=/vault/config/agent.hcl
  volumeMounts:
  - name: vault-config
    mountPath: /vault/config
  - name: shared-secrets
    mountPath: /vault/secrets

- name: app
  image: myapp:latest
  volumeMounts:
  - name: shared-secrets
    mountPath: /etc/secrets
```

### 10. How do you implement container compliance and governance?
**Answer:**

**Compliance Framework:**

1. **Policy as Code with OPA Gatekeeper:**
```yaml
# ConstraintTemplate for required security context
apiVersion: templates.gatekeeper.sh/v1beta1
kind: ConstraintTemplate
metadata:
  name: k8srequiredsecuritycontext
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredSecurityContext
      validation:
        properties:
          runAsNonRoot:
            type: boolean
  targets:
    - target: admission.k8s.gatekeeper.sh
      rego: |
        package k8srequiredsecuritycontext
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          not container.securityContext.runAsNonRoot == true
          msg := sprintf("Container %v must run as non-root user", [container.name])
        }
        
        violation[{"msg": msg}] {
          container := input.review.object.spec.containers[_]
          container.securityContext.allowPrivilegeEscalation == true
          msg := sprintf("Container %v must not allow privilege escalation", [container.name])
        }
---
# Constraint instance
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredSecurityContext
metadata:
  name: must-run-as-nonroot
spec:
  match:
    kinds:
      - apiGroups: [""]
        kinds: ["Pod"]
  parameters:
    runAsNonRoot: true
```

2. **Compliance Scanning:**
```bash
# CIS Kubernetes Benchmark with kube-bench
kube-bench --config-dir /etc/kube-bench --config kube-bench.yaml

# Polaris for best practice validation
polaris audit --config polaris-config.yaml

# Falco compliance rules
falco --rules-file /etc/falco/compliance-rules.yaml
```

3. **Automated Remediation:**
```python
# Kubernetes operator for compliance
import kopf
import kubernetes

@kopf.on.create('v1', 'pods')
def ensure_security_context(spec, name, namespace, **kwargs):
    """Ensure pods have proper security context"""
    v1 = kubernetes.client.CoreV1Api()
    
    # Check if pod has security context
    if not spec.get('securityContext', {}).get('runAsNonRoot'):
        # Update pod to run as non-root
        patch = {
            'spec': {
                'securityContext': {
                    'runAsNonRoot': True,
                    'runAsUser': 1000
                }
            }
        }
        
        v1.patch_namespaced_pod(
            name=name,
            namespace=namespace,
            body=patch
        )
        
        kopf.info(f"Updated pod {name} to run as non-root")
```

## 🛠️ Container Security Tools

### Image Scanning
```bash
# Trivy - Comprehensive vulnerability scanner
trivy image --severity HIGH,CRITICAL nginx:latest

# Grype - Anchore's vulnerability scanner
grype nginx:latest

# Snyk - Developer security platform
snyk container test nginx:latest

# Clair - Static analysis for vulnerabilities
clairctl analyze nginx:latest
```

### Runtime Security
```bash
# Falco - Runtime security monitoring
sudo falco -r /etc/falco/falco_rules.yaml

# Sysdig - Container monitoring and security
sysdig-inspect

# Aqua Security - Container security platform
aqua-scanner

# Twistlock/Prisma Cloud - Container security
prisma-cloud-compute-console
```

### Policy Enforcement
```bash
# Open Policy Agent
opa test policy/

# Gatekeeper
kubectl apply -f gatekeeper-constraints.yaml

# Polaris - Best practices validation
polaris audit --config polaris.yaml
```

## 🔗 Real-world Examples

Security implementations in this repository:
- [Container Security in CI/CD](../../.github/workflows/semgrep.yml)
- [Secure Docker Configurations](../../project/c2-microservices-v1/udacity-c2-deployment/docker/)
- [Kubernetes Security Examples](../../project/c2-microservices-v1/udacity-c2-deployment/k8s-final/)

## 📚 Security Resources

- [NIST Container Security Guide](https://csrc.nist.gov/publications/detail/sp/800-190/final)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [OWASP Container Security](https://owasp.org/www-project-docker-top-10/)