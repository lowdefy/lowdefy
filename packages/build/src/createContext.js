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

import { mergeObjects } from '@lowdefy/helpers';

import createBuildHandleError from './utils/createBuildHandleError.js';
import createCounter from './utils/createCounter.js';
import createHandleWarning from './utils/createHandleWarning.js';
import createReadConfigFile from './utils/readConfigFile.js';
import createWriteBuildArtifact from './utils/writeBuildArtifact.js';
import defaultTypesMap from './defaultTypesMap.js';

function createContext({ customTypesMap, directories, logger, refResolver, stage = 'prod' }) {
  const context = {
    connectionIds: new Set(),
    directories,
    errors: [],
    jsMap: {},
    keyMap: {},
    logger,
    readConfigFile: createReadConfigFile({ directories }),
    refMap: {},
    refResolver,
    seenSourceLines: new Set(),
    stage,
    typeCounters: {
      actions: createCounter(),
      auth: {
        adapters: createCounter(),
        callbacks: createCounter(),
        events: createCounter(),
        providers: createCounter(),
      },
      blocks: createCounter(),
      connections: createCounter(),
      requests: createCounter(),
      controls: createCounter(),
      operators: {
        client: createCounter('client'),
        server: createCounter('server'),
      },
    },
    typesMap: mergeObjects([defaultTypesMap, customTypesMap]),
    writeBuildArtifact: createWriteBuildArtifact({ directories }),
  };

  context.handleError = createBuildHandleError({ context });
  context.handleWarning = createHandleWarning({ context });

  return context;
}

export default createContext;
