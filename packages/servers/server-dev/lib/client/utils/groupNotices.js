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
// Splits the ErrorBar's entries into errors/warnings and the tenant: none
// notices, which the bar renders as their own "unscoped reads" group and the
// copy text lists under their own heading.
const TENANT_NONE_NOTICE = 'TenantNoneNotice';
// Steps that ran scoped to an authored organization (runAs) sit beside the
// unscoped ones: neither is an error, and both say which rows a step touched.
const RUN_AS_NOTICE = 'RunAsScope';

function groupNotices(errors) {
  const entries = [];
  const tenantNotices = [];
  const runAsNotices = [];
  (errors ?? []).forEach((error) => {
    if (error.type === TENANT_NONE_NOTICE) {
      tenantNotices.push(error);
    } else if (error.type === RUN_AS_NOTICE) {
      runAsNotices.push(error);
    } else {
      entries.push(error);
    }
  });
  return { entries, tenantNotices, runAsNotices };
}

export default groupNotices;
