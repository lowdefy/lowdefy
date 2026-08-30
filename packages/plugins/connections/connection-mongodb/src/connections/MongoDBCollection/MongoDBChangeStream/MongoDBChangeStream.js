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

import applyTenantToChangeStream from '../tenant/applyTenantToChangeStream.js';
import getCollection from '../getCollection.js';
import mapMongoError from '../mapMongoError.js';
import { serialize, deserialize } from '../serialize.js';
import schema from './schema.js';

// Websocket source resolver — opens a MongoDB change stream and publishes
// each change event to the channel's subscribers. Runs from the first
// subscriber until the last one leaves (abort signal). Requires MongoDB to
// run as a replica set (change streams are not available on standalone
// deployments).
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
  if (signal.aborted) {
    return;
  }
  let stream;
  try {
    stream = collection.watch(pipeline ?? [], {
      fullDocument: fullDocument ?? 'updateLookup',
    });
  } catch (error) {
    throw mapMongoError(error, { connection, requestType: 'MongoDBChangeStream' });
  }
  signal.addEventListener(
    'abort',
    () => {
      stream.close().catch(() => {
        // Already closed — nothing to clean up.
      });
    },
    { once: true }
  );
  try {
    for await (const change of stream) {
      publish({ data: serialize(change) });
    }
  } catch (error) {
    // Closing the stream on abort surfaces as an error on the iterator.
    if (!signal.aborted) {
      throw mapMongoError(error, { connection, requestType: 'MongoDBChangeStream' });
    }
  } finally {
    await stream.close().catch(() => {
      // Already closed — nothing to clean up.
    });
  }
}

MongoDBChangeStream.schema = schema;
MongoDBChangeStream.meta = {
  publish: false,
};

export default MongoDBChangeStream;
