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

// The server owns the tenant field on every written document: authored values
// are rejected (loud error over silent overwrite), then the caller's org is
// stamped.
function stampTenantOnDoc({ doc, tenant, position = 'an insert document' }) {
  const { field, value } = tenant;
  assertTenantFieldNotAuthored({ value: doc, field, position });
  return { ...doc, [field]: value };
}

export default stampTenantOnDoc;
