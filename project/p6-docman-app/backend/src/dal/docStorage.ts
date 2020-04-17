import { CreateSignedUrlRequest } from '../requests/CreateSignedUrlRequest';
import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { createLogger } from '../utils/logger'
const XAWS = AWSXRay.captureAWS(AWS);

const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})
const docStorage = process.env.AWS_S3_BUCKET;
const docStorage_Region = process.env.AWS_S3_BUCKET_REGION;
const docStorage_BaseFolder = process.env.AWS_S3_BUCKET_BASEFOLDER;
const logger = createLogger('DocStorage')
//env: process.env.AWS_S3_BUCKET
export default class DocStorage {
  constructor(

  ) { }
  /**
   *To get the storage bucket name
   *
   * @returns
   * @memberof DocStorage
   */
  getBucketName() {
    return docStorage;
  }
  /**
   *
   *
   * @returns
   * @memberof DocStorage
   */
  getBucketRegion() {
    return docStorage_Region;
  }

  /**
   *
   *
   * @returns
   * @memberof DocStorage
   */
  getBucketBaseFolder() {
    return docStorage_BaseFolder;
  }
  /**
   * Ge the item using Signed Url
   *
   * @param {CreateSignedUrlRequest} CreateSignedUrlRequest
   * @returns
   * @memberof DocStorage
   */
  async getPresignedUploadURL(createSignedUrlRequest: CreateSignedUrlRequest) {
    logger.info('getPresignedUploadURL', {
      // Additional information stored with a log statement
      requestData: createSignedUrlRequest
    });

    /*return s3.getSignedUrl('putObject',
       {
        Bucket: createSignedUrlRequest.Bucket,
        Key: createSignedUrlRequest.Key,
        Expires: createSignedUrlRequest.Expires
      }); */
    const signedUrl = await this.getSignedUrl(createSignedUrlRequest);
    return signedUrl;
  }

/**
 *
 *
 * @param {CreateSignedUrlRequest} createSignedUrlRequest
 * @returns
 * @memberof DocStorage
 */
async getSignedUrl(createSignedUrlRequest: CreateSignedUrlRequest) {
    return new Promise((resolve, reject) => {
      let params = { Bucket: createSignedUrlRequest.Bucket, Key: createSignedUrlRequest.Key, Expires: createSignedUrlRequest.Expires };
      s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) reject(err)
        resolve(url);
      })
    })
  }
}
