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

import { getMobileRootConfig } from '@lowdefy/api';

// The root config a shell syncs on start (getMobileRootConfig), filtered to
// the caller. An app without a mobile key has no shell, so it answers 404.
async function mobileRootHandler(c) {
  const context = c.get('lowdefyContext');
  const rootConfig = await getMobileRootConfig(context);
  if (rootConfig === null) {
    return c.json({ name: 'NotFoundError', message: 'This app has no mobile config.' }, 404);
  }
  return c.json(rootConfig);
}

export default mobileRootHandler;
