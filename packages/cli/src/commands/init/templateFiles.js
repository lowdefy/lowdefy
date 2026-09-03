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

// Every file `lowdefy init` writes, as template path -> path in the new project.
// The list is explicit rather than a directory walk because three templates are
// named differently from their target: a dotfile inside the published package
// would be swallowed by npm packing and by the repo's own .gitignore.
const templateFiles = [
  { template: 'lowdefy.yaml', target: 'lowdefy.yaml' },
  { template: 'pages/items.yaml', target: 'pages/items.yaml' },
  { template: 'pages/welcome.yaml', target: 'pages/welcome.yaml' },
  { template: 'api/add-item.yaml', target: 'api/add-item.yaml' },
  { template: 'fixtures/items.yaml', target: 'fixtures/items.yaml' },
  { template: 'tests/journeys/items-list.yaml', target: 'tests/journeys/items-list.yaml' },
  { template: 'tests/requests/add-item.test.yaml', target: 'tests/requests/add-item.test.yaml' },
  { template: 'README.md', target: 'README.md' },
  { template: 'gitignore.txt', target: '.gitignore' },
  { template: 'env.example.txt', target: '.env.example' },
  { template: 'env.txt', target: '.env' },
];

// The subset that is built by `lowdefy build`, and so is mirrored by the
// build fixture packages/build/src/tests/success/105-init-app.
const configTemplateFiles = [
  'lowdefy.yaml',
  'pages/items.yaml',
  'pages/welcome.yaml',
  'api/add-item.yaml',
];

export { configTemplateFiles };
export default templateFiles;
