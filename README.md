# Speckle Automate GitHub Action

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square&logo=discourse&logoColor=white)](https://discourse.speckle.works) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

## Introduction

This repository contains the source code for the Speckle Automate GitHub Action.
It is a GitHub Action that publishes a Speckle Automate Function definition to Speckle's automation platform.

## Documentation

> [!NOTE]
> This is a low level building block action.
> As a Speckle Automate Function developer you probably want to use our [composite action](https://github.com/specklesystems/speckle-automate-github-composite-action)

### Inputs

#### `speckle_automate_url`

The URL of the Speckle Automate Server to publish the function to.

Defaults to [`https://automate.speckle.dev`](https://automate.speckle.dev).

#### `speckle_token`

The Speckle Automate API token to use to publish the function. This token must have `functions:write` permissions.

**This must be stored in GitHub as an [encrypted secret](https://docs.github.com/en/actions/security-guides/encrypted-secrets)**. This token must be protected, as it allows anyone with access to it to publish functions as you to your Speckle Automate Server.

If you believe your token has been compromised, please revoke it immediately on your [Speckle Automate Server](https://automate.speckle.dev/tokens). Please also audit your Speckle Automate Function changes to ensure that they were not made by an unauthorized party.

Please note that this is not a Speckle Account token, but a **Speckle Automate API** token. You can create one by logging into the [Speckle Automate Server](https://automate.speckle.dev) and going to the [API Tokens](https://automate.speckle.dev/tokens) page.

#### `speckle_function_id`

Associates this new version with the given ID of a Speckle Function.

Your Speckle Token must have write permissions for the Speckle Function with this ID, otherwise the publish will fail.

#### `speckle_function_input_schema_file_path`

*Optional.* The path to the JSON Schema file that describes the input schema for this version of the Speckle Function. This file is used to define the input form that will be presented to users when they compose an Automation based on this Function. If not provided, no input form will be presented to users.

#### `speckle_function_command`

The command to run when this version of the Speckle Function is invoked. This command must be a valid command for the Docker image that contains the Speckle Function. This command must be a single string.

#### `speckle_function_release_tag`

The release tag for this version of the Speckle Function. This is intended to provide a more human understandable name for this version, and we recommend using the Git SHA of the commit used to generate this function version. The name must conform to the following:

- A minimum of 1 character is required.
- A maximum of 128 characters are permitted.
- The first character must be alphanumeric (of lower or upper case) or an underscor.
- Subsequent characters, if any, must be either alphanumeric (lower or upper case), underscore, hyphen, or a period.

#### `speckle_function_recommended_cpu_m`

*Optional.*  The recommended maximum CPU in millicores for the function. If the Function exceeds this limit, it will be throttled to run within the limit.

1000 millicores = 1 CPU core. Defaults to 1000 millicores (1 CPU core).

#### `speckle_function_recommended_memory_mi`

*Optional.* The recommended maximum memory in mebibytes for the function. If the Function exceeds this limit, it will be **terminated**.

1024 mebibytes = 1 gibibyte. Defaults to 100 mebibytes.

### Outputs

#### `version_id`

The unique ID of this version of the published function.

#### `speckle_automate_host`

The host component of the Speckle Automate Server URL.

### Example usage

Speckle Automate GitHub Action will register a Speckle Function with Speckle Automate. This is a necessary, but not sufficient, step in publishing your Speckle Function. You must also build and push the Docker image that contains your Speckle Function.

#### Publish a function to automate.speckle.dev

```yaml
uses: actions/speckle-automate-github-action@0.1.0
with:
  # speckle_automate_url is optional and defaults to https://automate.speckle.dev
  # The speckle_token is a secret and must be stored in GitHub as an encrypted secret
  # https://docs.github.com/en/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow
  speckle_token: "${{ secrets.SPECKLE_TOKEN }}"
  speckle_function_id: "abcdefghij"
  speckle_function_release_tag: "1.0.0"
```

#### Publish a function to a self-hosted server

```yaml
uses: actions/speckle-automate-github-action@0.1.0
with:
  # please update to the url of your self-hosted server
  speckle_automate_url: https://example.org
  # https://docs.github.com/en/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow
  speckle_token: ${{ secrets.SPECKLE_TOKEN }}
  speckle_function_id: "abcdefghij"
  speckle_function_release_tag: "1.0.0"
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
          # The name of the image to build and push.
          # This must be the automate url host, followed by the function id, followed by the release tag.
          tags: automate.speckle.dev/abcdefghij:1.0.0
      -
        id: speckle
        name: Register Speckle Function
        uses: actions/speckle-automate-github-action@0.1.0
        with:
          speckle_token: ${{ secrets.SPECKLE_TOKEN }}
          speckle_function_id: "abcdefghij"
          speckle_function_release_tag: "1.0.0"
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
