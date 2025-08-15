# Version Control and Git Interview Questions

## 🟢 Beginner Level Questions

### 1. What is version control and why is it important?
**Answer:**
Version control is a system that tracks changes to files over time, allowing you to:
- Track history of changes
- Collaborate with multiple developers
- Revert to previous versions
- Branch and merge code
- Identify who made specific changes
- Backup and recovery

### 2. Explain the difference between Git and GitHub
**Answer:**
- **Git**: Distributed version control system (software)
- **GitHub**: Cloud-based hosting service for Git repositories (platform)
- GitHub provides additional features like issue tracking, pull requests, project management

### 3. What are the basic Git commands every developer should know?
**Answer:**
```bash
# Basic commands
git init                    # Initialize a repository
git clone <url>            # Clone a repository
git add <file>             # Stage changes
git commit -m "message"    # Commit changes
git push                   # Push to remote
git pull                   # Pull from remote
git status                 # Check status
git log                    # View commit history

# Branching
git branch                 # List branches
git checkout -b <branch>   # Create and switch branch
git merge <branch>         # Merge branch
git branch -d <branch>     # Delete branch
```

### 4. What is a Git branch and why would you use branching?
**Answer:**
A Git branch is a movable pointer to a specific commit, allowing parallel development.

**Use cases:**
- Feature development
- Bug fixes
- Experimentation
- Release preparation
- Hotfixes

**Benefits:**
- Isolated development
- Parallel work
- Easy switching between features
- Safe experimentation

## 🟡 Intermediate Level Questions

### 5. Explain different Git workflow strategies
**Answer:**

**1. Git Flow:**
```
main (production)
├── develop (integration)
│   ├── feature/user-authentication
│   ├── feature/payment-system
│   └── release/v1.2
├── hotfix/critical-bug
```

**2. GitHub Flow:**
```
main (production)
├── feature/add-search
├── feature/update-ui
└── hotfix/fix-login
```

**3. GitLab Flow:**
```
main → pre-production → production
├── feature/new-dashboard
└── feature/api-improvements
```

### 6. What is the difference between merge and rebase?
**Answer:**

**Merge:**
```bash
git checkout main
git merge feature-branch
```
- Creates a merge commit
- Preserves commit history
- Non-destructive operation
- Shows when features were integrated

**Rebase:**
```bash
git checkout feature-branch
git rebase main
```
- Replays commits on top of target branch
- Creates linear history
- Rewrites commit history
- Cleaner project history

**When to use:**
- **Merge**: Public/shared branches, preserving context
- **Rebase**: Private branches, cleaning up history

### 7. How do you handle merge conflicts?
**Answer:**
```bash
# When conflict occurs
git status                 # See conflicted files
git diff                   # View conflicts

# Edit conflicted files, resolve markers:
<<<<<<< HEAD
Current branch content
=======
Incoming branch content
>>>>>>> branch-name

# After resolving
git add <resolved-files>
git commit                 # Complete merge
```

**Best practices:**
- Understand both versions before resolving
- Test after resolution
- Use merge tools (VS Code, GitKraken, etc.)
- Communicate with team about resolution

### 8. What are Git hooks and how would you use them?
**Answer:**
Git hooks are scripts triggered by Git events.

**Common hooks:**
```bash
# Pre-commit hook example
#!/bin/sh
# .git/hooks/pre-commit
npm run lint
npm run test
```

**Types:**
- **pre-commit**: Before commit creation
- **pre-push**: Before pushing to remote
- **post-merge**: After successful merge
- **pre-receive**: Before accepting pushed commits

**Use cases:**
- Code quality checks
- Automated testing
- Security scanning
- Commit message validation

## 🔴 Advanced Level Questions

### 9. Design a branching strategy for a large development team
**Answer:**

**Multi-environment Git Flow:**
```
main (production)
├── staging (pre-production)
├── develop (integration)
│   ├── feature/team-a/user-management
│   ├── feature/team-b/payment-gateway
│   ├── feature/team-c/reporting
├── release/v2.1.0
└── hotfix/security-patch
```

**Branch Protection Rules:**
```yaml
# .github/branch-protection.yml
protection_rules:
  main:
    required_status_checks:
      - continuous-integration
      - security-scan
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 2
      require_code_owner_reviews: true
```

**Policies:**
- Feature branches from develop
- Pull request mandatory for main/develop
- Automated testing required
- Code review by 2+ developers
- Branch naming conventions
- Commit message standards

### 10. How would you implement Git in a microservices architecture?
**Answer:**

**Strategies:**
1. **Monorepo**: Single repository for all services
2. **Polyrepo**: Separate repository per service
3. **Hybrid**: Core services in monorepo, others separate

**Monorepo structure:**
```
microservices-app/
├── services/
│   ├── user-service/
│   ├── payment-service/
│   ├── notification-service/
├── shared/
│   ├── libraries/
│   ├── configs/
├── deployment/
└── docs/
```

**Branching for microservices:**
```bash
# Service-specific branches
git checkout -b feature/user-service/oauth-integration
git checkout -b feature/payment-service/stripe-integration

# Cross-service changes
git checkout -b feature/multi-service/audit-logging
```

### 11. How do you handle secrets in Git repositories?
**Answer:**

**Prevention strategies:**
1. **Git-secrets tool:**
```bash
git secrets --register-aws
git secrets --scan
```

2. **Pre-commit hooks:**
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
```

3. **GitGuardian scanning**
4. **Environment variables**
5. **External secret managers**

**If secrets are committed:**
```bash
# Remove from history
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/secret/file' \
  --prune-empty --tag-name-filter cat -- --all

# Or use BFG Repo-Cleaner
bfg --delete-files secret-file.txt
```

### 12. Explain Git internals and how Git stores data
**Answer:**

**Git object types:**
1. **Blob**: File content
2. **Tree**: Directory structure
3. **Commit**: Snapshot with metadata
4. **Tag**: Reference to specific commit

**Storage example:**
```bash
# Git stores objects by SHA-1 hash
.git/objects/
├── a1/b2c3d4... (blob - file content)
├── e5/f6g7h8... (tree - directory)
└── i9/j0k1l2... (commit - snapshot)
```

**How commits work:**
```
Commit Object:
- Tree reference
- Parent commit(s)
- Author/committer info
- Commit message
- Timestamp
```

## 🛠️ Practical Exercises

### Exercise 1: Advanced Git Operations
```bash
# Interactive rebase to clean history
git rebase -i HEAD~3

# Cherry-pick specific commits
git cherry-pick <commit-hash>

# Bisect to find bug introduction
git bisect start
git bisect bad HEAD
git bisect good v1.0
```

### Exercise 2: Set up Git hooks for CI/CD
Create pre-commit and pre-push hooks that:
- Run linting and tests
- Validate commit messages
- Check for secrets
- Enforce code standards

### Exercise 3: Git workflow simulation
Practice complex scenarios:
- Multiple developer collaboration
- Handling large merge conflicts
- Emergency hotfix deployment
- Feature rollback scenarios

## 🔗 Real-world Examples

Check out Git practices in this repository:
- [Git Test Scripts](../../exercises/udacity-c2-frontend/udacity_tests/git_test.sh)
- [Branch Protection Examples](../../.github/)
- [Multi-service Git Structure](../../project/)

## 📊 Git Flow Visualization

```mermaid
gitgraph
    commit id: "Initial"
    branch develop
    commit id: "Setup"
    branch feature/auth
    commit id: "Add login"
    commit id: "Add logout"
    checkout develop
    merge feature/auth
    branch release/v1.0
    commit id: "Version bump"
    checkout main
    merge release/v1.0
    tag: "v1.0"
```

## 📚 Additional Resources

- [Pro Git Book](https://git-scm.com/book)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [GitHub Learning Lab](https://lab.github.com/)
- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)