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

import { ConfigWarning } from '@lowdefy/errors';

import collectStateUsage from './collectStateUsage.js';

function topLevelKey(path) {
  return path.split(/[.[]/)[0];
}

function validateStateReferences({ page, context }) {
  const usage = collectStateUsage({ page });
  const blockIds = new Set();
  const setStateKeys = new Set();
  const stateRefs = new Map(); // topLevelKey -> configKey (first occurrence)

  // Compare only the top-level segment, including it for dot-notation ids.
  usage.blockIds.forEach(({ id }) => {
    blockIds.add(id);
    blockIds.add(topLevelKey(id));
  });
  usage.setStateKeys.forEach(({ key }) => {
    setStateKeys.add(topLevelKey(key));
  });
  // A key declared in the page's state: schema is defined by contract, however
  // it is written at runtime (a custom action calling setState, for example).
  const declaredKeys = new Set(Object.keys(page.state ?? {}).map(topLevelKey));
  usage.stateRefs.forEach(({ path, configKey }) => {
    const key = topLevelKey(path);
    if (key && !stateRefs.has(key)) {
      stateRefs.set(key, configKey);
    }
  });

  // Filter to only undefined references and warn
  stateRefs.forEach((configKey, topLevelKey) => {
    // Skip if state key is from an input block or SetState action
    if (
      blockIds.has(topLevelKey) ||
      setStateKeys.has(topLevelKey) ||
      declaredKeys.has(topLevelKey)
    ) {
      return;
    }

    const message =
      `_state references "${topLevelKey}" on page "${page.pageId}", ` +
      `but no input block with id "${topLevelKey}" exists on this page. ` +
      `State keys are created from input block ids. ` +
      `Check for typos, add an input block with this id, or initialize the state with SetState. ` +
      `If the state is set at runtime (for example by a custom action calling setState), ` +
      `declare it under the page's "state:" schema, or suppress this check with ` +
      `"~ignoreBuildChecks: [state-refs]" on the reference.`;

    // This check is a heuristic: state written at runtime — custom actions
    // calling setState, dynamic SetState wrappers — is statically invisible,
    // so a miss here must never fail a production build (no prodError).
    context.handleWarning(new ConfigWarning(message, { configKey, checkSlug: 'state-refs' }));
  });
}

export default validateStateReferences;
