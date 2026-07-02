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

import { type } from '@lowdefy/helpers';

// Register auth plugin type usage so buildTypes resolves each type to an
// installed plugin package and buildImports generates the import files.
// Shapes are already validated by validateAuthConfig before this step runs.
function buildAuthPlugins({ components, context }) {
  const counters = context.typeCounters.auth;
  const { database, providers } = components.auth;
  if (!type.isNone(database)) {
    counters.adapters.increment(database.type, database['~k']);
  }
  (providers ?? []).forEach((provider) => {
    counters.providers.increment(provider.type, provider['~k']);
  });
}

export default buildAuthPlugins;
