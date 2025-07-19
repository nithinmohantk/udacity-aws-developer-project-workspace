

### Docker Commands 

```console
docker build -t thingxcloud/udacity-restapi-feed . 

docker build -t thingxcloud/udacity-restapi-user . 
docker build -t thingxcloud/udacity-frontend . 

docker run -dp 80:80 docker/getting-started
```

```console
sudo npm install -g @angular/cli@latest
sudo ng update --all --force
docker build -t thingxcloud/udacity-frontend . 
//Your can see the list of generated images by using the following command:

docker images
//If you want to remove any image, use the following commands:

docker image rm -f <image_name/ID>
docker image prune






