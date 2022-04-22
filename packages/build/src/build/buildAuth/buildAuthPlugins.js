/*
  Copyright 2020-2022 Lowdefy, Inc

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
import { type } from '@lowdefy/helpers';

function buildAuthPlugins({ components, context }) {
  if (type.isArray(components.auth.providers)) {
    components.auth.providers.forEach((provider) => {
      if (type.isUndefined(provider.id)) {
        throw new Error(`Connection id missing.`);
      }
      if (!type.isString(provider.id)) {
        throw new Error(
          `Auth provider id is not a string. Received ${JSON.stringify(provider.id)}.`
        );
      }
      if (!type.isString(provider.type)) {
        throw new Error(
          `Auth provider type is not a string at provider "${
            provider.id
          }". Received ${JSON.stringify(provider.type)}.`
        );
      }
      context.typeCounters.auth.providers.increment(provider.type);
    });
  }
}

export default buildAuthPlugins;
