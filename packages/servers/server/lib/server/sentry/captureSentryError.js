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

import * as Sentry from '@sentry/node';
import { type } from '@lowdefy/helpers';

import serializeErrorForLog from '../log/serializeErrorForLog.js';

function captureSentryError({ error, context, configLocation }) {
  // No-op if Sentry not initialized (DSN not set)
  if (!process.env.SENTRY_DSN) {
    return;
  }

  const tags = {};
  const extra = {};

  // Add Lowdefy-specific context
  if (context?.pageId) {
    tags.pageId = context.pageId;
  }

  if (!type.isNone(context?.rid)) {
    tags.requestId = context.rid;
  }

  if (error?.blockId) {
    tags.blockId = error.blockId;
  }

  if (error?.isServiceError !== undefined) {
    tags.isServiceError = error.isServiceError;
  }

  // Fields a data-integrity fault carries, so it can be filtered and grouped
  // in Sentry by where it happened.
  ['collection', 'connectionId', 'organizationId', 'endpointId'].forEach((field) => {
    if (!type.isNone(error?.[field])) {
      tags[field] = error[field];
    }
  });
  if (tags.collection || tags.connectionId || tags.organizationId || tags.endpointId) {
    tags.errorName = error.name;
  }
  const fingerprint =
    error?.name === 'TenantIntegrityError' ? [error.name, error.collection ?? ''] : undefined;

  // Add config location context
  if (configLocation) {
    extra.configLocation = configLocation;
  }

  // Add config key for reference
  if (error?.configKey) {
    extra.configKey = error.configKey;
  }

  // Sentry's own serialization of the exception carries only names, messages and stacks, so
  // the log's projection is what gives Sentry the error's other fields - the same ones the log
  // keeps, with the library fields it drops left out.
  extra.error = serializeErrorForLog(error);

  Sentry.captureException(error, {
    tags,
    extra,
    ...(fingerprint ? { fingerprint } : {}),
  });
}

export default captureSentryError;
