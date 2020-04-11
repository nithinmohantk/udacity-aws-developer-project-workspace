import * as AWS from 'aws-sdk';

import { DocumentClient } from 'aws-sdk/clients/dynamodb';
//import * as AWSXRay from 'aws-xray-sdk';
const AWSXRay = require('aws-xray-sdk')
const XAWS = AWSXRay.captureAWS(AWS);

export default class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.AWS_DB_TODOS_TABLE,
        private readonly indexName = process.env.AWS_DB_INDEX_NAME
    ) { }
    /**
     *
     *
     * @param {*} todoItem
     * @memberof TodosAccess
     */
    async addTodoToDB(todoItem) {
        await this.docClient.put({
            TableName: this.todosTable,
            Item: todoItem
        }).promise();
    }
    /**
     *
     *
     * @param {*} todoId
     * @param {*} userId
     * @memberof TodosAccess
     */
    async deleteTodoFromDB(todoId, userId) {
        await this.docClient.delete({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            }
        }).promise();
    }
    /**
     *
     *
     * @param {*} todoId
     * @param {*} userId
     * @returns
     * @memberof TodosAccess
     */
    async getTodoFromDB(todoId, userId) {
        const result = await this.docClient.get({
            TableName: this.todosTable,
            Key: {
                todoId,
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
     * @memberof TodosAccess
     */
    async getAllTodosFromDB(userId) {
        const result = await this.docClient.query({
            TableName: this.todosTable,
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
     * @param {*} todoId
     * @param {*} userId
     * @param {*} updatedTodo
     * @memberof TodosAccess
     */
    async updateTodoInDB(todoId, userId, updatedTodo) {
        await this.docClient.update({
            TableName: this.todosTable,
            Key: {
                todoId,
                userId
            },
            UpdateExpression: 'set #name = :n, #dueDate = :due, #done = :d',
            ExpressionAttributeValues: {
                ':n': updatedTodo.name,
                ':due': updatedTodo.dueDate,
                ':d': updatedTodo.done
            },
            ExpressionAttributeNames: {
                '#name': 'name',
                '#dueDate': 'dueDate',
                '#done': 'done'
            }
        }).promise();
    }
}