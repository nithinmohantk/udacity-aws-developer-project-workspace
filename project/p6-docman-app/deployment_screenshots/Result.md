```console
Serverless: Stack update finished...
Service Information
service: serverless-Doc-app01
stage: dev
region: eu-west-1
stack: serverless-Doc-app01-dev
resources: 62
api keys:
  None
endpoints:
  GET - https://ve1l7uy6kj.execute-api.eu-west-1.amazonaws.com/dev/Docs
  POST - https://ve1l7uy6kj.execute-api.eu-west-1.amazonaws.com/dev/Docs
  PATCH - https://ve1l7uy6kj.execute-api.eu-west-1.amazonaws.com/dev/Docs/{docId}
  DELETE - https://ve1l7uy6kj.execute-api.eu-west-1.amazonaws.com/dev/Docs/{docId}
  POST - https://ve1l7uy6kj.execute-api.eu-west-1.amazonaws.com/dev/Docs/{docId}/attachment
functions:
  Auth: serverless-Doc-app01-dev-Auth
  GetTodos: serverless-Doc-app01-dev-GetTodos
  CreateTodo: serverless-Doc-app01-dev-CreateTodo
  UpdateTodo: serverless-Doc-app01-dev-UpdateTodo
  DeleteTodo: serverless-Doc-app01-dev-DeleteTodo
  GenerateUploadUrl: serverless-Doc-app01-dev-GenerateUploadUrl
layers:
  None

Stack Outputs
AuthLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:serverless-Doc-app01-dev-Auth:9
GenerateUploadUrlLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:serverless-Doc-app01-dev-GenerateUploadUrl:4
UpdateTodoLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:serverless-Doc-app01-dev-UpdateTodo:4
GetTodosLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:serverless-Doc-app01-dev-GetTodos:4
DeleteTodoLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:serverless-Doc-app01-dev-DeleteTodo:4
EnterpriseLogAccessIamRole: arn:aws:iam::305706552515:role/serverless-Doc-app01-dev-EnterpriseLogAccessIamRo-1FOFIWXUPFSKA
CreateTodoLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:serverless-Doc-app01-dev-CreateTodo:4
ServiceEndpoint: https://ve1l7uy6kj.execute-api.eu-west-1.amazonaws.com/dev
ServerlessDeploymentBucketName: serverless-Doc-app01-de-serverlessdeploymentbuck-18cjqnd3a0ap2

Serverless: Removing old service artifacts from S3...
Serverless: Publishing service to the Serverless Dashboard...
Serverless: Successfully published your service to the Serverless Dashboard: https://dashboard.serverless.com/tenants/nithinmohantk1/applications/serverless-Doc-app01-app/services/serverless-Doc-app01/stage/dev/region/eu-west-1
```