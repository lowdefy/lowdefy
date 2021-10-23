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

import writeHtml, { pageHtml } from './writeHtml';
import testContext from '../../test/testContext';

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

test('pageHtml generates the correct html, default values', async () => {
  const context = {
    version: '1.0.0',
  };
  const page = {
    pageId: 'pageId',
  };
  const html = await pageHtml({ context, page });
  expect(html).toMatchInlineSnapshot(`
    "
    <!--
      Copyright 2020-2021 Lowdefy, Inc

      Licensed under the Apache License, Version 2.0 (the \\"License\\");
      you may not use this file except in compliance with the License.
      You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

      Unless required by applicable law or agreed to in writing, software
      distributed under the License is distributed on an \\"AS IS\\" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
      See the License for the specific language governing permissions and
      limitations under the License. -->
    <!DOCTYPE html>
    <html lang=\\"en\\">
      <head>
        <meta charset=\\"utf-8\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <title>Lowdefy App</title>

        <link rel=\\"manifest\\" href=\\"/public/manifest.webmanifest\\" />
        <link rel=\\"icon\\" type=\\"image/svg+xml\\" href=\\"/public/icon.svg\\" />
        <link rel=\\"icon\\" type=\\"image/png\\" href=\\"/public/icon-32.png\\" />
        <link rel=\\"apple-touch-icon\\" href=\\"/public/apple-touch-icon.png\\" />

        <link
          rel=\\"preload\\"
          href=\\"/lowdefy/page/pageId\\"
          as=\\"fetch\\"
          crossorigin=\\"anonymous\\"
        />
        <link rel=\\"preload\\" href=\\"/lowdefy/root\\" as=\\"fetch\\" crossorigin=\\"anonymous\\" />
        <script type=\\"text/javascript\\">
          const jsActions = {};
          const jsOperators = {};
          const getMethodLoader = (scope, reference) => (name, method) => {
            if (typeof name !== 'string') {
              throw new Error(\`\${scope} requires a string for the first argument.\`);
            }
            if (typeof method !== 'function') {
              throw new Error(\`\${scope} requires a function for the second argument.\`);
            }
            reference[name] = method;
          };
          window.lowdefy = {
            basePath: '',
            imports: {
              jsActions,
              jsOperators,
            },
            registerJsAction: getMethodLoader('registerJsAction', jsActions),
            registerJsOperator: getMethodLoader('registerJsOperator', jsOperators),
          };
        </script>
        <script defer src=\\"/client/runtime_1.0.0.js\\"></script>
        <script defer src=\\"/client/main_1.0.0.js\\"></script></head>
        
        
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id=\\"emotion\\"></div>
        <div id=\\"root\\"></div>
        
        
      </body>
    </html>
    "
  `);
});

test('pageHtml generates the correct html, all values', async () => {
  const context = {
    version: '1.0.0',
    serverBasePath: 'serverBasePath',
  };
  const page = {
    pageId: 'pageId',
    properties: {
      title: 'Page Title',
    },
  };
  const html = await pageHtml({ context, page });
  expect(html).toMatchInlineSnapshot(`
    "
    <!--
      Copyright 2020-2021 Lowdefy, Inc

      Licensed under the Apache License, Version 2.0 (the \\"License\\");
      you may not use this file except in compliance with the License.
      You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

      Unless required by applicable law or agreed to in writing, software
      distributed under the License is distributed on an \\"AS IS\\" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
      See the License for the specific language governing permissions and
      limitations under the License. -->
    <!DOCTYPE html>
    <html lang=\\"en\\">
      <head>
        <meta charset=\\"utf-8\\" />
        <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />
        <title>Page Title</title>

        <link rel=\\"manifest\\" href=\\"serverBasePath/public/manifest.webmanifest\\" />
        <link rel=\\"icon\\" type=\\"image/svg+xml\\" href=\\"serverBasePath/public/icon.svg\\" />
        <link rel=\\"icon\\" type=\\"image/png\\" href=\\"serverBasePath/public/icon-32.png\\" />
        <link rel=\\"apple-touch-icon\\" href=\\"serverBasePath/public/apple-touch-icon.png\\" />

        <link
          rel=\\"preload\\"
          href=\\"/lowdefy/page/pageId\\"
          as=\\"fetch\\"
          crossorigin=\\"anonymous\\"
        />
        <link rel=\\"preload\\" href=\\"/lowdefy/root\\" as=\\"fetch\\" crossorigin=\\"anonymous\\" />
        <script type=\\"text/javascript\\">
          const jsActions = {};
          const jsOperators = {};
          const getMethodLoader = (scope, reference) => (name, method) => {
            if (typeof name !== 'string') {
              throw new Error(\`\${scope} requires a string for the first argument.\`);
            }
            if (typeof method !== 'function') {
              throw new Error(\`\${scope} requires a function for the second argument.\`);
            }
            reference[name] = method;
          };
          window.lowdefy = {
            basePath: 'serverBasePath',
            imports: {
              jsActions,
              jsOperators,
            },
            registerJsAction: getMethodLoader('registerJsAction', jsActions),
            registerJsOperator: getMethodLoader('registerJsOperator', jsOperators),
          };
        </script>
        <script defer src=\\"serverBasePath/client/runtime_1.0.0.js\\"></script>
        <script defer src=\\"serverBasePath/client/main_1.0.0.js\\"></script></head>
        
        
      </head>
      <body>
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <div id=\\"emotion\\"></div>
        <div id=\\"root\\"></div>
        
        
      </body>
    </html>
    "
  `);
});
