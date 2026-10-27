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

/*
  Writes a shell's Android adaptive-icon foreground from its 1024×1024 icon: the icon scaled into
  the centre 66% of a transparent 1024×1024 canvas, the safe zone a launcher's mask never cuts.
  app.config.ts runs it when the shell's icon has no foreground yet (the app config is evaluated
  synchronously, and image code is asynchronous).

    node scripts/createShellAssets.mjs <icon.png> <foreground.png>
*/

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Jimp = require('jimp-compact');

const SIZE = 1024;
const SAFE_ZONE = 0.66;

async function createAdaptiveIconForeground({ icon, output }) {
  const image = await Jimp.read(icon);
  const inner = Math.round(SIZE * SAFE_ZONE);
  image.contain(inner, inner);
  const canvas = new Jimp(SIZE, SIZE, 0x00000000);
  canvas.composite(image, Math.round((SIZE - inner) / 2), Math.round((SIZE - inner) / 2));
  await canvas.writeAsync(output);
  return output;
}

if (fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [icon, output] = process.argv.slice(2);
  if (icon === undefined || output === undefined) {
    throw new Error('Usage: node scripts/createShellAssets.mjs <icon.png> <foreground.png>');
  }
  await createAdaptiveIconForeground({ icon, output });
}

export { createAdaptiveIconForeground };
