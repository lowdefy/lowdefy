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
import { jest } from '@jest/globals';

import writeServerFilePlugins from './writeServerFilePlugins.js';

const mockWriteBuildArtifact = jest.fn();

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeServerFilePlugins lists only the kinds the server process loads', async () => {
  const context = {
    filePlugins: [
      { kind: 'blocks', file: '/app/plugins/blocks/Badge.jsx' },
      { kind: 'actions', file: '/app/plugins/actions/CopyRow.js' },
      { kind: 'operators.client', file: '/app/plugins/operators/shared/_titleCase.js' },
      { kind: 'operators.server', file: '/app/plugins/operators/shared/_titleCase.js' },
      { kind: 'operators.build', file: '/app/plugins/operators/build/_stamp.js' },
    ],
    writeBuildArtifact: mockWriteBuildArtifact,
  };
  await writeServerFilePlugins({ context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith(
    'js/serverFilePlugins.json',
    JSON.stringify([
      '/app/plugins/operators/build/_stamp.js',
      '/app/plugins/operators/shared/_titleCase.js',
    ])
  );
});

test('writeServerFilePlugins writes an empty list when there are no file plugins', async () => {
  const context = { filePlugins: [], writeBuildArtifact: mockWriteBuildArtifact };
  await writeServerFilePlugins({ context });
  expect(mockWriteBuildArtifact).toHaveBeenCalledWith('js/serverFilePlugins.json', '[]');
});
