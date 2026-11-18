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
    required: ['docDefinition', 'filename'],
    properties: {
      docDefinition: {
        type: 'object',
        description:
          'The pdfMake 0.3 document definition object, passed to pdfMake as it is. A pageBreakBefore function receives (currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage).',
      },
      tableLayouts: {
        type: 'object',
        description: 'Custom table layouts, by name. A table uses one with layout: <name>.',
      },
      filename: {
        type: 'string',
        description: 'The filename for the downloaded PDF.',
      },
      fonts: {
        type: 'object',
        description:
          'Font definitions, by font name, with normal, bold, italics and bolditalics font file URLs. They are added to the bundled Roboto font.',
      },
    },
    additionalProperties: false,
  },
};
