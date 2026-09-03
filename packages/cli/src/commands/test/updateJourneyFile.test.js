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
import os from 'os';
import path from 'path';

import updateJourneyFile from './updateJourneyFile.js';

let directory;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-update-journey-'));
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

function write(content) {
  const filePath = path.join(directory, 'journey.yaml');
  fs.writeFileSync(filePath, content);
  return filePath;
}

test('updateJourneyFile fills equals and stamps from: recorded, keeping the comments around it', () => {
  const filePath = write(`# The flow a member walks every morning.
name: member creates a control
pageId: controls
steps:
  # Opens the drawer.
  - click: new_control
  - expect:
      state:
        path: controls.0.title
`);
  updateJourneyFile({ filePath, stepIndex: 1, equals: 'Access reviews' });
  expect(fs.readFileSync(filePath, 'utf8')).toEqual(`# The flow a member walks every morning.
name: member creates a control
pageId: controls
steps:
  # Opens the drawer.
  - click: new_control
  - expect:
      state:
        path: controls.0.title
        equals: Access reviews
        from: recorded
`);
});

test('updateJourneyFile edits only the named journey in a file holding a list', () => {
  const filePath = write(`- name: first
  pageId: controls
  steps:
    - expect: { state: { path: a } }
- name: second
  pageId: controls
  steps:
    - click: submit
    - expect: { state: { path: b } }
`);
  updateJourneyFile({ filePath, journeyIndex: 1, stepIndex: 1, equals: [{ id: 2 }] });
  expect(fs.readFileSync(filePath, 'utf8')).toEqual(`- name: first
  pageId: controls
  steps:
    - expect: { state: { path: a } }
- name: second
  pageId: controls
  steps:
    - click: submit
    - expect: { state: { path: b, equals: [ { id: 2 } ], from: recorded } }
`);
});
