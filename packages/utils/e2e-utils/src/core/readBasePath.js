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

// The e2e server serves every route under the app's basePath, which the build records in
// config.json. With no build yet (Playwright skips it when another server holds the
// port), the server on the port cannot be this app's, and the root path is as good as any.
function readBasePath({ buildDir }) {
  const configFile = path.join(buildDir, 'config.json');
  if (!fs.existsSync(configFile)) return '';
  return JSON.parse(fs.readFileSync(configFile, 'utf8')).basePath ?? '';
}

export default readBasePath;
