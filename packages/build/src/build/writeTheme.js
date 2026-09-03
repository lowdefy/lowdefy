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

function withCompactAlgorithm(algorithm) {
  if (type.isNone(algorithm)) return 'compact';
  if (type.isArray(algorithm)) {
    return algorithm.includes('compact') ? algorithm : [...algorithm, 'compact'];
  }
  return algorithm === 'compact' ? algorithm : [algorithm, 'compact'];
}

// The three declarative levers (mode, density, radius) are resolved here into the
// antd shape the client already consumes, so the runtime keeps a single source of
// truth. theme.antd is merged last, which makes an explicit token win.
function resolveLevers(theme) {
  theme.darkMode = theme.mode ?? theme.darkMode ?? 'system';
  delete theme.mode;

  if (theme.density === 'compact') {
    theme.antd = { ...(theme.antd ?? {}) };
    theme.antd.algorithm = withCompactAlgorithm(theme.antd.algorithm);
  }
  delete theme.density;

  if (!type.isNone(theme.radius)) {
    theme.antd = { ...(theme.antd ?? {}) };
    theme.antd.token = { borderRadius: theme.radius, ...(theme.antd.token ?? {}) };
  }
  delete theme.radius;
}

async function writeTheme({ components, context }) {
  if (type.isNone(components.theme)) {
    components.theme = {};
  }
  if (!type.isObject(components.theme)) {
    throw new Error('Theme is not an object.');
  }
  resolveLevers(components.theme);
  await context.writeBuildArtifact('theme.json', serializer.serializeToString(components.theme));
}

export default writeTheme;
