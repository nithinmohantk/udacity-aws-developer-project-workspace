```console
CloudFormation - DELETE_SKIPPED - AWS::Lambda::Version - UpdateDocLambdaVersionDfAFLPLvCPiFTMjpyqeLH4ShaWWbTv7fxU76KJZ3c
CloudFormation - DELETE_SKIPPED - AWS::Lambda::Version - DeleteDocLambdaVersionMu70zs788HztO8H98VweGo4CLTCWYIVb1KS2UDfqBI
CloudFormation - DELETE_SKIPPED - AWS::Lambda::Version - GetDocsLambdaVersioneQnJwZ6Oz4nHjO4h51fyK0ImaAybij6AejChLDL3iBE
CloudFormation - DELETE_COMPLETE - AWS::ApiGateway::Deployment - ApiGatewayDeployment1587124943094
CloudFormation - UPDATE_COMPLETE - AWS::CloudFormation::Stack - docman-backend-stack
Serverless: Stack update finished...
Service Information
service: docman-backend
stage: dev
region: eu-west-1
stack: docman-backend-stack
resources: 70
api keys:
  None
endpoints:
  GET - https://8xhrfua85i.execute-api.eu-west-1.amazonaws.com/dev/docs
  POST - https://8xhrfua85i.execute-api.eu-west-1.amazonaws.com/dev/docs
  PATCH - https://8xhrfua85i.execute-api.eu-west-1.amazonaws.com/dev/docs/{docId}
  DELETE - https://8xhrfua85i.execute-api.eu-west-1.amazonaws.com/dev/docs/{docId}
  POST - https://8xhrfua85i.execute-api.eu-west-1.amazonaws.com/dev/docs/{docId}/attachment
  PATCH - https://8xhrfua85i.execute-api.eu-west-1.amazonaws.com/dev/docs/{docId}/attachment
functions:
  Auth: docman-backend-dev-Auth
  GetDocs: docman-backend-dev-GetDocs
  CreateDoc: docman-backend-dev-CreateDoc
  UpdateDoc: docman-backend-dev-UpdateDoc
  DeleteDoc: docman-backend-dev-DeleteDoc
  GenerateUploadUrl: docman-backend-dev-GenerateUploadUrl
  UpdateAttachment: docman-backend-dev-UpdateAttachment
layers:
  None

Stack Outputs
AuthLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:docman-backend-dev-Auth:12
DeleteDocLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:docman-backend-dev-DeleteDoc:8
GenerateUploadUrlLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:docman-backend-dev-GenerateUploadUrl:8
GetDocsLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:docman-backend-dev-GetDocs:8
CreateDocLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:docman-backend-dev-CreateDoc:8
EnterpriseLogAccessIamRole: arn:aws:iam::305706552515:role/docman-backend-stack-EnterpriseLogAccessIamRole-HMHJ5WL7OCOE
UpdateDocLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:docman-backend-dev-UpdateDoc:8
UpdateAttachmentLambdaFunctionQualifiedArn: arn:aws:lambda:eu-west-1:305706552515:function:docman-backend-dev-UpdateAttachment:1
ServiceEndpoint: https://8xhrfua85i.execute-api.eu-west-1.amazonaws.com/dev
ServerlessDeploymentBucketName: docman-backend-stack-serverlessdeploymentbucket-oa4rvmysggtm

Serverless: Publishing service to the Serverless Dashboard...
Serverless: Successfully published your service to the Serverless Dashboard: https://dashboard.serverless.com/tenants/nithinmohantk1/applications/docman-backend/services/docman-backend/stage/dev/region/eu-west-1
```