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
import { ConfigError } from '@lowdefy/errors';

import readPngInfo from './readPngInfo.js';

const ICON_SIZE = 1024;
// PNG colour types without an alpha channel: 0 greyscale, 2 RGB.
const OPAQUE_COLOR_TYPES = [0, 2];

// The App Store refuses an icon with an alpha channel or of the wrong size,
// and only after a cloud build and an upload. Checking here fails in seconds.
function validateShellIcon({ icon, path: configPath, configDirectory, configKey }) {
  const iconPath = path.resolve(configDirectory, icon);
  if (!fs.existsSync(iconPath) || !fs.statSync(iconPath).isFile()) {
    throw new ConfigError(
      `App "${configPath}" file "${icon}" does not exist. The path is relative to the config directory.`,
      { received: icon, configKey }
    );
  }
  const info = readPngInfo(fs.readFileSync(iconPath));
  if (info === null) {
    throw new ConfigError(`App "${configPath}" file "${icon}" should be a PNG.`, {
      received: icon,
      configKey,
    });
  }
  if (info.width !== ICON_SIZE || info.height !== ICON_SIZE) {
    throw new ConfigError(
      `App "${configPath}" file "${icon}" should be ${ICON_SIZE}×${ICON_SIZE} pixels. Received ${info.width}×${info.height}.`,
      { received: icon, configKey }
    );
  }
  if (!OPAQUE_COLOR_TYPES.includes(info.colorType) || info.hasTransparencyChunk) {
    throw new ConfigError(
      `App "${configPath}" file "${icon}" should have no alpha channel or transparency. Save it as an RGB PNG without alpha.`,
      { received: icon, configKey }
    );
  }
}

export default validateShellIcon;
