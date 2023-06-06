# Speckle Automate GitHub Action

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square&logo=discourse&logoColor=white)](https://discourse.speckle.works) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

## Introduction

This repository contains the source code for the Speckle Automate GitHub Action. It is a GitHub Action that publishes a Speckle Automate Function to Speckle Automate your source code.

## Documentation

### Inputs

#### `speckle_server_url`

The URL of the Speckle Automate Server to publish the function to.

Defaults to [`https://automate.speckle.xyz`](https://automate.speckle.xyz).

#### `speckle_token`

The Speckle Automate API token to use to publish the function. This token must have `functions:write` permissions.

**This must be stored in GitHub as an [encrypted secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets)**. This token must be protected, as it allows anyone with access to it to publish functions as you to your Speckle Automate Server.

If you believe your token has been compromised, please revoke it immediately on your [Speckle Automate Server](https://automate.speckle.xyz/tokens). Please also audit your Speckle Automate Function changes to ensure that they were not made by an unauthorized party.

Please note that this is not a Speckle Account token, but a **Speckle Automate API** token. You can create one by logging into the [Speckle Automate Server](https://automate.speckle.xyz) and going to the [API Tokens](https://automate.speckle.xyz/tokens) page.

#### `speckle_function_path`

The path to the Speckle Automate Function to publish. This path is relative to the root of the repository. If you provide a path to a directory, your Speckle Automate Function must be in a file named `specklefunction.yaml` within that directory.

#### `speckle_function_id`

*Optional.* If you have already registered a Speckle Function, you can use the ID of that Speckle Function to ensure that any changes are associated with it.
If you do not provide a Function Id, we will attempt to determine the Function ID based on the GitHub server, GitHub repository, Reference (branch), and the Speckle Function Path.

Providing a Speckle Function ID allows you to change one of those values, and update the original Function instead of creating a new one.

Your Speckle Token must have write permissions for the Speckle Function with this ID, otherwise the publish will fail.

### Outputs

#### `version_id`

The unique ID of this version of the published function.

### Example usage

Speckle Automate GitHub Action will register a Speckle Function with Speckle Automate. This is a necessary, but not sufficient, step in publishing your Speckle Function. You must also build and push the Docker image that contains your Speckle Function.

#### Publish a function to automate.speckle.xyz

```yaml
uses: actions/speckle-automate-github-action@0.1.0
with:
  # speckle_server_url is optional and defaults to https://automate.speckle.xyz
  # The speckle_token is a secret and must be stored in GitHub as an encrypted secret
  # https://docs.github.com/en/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow
  speckle_token: ${{ secrets.SPECKLE_TOKEN }}
  # speckle_function_path is optional and defaults to ./specklefunction.yaml
  # speckle_function_id is optional and will be auto-generated if not provided
```

#### Publish a function to a self-hosted server

```yaml
uses: actions/speckle-automate-github-action@0.1.0
with:
  # please update to the url of your self-hosted server
  speckle_server_url: https://example.org
  # https://docs.github.com/en/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow
  speckle_token: ${{ secrets.SPECKLE_TOKEN }}
  # speckle_function_path is optional and defaults to ./specklefunction.yaml
  # speckle_function_id is optional and will be auto-generated if not provided
```

### Example usage within an entire GitHub Actions Workflow

#### Publish a Speckle Function, and build the Docker Image using Docker

Docker is the original, and still one of the most popular, ways to build and publish Docker images. It does require that you provide a [Dockerfile](https://docs.docker.com/engine/reference/builder/), which includes instructions to Docker for building your image.

Find out more about Docker and Dockerfiles by following Docker's [Get Started Guide](https://docs.docker.com/get-started/).

You can learn more about Docker's GitHub Action from their documentation in the [GitHub Actions Marketplace](https://github.com/marketplace/actions/build-and-push-docker-images).

```yaml
name: ci

on:
  push:
    branches:
      - 'main'

jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      -
        # Checkout the code
        # Docker's GitHub Action does not require this step
        # but Speckle Automate does
        name: Checkout
        uses: actions/checkout@v3
      -
        id: speckle
        name: Register Speckle Function
        uses: actions/speckle-automate-github-action@0.1.0
        with:
          speckle_token: ${{ secrets.SPECKLE_TOKEN }}
      -
        name: Set up QEMU
        uses: docker/setup-qemu-action@v2
      -
        name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      -
        name: Docker needs to login to Speckle Automate
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.SPECKLE_USERNAME }}
          password: ${{ secrets.SPECKLE_TOKEN }}
      -
        name: Build and push
        uses: docker/build-push-action@v4
        with:
          # ## file is optional and defaults to {context}/Dockerfile
          # file: ./Dockerfile
          # ## context is optional and defaults to the root directory '.' of the repository
          # context: .
          # ## platforms is optional and defaults to linux/amd64
          # ## platforms must match the platforms that you have registered with Speckle Automate, which also defaults to linux/amd64.
          # platforms: linux/amd64
          push: true
          tags: ${{ steps.speckle.outputs.image_name }}
```

## Developing & Debugging

### Running locally

#### Prerequisites to running locally

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) (v18)
- [Yarn](https://yarnpkg.com/getting-started/install)

#### Building

1. Clone this repository
1. Run `yarn install` to install dependencies.
1. Run `yarn run all` to validate, build, and test the project.

### Developing

#### Prerequisites to developing

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) (v18)
- [Yarn](https://yarnpkg.com/getting-started/install)
- [Pre-Commit](https://pre-commit.com/#install)

1. Clone this repository
1. Run `pre-commit install` to install the pre-commit hooks
1. Run `yarn install` to install dependencies

#### Testing

1. Run unit tests with coverage:

    ```bash
    yarn test
    ```

1. Run unit tests and watch for changes while developing:

    ```bash
    yarn test:watch
    ```

#### Linting

1. Run `yarn precommit` to run all pre-commit hooks.
1. You must address all linting errors prior to committing changes. The CI will fail if there are any linting errors, and you will be unable to merge your PR.

## Contributing

Please make sure you read the [contribution guidelines](.github/CONTRIBUTING.md) and [code of conduct](.github/CODE_OF_CONDUCT.md) for an overview of the practices we try to follow.

## Community

The Speckle Community hangs out on [the forum](https://discourse.speckle.works), do join and introduce yourself & feel free to ask us questions!

## Security

For any security vulnerabilities or concerns, please contact us directly at security[at]speckle.systems.

## License

Unless otherwise described, the code in this repository is licensed under the Apache-2.0 License. Please note that some modules, extensions or code herein might be otherwise licensed. This is indicated either in the root of the containing folder under a different license file, or in the respective file's header. If you have any questions, don't hesitate to get in touch with us via [email](mailto:hello@speckle.systems).

## Acknowledgements

- [GitHub Actions/ TypeScript Action](https://github.com/actions/typescript-action/tree/main)
