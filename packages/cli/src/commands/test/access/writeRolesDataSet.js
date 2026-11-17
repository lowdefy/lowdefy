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

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import createRoleUsers from './createRoleUsers.js';
import listDeclaredRoles from './listDeclaredRoles.js';

const HEADER = [
  ' Written by lowdefy test --update-access: one user per role the app declares, holding only it,',
  ' and no-role, a signed-in user with no roles. tests/access.yaml checks access as each of them.',
].join('\n');

// Writes tests/data/roles.yaml, the data set the first access table is checked as, unless the app
// already has a roles data set. Returns the user names it wrote, or undefined when it wrote none.
function writeRolesDataSet({ authJson, configDirectory }) {
  const dataDirectory = path.join(configDirectory, 'tests', 'data');
  const exists = ['roles.yaml', 'roles.yml'].some((fileName) =>
    fs.existsSync(path.join(dataDirectory, fileName))
  );
  if (exists) {
    return undefined;
  }
  const users = createRoleUsers({ roles: listDeclaredRoles({ authJson }) });
  const document = new YAML.Document({ users });
  document.commentBefore = HEADER;
  document.get('users').items.forEach((pair) => {
    pair.value.flow = true;
  });
  fs.mkdirSync(dataDirectory, { recursive: true });
  fs.writeFileSync(path.join(dataDirectory, 'roles.yaml'), document.toString({ lineWidth: 0 }));
  return Object.keys(users);
}

export default writeRolesDataSet;
