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

import MEMBER_ROWS_LIMIT from './memberRowsLimit.js';

// The organizations a person is suspended in. Only suspended rows are read - a
// row with no suspended field never equals true, on any adapter - so the
// common answer, none, reads no rows.
async function readSuspendedOrganizationIds({ adapter, userId }) {
  const rows = await adapter.findMany({
    model: 'member',
    where: [
      { field: 'userId', value: userId },
      { field: 'suspended', value: true },
    ],
    limit: MEMBER_ROWS_LIMIT,
  });
  return rows.map((row) => row.organizationId);
}

export default readSuspendedOrganizationIds;
