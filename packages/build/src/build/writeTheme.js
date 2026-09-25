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

import { type, serializer } from '@lowdefy/helpers';

import iconThemeDefaults from './icons/iconThemeDefaults.js';

async function writeTheme({ components, context }) {
  if (type.isNone(components.theme)) {
    components.theme = {};
  }
  if (!type.isObject(components.theme)) {
    throw new Error('Theme is not an object.');
  }
  if (type.isNone(components.theme.darkMode)) {
    components.theme.darkMode = 'system';
  }
  // The client reads theme.icons.{size,strokeWidth,nonScalingStroke} with no
  // fallbacks, so every theme.json carries them.
  if (type.isNone(components.theme.icons)) {
    components.theme.icons = {};
  }
  Object.entries(iconThemeDefaults).forEach(([key, value]) => {
    if (type.isNone(components.theme.icons[key])) {
      components.theme.icons[key] = value;
    }
  });
  await context.writeBuildArtifact('theme.json', serializer.serializeToString(components.theme));
}

export default writeTheme;
