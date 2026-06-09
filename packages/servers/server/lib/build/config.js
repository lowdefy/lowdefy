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

// Build artifacts are read from disk because the Hono server runs as
// unbundled Node.js ESM — JSON imports would need import attributes, and
// client code imports the build JSON directly through Vite instead.
import fs from 'node:fs';
import path from 'node:path';
import { serializer } from '@lowdefy/helpers';

const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'build/config.json'), 'utf8'));

export default serializer.deserialize(raw);
