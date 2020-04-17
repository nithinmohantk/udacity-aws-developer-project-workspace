import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { CreateDocRequest } from '../../requests/CreateDocRequest';
import { createDoc } from '../../bll/docs';

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newDoc: CreateDocRequest = JSON.parse(event.body);

  // docItem cannot  is not empty
  if (!newDoc.name) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'name is empty'
      })
    };
  }

  const docItem = await createDoc(event, newDoc);

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item: docItem
    })
  };
}