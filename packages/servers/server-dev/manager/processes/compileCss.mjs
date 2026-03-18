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
import postcss from 'postcss';
import tailwindcssPlugin from '@tailwindcss/postcss';

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function compileCss({ directories, logger }) {
  return async () => {
    const inputPath = path.join(directories.build, 'globals.css');
    const outputPath = path.join(directories.server, 'public/tailwind-jit.css');
    if (!fs.existsSync(inputPath)) return;

    logger.info({ spin: 'start' }, 'Compiling CSS...');
    const startTime = Date.now();

    const css = fs.readFileSync(inputPath, 'utf8');
    const result = await postcss([tailwindcssPlugin()]).process(css, {
      from: inputPath,
      to: outputPath,
    });
    fs.writeFileSync(outputPath, result.css);

    logger.info(
      { spin: 'succeed' },
      `Compiled CSS in ${formatDuration(Date.now() - startTime)}.`
    );
  };
}

export default compileCss;
