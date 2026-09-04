/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import YAML from 'yaml';
import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import { listConfigFiles } from '@lowdefy/node-utils';

import migrationFileSchema from './migrationFileSchema.js';

const MIGRATION_FILE = /\.ya?ml$/;

// The id is the path below migrations/ without the extension, so ordering is
// lexical on the id and the id is the ledger key (design D3). The checksum is
// over the raw file text — the thing the author edits — so an edit to an
// applied migration is detectable.
function migrationIdFromFileName(fileName) {
  return fileName.replace(MIGRATION_FILE, '');
}

function checksumOf(text) {
  return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
}

// Discovers migrations/**/*.yaml from the config directory through the shared
// discovery rule (listConfigFiles): recursive, byte-sorted, skipping "_" and
// "." prefixed names. Reads and checksums the raw text and parses the routine,
// but does no routine validation — buildMigrations runs each routine through
// buildRoutine so a migration gets the same step and control checks an
// endpoint gets. `_ref` inside a migration is not supported (design §3.1): a
// migration is a self-contained, checksummable unit.
async function collectMigrationFiles({ directories }) {
  const migrationsDir = path.resolve(directories.config, 'migrations');
  const files = listConfigFiles({ directory: migrationsDir });

  const migrations = [];
  const fileNameById = {};
  for (const { fileName, filePath } of files) {
    const text = await fs.readFile(filePath, 'utf8');
    const id = migrationIdFromFileName(fileName);
    // "a.yaml" and "a.yml" would share the ledger key "a"; two files answering
    // to one id makes the applied/pending decision ambiguous, so reject it.
    if (fileNameById[id] !== undefined) {
      throw new ConfigError(
        `Migration id "${id}" is declared by two files: "${fileNameById[id]}" and "${fileName}". Migration ids are file paths below migrations/ without the extension, and must be unique.`,
        { checkSlug: 'migration-files' }
      );
    }
    fileNameById[id] = fileName;
    let parsed;
    try {
      parsed = YAML.parse(text);
    } catch (error) {
      throw new ConfigError(`Migration "${id}" is not valid YAML: ${error.message}`, {
        checkSlug: 'migration-files',
      });
    }
    const { valid, errors } = validate({
      schema: migrationFileSchema,
      data: parsed,
      returnErrors: true,
    });
    if (!valid) {
      throw new ConfigError(`Migration "${id}" is invalid: ${errors[0].message}.`, {
        checkSlug: 'migration-files',
      });
    }
    migrations.push({
      id,
      checksum: checksumOf(text),
      name: parsed?.name,
      routine: parsed?.routine,
      filePath,
      text,
    });
  }
  return migrations;
}

export { checksumOf, migrationIdFromFileName };
export default collectMigrationFiles;
