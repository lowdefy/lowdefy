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

import path from 'node:path';
import { type } from '@lowdefy/helpers';

// A config source location ("<file>:<line>") relative to the config
// directory, with forward slashes, so findings read and key the same on every
// machine and worktree: "pages/ticket.yaml:88".
function relativeSource({ source, configDirectory }) {
  if (type.isNone(source)) return null;
  if (!path.isAbsolute(source) || type.isNone(configDirectory)) return source;
  return path.relative(configDirectory, source).split(path.sep).join('/');
}

export default relativeSource;
