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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../utils/collectExceptions.js';

// public/styles.less is a config fault, so it is reported with the other
// config errors at the build checkpoint. Detecting it in the write phase
// (writeGlobalsCss) surfaced it as "Build failed due to internal error".
function validateDeprecatedStyles({ context }) {
  if (fs.existsSync(path.join(context.directories.config, 'public/styles.less'))) {
    collectExceptions(
      context,
      new ConfigError(
        'public/styles.less is deprecated. Migrate to: (1) "theme" key in lowdefy.yaml for token overrides (recommended), (2) public/styles.css for custom CSS.'
      )
    );
  }
}

export default validateDeprecatedStyles;
