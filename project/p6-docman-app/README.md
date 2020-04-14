# Capstone Project :: Doc Manager App (a.k.a DocMan*)

This application will allow creating/removing/updating/fetching personal documents for each user. Each document entry will have an attachment document, stored in cloud within an S3 bucket. Each user only has access to documents that he/she has created.

* Target Audience: Home and Enterprise users
* Supported Formats: .pdf, .xls, .xlsx, .doc, .docx, .ppt, .pptx, .pub, .pubx 

This project is created as as part final CAPSTONE project for Udacity Cloud Developer nano-degree program. 

# Data Model: Documents 

The application will store documents with supported formats above, and each document entry contains the following fields:

* `docId` (string) - a unique id for an item
* `createdAt` (string) - date and time when an item was created
* `name` (string) - name of a Document item (e.g. "My CV")
* `status` (string) - date and time by which an item should be completed
* `type` (string) - type of document 
* `version` (string) - version of document (as previous version will be replaced by newly uploaded)
* `attachmentUrl` (string) (optional) - a URL pointing to an image attached to a Doc item

# Implemented functions : 

To implement this project, I implemented the following functions and configure them in the `serverless.yml` file:

* `Auth` - this function will incorporate a custom authorizer for API Gateway that should be added to all other functions.
* `GetDocs` - returns all Docs for a current user. A user id is extracted from a JWT token that is sent by the frontend.
* `CreateDoc` - Will create a new Doc for a current user. 
* `UpdateDoc` - Will update a Doc item created by a current user. 
* `DeleteDoc` - Will delete a Doc item created by a current user. ** expects an id of a Doc item to remove.
* `GenerateUploadUrl` - Generates a pre-signed URL that can be used to upload an attachment file for a Doc item.
* `UpdateDocAttachment` - Will update a document entry with attachment details newly uploaded by a current user. 

# Frontend

The `client` folder contains a web application that can use the API that should be developed in the project.

API endpoint and Auth0 configuration created for the Project:
** note the eu-west specific endpoints 
```ts
const apiId = 've1l7uy6kj'
export const apiEndpoint = `https://${apiId}.execute-api.eu-west-1.amazonaws.com/dev`

export const authConfig = {
  domain: 'thingxcloud-dev.eu.auth0.com',            // Auth0 domain
  clientId: 'OHWKfYM81Nyc8MXoVyomqCnrBMe75bDh',          // Auth0 client id
  callbackUrl: 'http://localhost:3001/callback'
}
```

## Authentication

Application uses Auth0 OAuth service for authentication, with asymmetrically encrypted JWT tokens for validation and transmission.

## Logging

Application uses necessary logging of information with context details.


# How to run the application

## Backend

To deploy an application run the following commands:

```
cd backend
npm install
sls deploy -v
```

## Frontend

To run a client application first edit the `client/src/config.ts` file to set correct parameters. And then run the following commands:

```
cd client
npm install
npm run start
```

This should start a development server with the React application that will interact with the serverless Doc application.

# Postman collection

An alternative way to test your API, you can use the Postman collection that contains sample requests. You can find a Postman collection in this project. To import this collection, do the following. __Postman definition is updated with EU specific API endpoints__

