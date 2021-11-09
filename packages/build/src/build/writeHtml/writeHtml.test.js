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

import writeHtml, { pageHtml } from './writeHtml.js';
import testContext from '../../test/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeHtml write page html', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        requests: [],
      },
    ],
  };
  await writeHtml({ components, context });
  expect(mockWriteBuildArtifact.mock.calls[0][0].filePath).toEqual('static/page1.html');
});

test('writeHtml multiple pages', async () => {
  const components = {
    pages: [
      {
        id: 'page:page1',
        pageId: 'page1',
        blockId: 'page1',
        requests: [],
      },
      {
        id: 'page:page2',
        pageId: 'page2',
        blockId: 'page2',
        requests: [],
      },
    ],
  };
  await writeHtml({ components, context });
  expect(mockWriteBuildArtifact.mock.calls[0][0].filePath).toEqual('static/page1.html');
  expect(mockWriteBuildArtifact.mock.calls[1][0].filePath).toEqual('static/page2.html');
});

test('writeHtml no pages', async () => {
  const components = {
    pages: [],
  };
  await writeHtml({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([]);
});

test('writeHtml pages undefined', async () => {
  const components = {};
  await writeHtml({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([]);
});
