/*
  Copyright 2020-2024 Lowdefy, Inc

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

import build from '@lowdefy/build';
import createCustomPluginTypesMap from '../utils/createCustomPluginTypesMap.mjs';

function lowdefyBuild({ directories, logger, options, license }) {
  return async () => {
    logger.info({ print: 'spin' }, 'Building config...');
    const customTypesMap = await createCustomPluginTypesMap({ directories, logger });
    await build({
      customTypesMap,
      directories,
      entitlements: license.entitlements,
      logger,
      refResolver: options.refResolver,
      stage: 'dev',
    });
    logger.info({ print: 'log' }, 'Built config.');
  };
}

export default lowdefyBuild;
