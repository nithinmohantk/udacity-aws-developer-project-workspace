import * as AWS from 'aws-sdk';

import { DocumentClient } from 'aws-sdk/clients/dynamodb';
//import * as AWSXRay from 'aws-xray-sdk';
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS);

export default class DocAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly docsTable = process.env.AWS_DB_APP_TABLE,
        private readonly indexName = process.env.AWS_DB_INDEX_NAME
    ) { }
    /**
     *
     *
     * @param {*} docItem
     * @memberof DocAccess
     */
    async addDocToDB(docItem) {
        await this.docClient.put({
            TableName: this.docsTable,
            Item: docItem
        }).promise();
    }
    /**
     *
     *
     * @param {*} docId
     * @param {*} userId
     * @memberof DocAccess
     */
    async deleteDocFromDB(docId, userId) {
        await this.docClient.delete({
            TableName: this.docsTable,
            Key: {
                docId,
                userId
            }
        }).promise();
    }
    /**
     *
     *
     * @param {*} docId
     * @param {*} userId
     * @returns
     * @memberof DocAccess
     */
    async getDocFromDB(docId, userId) {
        const result = await this.docClient.get({
            TableName: this.docsTable,
            Key: {
                docId,
                userId
            }
        }).promise();

        return result.Item;
    }

    /**
     *
     *
     * @param {*} userId
     * @returns
     * @memberof DocAccess
     */
    async getAllDocsFromDB(userId) {
        const result = await this.docClient.query({
            TableName: this.docsTable,
            IndexName: this.indexName,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }).promise();

        return result.Items;
    }
    /**
     *
     *
     * @param {*} docId
     * @param {*} userId
     * @param {*} updatedDoc
     * @memberof DocAccess
     */
    async updateDocInDB(docId, userId, updatedDoc) {
        await this.docClient.update({
            TableName: this.docsTable,
            Key: {
                docId,
                userId
            },
            UpdateExpression: 'set #name = :n, #version = :version, #status = :s',
            ExpressionAttributeValues: {
                ':n': updatedDoc.name,
                ':version': updatedDoc.version,
                ':s': updatedDoc.status
            },
            ExpressionAttributeNames: {
                '#name': 'name',
                '#version': 'version',
                '#status': 'status'
            }
        }).promise();
    }

  /**
   *
   *
   * @param {*} docId
   * @param {*} userId
   * @param {*} attachmentUrl
   * @memberof DocAccess
   */
  async updateAttachmentInDB(docId, userId, attachmentUrl) {
    await this.docClient.update({
      TableName: this.docsTable,
      Key: {
        docId,
        userId
      },
      UpdateExpression: 'set #attachmentUrl = :a',
      ExpressionAttributeValues: {
        ':a': attachmentUrl
      },
      ExpressionAttributeNames: {
        '#attachmentUrl': 'attachmentUrl'
      }
    }).promise();
  }
}
