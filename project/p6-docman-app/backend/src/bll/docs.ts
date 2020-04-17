import 'source-map-support/register';
import * as uuid from 'uuid';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserId } from '../lambda/utils';
import DocAccess from '../dal/docAccess';
import DocStorage from '../dal/docStorage';
import { DocItem } from '../models/DocItem';
import { CreateDocRequest } from '../requests/CreateDocRequest';
import { UpdateDocRequest } from '../requests/UpdateDocRequest';
/* tslint:disable */
//import { UpdateAttachmentRequest } from '../requests/UpdateAttachmentRequest';
/* tslint:enable */
import { createLogger } from '../utils/logger'
import { UploadFileInfo } from '../models/UploadFileInfo';
const docsAccess = new DocAccess();
const docStorage = new DocStorage();
const logger = createLogger('Docs')
/**
 *
 * Create a Doclist item
 * @export
 * @param {APIGatewayProxyEvent} event
 * @param {CreateDocRequest} createDocRequest
 * @returns {Promise<DocItem>}
 */
export async function createDoc(event: APIGatewayProxyEvent,
    createDocRequest: CreateDocRequest): Promise<DocItem> {
    const docId = uuid.v4();
    const userId = getUserId(event);
    const createdAt = new Date(Date.now()).toISOString();
    const updatedAt = new Date(Date.now()).toISOString();
    const docItem = {
        userId,
        docId: docId,
        createdAt,
        updatedAt,
        status: "draft", //initial creation it will be added as draft. After upload completion will be modified as final.
        version: "1.0.0",
        type: "n/a",
        
        //attachmentUrl: `https://${docStorage.getBucketName()}.s3-eu-west-1.amazonaws.com/docs/{userId}/${docId}.png`,
        ...createDocRequest
    };

    logger.info('Storing new item: ' + JSON.stringify(docItem));
    await docsAccess.addDocToDB(docItem);

    return docItem;
}
/**
 * Delete a Doc list item from database
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function deleteDoc(event: APIGatewayProxyEvent) {
    const docId = event.pathParameters.docId;
    const userId = getUserId(event);

    if (!(await docsAccess.getDocFromDB(docId, userId))) {
        return false;
    }

    await docsAccess.deleteDocFromDB(docId, userId);

    return true;
}
/**
 * get a Doc item from database.
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function getDoc(event: APIGatewayProxyEvent) {
    const docId = event.pathParameters.docId;
    const userId = getUserId(event);

    return await docsAccess.getDocFromDB(docId, userId);
}
/**
 * get Docs list from database
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function getDocs(event: APIGatewayProxyEvent) {
    const userId = getUserId(event);

    return await docsAccess.getAllDocsFromDB(userId);
}
/**
 *  update Doc entry to database
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @param {UpdateDocRequest} updateDocRequest
 * @returns
 */
export async function updateDoc(event: APIGatewayProxyEvent,
    updateDocRequest: UpdateDocRequest) {
    const docId = event.pathParameters.docId;
    const userId = getUserId(event);

    //Check if document record exists in DB, then continue else break and exit function.
    if (!(await docsAccess.getDocFromDB(docId, userId))) {
        return false;
    }
    await docsAccess.updateDocInDB(docId, userId, updateDocRequest);

    return true;
}

/**
 * to update attachment info back to DB on successful upload.
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @param {UploadFileInfo} fileInfo
 * @returns
 */
export async function updateAttachment(event:APIGatewayProxyEvent,fileInfo: UploadFileInfo) 
{
    const bucket = docStorage.getBucketName();
    const region = docStorage.getBucketRegion();
    const baseFolder = docStorage.getBucketBaseFolder();
    const docId = event.pathParameters.docId;
    const userId = getUserId(event);

    const attachmentUrl = `https://${bucket}.${region}.amazonaws.com/${baseFolder}/${userId}/${docId}.${fileInfo.extn}`;

      //Check if document record exists in DB, then continue with update attachment Info to DB. Else break.
      if (!(await docsAccess.getDocFromDB(docId, userId))) {
        return false;
      }
      logger.info(`{docId} :: {userId} :: {attachmentUrl}`);
      await docsAccess.updateAttachmentInDB(docId, userId, attachmentUrl);

      return true;
}
/**
 * Generates Presigned Upload Url for the attachment. Later can be used to upload attachments to the specific resource location.
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function generateUploadUrl(event: APIGatewayProxyEvent, fileInfo: UploadFileInfo) {
    const bucket = docStorage.getBucketName();
    //const region = docStorage.getBucketRegion();
    const baseFolder = docStorage.getBucketBaseFolder();
    const urlExpiration = +process.env.AWS_S3_SIGNED_URL_EXPIRATION;
    const docId = event.pathParameters.docId;
    const userId = getUserId(event);
    //const attachmentUrl = `https://${bucket}.${region}.amazonaws.com/${baseFolder}/${userId}/${docId}.${fileInfo.extn}`;
    const CreateSignedUrlRequest = {
        Bucket: bucket,
        Key: `${baseFolder}/${userId}/${docId}.${fileInfo.extn}`,
        Expires: urlExpiration
    }

    var result = await docStorage.getPresignedUploadURL(CreateSignedUrlRequest);
    logger.info("docStorage.getPresignedUploadURL", result);

  return result;
}
