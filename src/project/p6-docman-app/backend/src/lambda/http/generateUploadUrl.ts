import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
import { generateUploadUrl } from '../../bll/docs';
import { createLogger } from '../../utils/logger'
import { UploadFileInfo } from '../../models/UploadFileInfo';
const logger = createLogger('generateUploadUrl')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const fileInfo: UploadFileInfo = JSON.parse(event.body);

  const signedUrl = await generateUploadUrl(event,fileInfo);
  logger.info("generateUploadUrl::signedUrl", signedUrl);
  logger.info(`fileInfo :: ${event.body}`);
  return {
    statusCode: 202,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl: signedUrl
    })
  };
}