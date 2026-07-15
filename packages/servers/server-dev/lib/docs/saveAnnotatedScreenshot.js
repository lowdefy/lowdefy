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

const PNG_DATA_URL_PREFIX = 'data:image/png;base64,';

// Saves a tab-captured annotated screenshot (PNG data URL POSTed with the
// feedback batch) under the config dir's .lowdefy/annotations/ — the same
// location and naming captureAnnotatedScreenshot.js uses, so formatFeedback's
// screenshotPath contract is identical for both capture paths. Never throws —
// returns { path } or { error }.
function saveAnnotatedScreenshot({ dataUrl, fileName }) {
  if (typeof dataUrl !== 'string' || !dataUrl.startsWith(PNG_DATA_URL_PREFIX)) {
    return { error: 'Screenshot is not a PNG data URL.' };
  }
  try {
    const buffer = Buffer.from(dataUrl.slice(PNG_DATA_URL_PREFIX.length), 'base64');
    const configDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
    const dir = path.join(configDirectory, '.lowdefy', 'annotations');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, fileName), buffer);
    return { path: path.join('.lowdefy', 'annotations', fileName) };
  } catch (error) {
    return { error: `Failed to save annotated screenshot: ${error.message}` };
  }
}

export default saveAnnotatedScreenshot;
