# Infrastructure as Code Interview Questions

## 🟢 Beginner Level Questions

### 1. What is Infrastructure as Code (IaC) and why is it important?
**Answer:**
**Infrastructure as Code** is the practice of managing and provisioning infrastructure through code instead of manual processes.

**Key Benefits:**
- **Consistency**: Identical environments every time
- **Version Control**: Track infrastructure changes
- **Automation**: Reduce manual errors
- **Scalability**: Easy replication and scaling
- **Documentation**: Code serves as documentation
- **Cost Management**: Better resource optimization

**Example:**
```hcl
# Traditional: Manual setup via console
# IaC: Terraform configuration
resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  
  tags = {
    Name = "WebServer"
    Environment = "production"
  }
}
```

### 2. What are the different types of IaC tools?
**Answer:**

**Declarative vs Imperative:**
- **Declarative**: Define desired state (Terraform, CloudFormation)
- **Imperative**: Define steps to achieve state (Ansible, Chef)

**Configuration Management vs Provisioning:**
- **Provisioning**: Create infrastructure (Terraform, CloudFormation)
- **Configuration**: Configure software on existing infrastructure (Ansible, Puppet)

**Agent vs Agentless:**
- **Agent-based**: Chef, Puppet (require agents on managed nodes)
- **Agentless**: Ansible, Terraform (work over SSH/APIs)

### 3. Explain the difference between mutable and immutable infrastructure
**Answer:**

**Mutable Infrastructure:**
- Infrastructure is updated in-place
- Configuration drift possible
- Harder to reproduce environments
- Example: Update running servers

**Immutable Infrastructure:**
- Replace entire components instead of updating
- Consistent environments
- Easier rollbacks
- Example: Deploy new AMI, terminate old instances

```hcl
# Immutable infrastructure pattern
resource "aws_launch_template" "app" {
  name_prefix   = "app-"
  image_id      = var.ami_id  # New AMI for updates
  instance_type = "t3.micro"
  
  lifecycle {
    create_before_destroy = true
  }
}
```

### 4. What is state management in Terraform?
**Answer:**
**Terraform State** tracks the mapping between configuration and real-world resources.

**State File Contents:**
- Resource metadata
- Dependencies between resources
- Performance optimization data

**Best Practices:**
```hcl
# Remote state configuration
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

**State Commands:**
```bash
# View state
terraform show
terraform state list

# Import existing resources
terraform import aws_instance.web i-1234567890abcdef0

# Remove from state (without destroying)
terraform state rm aws_instance.web
```

## 🟡 Intermediate Level Questions

### 5. How do you structure a Terraform project for multiple environments?
**Answer:**

**Directory Structure:**
```
terraform-infrastructure/
├── modules/
│   ├── vpc/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── ec2/
│   └── rds/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── terraform.tfvars
│   │   └── versions.tf
│   ├── staging/
│   └── prod/
├── global/
│   ├── iam/
│   └── route53/
└── shared/
    ├── variables.tf
    └── locals.tf
```

**Environment-specific Configuration:**
```hcl
# environments/prod/main.tf
module "vpc" {
  source = "../../modules/vpc"
  
  environment = "prod"
  cidr_block  = "10.0.0.0/16"
  
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

module "ec2" {
  source = "../../modules/ec2"
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  instance_type   = "t3.large"  # Larger for prod
  min_size        = 3           # More instances for prod
  max_size        = 10
}
```

**Variables File:**
```hcl
# environments/prod/terraform.tfvars
environment = "prod"
instance_type = "t3.large"
min_size = 3
max_size = 10
db_instance_class = "db.r5.xlarge"
```

### 6. How do you handle secrets and sensitive data in IaC?
**Answer:**

**Terraform Best Practices:**

1. **Use External Data Sources:**
```hcl
# Retrieve from AWS Secrets Manager
data "aws_secretsmanager_secret" "db_password" {
  name = "prod/database/password"
}

data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = data.aws_secretsmanager_secret.db_password.id
}

resource "aws_db_instance" "main" {
  # Other configuration...
  password = jsondecode(data.aws_secretsmanager_secret_version.db_password.secret_string)["password"]
}
```

2. **Environment Variables:**
```bash
# Set sensitive variables via environment
export TF_VAR_db_password="supersecret"
terraform apply
```

3. **Vault Integration:**
```hcl
# Using Vault provider
provider "vault" {
  address = "https://vault.company.com"
}

data "vault_generic_secret" "db_creds" {
  path = "secret/database"
}

resource "aws_db_instance" "main" {
  password = data.vault_generic_secret.db_creds.data["password"]
}
```

4. **State File Security:**
```hcl
terraform {
  backend "s3" {
    bucket         = "terraform-state-bucket"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true              # Encrypt state file
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
    dynamodb_table = "terraform-locks"
  }
}
```

### 7. Explain Terraform modules and their benefits
**Answer:**

**Terraform Modules** are containers for multiple resources used together.

**Module Structure:**
```
modules/
└── webserver/
    ├── main.tf       # Main configuration
    ├── variables.tf  # Input variables
    ├── outputs.tf    # Output values
    ├── versions.tf   # Provider requirements
    └── README.md     # Documentation
```

**Module Example:**
```hcl
# modules/webserver/main.tf
resource "aws_security_group" "web" {
  name_prefix = "${var.name}-web-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web" {
  count           = var.instance_count
  ami             = var.ami_id
  instance_type   = var.instance_type
  subnet_id       = var.subnet_ids[count.index % length(var.subnet_ids)]
  security_groups = [aws_security_group.web.id]

  tags = {
    Name = "${var.name}-web-${count.index + 1}"
  }
}
```

**Using the Module:**
```hcl
# main.tf
module "frontend" {
  source = "./modules/webserver"
  
  name           = "frontend"
  vpc_id         = aws_vpc.main.id
  subnet_ids     = aws_subnet.public[*].id
  instance_count = 3
  instance_type  = "t3.micro"
  ami_id         = data.aws_ami.ubuntu.id
}

module "backend" {
  source = "./modules/webserver"
  
  name           = "backend"
  vpc_id         = aws_vpc.main.id
  subnet_ids     = aws_subnet.private[*].id
  instance_count = 2
  instance_type  = "t3.small"
  ami_id         = data.aws_ami.ubuntu.id
}
```

### 8. How do you implement automated testing for Infrastructure as Code?
**Answer:**

**Testing Pyramid for IaC:**

1. **Static Analysis:**
```bash
# Terraform validation
terraform fmt -check
terraform validate

# Security scanning
tfsec .
checkov -f main.tf

# Linting
tflint
```

2. **Unit Testing:**
```go
// Terratest example in Go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestTerraformWebServerExample(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../examples/webserver",
        Vars: map[string]interface{}{
            "instance_type": "t3.micro",
        },
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    instanceID := terraform.Output(t, terraformOptions, "instance_id")
    assert.NotEmpty(t, instanceID)
}
```

3. **Integration Testing:**
```yaml
# Kitchen-CI configuration
driver:
  name: terraform

provisioner:
  name: terraform

verifier:
  name: awspec

platforms:
  - name: aws

suites:
  - name: default
    verifier:
      patterns:
        - test/integration/default/verify_*.rb
```

4. **Policy Testing:**
```rego
# OPA policy test
package terraform.analysis

test_deny_public_s3_bucket {
    deny[_] with input as {
        "resource": {
            "aws_s3_bucket": {
                "test": {
                    "acl": "public-read"
                }
            }
        }
    }
}
```

## 🔴 Advanced Level Questions

### 9. Design a CI/CD pipeline for Infrastructure as Code
**Answer:**

**GitOps Pipeline for IaC:**
```yaml
# .github/workflows/terraform.yml
name: Terraform Infrastructure Pipeline

on:
  push:
    branches: [main]
    paths: ['infrastructure/**']
  pull_request:
    branches: [main]
    paths: ['infrastructure/**']

env:
  TF_VERSION: 1.5.0
  AWS_REGION: us-east-1

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
          
      - name: Terraform Format Check
        run: terraform fmt -check -recursive
        
      - name: Terraform Validate
        run: |
          cd infrastructure
          terraform init -backend=false
          terraform validate
          
      - name: Security Scan
        uses: aquasecurity/tfsec-action@v1.0.0
        
      - name: Policy Check
        run: |
          conftest verify --policy policy/ infrastructure/

  plan:
    needs: validate
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Terraform Plan
        run: |
          cd infrastructure
          terraform init
          terraform plan -out=tfplan
          
      - name: Post Plan to PR
        uses: actions/github-script@v6
        with:
          script: |
            const output = `#### Terraform Plan 📖
            <details><summary>Show Plan</summary>
            
            \`\`\`terraform
            ${process.env.PLAN}
            \`\`\`
            
            </details>`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            });

  apply:
    needs: validate
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
          
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Terraform Apply
        run: |
          cd infrastructure
          terraform init
          terraform apply -auto-approve
```

**Multi-Environment Pipeline:**
```yaml
strategy:
  matrix:
    environment: [dev, staging, prod]
    
steps:
  - name: Terraform Apply
    run: |
      cd infrastructure/environments/${{ matrix.environment }}
      terraform init
      terraform apply -auto-approve
    env:
      TF_WORKSPACE: ${{ matrix.environment }}
```

### 10. How do you implement drift detection and remediation?
**Answer:**

**Drift Detection Strategies:**

1. **Scheduled Terraform Plans:**
```yaml
# Scheduled drift detection
name: Infrastructure Drift Detection

on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8 AM

jobs:
  drift-detection:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
          
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        
      - name: Detect Drift
        run: |
          cd infrastructure
          terraform init
          terraform plan -detailed-exitcode > plan.out
          if [ $? -eq 2 ]; then
            echo "Drift detected!"
            cat plan.out
            # Send alert to Slack/Teams
            curl -X POST -H 'Content-type: application/json' \
              --data '{"text":"Infrastructure drift detected!"}' \
              ${{ secrets.SLACK_WEBHOOK_URL }}
          fi
```

2. **AWS Config for Drift Detection:**
```hcl
# AWS Config rule for drift detection
resource "aws_config_configuration_recorder" "recorder" {
  name     = "terraform-drift-recorder"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_config_rule" "terraform_compliance" {
  name = "terraform-resource-compliance"

  source {
    owner             = "AWS"
    source_identifier = "CLOUDFORMATION_STACK_DRIFT_DETECTION_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.recorder]
}
```

3. **Automated Remediation:**
```python
# Lambda function for drift remediation
import boto3
import json

def lambda_handler(event, context):
    """Automatically remediate infrastructure drift"""
    
    # Parse Config rule evaluation
    config_event = event['configRuleInvocationEvent']
    resource_type = config_event['configurationItem']['resourceType']
    resource_id = config_event['configurationItem']['resourceId']
    
    if resource_type == 'AWS::EC2::SecurityGroup':
        # Check if security group allows 0.0.0.0/0 on SSH
        ec2 = boto3.client('ec2')
        
        sg = ec2.describe_security_groups(GroupIds=[resource_id])
        for rule in sg['SecurityGroups'][0]['IpPermissions']:
            if rule.get('FromPort') == 22:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        # Remove the dangerous rule
                        ec2.revoke_security_group_ingress(
                            GroupId=resource_id,
                            IpPermissions=[rule]
                        )
                        
                        # Create incident ticket
                        create_incident_ticket({
                            'resource': resource_id,
                            'action': 'removed_ssh_access',
                            'timestamp': context.aws_request_id
                        })
    
    return {'statusCode': 200}
```

### 11. How do you implement cost optimization with IaC?
**Answer:**

**Cost Optimization Strategies:**

1. **Resource Tagging for Cost Allocation:**
```hcl
# Consistent tagging strategy
locals {
  common_tags = {
    Environment   = var.environment
    Project       = var.project_name
    Owner         = var.team_name
    CostCenter    = var.cost_center
    CreatedBy     = "terraform"
    BackupPolicy  = var.backup_required ? "daily" : "none"
    ExpiryDate    = var.temporary_resource ? formatdate("YYYY-MM-DD", timeadd(timestamp(), "720h")) : ""
  }
}

resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type
  
  tags = merge(local.common_tags, {
    Name = "${var.project_name}-web-${var.environment}"
    Role = "webserver"
  })
}
```

2. **Right-sizing with Conditional Logic:**
```hcl
# Environment-based instance sizing
locals {
  instance_sizes = {
    dev     = "t3.micro"
    staging = "t3.small"
    prod    = "t3.medium"
  }
  
  auto_scaling_config = {
    dev = {
      min_size = 1
      max_size = 2
    }
    staging = {
      min_size = 1
      max_size = 3
    }
    prod = {
      min_size = 2
      max_size = 10
    }
  }
}

resource "aws_instance" "app" {
  instance_type = local.instance_sizes[var.environment]
  
  # Use Spot instances for dev/staging
  spot_price = var.environment != "prod" ? "0.01" : null
}
```

3. **Scheduled Resource Management:**
```hcl
# Auto-scaling schedule for cost optimization
resource "aws_autoscaling_schedule" "scale_down_evening" {
  count = var.environment != "prod" ? 1 : 0
  
  scheduled_action_name  = "scale-down-evening"
  min_size              = 0
  max_size              = 0
  desired_capacity      = 0
  recurrence           = "0 20 * * MON-FRI"  # 8 PM on weekdays
  auto_scaling_group_name = aws_autoscaling_group.app.name
}

resource "aws_autoscaling_schedule" "scale_up_morning" {
  count = var.environment != "prod" ? 1 : 0
  
  scheduled_action_name  = "scale-up-morning"
  min_size              = 1
  max_size              = 3
  desired_capacity      = 1
  recurrence           = "0 8 * * MON-FRI"   # 8 AM on weekdays
  auto_scaling_group_name = aws_autoscaling_group.app.name
}
```

4. **Cost Budget Alarms:**
```hcl
# AWS Budget for cost monitoring
resource "aws_budgets_budget" "project_budget" {
  name         = "${var.project_name}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  cost_filters = {
    Tag = ["Project:${var.project_name}"]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
```

## 🛠️ IaC Tools Comparison

| Tool | Language | Cloud Support | State Management |
|------|----------|---------------|------------------|
| **Terraform** | HCL | Multi-cloud | Local/Remote |
| **CloudFormation** | JSON/YAML | AWS only | AWS managed |
| **ARM Templates** | JSON | Azure only | Azure managed |
| **Pulumi** | Multiple | Multi-cloud | Pulumi Service |
| **CDK** | Multiple | Multi-cloud | CloudFormation |

## 🔗 Real-world Examples

IaC implementations in this repository:
- [Kubernetes Deployment Configurations](../../project/c2-microservices-v1/udacity-c2-deployment/k8s-final/)
- [Container Infrastructure](../../project/c2-microservices-v1/udacity-c2-deployment/docker/)
- [Serverless Infrastructure](../../project/c4-serverless-app/)

## 📚 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS CloudFormation Templates](https://aws.amazon.com/cloudformation/templates/)
- [Terratest Testing Framework](https://terratest.gruntwork.io/)
- [IaC Security Best Practices](https://www.tfsec.dev/)