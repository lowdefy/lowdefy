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

// A changeLog record is written by the server, not the caller, but it records
// one tenant's data (before/after/payload) and the log collection is often
// walled itself - an unstamped record would fall outside every walled read
// and its null tenant field would wedge the tenant preflight permanently. So
// the record carries the verdict of the operation it records. No authored
// scan here (stampTenantOnDoc): the record nests caller content under args/
// before/after, and the stamp is a top-level server-owned key.
function stampTenantOnLogRecord({ record, tenant }) {
  if (!tenant) {
    return record;
  }
  return { ...record, [tenant.field]: tenant.value };
}

export default stampTenantOnLogRecord;
