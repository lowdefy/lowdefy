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

import { MongoClient } from 'mongodb';

import { fixtureTest, postJourney } from './fixtureClient.mjs';
import { expect } from 'vitest';

// A walled-client plugin under a data set: the fixture app's local plugin type
// declares meta.dataSet 'walled' and writes through the walled client to the
// fixture_db connection it names. A data-set journey clicks through that write:
// the click rails let it through, the gate passes the plugin connection
// unchanged and redirects fixture_db, so the row lands in the session database
// and never in the fixture's own.

async function countFixtureRows(query) {
  const client = new MongoClient(process.env.LOWDEFY_JOURNEY_FIXTURE_DATABASE_URI);
  try {
    await client.connect();
    return await client.db().collection('items').countDocuments(query);
  } finally {
    await client.close();
  }
}

fixtureTest(
  'a data-set journey clicks through a walled-client plugin write into the session database',
  async () => {
    const result = await postJourney({
      pageId: 'walled',
      data: 'walled',
      user: 'member',
      steps: [
        { expect: { visible: 'walled_title' } },
        { click: 'save_walled_button' },
        { wait: { request: 'get_walled_rows' } },
        { expect: { visible: 'walled_saved_alert' } },
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
    expect(await countFixtureRows({ kind: 'walled' })).toBe(0);
  }
);
