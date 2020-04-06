## Udagram Micro-Services App
A simple "Udagram" micro services application to build, and deploy frondend/backend workloads in Docker/Kubernetes environment.

## Technology Stack
- Docker for Windows/Mac - Install using Hyper-V/WSL and Register an Account with DockerHub
- Kubernetes(K8s) - Install Minikube on Windows 10 or Setup AWS EKS instance 

### Prerequisite
Before we get started, confirm that you have installed NodeJs, npm and Ionic Framework by checking the versions:
```bash
node --version
npm --version
ionic --version
```

If you get a `not found` message, install the required item:
*   [Ionic CLI](https://ionicframework.com/docs/installation/cli) if you don't already have it installed
*  [Nodejs and npm](https://nodejs.org/en/download/) 


## Instructions to Use
To use the code base from this project:

### To Use the Code
Clone the [course repo](https://github.com/nithinmohantk/udacity-aws-developer-project-workspace) and stay on the `master` branch.

```bash
git clone https://github.com/nithinmohantk/udacity-aws-developer-project-workspace
cd udacity-aws-developer-project-workspace/project/c2-microservices-v2
git branch
```
Navigate to the `udacity-c2-deployment/k8s-final` directory.

### Steps to Deploy 


#### To Start the backend npm server
We will start the backend first and the frontend later. Open a **new** terminal and navigate to the `/udacity-c2-restapi-feed/` or `/udacity-c2-restapi-user/` directory. 
Use `npm` to install all dependencies as mentioned in the `package.json`:
```bash
npm install
source ~/.profile
npm run dev
```

#### To Start the frontend server
Next, open another terminal and navigate to the `/udacity-c3-frontend/` folder, and use `npm` to install all dependencies:

```bash
npm install
```
Ionic CLI provides an easy to use development server to run and autoreload the frontend. This allows you to make quick changes and see them in real time in your browser. Start the Ionic server as follows:

```bash
ionic serve
```
A successful command would automatically start the services at `http://localhost:8100/home`. 

## Useful Commands 

### Useful docker-compose commands 

```console

docker-compose ps # lists all services (id, name)
docker-compose stop <id/name> #this will stop only the selected container
docker-compose rm <id/name> # this will remove the docker container permanently 
docker-compose up # builds/rebuilds all not already built container 

```

```console
docker-compose up -d --force-recreate --build

```

```console
docker-compose -f docker-compose.yml up
```

```console
Options:
  -d                  Detached mode: Run containers in the background,
                      print new container names. Incompatible with
                      --abort-on-container-exit.
  --force-recreate    Recreate containers even if their configuration
                      and image haven't changed.
  --build             Build images before starting containers.
```


 ```console 
docker-compose restart 
```
### Stop and Remove Container(s)

```console 
docker-compose stop udacity-c2-restapi-feed_1
docker-compose kill udacity-c2-restapi-feed_1
docker stop udacity-c2-restapi-feed_1
docker rm -f udacity-c2-restapi-feed_1

```
### Install minikube

```console 
# Using PowerShell (run as Administrator)
choco install minikube

# Test minikube installation
minikube version

# Check available Version of Kubernetes
minikube get-k8s-versions

# Update minikube
minikube update-check
```

### Working with Kubernetes

```console
# Start minikube
minikube start

# Set docker env
eval $(minikube docker-env)

# Build image
docker build -t udacity-c2-restapi-feed:0.0.1 .

# Run in minikube
kubectl run hello-feedapi --image=udacity-c2-restapi-feed:0.0.1 --image-pull-policy=Never

# Check that it's running
kubectl get pods
```


### Setting up EKS Cluster 

We are going to use Kubernetes Operations Service(KOPS) to provision a Kubernetes Cluster in EKS 
```console
export $bucket_name=udagram-nithin-dev
export KOPS_CLUSTER_NAME=thingxcloud.k8s.local
export KOPS_STATE_STORE=s3://${bucket_name}

// If you do not have S3 bucket create use the follwing AWS command to create bucket.
aws s3api create-bucket \
--bucket ${bucket_name} \
--region eu-west-1

# Create an EKS Cluster using AWS CLI: 
kops create cluster --node-count=2 --node-size=t2.medium --zones=eu-west-1a --name=${KOPS_CLUSTER_NAME}

# Confirm the creation using: 
kops update cluster --name thingxcloud.k8s.local --yes

# To delete your cluster: 
kops delete cluster thingxcloud.k8s.local --yes
OR 
kops delete cluster --yes

# To view pods 
kubectl get pods -o wide

# To SSH to the master: 
ssh -i ~/.ssh/id_rsa admin@api.thingxcloud.k8s.local

# To manually create a route53 DNS 
aws route53 create-hosted-zone --name thingxcloud.k8s.local --caller-reference 1.

