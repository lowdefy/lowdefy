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
import { assertMatches } from '@lowdefy/test-utils/assert';
import { findSessionDocuments } from '@lowdefy/test-utils/dataSets';

import JourneyStepError from './JourneyStepError.js';

const POLL_MS = 100;

function describeQuery({ collection, match }) {
  return `"${collection}" matching ${JSON.stringify(match)}`;
}

// What the documents found fail to show, or undefined when they hold what the step expects: a
// count of them, or the list equals, item for item in _id order, each document holding at least
// the keys given.
function findMismatch({ documents, params }) {
  if (!type.isUndefined(params.count)) {
    if (documents.length === params.count) return undefined;
    return {
      message: `Expected ${params.count} document${
        params.count === 1 ? '' : 's'
      } in ${describeQuery(params)} but found ${documents.length}.`,
      expected: params.count,
      actual: documents.length,
    };
  }
  try {
    assertMatches(documents, params.equals);
    return undefined;
  } catch (error) {
    return {
      message: `Expected the documents in ${describeQuery(params)} to be ${JSON.stringify(
        params.equals
      )}: ${error.message}`,
      expected: params.equals,
      actual: documents,
    };
  }
}

// expect.db reads the journey's data session database, as the data set run's requests wrote it,
// and waits up to `timeout` ms for it to hold what the step expects, since a write the app makes
// in the background (context.waitUntil) may land after the step that caused it.
async function expectJourneyDb({ journey, params, timeout }) {
  if (type.isNone(journey.dataSession)) {
    throw new JourneyStepError(
      'expect.db reads the journey\'s data set database, and this journey declares no "data".',
      { expected: 'a journey with a data set', actual: 'no data set' }
    );
  }
  async function read() {
    try {
      return await findSessionDocuments({
        buildDirectory: journey.buildDirectory,
        client: journey.dataStore.client,
        collection: params.collection,
        connectionId: params.connectionId,
        match: params.match,
        session: journey.dataSession.session,
      });
    } catch (error) {
      throw new JourneyStepError(error.message, {
        expected: `documents in ${describeQuery(params)}`,
        actual: error.message,
      });
    }
  }
  const deadline = Date.now() + timeout;
  let mismatch = findMismatch({ documents: await read(), params });
  while (!type.isUndefined(mismatch) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    mismatch = findMismatch({ documents: await read(), params });
  }
  if (!type.isUndefined(mismatch)) {
    throw new JourneyStepError(mismatch.message, {
      expected: mismatch.expected,
      actual: mismatch.actual,
    });
  }
}

export default expectJourneyDb;
