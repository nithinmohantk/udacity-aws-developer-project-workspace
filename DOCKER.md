# Docker Usage

This repository includes Docker support for building and running the various projects.

## Building a Docker Image

To build a Docker image for a specific project, use the following command from the root directory:

```bash
# Build image for the image filter project
docker build --build-arg PROJECT_PATH=src/project/image-filter-udagram-app -t udacity-image-filter .

# Build image for microservices frontend
docker build --build-arg PROJECT_PATH=src/project/c2-microservices-v1/udacity-c2-frontend -t udacity-c2-frontend .

# Build image for microservices REST API feed service
docker build --build-arg PROJECT_PATH=src/project/c2-microservices-v1/udacity-c2-restapi-feed -t udacity-c2-restapi-feed .
```

## Running a Docker Container

After building an image, run it with:

```bash
docker run -p 8080:8080 udacity-image-filter
```

## GitHub Actions

The repository includes GitHub Actions workflows that automatically build and publish Docker images to GitHub Container Registry when code is pushed to main branches.

### Available Images

- `ghcr.io/nithinmohantk/udacity-aws-developer-project-workspace/image-filter-udagram`
- `ghcr.io/nithinmohantk/udacity-aws-developer-project-workspace/udacity-c2-frontend`
- `ghcr.io/nithinmohantk/udacity-aws-developer-project-workspace/udacity-c2-restapi-feed`
- `ghcr.io/nithinmohantk/udacity-aws-developer-project-workspace/udacity-c2-restapi-user`

Images are tagged with branch names, semantic versions, and SHA hashes.