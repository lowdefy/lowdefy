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

import schema from './schema.js';

// A pure pub/sub relay — the channel produces no messages of its own.
// Messages originate from client Publish actions, which the server
// broadcasts to all subscribers. The resolver only holds the channel
// open until the last subscriber leaves.
async function Channel({ signal }) {
  if (signal.aborted) {
    return;
  }
  await new Promise((resolve) => {
    signal.addEventListener('abort', resolve, { once: true });
  });
}

Channel.schema = schema;
Channel.meta = {
  publish: true,
};

export default Channel;
