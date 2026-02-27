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

## Key Files

| File                           | Purpose                                |
| ------------------------------ | -------------------------------------- |
| `src/readFile.js`              | File reading                           |
| `src/writeFile.js`             | File writing                           |
| `src/cleanDirectory.js`        | Directory cleaning                     |
| `src/copyFileOrDirectory.js`   | Copy operations                        |
| `src/getFileExtension.js`      | Extension parsing                      |
| `src/spawnProcess.js`          | Process spawning                       |
| `src/getSecretsFromEnv.js`     | Environment secrets                    |
| `src/ConfigMessage.js`         | Base class for config messages         |
| `src/ConfigError.js`           | Build-time error with location         |
| `src/ConfigWarning.js`         | Build-time warning with prodError flag |
| `src/resolveConfigLocation.js` | Config location resolver               |

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
