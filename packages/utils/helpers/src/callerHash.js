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
import type from './type.js';

// A short fingerprint of the caller a response was answered as: the user id
// and active organization together, so a switched organization reads as
// another caller. Empty for an anonymous caller. It is the first part of the
// caller stamp (see callerStamp), which the client compares with the caller it
// renders.
function callerHash({ user }) {
  if (type.isNone(user)) {
    return '';
  }
  return stampHash(`${user.id}:${user.organization_id ?? ''}`);
}

export default callerHash;
