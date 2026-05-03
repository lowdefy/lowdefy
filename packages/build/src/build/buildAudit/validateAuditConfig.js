/* eslint-disable no-param-reassign */

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

import { type } from '@lowdefy/helpers';
import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import lowdefySchema from '../../lowdefySchema.js';
import collectExceptions from '../../utils/collectExceptions.js';

const SUPPORTED_PAIRINGS = {
  MongoDBCollection: 'MongoDBInsertMany',
  AwsS3Bucket: 'AwsS3PutObject',
};

function findConnection(components, connectionId) {
  return (components.connections ?? []).find((c) => c.connectionId === connectionId);
}

function collectExcludeIncludeIds(components) {
  const requestIds = new Set();
  const endpointIds = new Set();
  const pageIds = new Set();
  (components.pages ?? []).forEach((page) => {
    if (page.pageId) pageIds.add(page.pageId);
    (page.requests ?? []).forEach((request) => {
      if (request.requestId) requestIds.add(request.requestId);
    });
  });
  (components.api ?? []).forEach((endpoint) => {
    if (endpoint.endpointId) endpointIds.add(endpoint.endpointId);
  });
  return { requestIds, endpointIds, pageIds };
}

function validateReferences({ audit, components, context }) {
  if (type.isNone(audit.exclude) && type.isNone(audit.include)) return;
  const filter = audit.exclude ?? audit.include;
  const filterKey = type.isNone(audit.exclude) ? 'include' : 'exclude';
  const { requestIds, endpointIds, pageIds } = collectExcludeIncludeIds(components);

  const checks = [
    { key: 'requests', set: requestIds, label: 'request' },
    { key: 'endpoints', set: endpointIds, label: 'endpoint' },
    { key: 'pages', set: pageIds, label: 'page' },
  ];

  checks.forEach(({ key, set, label }) => {
    (filter[key] ?? []).forEach((id) => {
      if (!set.has(id)) {
        collectExceptions(
          context,
          new ConfigError(
            `Audit "${filterKey}.${key}" references unknown ${label} "${id}".`,
            { configKey: filter['~k'] ?? audit['~k'] }
          )
        );
      }
    });
  });
}

function validateAuditConfig({ components, context }) {
  if (type.isNone(components.audit)) {
    return;
  }
  if (!type.isObject(components.audit)) {
    collectExceptions(
      context,
      new ConfigError('App "audit" should be an object.', {
        received: components.audit,
        configKey: components['~k'],
      })
    );
    return;
  }

  const audit = components.audit;
  const configKey = audit['~k'];

  const { valid, errors } = validate({
    schema: lowdefySchema.properties.audit,
    data: audit,
    returnErrors: true,
  });

  if (!valid) {
    errors.forEach((error) => {
      collectExceptions(context, new ConfigError(`Audit ${error.message}.`, { configKey }));
    });
    return;
  }

  if (!context.connectionIds?.has(audit.connectionId)) {
    collectExceptions(
      context,
      new ConfigError(
        `Audit "connectionId" references unknown connection "${audit.connectionId}".`,
        { configKey }
      )
    );
    return;
  }

  const connection = findConnection(components, audit.connectionId);
  const expectedRequestType = SUPPORTED_PAIRINGS[connection?.type];
  if (!expectedRequestType) {
    collectExceptions(
      context,
      new ConfigError(
        `Audit connection "${audit.connectionId}" has unsupported type "${connection?.type}". Supported types: ${Object.keys(SUPPORTED_PAIRINGS).join(', ')}.`,
        { configKey }
      )
    );
    return;
  }
  if (audit.requestType !== expectedRequestType) {
    collectExceptions(
      context,
      new ConfigError(
        `Audit "requestType" "${audit.requestType}" is incompatible with connection type "${connection.type}". Expected "${expectedRequestType}".`,
        { configKey }
      )
    );
    return;
  }

  if (!type.isNone(audit.exclude) && !type.isNone(audit.include)) {
    collectExceptions(
      context,
      new ConfigError(
        'Audit config cannot have both "exclude" and "include". Use one or the other.',
        { configKey }
      )
    );
    return;
  }

  validateReferences({ audit, components, context });
}

export default validateAuditConfig;
