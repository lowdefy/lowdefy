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
import pino from 'pino';

function createLogger({ level = 'info' }) {
  const logger = pino({
    name: 'lowdefy build',
    level,
    base: { pid: undefined, hostname: undefined },
    mixin: (context, level) => {
      return {
        ...context,
        print: context.print ?? logger.levels.labels[level],
      };
    },
  });
  return logger;
}

export default createLogger;
