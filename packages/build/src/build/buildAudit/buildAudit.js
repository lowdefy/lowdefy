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
import validateAuditConfig from './validateAuditConfig.js';

function buildAudit({ components, context }) {
  validateAuditConfig({ components, context });

  if (type.isNone(components.logger?.audit)) {
    return components;
  }

  const audit = components.logger.audit;

  if (type.isNone(audit.enabled)) {
    audit.enabled = true;
  }
  if (type.isNone(audit.severity)) {
    audit.severity = 'medium';
  }
  if (type.isNone(audit.mask)) {
    audit.mask = [];
  }
  if (type.isNone(audit.fields)) {
    audit.fields = {};
  }
  if (type.isNone(audit.capture)) {
    audit.capture = {};
  }
  if (type.isNone(audit.sampling)) {
    audit.sampling = {};
  }
  if (type.isNone(audit.rateLimit)) {
    audit.rateLimit = {};
  }

  return components;
}

export default buildAudit;
