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

export default {
  type: 'object',
  params: {
    type: 'object',
    description:
      'Asks the MCP host the page is shown in as a view to open a link in the browser. Give one of "url", "pageId" or "home". Only http and https links are opened. The action fails when the page is not inside a host or the host refuses the link.',
    properties: {
      url: {
        type: 'string',
        description:
          'The URL to open. A URL without a scheme is read as https, and a path starting with "/" is a path of the app.',
      },
      pageId: {
        type: 'string',
        description: "The id of a page of the app to open, at the app's own address.",
      },
      home: {
        type: 'boolean',
        description: "Open the app's home page.",
      },
      pathParams: {
        type: 'object',
        description: "Values for the placeholders in the page's path, by placeholder name.",
      },
      urlQuery: {
        type: 'object',
        description: 'URL query parameters to add to the link.',
      },
    },
    additionalProperties: false,
  },
};
