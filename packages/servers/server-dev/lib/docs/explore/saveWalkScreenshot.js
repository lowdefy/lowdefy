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

// Saves the walk's page as .lowdefy/explore/<run>/screenshots/<walk>-<index>.png
// when an error finding fires, and returns its path relative to the config
// directory, or null when the page cannot be captured.
async function saveWalkScreenshot({ walk, index, configDirectory }) {
  const page = walk.runner.actors.current().page;
  if (page.isClosed()) return null;
  const relative = path.join(
    '.lowdefy',
    'explore',
    walk.run,
    'screenshots',
    `${walk.journey}-${index}.png`
  );
  const filePath = path.join(configDirectory, relative);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  try {
    await page.screenshot({ path: filePath });
  } catch {
    return null;
  }
  return relative.split(path.sep).join('/');
}

export default saveWalkScreenshot;
