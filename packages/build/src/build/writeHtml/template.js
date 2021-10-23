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

const template = `
<!--
  Copyright 2020-2021 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License. -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ LOWDEFY_PAGE_TITLE }}</title>

    <link rel="manifest" href="{{ LOWDEFY_SERVER_BASE_PATH }}/public/manifest.webmanifest" />
    <link rel="icon" type="image/svg+xml" href="{{ LOWDEFY_SERVER_BASE_PATH }}/public/icon.svg" />
    <link rel="icon" type="image/png" href="{{ LOWDEFY_SERVER_BASE_PATH }}/public/icon-32.png" />
    <link rel="apple-touch-icon" href="{{ LOWDEFY_SERVER_BASE_PATH }}/public/apple-touch-icon.png" />

    <link
      rel="preload"
      href="/lowdefy/page/{{ LOWDEFY_PAGE_ID }}"
      as="fetch"
      crossorigin="anonymous"
    />
    <link rel="preload" href="/lowdefy/root" as="fetch" crossorigin="anonymous" />
    <script type="text/javascript">
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
        basePath: '{{ LOWDEFY_SERVER_BASE_PATH }}',
        imports: {
          jsActions,
          jsOperators,
        },
        registerJsAction: getMethodLoader('registerJsAction', jsActions),
        registerJsOperator: getMethodLoader('registerJsOperator', jsOperators),
      };
    </script>
    <script defer src="{{ LOWDEFY_SERVER_BASE_PATH }}/client/runtime_{{ LOWDEFY_VERSION }}.js"></script>
    <script defer src="{{ LOWDEFY_SERVER_BASE_PATH }}/client/main_{{ LOWDEFY_VERSION }}.js"></script></head>
    {{ LOWDEFY_APP_HEAD_HTML }}
    {{ LOWDEFY_PAGE_HEAD_HTML }}
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="emotion"></div>
    <div id="root"></div>
    {{ LOWDEFY_APP_BODY_HTML }}
    {{ LOWDEFY_PAGE_BODY_HTML }}
  </body>
</html>
`;

export default template;
