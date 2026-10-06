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

// The _js operator hands its function accessors (state(), payload(), ...) that
// call these operators through the operator registry, so config that runs _js
// needs them whether or not it names them.
const jsAccessorOperators = {
  client: [
    '_actions',
    '_app',
    '_event',
    '_global',
    '_input',
    '_location',
    '_path_params',
    '_request',
    '_state',
    '_url_query',
    '_user',
  ],
  server: ['_app', '_item', '_payload', '_secret', '_state', '_step', '_user'],
};

export default jsAccessorOperators;
