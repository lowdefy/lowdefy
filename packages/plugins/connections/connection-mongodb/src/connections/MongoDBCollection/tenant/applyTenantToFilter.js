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

// Merge the tenant equality into a find/update/delete selector:
// { $and: [filter, { <field>: <value> }] }. The $and form composes with any
// authored filter shape (including one that already uses $and/$or at the
// top level), and MongoDB extracts the nested equality clause when building
// an upserted document, which is what carries the tenant field onto upserts.
function applyTenantToFilter({ filter, tenant, position = 'a filter' }) {
  const { field, value } = tenant;
  if (tenant.authored === true) {
    // Every non-aggregation operation reaches the wall through this helper or
    // stampTenantOnDoc, so the authored sentinel is refused here once rather
    // than in each operation file.
    throw new Error(
      '"tenant: authored" applies only to aggregation requests - the tenant wall scopes this request mechanically. Remove "tenant: authored".'
    );
  }
  assertTenantFieldNotAuthored({ value: filter, field, position });
  if (filter == null || Object.keys(filter).length === 0) {
    return { [field]: value };
  }
  return { $and: [filter, { [field]: value }] };
}

export default applyTenantToFilter;
