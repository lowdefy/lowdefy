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
  title: 'Lowdefy Request Schema - FileSystemList',
  type: 'object',
  properties: {
    path: {
      type: 'string',
      description: 'Directory path relative to the connection basePath. Defaults to the root.',
      errorMessage: {
        type: 'FileSystemList request property "path" should be a string.',
      },
    },
    glob: {
      type: 'string',
      description: 'Glob pattern to filter results, e.g. "**/*.md".',
      errorMessage: {
        type: 'FileSystemList request property "glob" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'FileSystemList request properties should be an object.',
  },
};
