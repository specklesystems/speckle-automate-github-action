# Speckle Automate GitHub Action

[![Twitter Follow](https://img.shields.io/twitter/follow/SpeckleSystems?style=social)](https://twitter.com/SpeckleSystems) [![Community forum users](https://img.shields.io/discourse/users?server=https%3A%2F%2Fdiscourse.speckle.works&style=flat-square&logo=discourse&logoColor=white)](https://discourse.speckle.works) [![website](https://img.shields.io/badge/https://-speckle.systems-royalblue?style=flat-square)](https://speckle.systems) [![docs](https://img.shields.io/badge/docs-speckle.guide-orange?style=flat-square&logo=read-the-docs&logoColor=white)](https://speckle.guide/dev/)

## Introduction

This repository contains the source code for the Speckle Automate GitHub Action. It is a GitHub Action that builds a Speckle Automate Function from your source code.

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

### Outputs

#### `function_id`

The unique ID of the published function.

#### `version_id`

The unique ID of this version of the published function.

### Example usage

#### Publish a function to automate.speckle.xyz

```yaml
uses: actions/speckle-automate-github-action@0.1.0
with:
  # speckle_server_url is optional and defaults to https://automate.speckle.xyz
  # speckle_server_url: https://automate.speckle.xyz
  # https://docs.github.com/en/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow
  speckle_token: ${{ secrets.speckle_token }}
```

#### Publish a function to a self-hosted server

```yaml
uses: actions/speckle-automate-github-action@0.1.0
with:
  # please update to the url of your self-hosted server
  speckle_server_url: https://example.org
  # https://docs.github.com/en/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow
  speckle_token: ${{ secrets.speckle_token }}
```

## Developing & Debugging

### Running locally

#### Prerequisites to running locally

- [Docker](https://docs.docker.com/get-docker/)
- [Node.js](https://nodejs.org/en/download/) (v18)
- [Yarn](https://yarnpkg.com/getting-started/install)

#### Building

1. Clone this repository
1. Run `yarn install` to install dependencies
1. Run `yarn build`

#### Running built image

1. Set the Speckle Server URL and Speckle Token environment variables, and run the image:

    ```bash
    export SPECKLE_SERVER_URL="https://automate.speckle.xyz" # (or your self-hosted server, which may be `localhost:3000` if running a development server)
    export SPECKLE_TOKEN="ABCD1234" #(replace with your token)
    docker run --rm \
    -e SPECKLE_SERVER_URL="${SPECKLE_SERVER_URL}" \
    -e SPECKLE_TOKEN="${SPECKLE_TOKEN}" \
    -e SPECKLE_FUNCTION_PATH="./examples/basic" \
    -e GITHUB_WORKSPACE="/home/runner/work/specklesystems/speckle-automate-github-action" \
    -e GITHUB_OUTPUT="/output/github_output" \
    -v "$(pwd):/home/runner/work/specklesystems/speckle-automate-github-action" \
    -v "/tmp:/output" \
    speckle/speckle-automate-github-action:local
    ```

1. Inspect the output at `/tmp/github_output`:

    ```bash
    cat /tmp/github_output
    ```

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

1. Run unit tests:

    ```bash
    yarn test
    ```

1. Run integration tests:

    ```bash
    yarn test:e2e
    ```

#### Linting

1. Run `yarn pre-commit` to run all pre-commit hooks.
1. Address all linting errors prior to committing changes.

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
