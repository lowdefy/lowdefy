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

import {
  changeLogOrganizationOfDocs,
  changeLogOrganizationOfFilter,
} from '../tenant/guardUnscopedWrite.js';

// An unscoped save (tenant: none) on a change-logged tenant connection writes one log record,
// stamped with the organization of the rows it writes, so the save must write rows of one
// organization: the base filter pins it by equality for every update and delete (none of
// which may write the tenant field), and every new row carries that same organization.
function getChangeLogOrganization({ filter, operations, field }) {
  let organizationId = null;
  const documents = [];
  operations.forEach((operation) => {
    if (operation.insertOne) {
      documents.push(operation.insertOne.document);
      return;
    }
    organizationId = changeLogOrganizationOfFilter({
      filter,
      update: operation.updateOne?.update,
      field,
    });
  });
  if (documents.length === 0) return organizationId;
  const documentsOrganizationId = changeLogOrganizationOfDocs({ docs: documents, field });
  if (organizationId !== null && documentsOrganizationId !== organizationId) {
    throw new ConfigError(
      `Unscoped write (tenant: none) on a change-logged tenant connection must write rows of one organization - the filter matches ${JSON.stringify(
        organizationId
      )} but the added rows carry ${JSON.stringify(documentsOrganizationId)}.`
    );
  }
  return documentsOrganizationId;
}

export default getChangeLogOrganization;
