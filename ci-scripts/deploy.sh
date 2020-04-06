#!/bin/bash

kubectl apply -f udacity-c2-deployment/k8s

kubectl set image deployments/backend-feed backend-feed=thingxcloud/udacity-restapi-feed:$IMAGE_VERSION
kubectl set image deployments/backend-user backend-user=thingxcloud/udacity-restapi-user:$IMAGE_VERSION
kubectl set image deployments/frontend frontend=thingxcloud/udacity-frontend:$IMAGE_VERSION
kubectl set image deployments/reverseproxy reverseproxy=thingxcloud/udacity-reverseproxy:$IMAGE_VERSION