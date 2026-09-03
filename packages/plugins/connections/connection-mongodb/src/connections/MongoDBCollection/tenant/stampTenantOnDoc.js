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

import assertTenantFieldNotAuthored from './assertTenantFieldNotAuthored.js';

// The server owns the tenant field on every written document: authored values
// are rejected (loud error over silent overwrite), then the caller's org is
// stamped.
//
// `trace` is an optional dev-only collector: when present the stamp is
// recorded on trace.rewritten as { at, injected }, where `at` names the
// authored property ('doc', 'docs[1]', 'operations[0].document').
function stampTenantOnDoc({ doc, tenant, position = 'an insert document', trace, at = 'doc' }) {
  const { field, value } = tenant;
  if (tenant.authored === true) {
    // See applyTenantToFilter - the shared refusal of the authored sentinel
    // on non-aggregation operations.
    throw new ConfigError(
      '"tenant: authored" applies only to aggregation requests - the tenant wall scopes this request mechanically. Remove "tenant: authored".'
    );
  }
  assertTenantFieldNotAuthored({ value: doc, field, position });
  if (trace) {
    trace.rewritten.push({ at, injected: { [field]: value } });
  }
  return { ...doc, [field]: value };
}

export default stampTenantOnDoc;
