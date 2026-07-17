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

// The tenant field may be read, but never authored in a write or filter
// position. In filter and insert positions authoring it is fail-closed
// already (the injected equality ANDs in; the stamp overwrites), so this scan
// is DX - a loud error instead of a silent no-match. In update positions it
// is a security guard: the update selector is walled but the update document
// is not stamped, so an authored $set could move a row across the wall.
//
// The scan is key-based: an object key equal to the tenant field, or a dotted
// path rooted in it (`organizationId.x`), at any depth of the tree. Values
// are recursed through plain objects and arrays only - BSON values like
// ObjectId and Date are leaves.
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && value.constructor === Object;
}

function walk({ node, field, position }) {
  if (Array.isArray(node)) {
    node.forEach((item) => walk({ node: item, field, position }));
    return;
  }
  if (!isPlainObject(node)) {
    return;
  }
  Object.entries(node).forEach(([key, value]) => {
    if (key === field || key.startsWith(`${field}.`)) {
      throw new Error(
        `Tenant field "${field}" can not be set in ${position} on a tenant connection - the tenant wall stamps and filters it mechanically.`
      );
    }
    walk({ node: value, field, position });
  });
}

function assertTenantFieldNotAuthored({ value, field, position }) {
  walk({ node: value, field, position });
}

export default assertTenantFieldNotAuthored;
