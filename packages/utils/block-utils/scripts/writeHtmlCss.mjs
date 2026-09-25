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
import { fileURLToPath } from 'url';

import createHtmlCss from '../dist/createHtmlCss.js';

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
fs.writeFileSync(path.join(dist, 'html.css'), createHtmlCss());
console.log('Wrote dist/html.css');
