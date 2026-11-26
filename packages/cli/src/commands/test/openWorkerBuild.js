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

import openBuildApp from './openBuildApp.js';

// Opens the production build in a worker thread of a --build run, as openBuildApp does. The run's
// own thread opened the build with id `buildId`; a thread that opens a build rebuilt since would
// run its journeys on other config than the rest of the run, all recorded under the first build's
// id, so it closes that app and refuses, and the run goes on in its own thread. Returns { app } or
// { refused }.
async function openWorkerBuild({ buildId, context, secrets }) {
  const opened = await openBuildApp({ context, secrets });
  if (!type.isUndefined(opened.refused) || opened.app.buildId === buildId) {
    return opened;
  }
  await opened.app.close();
  return { refused: 'The build was rebuilt during the run.' };
}

export default openWorkerBuild;
