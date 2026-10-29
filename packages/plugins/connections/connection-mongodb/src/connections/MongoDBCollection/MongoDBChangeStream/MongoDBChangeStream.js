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

import { setTimeout as wait } from 'node:timers/promises';

import applyTenantToChangeStream from '../tenant/applyTenantToChangeStream.js';
import getCollection from '../getCollection.js';
import isResumableChangeStreamError from './isResumableChangeStreamError.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

// Wait before reopening a stream that failed: 0.5 s, 1 s, 2 s, then every 4 s.
const RETRY_DELAYS_MS = [500, 1000, 2000, 4000];
// Give up once the stream has kept failing for this long, and throw as before. A stream
// the server kept answering for this long was healthy, and its failure starts a new window.
const RETRY_WINDOW_MS = 30000;

// Websocket source resolver — opens a MongoDB change stream and publishes
// each change event to the channel's subscribers. Runs from the first
// subscriber until the last one leaves (abort signal). Requires MongoDB to
// run as a replica set (change streams are not available on standalone
// deployments).
//
// A replica set election ends the stream with an error the driver does not
// resume (code 11602). The resolver then reopens the stream after the last
// published change (resumeAfter), so subscribers keep their channel instead
// of all reconnecting and reloading at once.
async function MongoDBChangeStream({ connection, properties, publish, signal, tenant }) {
  let { fullDocument, pipeline } = deserialize(properties ?? {});
  if (tenant) {
    // Inject the tenant $match against fullDocument and force updateLookup so
    // update events carry the document. Events that can not prove they match
    // (deletes, no fullDocument) are not delivered - fail closed.
    ({ fullDocument, pipeline } = applyTenantToChangeStream({ pipeline, tenant }));
  }
  // The client is cached and shared with all other requests on this connection,
  // so only the stream may be closed here, never the client.
  const { collection } = await getCollection({ connection });
  let resumeToken = null;
  let failingSince = null;
  let retries = 0;
  while (!signal.aborted) {
    const options = { fullDocument: fullDocument ?? 'updateLookup' };
    if (resumeToken !== null) {
      options.resumeAfter = resumeToken;
    }
    let stream;
    try {
      stream = collection.watch(pipeline ?? [], options);
    } catch (error) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBChangeStream' });
    }
    // The driver updates the resume token when the server answers the stream's
    // aggregate or getMore, so these say when the stream was answered. Time the
    // driver spends blocked (waiting for a primary) is not counted as healthy.
    let firstAnsweredAt = null;
    let lastAnsweredAt = null;
    stream.on('resumeTokenChanged', () => {
      lastAnsweredAt = Date.now();
      firstAnsweredAt ??= lastAnsweredAt;
    });
    const closeStream = () =>
      stream.close().catch(() => {
        // Already closed — nothing to clean up.
      });
    signal.addEventListener('abort', closeStream, { once: true });
    try {
      for await (const change of stream) {
        resumeToken = change._id;
        publish({ data: serialize(change) });
      }
      return;
    } catch (error) {
      // Closing the stream on abort surfaces as an error on the iterator.
      if (signal.aborted) {
        return;
      }
      const wasHealthy =
        firstAnsweredAt !== null && lastAnsweredAt - firstAnsweredAt > RETRY_WINDOW_MS;
      if (failingSince === null || wasHealthy) {
        failingSince = Date.now();
        retries = 0;
      }
      if (!isResumableChangeStreamError(error) || Date.now() - failingSince > RETRY_WINDOW_MS) {
        throw mapMongoError(error, { connection, requestType: 'MongoDBChangeStream' });
      }
    } finally {
      signal.removeEventListener('abort', closeStream);
      await closeStream();
    }
    const delay = RETRY_DELAYS_MS[Math.min(retries, RETRY_DELAYS_MS.length - 1)];
    retries += 1;
    // An abort during the wait ends it early, and the loop ends.
    await wait(delay, undefined, { signal }).catch(() => {});
  }
}

MongoDBChangeStream.schema = schema;
MongoDBChangeStream.meta = {
  checkRead: true,
  checkWrite: false,
  publish: false,
};

export default MongoDBChangeStream;
