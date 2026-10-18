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

import fs from 'node:fs';
import path from 'node:path';

// The copied @lowdefy/shell's own package.json, before lowdefy mobile config
// added any shell plugin to it. config keeps it as package.original.json, as
// the server does, so every run starts from the shell's published
// dependencies and a plugin removed from lowdefy.yaml leaves the project.
function readShellPackageJson({ projectDirectory }) {
  const originalPath = path.join(projectDirectory, 'package.original.json');
  const filePath = fs.existsSync(originalPath)
    ? originalPath
    : path.join(projectDirectory, 'package.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export default readShellPackageJson;
