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

const ALL_PROPERTY = {
  type: 'boolean',
  description:
    'List every build warning. Without it, warnings unchanged since your last answer are only counted (build.warningsUnchanged).',
};

export const DESCRIPTION_NOTE = ' Warnings unchanged since your last call are counted, not listed.';

// The config build's warnings repeat on every build status answer until the
// config changes, and on a large app they are most of the answer. Each
// session gets a warning in full the first time and again whenever it
// changes or comes back; an answer leaves out the warnings that were in the
// session's last answer for that app as they are, and counts them. Errors are
// never left out.
function createShownWarnings() {
  // The warnings of each app's last answer, by config directory, as their
  // JSON: a warning whose message, location or anything else changed is new.
  const lastShown = new Map();

  function withAllOption(tool) {
    return {
      ...tool,
      description: `${tool.description ?? ''}${DESCRIPTION_NOTE}`,
      inputSchema: {
        ...tool.inputSchema,
        properties: { ...(tool.inputSchema.properties ?? {}), all: ALL_PROPERTY },
      },
    };
  }

  // Returns value itself when nothing is left out.
  function trimShownWarnings({ app, value, all }) {
    const warnings = value.build?.warnings;
    if (!type.isArray(warnings)) {
      return value;
    }
    const keys = warnings.map((warning) => JSON.stringify(warning));
    const previous = lastShown.get(app.configDirectory) ?? new Set();
    lastShown.set(app.configDirectory, new Set(keys));
    if (all === true) {
      return value;
    }
    const fresh = warnings.filter((warning, index) => !previous.has(keys[index]));
    const count = warnings.length - fresh.length;
    if (count === 0) {
      return value;
    }
    return {
      ...value,
      build: {
        ...value.build,
        warnings: fresh,
        warningsUnchanged: {
          count,
          note: `${count} warning(s) unchanged since your last lowdefy_build_status answer are left out. Call with all: true to list every warning.`,
        },
      },
    };
  }

  return { trimShownWarnings, withAllOption };
}

export default createShownWarnings;
