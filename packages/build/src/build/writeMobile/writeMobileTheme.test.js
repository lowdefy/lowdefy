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

import writeMobileTheme from './writeMobileTheme.js';
import testContext from '../../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();
const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeMobileTheme writes an empty file when no mobile theme is defined', async () => {
  await writeMobileTheme({ components: {}, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([['mobile/theme.css', '']]);
});

test('writeMobileTheme writes CSS variables on :root:root', async () => {
  const components = {
    mobile: {
      theme: {
        '--adm-color-primary': '#1677ff',
        '--adm-font-size-main': '13px',
      },
    },
  };
  await writeMobileTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls[0][0]).toEqual('mobile/theme.css');
  expect(mockWriteBuildArtifact.mock.calls[0][1]).toEqual(
    `:root:root {
  --adm-color-primary: #1677ff;
  --adm-font-size-main: 13px;
}
`
  );
});

test('writeMobileTheme writes dark variables scoped to data-prefers-color-scheme', async () => {
  const components = {
    mobile: {
      theme: {
        '--adm-color-primary': '#1677ff',
        dark: {
          '--adm-color-background': '#000000',
        },
      },
    },
  };
  await writeMobileTheme({ components, context });
  expect(mockWriteBuildArtifact.mock.calls[0][1]).toEqual(
    `:root:root {
  --adm-color-primary: #1677ff;
}
html[data-prefers-color-scheme='dark']:root:root {
  --adm-color-background: #000000;
}
`
  );
});
