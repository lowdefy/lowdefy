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

import { resolveConfigLocation } from '@lowdefy/helpers';

async function resolveErrorConfigLocation(context, error) {
  if (!error.configKey) {
    return null;
  }
  try {
    const [keyMap, refMap] = await Promise.all([
      context.readConfigFile('keyMap.json'),
      context.readConfigFile('refMap.json'),
    ]);
    const location = resolveConfigLocation({
      configKey: error.configKey,
      keyMap,
      refMap,
    });
    return location?.formatted || null;
  } catch {
    return null;
  }
}

async function logError({ context, error }) {
  try {
    const { user = {} } = context;

    const configLocation = await resolveErrorConfigLocation(context, error);

    context.logger.error({
      err: error,
      configLocation,
      user: {
        id: user.id,
        roles: user.roles,
        sub: user.sub,
        session_id: user.session_id,
      },
      url: context.req.url,
      method: context.req.method,
      resolvedUrl: context.nextContext?.resolvedUrl,
    });
  } catch (e) {
    console.error(error);
    console.error('An error occurred while logging the error.');
    console.error(e);
  }
}

export default logError;
