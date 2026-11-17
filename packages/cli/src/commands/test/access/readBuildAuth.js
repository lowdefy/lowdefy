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
import { serializer } from '@lowdefy/helpers';

// The build's auth config: whether auth is configured and the roles it declares. The build
// always writes auth.json, and openTestApp has checked the build before this reads it.
function readBuildAuth({ directories }) {
  const content = fs.readFileSync(path.join(directories.build, 'auth.json'), 'utf8');
  return serializer.deserializeFromString(content);
}

export default readBuildAuth;
