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

// A journey's `cases` table: one run per row, each row an object of the values its `_case`
// placeholders read, named by its `name`. expandCases checks the names are unique, which ajv
// cannot.
const casesSchema = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        errorMessage: 'Journey "cases" row "name" should be a non-empty string.',
      },
    },
    errorMessage: {
      type: 'Journey "cases" rows should be objects, each with a "name".',
      required: 'Journey "cases" rows should each have a "name".',
    },
  },
  description:
    'A case table: the journey runs once per row, named "<name> [<row name>]", with each { _case: <key> } in it replaced by that key of the row, user, data and pageId included.',
  errorMessage: {
    type: 'Journey "cases" should be a list of rows, each an object with a "name".',
    minItems: 'Journey "cases" should have at least one row.',
  },
};

export default casesSchema;
