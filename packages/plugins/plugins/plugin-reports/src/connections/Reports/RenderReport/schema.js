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
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - RenderReport',
  type: 'object',
  required: ['pageId'],
  properties: {
    pageId: {
      type: 'string',
      description: 'The id of the page to render as a report.',
      errorMessage: {
        type: 'RenderReport request property "pageId" should be a string.',
      },
    },
    format: {
      type: 'string',
      enum: ['pdf', 'xlsx'],
      description: 'The output format. Defaults to "pdf".',
      errorMessage: {
        type: 'RenderReport request property "format" should be a string.',
        enum: 'RenderReport request property "format" should be one of "pdf" or "xlsx".',
      },
    },
    filename: {
      type: 'string',
      description: 'The download filename. Defaults to the page id plus the format extension.',
      errorMessage: {
        type: 'RenderReport request property "filename" should be a string.',
      },
    },
    urlQuery: {
      type: 'object',
      description: 'The url query snapshot seeded into the headless render before onInit.',
      errorMessage: {
        type: 'RenderReport request property "urlQuery" should be an object.',
      },
    },
    input: {
      type: 'object',
      description: 'The page input snapshot seeded into the headless render before onInit.',
      errorMessage: {
        type: 'RenderReport request property "input" should be an object.',
      },
    },
    state: {
      type: 'object',
      description: 'The page state snapshot seeded into the headless render before onInit.',
      errorMessage: {
        type: 'RenderReport request property "state" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'RenderReport request properties should be an object.',
    required: 'RenderReport request should have required property "pageId".',
  },
};
