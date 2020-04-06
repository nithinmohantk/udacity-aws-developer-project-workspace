#!/bin/bash

kubectl apply -f udacity-c2-deployment/k8s

kubectl set image deployments/backend-feed backend-feed=thingxcloud/udacity-restapi-feed:$SHA
kubectl set image deployments/backend-user backend-user=thingxcloud/udacity-restapi-user:$SHA
kubectl set image deployments/frontend frontend=thingxcloud/udacity-frontend:$SHA
kubectl set image deployments/reverseproxy reverseproxy=thingxcloud/udacity-reverseproxy:$SHA