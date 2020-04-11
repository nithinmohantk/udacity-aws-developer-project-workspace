import { CreateSignedUrlRequest } from '../requests/CreateSignedUrlRequest';
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';

const XAWS = AWSXRay.captureAWS(AWS);
//env: process.env.AWS_BUCKET
export default class TodosStorage {
    constructor(
        private readonly todosStorage = process.env.AWS_BUCKET,
        private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' })
    ) { }
    /**
     *To get the storage bucket name
     *
     * @returns
     * @memberof TodosStorage
     */
    getBucketName() {
        return this.todosStorage;
    }
    /**
     * Ge the item using Signed Url 
     *
     * @param {CreateSignedUrlRequest} CreateSignedUrlRequest
     * @returns
     * @memberof TodosStorage
     */
    getPresignedUploadURL(CreateSignedUrlRequest: CreateSignedUrlRequest) {
        return this.s3.getSignedUrl('putObject', CreateSignedUrlRequest);
    }
}