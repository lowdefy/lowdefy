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

// Adapts the Lowdefy logger to BetterAuth's logger contract:
// { disabled, level, log(level, message, ...args) }.
//
// BetterAuth passes what failed as extra args - "Failed to run background task:" with the
// error from an email send. An Error goes under `err`, so the log keeps its message, stack and
// cause and the prod log's projection drops a library's own fields (nodemailer's rejected
// recipients and server response). Any other arg is a value BetterAuth was working on - a user,
// a session, a request body - so the line names its type only. An error the Lowdefy code it
// called already reported (handled, set by handleError) is written at debug.
function createAuthLogger({ logger }) {
  return {
    disabled: false,
    level: logger?.isLevelEnabled?.('debug') === true ? 'debug' : 'warn',
    log: (level, message, ...args) => {
      const err = args.find((arg) => arg instanceof Error);
      const lineLevel = err?.handled === true ? 'debug' : level;
      const log = logger?.[lineLevel] ?? logger?.info;
      if (!log) return;
      const entry = { event: 'auth_engine' };
      if (err) {
        entry.err = err;
      }
      const values = args.filter((arg) => arg !== err);
      if (values.length > 0) {
        entry.argTypes = values.map((arg) => type.typeOf(arg));
      }
      log.call(logger, entry, message);
    },
  };
}

export default createAuthLogger;
