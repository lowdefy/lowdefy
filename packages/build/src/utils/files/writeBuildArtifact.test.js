/*
  Copyright 2020-2021 Lowdefy, Inc
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
import createWriteBuildArtifact from './writeBuildArtifact.js';

const buildDirectory = path.resolve(process.cwd(), 'src/test/fileSetter');

test('writeFile', async () => {
  const filePath = path.resolve(buildDirectory, 'writeFile.txt');
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    //pass
  }
  expect(fs.existsSync(filePath)).toBe(false);
  const writeBuildArtifact = createWriteBuildArtifact({ buildDirectory });

  await writeBuildArtifact({
    filePath: 'writeFile.txt',
    content: 'Test fileSetter file',
  });
  const res = fs.readFileSync(filePath, 'utf8');
  expect(res).toEqual('Test fileSetter file');
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    //pass
  }
});
