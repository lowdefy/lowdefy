# @lowdefy/node-utils

Node.js-specific file system and process utilities.

## Overview

Provides Node.js utilities for:

- File system operations
- Process spawning
- Environment variable handling
- Path manipulation

## Installation

```javascript
import { readFile, writeFile, spawnProcess } from '@lowdefy/node-utils';
```

## Functions

### readFile(filePath, options)

Read file contents:

```javascript
const content = await readFile('config.yaml');
const buffer = await readFile('image.png', { encoding: null });
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `encoding` | string | 'utf8' | File encoding |

### writeFile(filePath, data, options)

Write data to file:

```javascript
await writeFile('output.json', JSON.stringify(data));
await writeFile('output.json', data, { encoding: 'utf8' });
```

**Options:**
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `encoding` | string | 'utf8' | File encoding |

### cleanDirectory(dirPath)

Remove all files from a directory:

```javascript
await cleanDirectory('./build');
// All files in ./build are removed
// Directory itself remains
```

### copyFileOrDirectory(src, dest)

Copy files or directories recursively:

```javascript
// Copy single file
await copyFileOrDirectory('src/config.yaml', 'dest/config.yaml');

// Copy directory
await copyFileOrDirectory('src/templates', 'dest/templates');
```

### getFileExtension(filePath)

Extract file extension:

```javascript
getFileExtension('config.yaml'); // 'yaml'
getFileExtension('app.config.js'); // 'js'
getFileExtension('README'); // ''
```

### getFileSubExtension(filePath)

Extract sub-extension:

```javascript
getFileSubExtension('app.config.js'); // 'config'
getFileSubExtension('test.spec.ts'); // 'spec'
getFileSubExtension('file.js'); // ''
```

### spawnProcess(options)

Spawn child processes:

```javascript
await spawnProcess({
  command: 'npm',
  args: ['install'],
  cwd: './project',
  logger: console,
  processOptions: { env: process.env },
});
```

**Options:**
| Option | Type | Description |
|--------|------|-------------|
| `command` | string | Command to execute |
| `args` | string[] | Command arguments |
| `cwd` | string | Working directory |
| `logger` | object | Logger with info/error methods |
| `processOptions` | object | Node.js spawn options |
| `returnProcess` | boolean | Return process instead of promise |
| `onStdout` | function | Stdout line handler |
| `onStderr` | function | Stderr line handler |

**Return Process Mode:**

```javascript
const childProcess = await spawnProcess({
  command: 'node',
  args: ['server.js'],
  returnProcess: true,
});

// Kill later
childProcess.kill();
```

**Custom Output Handling:**

```javascript
await spawnProcess({
  command: 'npm',
  args: ['test'],
  onStdout: (line) => console.log('OUT:', line),
  onStderr: (line) => console.error('ERR:', line),
});
```

### getSecretsFromEnv(envObject)

Extract secrets from environment variables:

```javascript
const secrets = getSecretsFromEnv(process.env);
// Returns object with all env vars as potential secrets
```

Typically filtered by prefix or naming convention in calling code.

### Public address checks

A server that fetches a link a user supplied must not reach a private, loopback, link-local or
cloud metadata address. One copy of the check serves every such fetch (the `AwsS3PutObject` url
copy, the agent and AI request file downloads), so a range added here closes it for all of them.

- `isPublicAddress(address)`: `false` for any IPv4 or IPv6 address that is not public unicast,
  including an IPv4-mapped, NAT64 (`64:ff9b::/96`) or 6to4 (`2002::/16`) address that embeds a
  private IPv4 address.
- `createLookupPublicAddress({ createNotPublicError })`: a `dns.lookup` for a socket. The socket
  connects to the addresses it answers, so the address checked is the address connected to and a
  name that rebinds between lookups gets nowhere.
- `createConnectPublic({ createNotPublicError })`: an undici connector built on that lookup, which
  also checks an IP literal (a literal skips the lookup). Pass it as `new Agent({ connect })` and
  every request and redirect through that dispatcher is checked.

`createNotPublicError(hostname)` returns the error a refused address fails with, so each caller
keeps its own message and `code`:

```javascript
import createConnectPublic from '@lowdefy/node-utils/createConnectPublic.js';
import { Agent } from 'undici';

const dispatcher = new Agent({
  connect: createConnectPublic({
    createNotPublicError: (hostname) =>
      Object.assign(new Error(`Link to ${hostname} is not public.`), { code: 'url_not_public' }),
  }),
});
```

## Error Classes (Moved to @lowdefy/errors)

> **Note:** Error classes (`ConfigError`, `ConfigWarning`, `ConfigMessage`) and location resolution (`resolveConfigLocation`, `shouldSuppressBuildCheck`, `VALID_CHECK_SLUGS`) have moved to `@lowdefy/errors`. Import from there:
>
> ```javascript
> import {
>   ConfigError,
>   ConfigWarning,
>   shouldSuppressBuildCheck,
>   VALID_CHECK_SLUGS,
> } from '@lowdefy/errors';
> ```
>
> See [errors.md](./errors.md) for the complete error system and [error-tracing.md](../architecture/error-tracing.md) for the error flow.

## Dependencies

- `@lowdefy/helpers` (4.4.0)
- `fs-extra` (11.1.1)
- `undici` (the public address connector)

## Key Files

| File                         | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `src/readFile.js`            | File reading                                 |
| `src/writeFile.js`           | File writing                                 |
| `src/cleanDirectory.js`      | Directory cleaning                           |
| `src/copyFileOrDirectory.js` | Copy operations                              |
| `src/getFileExtension.js`    | Extension parsing                            |
| `src/spawnProcess.js`        | Process spawning                             |
| `src/getSecretsFromEnv.js`   | Environment secrets                          |
| `src/isPublicAddress.js`     | Public address ranges                        |
| `src/createConnectPublic.js` | Connector that reaches public addresses only |

## Usage Examples

### Build Script

```javascript
import { cleanDirectory, copyFileOrDirectory, spawnProcess } from '@lowdefy/node-utils';

async function build() {
  // Clean output
  await cleanDirectory('./dist');

  // Copy assets
  await copyFileOrDirectory('./src/assets', './dist/assets');

  // Run build
  await spawnProcess({
    command: 'npm',
    args: ['run', 'build'],
    logger: console,
  });
}
```

### File Processing

```javascript
import { readFile, writeFile, getFileExtension } from '@lowdefy/node-utils';

async function processFile(inputPath, outputPath) {
  const content = await readFile(inputPath);
  const ext = getFileExtension(inputPath);

  let processed;
  if (ext === 'yaml') {
    processed = yaml.parse(content);
  } else if (ext === 'json') {
    processed = JSON.parse(content);
  }

  await writeFile(outputPath, JSON.stringify(processed, null, 2));
}
```
