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

import { errorToDisplayString, resolveErrorLocation } from '@lowdefy/errors/build';

function createBuildHandleError({ pinoLogger, context }) {
  return function handleError(error) {
    try {
      resolveErrorLocation(error, {
        keyMap: context.keyMap,
        refMap: context.refMap,
        configDirectory: context.directories?.config,
      });
      pinoLogger.error({ err: error }, errorToDisplayString(error));
    } catch {
      try {
        pinoLogger.error({ err: error }, error.message);
      } catch {
        console.error(error);
      }
    }
  };
}

export default createBuildHandleError;
