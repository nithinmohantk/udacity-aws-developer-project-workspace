# Capstone Project :: Doc Manager App (a.k.a DocMan*)

This application will allow creating/removing/updating/fetching personal documents for each user. Each document entry will have an attachment document, stored in cloud within an S3 bucket. Each user only has access to documents that he/she has created.

* Target Audience: Home and Enterprise users
* Supported Formats: .pdf, .xls, .xlsx, .doc, .docx, .ppt, .pptx, .pub, .pubx 

This project is created as as part final CAPSTONE project for Udacity Cloud Developer nano-degree program. 

# Application Features
1. User will be able to login to application using auth0, either individual login or use OpenId provider supported/enabled for the application.
2. After logging in user will be taken to dashboard page.
3. Dashboard has option to create new document or edit existing document entry. 
4. Each user will be able to view only documents uploaded by them. 
5. Provide ability to add or replace existing document. Each document entry in database would have one and only document in storage as an attachment. 

# Technology Stack 
* Serverless framework [https://serverless.com/](https://serverless.com/)
Global components 
```
npm install -g serverless 
```
Following plugins are installed local to project : 
```
npm install serverless-offline --save-dev
```   
* devDependencies
```npm
npm install serverless-offline --save-dev
npm install serverless-aws-documentation --save-dev
npm install serverless-dynamodb-local --save-dev
npm install serverless-iam-roles-per-function --save-dev
npm install serverless-jest-plugin --save-dev
npm install serverless-plugin-aws-alerts --save-dev
npm install serverless-plugin-canary-deployments --save-dev
npm install serverless-plugin-tracing --save-dev
npm install serverless-reqvalidator-plugin --save-dev
npm install serverless-webpack --save-dev
```
* AWS Lambda - _creating necessary business functions_ 
* AWS Cloud watch
* AWS S3 Buckets - _file storage_ 
* AWS Cloud Formation 
* AWS Cloud Watch 
* AWS dynamodb - _data store_ 
* AWS API Gateway - _API management gateway to consume business lambda functions created in AWS._

# Solution Structure 
Solution is organized in to two folders mainly
1. **backend** - backend serveless framework based application. Reused most of the 
2. **client** - contains react application code, that can be hosted in elastic Beanstalk or later can be containarized, exposed on port 3001 for local development. 
# Data Model: Documents 

The application will store documents with supported formats above, and each document entry contains the following fields:

* `docId` (string) - a unique id for an item
* `createdAt` (string) - date and time when an item was created
* `updatedAt` (string) - date and time when an item was updated
* `name` (string) - name of a Document item (e.g. "My CV")
* `status` (string) - indicates file status
* `type` (string) - type of document 
* `version` (string) - version of document (as previous version will be replaced by newly uploaded)
* `attachmentUrl` (string) (optional) - a URL pointing to an image attached to a Doc item
* `done` (boolean) (optional) - indicates file upload was successful

# Implemented functions : 

To implement this project, I implemented the following functions and configure them in the `serverless.yml` file:

* `Auth` - this function will incorporate a custom authorizer for API Gateway that should be added to all other functions.
* `GetDocs` - returns all Docs for a current user. A user id is extracted from a JWT token that is sent by the frontend.
* `CreateDoc` - Will create a new Doc for a current user. 
* `UpdateDoc` - Will update a Doc item created by a current user. 
* `DeleteDoc` - Will delete a Doc item created by a current user. ** expects an id of a Doc item to remove.
* `GenerateUploadUrl` - Generates a pre-signed URL that can be used to upload an attachment file for a Doc item.
* `UpdateAttachment` - Will update a document entry with attachment details newly uploaded by a current user. This function will be called upon successful upload of files to s3 bucket.

# Frontend

The `client` folder contains a web application that can use the API that should be developed in the project.

API endpoint and Auth0 configuration created for the Project:
** note the eu-west specific endpoints 
```ts
const apiId = '8xhrfua85i'
const apiRegion = 'eu-west-1'
const apiEnvironment ="dev"
export const apiEndpoint = `https://${apiId}.execute-api.${apiRegion}.amazonaws.com/${apiEnvironment}`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'thingxcloud-dev.eu.auth0.com',            // Auth0 domain
  clientId: 'Kex4dFKFWuuIOrhmpRndeqpqBzEJttS5',          // Auth0 client id
  callbackUrl: 'http://localhost:3001/callback'   //Call back URI ** to-be configured in Auth0. application page.
}
```

## Authentication

Application uses Auth0 OAuth service for authentication, with asymmetrically encrypted JWT tokens for validation and transmission.

## Logging

Application uses necessary logging of information with context details.

* Serverless Dashboard: https://dashboard.serverless.com/tenants/nithinmohantk1/applications/docman-backend/services/docman-backend/stage/dev/region/eu-west-1

# How to run the application

## Backend

### To deploy an application run the following commands:

```
cd backend
npm install
sls deploy -v
```
### To remove the stack 
```
sls remove --force
```

## Frontend

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless Doc application.

## Using dynamodb-locally 

### Install Plugin
```npm install --save serverless-dynamodb-local@0.2.10```
### Using the Plugin
1) Install DynamoDB Local ```sls dynamodb install```
2) Start DynamoDB Local ```sls dynamodb start```
3) Execute all migrations for DynamoDB Local. ```sls dynamodb executeAll```

For more help: read [documentation](https://serverless.com/plugins/serverless-dynamodb-local/)
# Postman collection

An alternative way to test your API, you can use the Postman collection that contains sample requests. You can find a Postman collection in this project. To import this collection, do the following. __Postman definition is updated with EU specific API endpoints__

