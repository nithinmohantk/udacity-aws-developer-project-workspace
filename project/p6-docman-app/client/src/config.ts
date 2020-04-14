// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = 'izweiam6ha'
export const apiEndpoint = `https://${apiId}.execute-api.eu-west-1.amazonaws.com/dev`

export const authConfig = {
  // TODO: Create an Auth0 application and copy values from it into this map
  domain: 'thingxcloud-dev.eu.auth0.com',            // Auth0 domain
  clientId: 'Kex4dFKFWuuIOrhmpRndeqpqBzEJttS5',          // Auth0 client id
  callbackUrl: 'http://localhost:3001/callback'
}
