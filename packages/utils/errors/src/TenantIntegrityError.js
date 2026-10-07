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

// Thrown when a walled collection holds, or a write would leave behind, a row
// the tenant wall cannot see: a document with no organisation, or one stamped
// for a different organisation than the request ran for. It is a data fault, so
// it fails one request (or is logged once at boot by the tenant preflight) and
// never takes the app down. The fields name where to look.
class TenantIntegrityError extends Error {
  constructor(
    message,
    { cause, collection, configKey, connectionId, organizationId, field, endpointId } = {}
  ) {
    super(message, { cause });
    this.name = 'TenantIntegrityError';
    this.isLowdefyError = true;
    this.collection = collection ?? null;
    this.configKey = configKey ?? null;
    this.connectionId = connectionId ?? null;
    this.organizationId = organizationId ?? null;
    this.field = field ?? null;
    this.endpointId = endpointId ?? null;
  }
}

export default TenantIntegrityError;
