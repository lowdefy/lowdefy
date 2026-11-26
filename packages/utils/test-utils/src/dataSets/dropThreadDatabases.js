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

// Drops the databases a stopped thread of this process left on the dev server's store: a journey
// worker thread's sessions carry its thread id (ld_p<pid>t<threadId>_, openDataSession), and no
// other thread's sweep drops them (sweepOrphanDatabases). The dev server's journey pool calls it
// once a thread has stopped, so a thread that crashed mid-journey leaves no databases behind (a
// drop that fails is logged, and those databases stay until the store stops).
async function dropThreadDatabases({ client, threadId }) {
  const prefix = `ld_p${process.pid}t${threadId}_`;
  const { databases } = await client.db('admin').admin().listDatabases({ nameOnly: true });
  await Promise.all(
    databases
      .map((database) => database.name)
      .filter((name) => name.startsWith(prefix))
      .map((name) => client.db(name).dropDatabase())
  );
}

export default dropThreadDatabases;
