/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { type, get } from '@lowdefy/helpers';

async function writeConfig({ components, context }) {
  if (type.isNone(components.config)) {
    components.config = {};
  }
  if (!type.isObject(components.config)) {
    throw new Error('Config is not an object.');
  }
  if (
    get(components.config, 'auth.pages.protected') &&
    get(components.config, 'auth.pages.public')
  ) {
    throw new Error(
      'Protected and public pages are mutually exclusive. When protected pages are listed, all unlisted pages are public by default and visa versa. Use only the one or the other.'
    );
  }
  await context.artifactSetter.set({
    filePath: 'config.json',
    content: JSON.stringify(components.config, null, 2),
  });
}

export default writeConfig;
