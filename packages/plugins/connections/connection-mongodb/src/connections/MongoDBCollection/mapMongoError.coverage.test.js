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

import fs from 'fs';
import path from 'path';
import url from 'url';

// A request type added without the mapMongoError wrapper ships the driver's raw
// message to the browser. This asserts the wrapper mechanically, over whatever
// implementations exist, instead of relying on the next author remembering.
const directory = path.dirname(url.fileURLToPath(import.meta.url));

const implementations = fs
  .readdirSync(directory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('MongoDB'))
  .map((entry) => entry.name)
  .filter((name) => fs.existsSync(path.join(directory, name, `${name}.js`)))
  .sort();

test('every MongoDBCollection request implementation is found', () => {
  expect(implementations.length).toBe(14);
});

test.each(implementations)('%s imports mapMongoError', (name) => {
  const source = fs.readFileSync(path.join(directory, name, `${name}.js`), 'utf8');
  expect(source).toContain("import mapMongoError from '../mapMongoError.js';");
});

test.each(implementations)('%s calls mapMongoError in a catch', (name) => {
  const source = fs.readFileSync(path.join(directory, name, `${name}.js`), 'utf8');
  expect(source).toMatch(/catch \(error\) \{\s*throw mapMongoError\(error, \{/);
});
