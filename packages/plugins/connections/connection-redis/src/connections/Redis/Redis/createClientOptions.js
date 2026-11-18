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

function createClientOptions({ connection }) {
  const options = type.isString(connection) ? { url: connection } : connection;
  return {
    ...options,
    socket: {
      // Each request opens its own client, so a failed connection should fail the request
      // instead of retrying in the background while the request waits.
      reconnectStrategy: false,
      ...options.socket,
    },
  };
}

export default createClientOptions;
