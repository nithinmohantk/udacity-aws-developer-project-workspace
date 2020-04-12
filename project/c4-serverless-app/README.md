# Serverless TODO App

This application will allow creating/removing/updating/fetching TODO items. Each TODO item can optionally have an attachment image. Each user only has access to TODO items that he/she has created.

# Data Model: TODO items

The application will store TODO items, and each TODO item contains the following fields:

* `todoId` (string) - a unique id for an item
* `createdAt` (string) - date and time when an item was created
* `name` (string) - name of a TODO item (e.g. "Change a light bulb")
* `dueDate` (string) - date and time by which an item should be completed
* `done` (boolean) - true if an item was completed, false otherwise
* `attachmentUrl` (string) (optional) - a URL pointing to an image attached to a TODO item

# Implemented functions : 

To implement this project, I implemented the following functions and configure them in the `serverless.yml` file:

* `Auth` - this function will incorporate a custom authorizer for API Gateway that should be added to all other functions.
* `GetTodos` - returns all TODOs for a current user. A user id is extracted from a JWT token that is sent by the frontend.
* `CreateTodo` - Will create a new TODO for a current user. 
* `UpdateTodo` - Will update a TODO item created by a current user. 
* `DeleteTodo` - Will delete a TODO item created by a current user. ** expects an id of a TODO item to remove.
* `GenerateUploadUrl` - Generates a pre-signed URL that can be used to upload an attachment file for a TODO item.

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
  callbackUrl: 'http://localhost:3000/callback'
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

This should start a development server with the React application that will interact with the serverless TODO application.

# Postman collection

An alternative way to test your API, you can use the Postman collection that contains sample requests. You can find a Postman collection in this project. To import this collection, do the following. __Postman definition is updated with EU specific API endpoints__

