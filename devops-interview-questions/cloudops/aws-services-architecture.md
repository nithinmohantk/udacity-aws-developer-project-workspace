# AWS Services and Architecture Interview Questions

## 🟢 Beginner Level Questions

### 1. What are the core AWS services and their purposes?
**Answer:**

**Compute Services:**
- **EC2**: Virtual servers in the cloud
- **Lambda**: Serverless compute functions
- **ECS/EKS**: Container orchestration
- **Elastic Beanstalk**: Application deployment platform

**Storage Services:**
- **S3**: Object storage
- **EBS**: Block storage for EC2
- **EFS**: Network file system
- **Glacier**: Archive storage

**Database Services:**
- **RDS**: Managed relational databases
- **DynamoDB**: NoSQL database
- **ElastiCache**: In-memory caching
- **Redshift**: Data warehouse

**Networking:**
- **VPC**: Virtual private cloud
- **CloudFront**: Content delivery network
- **Route 53**: DNS service
- **ELB**: Load balancing

### 2. Explain AWS Regions and Availability Zones
**Answer:**
- **Region**: Geographic area with multiple AZs (e.g., us-east-1)
- **Availability Zone**: Isolated data center within a region
- **Edge Location**: CDN endpoints for CloudFront

**Benefits:**
- High availability and fault tolerance
- Low latency through geographic distribution
- Compliance with data residency requirements
- Disaster recovery capabilities

### 3. What is the difference between horizontal and vertical scaling?
**Answer:**
**Vertical Scaling (Scale Up):**
- Increase instance size (CPU, RAM)
- Limited by hardware constraints
- Temporary downtime during scaling
- Example: t3.micro → t3.large

**Horizontal Scaling (Scale Out):**
- Add more instances
- Theoretically unlimited scaling
- No downtime with proper load balancing
- Example: 2 instances → 10 instances

### 4. How does AWS pricing work?
**Answer:**
**Pricing Models:**
- **On-Demand**: Pay per hour/second of usage
- **Reserved Instances**: 1-3 year commitments for discounts
- **Spot Instances**: Bid for unused capacity
- **Savings Plans**: Flexible pricing for compute usage

**Cost Factors:**
- Instance type and size
- Storage usage
- Data transfer
- Additional services used

## 🟡 Intermediate Level Questions

### 5. Design a highly available web application architecture on AWS
**Answer:**
```
Internet Gateway
    │
    ▼
Application Load Balancer (Multi-AZ)
    │
    ├─────────────────┬─────────────────┐
    ▼                 ▼                 ▼
  AZ-1a             AZ-1b             AZ-1c
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   EC2       │   │   EC2       │   │   EC2       │
│ Web Servers │   │ Web Servers │   │ Web Servers │
└─────────────┘   └─────────────┘   └─────────────┘
    │                 │                 │
    └─────────────────┼─────────────────┘
                      ▼
                 RDS Multi-AZ
              (Primary + Standby)
                      │
                      ▼
              S3 (Static Assets)
                      │
                      ▼
              CloudFront CDN
```

**Components:**
- **ALB**: Distributes traffic across AZs
- **Auto Scaling**: Handles traffic spikes
- **RDS Multi-AZ**: Database high availability
- **CloudFront**: Global content delivery
- **S3**: Static asset storage

### 6. How would you implement disaster recovery in AWS?
**Answer:**

**DR Strategies (RTO/RPO increasing):**

1. **Pilot Light** (RTO: minutes, RPO: minutes):
```yaml
Primary Region (us-east-1):
  - Full production environment
  - Database replication to DR region

DR Region (us-west-2):
  - Minimal infrastructure running
  - Database standby
  - AMIs and scripts ready
```

2. **Warm Standby** (RTO: minutes, RPO: seconds):
```yaml
Primary: Full capacity
DR: Reduced capacity, scaled on demand
```

3. **Multi-Site Active/Active** (RTO: seconds, RPO: real-time):
```yaml
Both regions: Full capacity, active traffic
```

**Implementation:**
```bash
# Cross-region backup
aws s3 sync s3://primary-bucket s3://dr-bucket --region us-west-2

# Database cross-region replica
aws rds create-db-instance-read-replica \
  --db-instance-identifier myapp-dr-replica \
  --source-db-instance-identifier myapp-primary
```

### 7. Explain AWS VPC and networking concepts
**Answer:**

**VPC Components:**
```
Region: us-east-1
├── VPC: 10.0.0.0/16
│   ├── Public Subnet: 10.0.1.0/24 (AZ-1a)
│   │   ├── Internet Gateway
│   │   └── NAT Gateway
│   ├── Private Subnet: 10.0.2.0/24 (AZ-1a)
│   │   └── Database Subnet
│   ├── Public Subnet: 10.0.3.0/24 (AZ-1b)
│   └── Private Subnet: 10.0.4.0/24 (AZ-1b)
```

**Security:**
- **Security Groups**: Instance-level firewall
- **NACLs**: Subnet-level firewall
- **Route Tables**: Traffic routing rules

**Connectivity:**
- **VPC Peering**: Connect VPCs
- **VPN Gateway**: On-premises connection
- **Direct Connect**: Dedicated network connection

### 8. How do you secure AWS resources?
**Answer:**

**Identity and Access Management:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "StringEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

**Security Best Practices:**
1. **Principle of Least Privilege**
2. **Multi-Factor Authentication**
3. **Encryption at rest and in transit**
4. **Network segmentation**
5. **Regular security assessments**
6. **CloudTrail for audit logging**
7. **GuardDuty for threat detection**

## 🔴 Advanced Level Questions

### 9. Design a microservices architecture with AWS managed services
**Answer:**

```
┌─────────────────────────────────────────────────────────┐
│                    API Gateway                          │
│            (Authentication, Rate Limiting)              │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Lambda  │   │ Lambda  │   │ Lambda  │
│ User    │   │ Order   │   │ Payment │
│ Service │   │ Service │   │ Service │
└─────────┘   └─────────┘   └─────────┘
    │             │             │
    ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌─────────┐
│DynamoDB │   │   RDS   │   │DynamoDB │
│ Users   │   │ Orders  │   │Payments │
└─────────┘   └─────────┘   └─────────┘
    │             │             │
    └─────────────┼─────────────┘
                  ▼
            ┌─────────┐
            │   SQS   │
            │ Queues  │
            └─────────┘
                  │
                  ▼
            ┌─────────┐
            │   SNS   │
            │ Topics  │
            └─────────┘
```

**Implementation:**
```yaml
# Serverless Framework
service: microservices-api

provider:
  name: aws
  runtime: nodejs14.x
  environment:
    USERS_TABLE: ${self:service}-users-${opt:stage}
    ORDERS_TABLE: ${self:service}-orders-${opt:stage}

functions:
  userService:
    handler: src/users/handler.main
    events:
      - http:
          path: /users/{id}
          method: get
          cors: true
  
  orderService:
    handler: src/orders/handler.main
    events:
      - http:
          path: /orders
          method: post
          cors: true

resources:
  Resources:
    UsersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: ${self:provider.environment.USERS_TABLE}
        BillingMode: PAY_PER_REQUEST
```

### 10. How would you implement auto-scaling for a complex application?
**Answer:**

**Multi-tier Auto Scaling:**
```yaml
# Auto Scaling Configuration
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    MinSize: 2
    MaxSize: 10
    DesiredCapacity: 3
    TargetGroupARNs:
      - !Ref ApplicationLoadBalancerTargetGroup
    HealthCheckType: ELB
    HealthCheckGracePeriod: 300

# Scaling Policies
ScaleUpPolicy:
  Type: AWS::AutoScaling::ScalingPolicy
  Properties:
    PolicyType: TargetTrackingScaling
    TargetTrackingConfiguration:
      PredefinedMetricSpecification:
        PredefinedMetricType: ASGAverageCPUUtilization
      TargetValue: 70.0

# Application Auto Scaling for DynamoDB
DynamoDBScaling:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    ServiceNamespace: dynamodb
    ResourceId: table/MyTable
    ScalableDimension: dynamodb:table:WriteCapacityUnits
    MinCapacity: 5
    MaxCapacity: 1000
```

**Predictive Scaling:**
```bash
# Enable predictive scaling
aws autoscaling put-scaling-policy \
  --auto-scaling-group-name my-asg \
  --policy-name predictive-scaling \
  --policy-type PredictiveScaling \
  --predictive-scaling-configuration file://predictive-config.json
```

### 11. Explain AWS cost optimization strategies
**Answer:**

**Cost Optimization Framework:**

1. **Right Sizing:**
```bash
# Get recommendations
aws compute-optimizer get-ec2-instance-recommendations

# Analyze usage patterns
aws cloudwatch get-metric-statistics \
  --namespace AWS/EC2 \
  --metric-name CPUUtilization \
  --dimensions Name=InstanceId,Value=i-1234567890abcdef0
```

2. **Reserved Instances/Savings Plans:**
```bash
# RI recommendations
aws ce get-reservation-purchase-recommendation \
  --service EC2-Instance \
  --term-in-years 1
```

3. **Spot Instances:**
```yaml
# Spot Fleet configuration
SpotFleetConfig:
  IamFleetRole: arn:aws:iam::123456789012:role/fleet-role
  AllocationStrategy: diversified
  TargetCapacity: 10
  SpotPrice: "0.012"
  LaunchSpecifications:
    - ImageId: ami-12345678
      InstanceType: m5.large
      SubnetId: subnet-12345678
```

4. **Storage Optimization:**
```bash
# S3 Intelligent Tiering
aws s3api put-bucket-intelligent-tiering-configuration \
  --bucket my-bucket \
  --id intelligent-tiering \
  --intelligent-tiering-configuration Status=Enabled
```

### 12. How do you implement multi-region deployment strategy?
**Answer:**

**Global Infrastructure:**
```yaml
# CloudFormation Cross-Region
Regions:
  Primary: us-east-1
  Secondary: us-west-2
  Europe: eu-west-1

Resources:
  GlobalDatabase:
    Type: AWS::RDS::GlobalCluster
    Properties:
      DatabaseName: myapp
      Engine: aurora-mysql
      
  Route53:
    Type: AWS::Route53::RecordSet
    Properties:
      Type: A
      SetIdentifier: primary
      Failover: PRIMARY
      AliasTarget:
        DNSName: !GetAtt LoadBalancer.DNSName
```

**Deployment Pipeline:**
```yaml
# Multi-region deployment
deploy-primary:
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to us-east-1
      run: |
        aws cloudformation deploy \
          --template-file template.yaml \
          --stack-name myapp-primary \
          --region us-east-1

deploy-secondary:
  needs: deploy-primary
  runs-on: ubuntu-latest
  steps:
    - name: Deploy to us-west-2
      run: |
        aws cloudformation deploy \
          --template-file template.yaml \
          --stack-name myapp-secondary \
          --region us-west-2
```

## 🛠️ Practical Exercises

### Exercise 1: Three-Tier Architecture
Deploy a web application with:
- Web tier (EC2 + ALB)
- Application tier (Lambda/ECS)
- Database tier (RDS Multi-AZ)

### Exercise 2: Cost Optimization Audit
- Analyze current AWS spending
- Implement cost-saving recommendations
- Set up billing alerts and budgets

### Exercise 3: Disaster Recovery Testing
- Implement cross-region backup
- Test failover procedures
- Document recovery playbooks

## 🔗 Real-world Examples

Check out AWS implementations in this repository:
- [Microservices on AWS](../../project/c2-microservices-v1/)
- [Serverless Applications](../../project/c4-serverless-app/)
- [Document Management with AWS](../../project/p6-docman-app/)

## 📊 Architecture Diagrams

Use AWS Architecture Icons to create professional diagrams:
- [AWS Architecture Center](https://aws.amazon.com/architecture/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## 📚 Additional Resources

- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [AWS Solutions Library](https://aws.amazon.com/solutions/)
- [AWS Whitepapers](https://aws.amazon.com/whitepapers/)
- [AWS Training and Certification](https://aws.amazon.com/training/)