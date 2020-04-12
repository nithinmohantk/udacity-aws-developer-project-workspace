import 'source-map-support/register';
import * as uuid from 'uuid';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { getUserId } from '../lambda/utils';
import TodosAccess from '../dal/todosAccess';
import TodosStorage from '../dal/todosStorage';
import { TodoItem } from '../models/TodoItem';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { createLogger } from '../utils/logger'
const todosAccess = new TodosAccess();
const todosStorage = new TodosStorage();
const logger = createLogger('todos')
/**
 *
 * Create a todolist item 
 * @export
 * @param {APIGatewayProxyEvent} event
 * @param {CreateTodoRequest} createTodoRequest
 * @returns {Promise<TodoItem>}
 */
export async function createTodo(event: APIGatewayProxyEvent,
    createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4();
    const userId = getUserId(event);
    const createdAt = new Date(Date.now()).toISOString();

    const todoItem = {
        userId,
        todoId,
        createdAt,
        done: false,
        attachmentUrl: `https://${todosStorage.getBucketName()}.s3-eu-west-1.amazonaws.com/${todoId}`,
        ...createTodoRequest
    };

    logger.info('Storing new item: ' + JSON.stringify(todoItem));
    await todosAccess.addTodoToDB(todoItem);

    return todoItem;
}
/**
 * Delete a todo list item from database
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function deleteTodo(event: APIGatewayProxyEvent) {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);

    if (!(await todosAccess.getTodoFromDB(todoId, userId))) {
        return false;
    }

    await todosAccess.deleteTodoFromDB(todoId, userId);

    return true;
}
/**
 * get a Todo list item from database.
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function getTodo(event: APIGatewayProxyEvent) {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);

    return await todosAccess.getTodoFromDB(todoId, userId);
}
/**
 * get ToDo list from database 
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function getTodos(event: APIGatewayProxyEvent) {
    const userId = getUserId(event);

    return await todosAccess.getAllTodosFromDB(userId);
}
/**
 *  update ToDo list to database 
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @param {UpdateTodoRequest} updateTodoRequest
 * @returns
 */
export async function updateTodo(event: APIGatewayProxyEvent,
    updateTodoRequest: UpdateTodoRequest) {
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);

    if (!(await todosAccess.getTodoFromDB(todoId, userId))) {
        return false;
    }

    await todosAccess.updateTodoInDB(todoId, userId, updateTodoRequest);

    return true;
}
/**
 *
 *
 * @export
 * @param {APIGatewayProxyEvent} event
 * @returns
 */
export async function generateUploadUrl(event: APIGatewayProxyEvent) {
    const bucket = todosStorage.getBucketName();
    const urlExpiration = +process.env.AWS_S3_SIGNED_URL_EXPIRATION;
    const todoId = event.pathParameters.todoId;

    const CreateSignedUrlRequest = {
        Bucket: bucket,
        Key: todoId,
        Expires: urlExpiration
    }

    var result = await todosStorage.getPresignedUploadURL(CreateSignedUrlRequest);

    logger.info("todosStorage.getPresignedUploadURL", result);
    return result;
}
  