
import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { Jwt } from '../../auth/Jwt'

/**
 *  A clone copy from exercise. Just to verify the auth. Will not be used.
 */
const cert = `-----BEGIN CERTIFICATE-----
MIIDEzCCAfugAwIBAgIJXIaan06EHtJoMA0GCSqGSIb3DQEBCwUAMCcxJTAjBgNV
BAMTHHRoaW5neGNsb3VkLWRldi5ldS5hdXRoMC5jb20wHhcNMjAwNDEwMjIxNzQ5
WhcNMzMxMjE4MjIxNzQ5WjAnMSUwIwYDVQQDExx0aGluZ3hjbG91ZC1kZXYuZXUu
YXV0aDAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvdKG6wmH
+bBcTDF2IeBe8AMnjznGzNRXozpu9uLpyfl4MKq0Z4r2mpjpwRDxfTYzNt56Pt3I
koFR1qkddBoQ8xDNSFEBzd61jXd9RmOCOrFV0s1eWiwtLhzFbkNv1rFgKg2IZgnj
GoqggY7d51/m89nl2B4HFP5wXDmLJrh/FIHKYF4SYQyWSYtMrCYnM42AQYRNx5/X
J6FcEAiRPd8DAsCwNhL8GSlPbJSsF9u7E0SS5Utpb5VUQ908E0iaBHPRBOd7SN8r
NvuQSqoc8TMyrE5KNF0Hc/EjD98uCeeHGWLhTcm5rozovlU01lFCwpIkD4foI9HL
763esm024nzhgwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBRN
YY9m5c7F7G5jBcSbtZNSSGgOujAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQEL
BQADggEBALKVeKbOVqcR1/Qom9Vo4DIYUjhIr1SNTaxvtwBYtyFGVBLm2WcTvOzo
gUhzJBWCD54vhHGzAiiQ9EtIlbGYCveZkNdCYX22N86S4BUDFFksqzgce7WKB96E
NDTbgilkU5dMlBnwPShdPLLZ/jsV5x5Hu1IYms2OV+m/GW1O3//iZtr0y/4bmhem
k4dIYyCCju+7qN0m3389pIYxmW7t01QLZWTs7x4saslV4B/OVH659HF2MHkOY8ft
1HdGB5HpXbtIHjhdaghKEWTwM1lwUy39pP2iJ4B4ltVs/zEBx+J0ytv+e3x3ZL38
LliUsAmgSMau8KArniJErphit61HzcY=
-----END CERTIFICATE-----`

export const handler = async (event: CustomAuthorizerEvent): Promise<CustomAuthorizerResult> => {
  try {
    const jwtToken = verifyToken(event.authorizationToken)
    console.log('User was authorized', jwtToken)

    return {
      principalId: jwtToken.payload.sub,
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
    console.log('User authorized', e.message)

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

function verifyToken(authHeader: string): Jwt {
  if (!authHeader)
    throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, { algorithms: ['RS256'] }) as Jwt
}
