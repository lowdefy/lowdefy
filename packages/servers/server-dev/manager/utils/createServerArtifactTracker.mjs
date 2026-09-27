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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';

// The files the dev server reads when it starts. Node never drops a loaded
// ES module, so a change to one needs a new server process. Client-side
// artifacts (blocks.js, operators/client.js, globals.css, ...) are served by
// Vite, which hot-replaces them without a restart. package.json lists the
// plugin packages: a change there needs an install first.
const trackedFiles = [
  'build/app.json',
  'build/auth.json',
  'build/config.json',
  'build/plugins/auth/adapters.js',
  'build/plugins/auth/providers.js',
  'build/plugins/connections.js',
  'build/plugins/operators/server.js',
  'package.json',
];

function hashFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  // Build keys (~k) change with unrelated edits and mean nothing to the server.
  if (filePath.endsWith('.json')) {
    content = JSON.stringify(
      JSON.parse(content, (_, value) => {
        if (!type.isObject(value)) return value;
        delete value['~k'];
        return value;
      })
    );
  }
  return crypto.createHash('sha1').update(content).digest('base64');
}

// Compares these files with what the running server started with, so a
// build restarts the server only when it changed something the server read.
function createServerArtifactTracker({ directories }) {
  function hashAll() {
    return Object.fromEntries(
      trackedFiles.map((file) => [file, hashFile(path.join(directories.server, file))])
    );
  }

  let started = hashAll();

  function record() {
    started = hashAll();
  }

  function check() {
    const current = hashAll();
    const changed = trackedFiles.filter((file) => current[file] !== started[file]);
    return {
      install: changed.includes('package.json'),
      restart: changed.length > 0,
    };
  }

  return { check, record };
}

export default createServerArtifactTracker;
