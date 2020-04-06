## Udagram Micro-Services App
A simple "Udagram" micro services application to build, and deploy frondend/backend workloads in Docker/Kubernetes environment.

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


## Exercise Instructions
Perform the following tasks in the sequence mentioned below:

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


