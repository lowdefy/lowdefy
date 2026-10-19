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

// Clients are cached for the lifetime of the process so requests share the driver's
// connection pool instead of paying a full connect (DNS, TLS, auth) per request.
const clientPromises = new Map();

function getClient({ databaseUri, options }) {
  const key = `${databaseUri}:${JSON.stringify(options ?? {})}`;
  if (!clientPromises.has(key)) {
    const clientPromise = new MongoClient(databaseUri, options).connect();
    // Evict failed connects so the next request retries instead of replaying the rejection.
    clientPromise.catch(() => clientPromises.delete(key));
    clientPromises.set(key, clientPromise);
  }
  return clientPromises.get(key);
}

async function closeClients() {
  const promises = [...clientPromises.values()];
  clientPromises.clear();
  await Promise.all(
    promises.map(async (clientPromise) => {
      try {
        const client = await clientPromise;
        await client.close();
      } catch (error) {
        // Clients that failed to connect have nothing to close.
      }
    })
  );
}

export { closeClients };
export default getClient;
