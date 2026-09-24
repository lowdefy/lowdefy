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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The write-position scan: reject the tenant field where it names a PATH of
// the document being written, and nowhere else.
//
// In an update operator's argument ({ $set: { <path>: <value> } }) and in an
// insert or replacement document, only the top-level keys are document
// paths. Everything under them is data: a subdocument key spells
// `<parent>.<key>`, never the root field, and an array of objects carries
// whatever the app stores - a chat transcript, a tool result, an audit
// snapshot. Recursing into values (assertTenantFieldNotAuthored) is right
// for filters, where $and/$or/$elemMatch nest further clauses, but in a write
// it turned any nested "organization_id" key inside stored data into a false
// rejection of the whole write.
//
// type.isObject classifies by shape, not constructor, so a null-prototype
// argument is scanned like any other - this is the security guard on the
// update path.
function assertTenantPathNotAuthored({ value, field, position }) {
  if (!type.isObject(value)) return;
  Object.keys(value).forEach((key) => {
    if (key === field || key.startsWith(`${field}.`)) {
      throw new ConfigError(
        `Tenant field "${field}" can not be set in ${position} on a tenant connection - the tenant wall stamps and filters it mechanically.`
      );
    }
  });
}

export default assertTenantPathNotAuthored;
