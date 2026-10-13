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

import stampHash from './stampHash.js';

// The stamp hash of a list whose order carries no meaning (the organization ids
// a person belongs to): sorted first, so the same set always hashes the same,
// and JSON-encoded, so no separator inside an entry can make two lists read as
// one.
function listHash({ values }) {
  return stampHash(JSON.stringify([...values].sort()));
}

export default listHash;
