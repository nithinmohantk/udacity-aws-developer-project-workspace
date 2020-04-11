import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
//import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set

const pemData:any = `-----BEGIN CERTIFICATE-----
MIIDEzCCAfugAwIBAgIJXIaan06EHtJoMA0GCSqGSIb3DQEBCwUAMCcxJTAjBgNV
BAMTHHRoaW5neGNsb3VkLWRldi5ldS5hdXRoMC5jb20wHhcNMjAwNDEwMjIxNzQ5
WhcNMzMxMjE4MjIxNzQ5WjAnMSUwIwYDVQQDExx0aGluZ3hjbG91ZC1kZXYuZXUu
YXV0aDAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvdKG6wmH
  + bBcTDF2IeBe8AMnjznGzNRXozpu9uLpyfl4MKq0Z4r2mpjpwRDxfTYzNt56Pt3I
koFR1qkddBoQ8xDNSFEBzd61jXd9RmOCOrFV0s1eWiwtLhzFbkNv1rFgKg2IZgnj
GoqggY7d51 / m89nl2B4HFP5wXDmLJrh / FIHKYF4SYQyWSYtMrCYnM42AQYRNx5 / X
J6FcEAiRPd8DAsCwNhL8GSlPbJSsF9u7E0SS5Utpb5VUQ908E0iaBHPRBOd7SN8r
NvuQSqoc8TMyrE5KNF0Hc / EjD98uCeeHGWLhTcm5rozovlU01lFCwpIkD4foI9HL
763esm024nzhgwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH / MB0GA1UdDgQWBBRN
YY9m5c7F7G5jBcSbtZNSSGgOujAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQEL
BQADggEBALKVeKbOVqcR1 / Qom9Vo4DIYUjhIr1SNTaxvtwBYtyFGVBLm2WcTvOzo
gUhzJBWCD54vhHGzAiiQ9EtIlbGYCveZkNdCYX22N86S4BUDFFksqzgce7WKB96E
NDTbgilkU5dMlBnwPShdPLLZ / jsV5x5Hu1IYms2OV + m / GW1O3//iZtr0y/4bmhem
k4dIYyCCju + 7qN0m3389pIYxmW7t01QLZWTs7x4saslV4B / OVH659HF2MHkOY8ft
1HdGB5HpXbtIHjhdaghKEWTwM1lwUy39pP2iJ4B4ltVs / zEBx + J0ytv + e3x3ZL38
LliUsAmgSMau8KArniJErphit61HzcY =
  ----- END CERTIFICATE-----`
const jwksUrl = 'https://thingxcloud-dev.auth0.com/.well-known/jwks.json';

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  //const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/

  let authCert;
  try {
    const response = await Axios.get(jwksUrl);
    const pemData = response['data']['keys'][0]['x5c'][0];
    authCert = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----`;
  }
  catch (err) {
    console.log("error in verifying token >> " + err);
  }

  return verify(token, authCert, { algorithms: ['RS256']}) as JwtPayload;
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
