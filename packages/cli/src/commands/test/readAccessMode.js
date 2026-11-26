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

const JOURNEYS_PURPOSE = 'to check the table and run those journeys';

// The `lowdefy test` options --access and --update-access do not take, each with the command the
// developer more likely meant. An option is refused only when typed on the command line: options
// also come from the environment (PORT, LOWDEFY_DIRECTORY_DEV) or lowdefy.yaml's cli config, which
// a run does not choose.
const REFUSED_OPTIONS = [
  {
    key: 'paths',
    flag: 'the journey paths',
    meant: 'lowdefy test --build <paths>',
    purpose: JOURNEYS_PURPOSE,
  },
  {
    key: 'headless',
    flag: '--headless',
    meant: 'lowdefy test --build',
    purpose: 'to check the table and run the headless journeys',
  },
  {
    key: 'build',
    flag: '--build',
    meant: 'lowdefy test --build',
    purpose: 'to check the table and run the headless journeys',
  },
  {
    key: 'browser',
    flag: '--browser',
    meant: 'lowdefy test --browser',
    purpose: 'to run every journey in the browser',
  },
  {
    key: 'thorough',
    flag: '--thorough',
    meant: 'lowdefy test --thorough',
    purpose: 'to run the journeys, and those found to need a browser in it',
  },
  { key: 'lint', flag: '--lint', meant: 'lowdefy test --lint', purpose: 'to lint the journeys' },
  {
    key: 'repeat',
    flag: '--repeat',
    meant: 'lowdefy test --build --repeat <n>',
    purpose: JOURNEYS_PURPOSE,
  },
  {
    key: 'concurrency',
    flag: '--concurrency',
    meant: 'lowdefy test --concurrency <n>',
    purpose: 'to run the browser journeys side by side',
  },
  {
    key: 'filter',
    flag: '--filter',
    meant: 'lowdefy test --build --filter <name>',
    purpose: JOURNEYS_PURPOSE,
  },
  {
    key: 'tag',
    flag: '--tag',
    meant: 'lowdefy test --build --tag <tag>',
    purpose: JOURNEYS_PURPOSE,
  },
  {
    key: 'tier',
    flag: '--tier',
    meant: 'lowdefy test --build --tier <tier>',
    purpose: JOURNEYS_PURPOSE,
  },
  {
    key: 'usageWindow',
    flag: '--usage-window',
    meant: 'lowdefy test --build --tier <tier> --usage-window <months>',
    purpose: JOURNEYS_PURPOSE,
  },
  {
    key: 'journeysDirectory',
    flag: '--journeys-directory',
    meant: 'lowdefy test --build --journeys-directory <journeys-directory>',
    purpose: JOURNEYS_PURPOSE,
  },
  {
    key: 'url',
    flag: '--url',
    meant: 'lowdefy test --url <url>',
    purpose: 'to run the journeys on that server',
  },
  {
    key: 'port',
    flag: '--port',
    meant: 'lowdefy test --port <port>',
    purpose: 'to run the journeys on a dev server at that port',
  },
  {
    key: 'devDirectory',
    flag: '--dev-directory',
    meant: 'lowdefy test --dev-directory <dev-directory>',
    purpose: 'to run the journeys on that dev server',
  },
  {
    key: 'refResolver',
    flag: '--ref-resolver',
    meant: 'lowdefy test --ref-resolver <ref-resolver-function-path>',
    purpose: 'to run the journeys on a dev server with that resolver',
  },
];

function isGiven({ options, refused }) {
  if (refused.key === 'paths') {
    return (options.paths ?? []).length > 0;
  }
  return (options.typedOptions ?? []).includes(refused.key);
}

// Whether `lowdefy test` checks (--access) or rewrites (--update-access) the access table alone:
// { access, updateAccess } or { error }. Either takes only --config-directory,
// --server-directory, --log-level and --disable-telemetry; any journey or dev-server option, or
// both flags, refuse the run before anything opens, naming the command meant, since ignoring
// them would run less than asked without a word.
function readAccessMode({ options }) {
  const access = options.access === true;
  const updateAccess = options.updateAccess === true;
  if (access && updateAccess) {
    return {
      error:
        '--access and --update-access do different things: run "lowdefy test --access" to check tests/access.yaml, or "lowdefy test --update-access" to rewrite it.',
    };
  }
  if (!access && !updateAccess) {
    return { access, updateAccess };
  }
  const mode = access
    ? '--access checks the access table alone'
    : '--update-access rewrites tests/access.yaml alone';
  const refused = REFUSED_OPTIONS.find((option) => isGiven({ options, refused: option }));
  if (!type.isUndefined(refused)) {
    return {
      error: `${mode}: drop ${refused.flag}, or run "${refused.meant}" ${refused.purpose}.`,
    };
  }
  return { access, updateAccess };
}

export default readAccessMode;
