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

function shouldSuppressError({ configKey, keyMap }) {
  if (!configKey || !keyMap || !keyMap[configKey]) {
    return false;
  }

  const keyMapEntry = keyMap[configKey];
  // Check if the ~ignoreBuildCheck property is explicitly true
  return keyMapEntry['~ignoreBuildCheck'] === true;
}

function formatConfigMessage({ prefix, message, configKey, context }) {
  // Check for ~ignoreBuildCheck: true suppression
  if (shouldSuppressError({ configKey, keyMap: context?.keyMap })) {
    return ''; // Silent suppression - return empty string
  }

  if (!configKey || !context) {
    return `${prefix} ${message}`;
  }

  const location = resolveConfigLocation({
    configKey,
    keyMap: context.keyMap,
    refMap: context.refMap,
    configDirectory: context.directories.config,
  });

  if (!location) {
    return `${prefix} ${message}`;
  }

  const source = location.source ? `${location.source} at ${location.config}` : '';
  const link = location.link || '';
  return `${prefix} ${message}\n  ${source}\n  ${link}`;
}

export default formatConfigMessage;
