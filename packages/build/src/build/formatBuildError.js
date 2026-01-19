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

import { resolveConfigLocation } from '@lowdefy/node-utils';

function formatBuildError({ context, counter, typeName, message }) {
  const configKey = counter.getLocation(typeName);
  if (!configKey) {
    return `[Config Error] ${message}`;
  }

  const location = resolveConfigLocation({
    configKey,
    keyMap: context.keyMap,
    refMap: context.refMap,
    configDirectory: context.directories.config,
  });

  if (!location) {
    return `[Config Error] ${message}`;
  }

  const source = location.source ? `${location.source} at ${location.config}` : '';
  const link = location.link || '';
  return `[Config Error] ${message}\n  ${source}\n  ${link}`;
}

export default formatBuildError;
