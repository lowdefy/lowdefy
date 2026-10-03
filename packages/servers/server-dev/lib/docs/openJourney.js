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

import createJourneyActors from './createJourneyActors.js';

// The actor a journey starts as; `as` steps switch to others by name.
const MAIN_ACTOR = 'main';

// Opens a journey's first page as its main actor and returns the journey the
// steps run against, with the main actor's page. `timeout` bounds each page
// open, raised to `stepTimeout` when that is longer, so one journey setting
// raises every such wait. Closes every actor it opened when the open fails.
async function openJourney({
  browser,
  origin,
  basePath,
  pageId,
  user,
  urlQuery,
  width,
  height,
  colorScheme,
  timeout,
  stepTimeout,
  mutantCookie,
}) {
  const openTimeout = Math.max(timeout, stepTimeout);
  // Taken before any page opens: mail the journey causes arrives after it,
  // including mail the first page's onInit sends.
  const startedAt = Date.now();
  const actors = createJourneyActors({
    browser,
    origin,
    basePath,
    pageId,
    user,
    urlQuery,
    width,
    height,
    colorScheme,
    timeout: openTimeout,
    mutantCookie,
  });
  try {
    const main = await actors.switchTo(MAIN_ACTOR);
    const journey = {
      actors,
      origin,
      configDirectory: process.env.LOWDEFY_DIRECTORY_CONFIG ?? process.cwd(),
      startedAt,
      openTimeout,
      stepTimeout,
    };
    return { journey, main };
  } catch (error) {
    await actors.closeAll();
    throw error;
  }
}

export default openJourney;
