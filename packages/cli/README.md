# Lowdefy CLI

The Lowdefy CLI is used to develop a Lowdefy app locally, and to build Lowdefy apps for deployment.

We recommend running the CLI using `npx`, to always use the latest version:

```
npx lowdefy@latest <command>
```

or, to use a specific version:

```
npx lowdefy@version <command>
```

Alternative, you can install the CLI globally or to a npm project (with a `package.json` file) via npm or yarn.

To install the CLI globally run:

```
npm install lowdefy -g
```

The CLI can then be run using `lowdefy` as the executable name:

```
lowdefy <command>
```

# CLI commands

## build

The `build` command runs a Lowdefy build. The options are:

- `--base-directory <base-directory>`: Change base directory. The default is the current working directory.
- `--blocks-server-url <blocks-server-url>`: The URL from where Lowdefy blocks will be served.
- `--disable-telemetry`: Disable telemetry.
- `--output-directory <output-directory>`: Change the directory to which build artifacts are saved. The default is `<base-directory>/.lowdefy/build`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.

## build-netlify

The `build-netlify` command creates a production build for the [Netlify](https://www.netlify.com) web hosting service. It is designed to run as the Netlify build command.

We recommend setting the build command to `npx lowdefy@latest build-netlify`. The Netlify publish directory should be set to `.lowdefy/publish`, and the functions directory set to `.lowdefy/functions`.

- `--base-directory <base-directory>`: Change base directory. The default is the current working directory (The base directory should rather be configured in the Netlify build settings).
- `--blocks-server-url <blocks-server-url>`: The URL from where Lowdefy blocks will be served.
- `--disable-telemetry`: Disable telemetry.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.

## clean-cache

The Lowdefy CLI caches block metadata, and build and server scripts in the `.lowdefy/cache` directory. These cached files can be removed using the `clean-cache` command.

- `--base-directory <base-directory>`: Change base directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.

## dev

The `dev` command starts a Lowdefy development server, running locally. It can be accessed in a browser at [http://localhost:3000](http://localhost:3000). The CLI watches the file system, and rebuilds the app and reloads served pages every time a change is made to any of the files in the project directory.

- `--base-directory <base-directory>`: Change base directory. The default is the current working directory.
- `--blocks-server-url <blocks-server-url>`: The URL from where Lowdefy blocks will be served.
- `--disable-telemetry`: Disable telemetry.
- `--port <port>`: Change the port the server is hosted at. The default is `3000`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--watch <paths...>`: A list of paths to files or directories that should be watched for changes.
- `--watch-ignore <patterns...>`: A list of paths to files or directories that should be ignored by the file watcher. Globs are supported.

#### Examples

Run the dev server, watching a relative directory for file changes:

```txt
npx lowdefy@latest dev --watch ../other-project
```

Run the dev server, ignoring the public directory:

```txt
npx lowdefy@latest dev --watch-ignore public/**
```

# Configuration

All the CLI options can either be set as command line options, or the `cli` config object in your `lowdefy.yaml` file. Options set as command line options take precedence over options set in the `lowdefy.yaml` file. The config in the `lowdefy.yaml` cannot be referenced using the `_ref` operator, but need to be set in the file itself.

Options set in the `lowdefy.yaml` should be defined in camelCase. The options that can be set are:

- `blocksServerUrl: string`: The URL from where Lowdefy blocks will be served.
- `disableTelemetry: boolean`: Disable telemetry.
- `outputDirectory: string`: Change the directory to which build artifacts are saved. The default is `<base-directory>/.lowdefy/build`.
- `refResolver: string`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `port: number`: Change the port the server is hosted at. The default is `3000`.
- `watch: string[]`: A list of paths to files or directories that should be watched for changes.
- `watchIgnore: string[]`: A list of paths to files or directories that should be ignored by the file watcher. Globs are supported.

The `--base-directory` option cannot be set from the `lowdefy.yaml` file.

# Telemetry

The CLI collects usage and error information to help us fix bugs, prioritize features, and understand how Lowdefy is being used.

All telemetry can be disabled by setting the `disableTelemetry` flag in `cli` config object in your `lowdefy.yaml` file (this cannot be a reference to another file), or by using the `--disable-telemetry` command line flag.:

###### `lowdefy.yaml`

```yaml
lowdefy: LOWDEFY_VERSION

cli:
  disableTelemetry: true
```

We collect the following information:

- The CLI version.
- The Lowdefy version of your app.
- A random local app id (stored locally in your project folder at `.lowdefy/cli.json`).
- The CLI command used.
- If the CLI is being used in the Netlify CI environment (when using the `build-netlify` command).
- Your IP address.
- Error messages and stack traces for any errors.

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
