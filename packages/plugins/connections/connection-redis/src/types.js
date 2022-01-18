/* eslint-disable import/namespace */
/*
  Copyright 2020-2021 Lowdefy, Inc

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

import * as connections from './connections.js';

export default {
  connections: Object.keys(connections),
  requests: Object.keys(connections)
    .map((connection) => Object.keys(connections[connection].requests))
    .flat(),
};

// export default {
//   connections: ['Redis'],
//   requests: ['Redis'],
// };
