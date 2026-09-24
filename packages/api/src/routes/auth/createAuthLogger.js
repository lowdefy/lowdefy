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

// Adapts the Lowdefy logger to BetterAuth's logger contract:
// { disabled, level, log(level, message, ...args) }.
function createAuthLogger({ logger }) {
  return {
    disabled: false,
    level: logger?.isLevelEnabled?.('debug') === true ? 'debug' : 'warn',
    log: (level, message, ...args) => {
      const log = logger?.[level] ?? logger?.info;
      if (!log) return;
      log.call(logger, { event: 'auth_engine', args }, message);
    },
  };
}

export default createAuthLogger;
