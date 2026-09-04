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

// `lowdefy dev` holds a pid lock on .lowdefy/dev and refuses a second manager
// there, so a runner that booted its server into the same directory could never
// run beside a development server - the common case for an agent. The runner
// owns .lowdefy/test instead. An explicit --dev-directory still wins: the caller
// named the directory they want.
function getTestServerDirectory({ context }) {
  const devDirectory = context.commandLineOptions?.devDirectory;
  if (!type.isNone(devDirectory)) {
    return path.resolve(devDirectory);
  }
  return path.resolve(context.directories.config, '.lowdefy', 'test');
}

export default getTestServerDirectory;
