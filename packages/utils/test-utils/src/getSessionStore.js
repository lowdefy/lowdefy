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

import storeLogger from './storeLogger.js';
import { getRunDataStore } from './dataSets/index.js';

// The test app's client on the run's data store, joined at the first session and kept for the
// later ones. A store found dead is stopped by the session that found it (openDataSession), so
// the next session joins the run's store again, which by then is a new one. A failed join is
// not kept either.
function getSessionStore({ testApp }) {
  if (type.isNone(testApp.store)) {
    const joining = getRunDataStore({ logger: storeLogger });
    testApp.store = joining;
    joining.catch(() => {
      if (testApp.store === joining) testApp.store = null;
    });
    return joining;
  }
  return testApp.store.then((store) => {
    if (!store.stopped) return store;
    testApp.store = null;
    return getSessionStore({ testApp });
  });
}

export default getSessionStore;
