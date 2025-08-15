# CI/CD and Build Automation Interview Questions

## 🟢 Beginner Level Questions

### 1. What is CI/CD and why is it important?
**Answer:**
- **CI (Continuous Integration)**: Practice of frequently merging code changes into a shared repository, followed by automated builds and tests
- **CD (Continuous Delivery/Deployment)**: Automated deployment of validated code changes to production or staging environments

**Benefits:**
- Faster feedback loops
- Reduced integration issues
- Consistent and reliable deployments
- Improved code quality
- Faster time to market

### 2. Explain the difference between Continuous Delivery and Continuous Deployment
**Answer:**
- **Continuous Delivery**: Code changes are automatically prepared for production deployment but require manual approval
- **Continuous Deployment**: Code changes are automatically deployed to production without manual intervention

### 3. What are the key stages in a typical CI/CD pipeline?
**Answer:**
1. **Source Control**: Code commit triggers pipeline
2. **Build**: Compile code and create artifacts
3. **Test**: Run automated tests (unit, integration, functional)
4. **Package**: Create deployable packages/containers
5. **Deploy**: Deploy to staging/production environments
6. **Monitor**: Track application performance and health

### 4. What is the purpose of automated testing in CI/CD?
**Answer:**
- Catch bugs early in development cycle
- Ensure code quality and functionality
- Prevent regression issues
- Enable confident deployments
- Reduce manual testing effort

## 🟡 Intermediate Level Questions

### 5. How would you implement a CI/CD pipeline for a microservices architecture?
**Answer:**
```yaml
# Example GitHub Actions workflow
name: Microservices CI/CD
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.changes.outputs.services }}
    steps:
      - uses: actions/checkout@v3
      - id: changes
        run: |
          # Detect which services have changed
          echo "services=$(git diff --name-only HEAD~1 | grep -E '^services/' | cut -d'/' -f2 | sort -u | jq -R -s -c 'split("\n")[:-1]')" >> $GITHUB_OUTPUT

  build-and-test:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
    steps:
      - uses: actions/checkout@v3
      - name: Build ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          docker build -t ${{ matrix.service }}:${{ github.sha }} .
      - name: Test ${{ matrix.service }}
        run: |
          cd services/${{ matrix.service }}
          npm test
```

**Key considerations:**
- Service-specific pipelines
- Dependency management between services
- Parallel builds and testing
- Selective deployment based on changes
- Integration testing across services

### 6. What are blue-green deployments and when would you use them?
**Answer:**
**Blue-Green Deployment** maintains two identical production environments (blue and green).

**Process:**
1. Current traffic goes to blue environment
2. Deploy new version to green environment
3. Test green environment thoroughly
4. Switch traffic from blue to green
5. Keep blue as backup for quick rollback

**Benefits:**
- Zero-downtime deployments
- Instant rollback capability
- Full production testing before switch
- Risk mitigation

**Use cases:**
- Critical production applications
- Applications requiring zero downtime
- When you need instant rollback capability

### 7. How do you handle secrets and sensitive data in CI/CD pipelines?
**Answer:**
**Best Practices:**
1. **External Secret Management**:
   ```yaml
   # GitHub Actions example
   - name: Deploy to AWS
     env:
       AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
       AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
   ```

2. **Use dedicated secret stores**:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Kubernetes Secrets

3. **Principle of least privilege**
4. **Rotation of secrets**
5. **Audit and monitoring**

## 🔴 Advanced Level Questions

### 8. Design a CI/CD strategy for a company with multiple teams and environments
**Answer:**
**Multi-branch Strategy:**
```
├── feature/* → Feature environment (PR-based)
├── develop → Development environment
├── staging → Staging environment
├── main → Production environment
```

**Pipeline Strategy:**
1. **Feature Branches**: Automated testing and ephemeral environments
2. **Development**: Continuous deployment for integration testing
3. **Staging**: Production-like testing with manual gates
4. **Production**: Automated deployment with monitoring

**Governance:**
- Branch protection rules
- Required reviews and approvals
- Automated security scanning
- Compliance checks
- Deployment windows

### 9. How would you implement canary deployments in a Kubernetes environment?
**Answer:**
```yaml
# Canary deployment with Istio
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: app-canary
spec:
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: app-service
        subset: canary
  - route:
    - destination:
        host: app-service
        subset: stable
      weight: 90
    - destination:
        host: app-service
        subset: canary
      weight: 10
```

**Implementation steps:**
1. Deploy canary version alongside stable
2. Route small percentage of traffic to canary
3. Monitor metrics (error rates, latency, business KPIs)
4. Gradually increase traffic to canary
5. Full rollout or rollback based on metrics

### 10. How do you ensure pipeline security and prevent supply chain attacks?
**Answer:**
**Security Measures:**
1. **Secure the CI/CD infrastructure**:
   - Use secure runners/agents
   - Network isolation
   - Regular patching

2. **Code and dependency scanning**:
   ```yaml
   - name: Run Semgrep
     uses: returntocorp/semgrep-action@v1
   - name: Dependency check
     uses: dependency-check/Dependency-Check_Action@main
   ```

3. **Artifact integrity**:
   - Sign containers and artifacts
   - Use immutable artifact storage
   - Verify checksums

4. **Access controls**:
   - RBAC for pipeline access
   - Audit logs
   - Principle of least privilege

## 🛠️ Practical Exercises

### Exercise 1: Set up a CI/CD pipeline for a Node.js application
Create a GitHub Actions workflow that:
- Runs tests on multiple Node.js versions
- Builds a Docker image
- Pushes to container registry
- Deploys to staging environment

### Exercise 2: Implement deployment strategies
Set up both blue-green and canary deployment strategies for a sample application.

### Exercise 3: Pipeline troubleshooting
Debug common CI/CD pipeline failures and implement solutions.

## 🔗 Real-world Examples

Check out the practical implementations in this repository:
- [GitHub Actions Workflows](../../.github/workflows/)
- [Travis CI Configuration](../../.travis.yml)
- [Microservices CI/CD](../../project/c2-microservices-v1/)

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jenkins Pipeline Documentation](https://www.jenkins.io/doc/book/pipeline/)
- [AWS CodePipeline](https://aws.amazon.com/codepipeline/)
- [Azure DevOps Pipelines](https://azure.microsoft.com/en-us/services/devops/pipelines/)