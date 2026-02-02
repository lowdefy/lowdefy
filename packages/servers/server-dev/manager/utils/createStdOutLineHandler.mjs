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

function createStdOutLineHandler({ context }) {
  const { logger } = context;
  function stdOutLineHandler(line) {
    try {
      const { level, msg, source, err } = JSON.parse(line);
      if (!level) return;

      const levelLabel = logger.levels.labels[level];

      // Extract source from err (pino error serialization) or top-level (merging object)
      const resolvedSource = err?.source ?? source;

      // Error/warn with source: show source line (info/blue) before the message
      if (resolvedSource && level >= 40) {
        logger.info({ print: 'info' }, resolvedSource);
      }

      if (msg && msg !== 'undefined') {
        const print = level === 30 ? 'info' : levelLabel;
        logger[levelLabel]({ print }, msg);
      }
    } catch (error) {
      logger.info({ print: 'info' }, line);
    }
  }
  return stdOutLineHandler;
}

export default createStdOutLineHandler;
