import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
import { deleteDoc } from '../../bll/docs';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // delete doc and if it fails, return error
  if (!(await deleteDoc(event))) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        error: 'Item does not exist'
      })
    };
  }

  return {
    statusCode: 202,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({})
  };
}