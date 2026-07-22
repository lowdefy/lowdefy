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

import assertTenantFieldNotAuthored from './assertTenantFieldNotAuthored.js';

// A change stream is a read on a separate execution path and is scoped like
// one. The tenant predicate is injected as a $match against fullDocument, and
// fullDocument: 'updateLookup' is forced so update events carry the document.
// Events that can not prove they match - delete events (no post-image) and
// any event without a fullDocument - are not delivered: delivering a bare
// documentKey for another tenant's delete would leak existence and id.
// (Revisit delete delivery with MongoDB 6.0 pre-images when an app needs it.)
function applyTenantToChangeStream({ pipeline, tenant }) {
  const { field, value } = tenant;
  if (tenant.authored === true) {
    // Change-stream pipelines never carry the first-stage-only stages the
    // authored sentinel exists for - refuse it here (build also rejects it
    // on websockets).
    throw new Error(
      '"tenant: authored" applies only to aggregation requests - the tenant wall scopes this change stream mechanically. Remove "tenant: authored".'
    );
  }
  const authored = pipeline ?? [];
  assertTenantFieldNotAuthored({
    value: authored,
    field,
    position: 'a change stream pipeline',
  });
  assertTenantFieldNotAuthored({
    value: authored,
    field: `fullDocument.${field}`,
    position: 'a change stream pipeline',
  });
  return {
    pipeline: [{ $match: { [`fullDocument.${field}`]: value } }, ...authored],
    fullDocument: 'updateLookup',
  };
}

export default applyTenantToChangeStream;
