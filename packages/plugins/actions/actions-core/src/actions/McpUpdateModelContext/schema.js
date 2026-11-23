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
      'Sets the context the MCP host gives the model on its next turn, without posting a message or starting a reply. Each call replaces the context the page set before. The action fails when the page is not inside a host or the host refuses the context.',
    required: ['text'],
    properties: {
      text: {
        type: 'string',
        description: 'The context for the model, such as what the person changed in the view.',
      },
    },
    additionalProperties: false,
  },
};
