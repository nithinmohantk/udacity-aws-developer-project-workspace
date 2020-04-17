import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
import { updateAttachment } from '../../bll/docs';
import { createLogger } from '../../utils/logger'
import { UploadFileInfo } from '../../models/UploadFileInfo';
//import { UpdateAttachmentRequest } from '../../requests/UpdateAttachmentRequest';
const logger = createLogger('updateAttachment.handler')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const fileInfo: UploadFileInfo = JSON.parse(event.body);

    const updated = await updateAttachment(event,fileInfo);
    if (!updated) {
        logger.info("Document item entry does not exist.");
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: 'Document item entry does not exist.'
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