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

import path from 'path';
import { type } from '@lowdefy/helpers';

import formatPathArgument from './formatPathArgument.js';

// A `lowdefy` command for the run's app, as the developer types it: with --config-directory when
// the app is not the working directory, and with --server-directory when the run was given one,
// so the command reads the same build the run did.
function formatAccessCommand({ args, configDirectory, serverDirectory }) {
  const parts = ['lowdefy', args];
  if (path.relative(process.cwd(), configDirectory) !== '') {
    parts.push('--config-directory', formatPathArgument({ directory: configDirectory }));
  }
  if (!type.isUndefined(serverDirectory)) {
    parts.push('--server-directory', formatPathArgument({ directory: serverDirectory }));
  }
  return parts.join(' ');
}

export default formatAccessCommand;
