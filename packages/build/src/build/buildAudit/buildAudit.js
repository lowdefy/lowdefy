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

  if (type.isNone(components.audit)) {
    return components;
  }

  if (type.isNone(components.audit.transport)) {
    components.audit.transport = 'connection';
  }
  if (type.isNone(components.audit.severity)) {
    components.audit.severity = 'medium';
  }
  if (type.isNone(components.audit.strict)) {
    components.audit.strict = false;
  }
  if (type.isNone(components.audit.mask)) {
    components.audit.mask = [];
  }
  if (type.isNone(components.audit.fields)) {
    components.audit.fields = {};
  }
  if (type.isNone(components.audit.capture)) {
    components.audit.capture = {};
  }
  if (type.isNone(components.audit.batch)) {
    components.audit.batch = { enabled: false };
  } else {
    if (type.isNone(components.audit.batch.enabled)) {
      components.audit.batch.enabled = false;
    }
    if (type.isNone(components.audit.batch.size)) {
      components.audit.batch.size = 100;
    }
    if (type.isNone(components.audit.batch.interval)) {
      components.audit.batch.interval = 5000;
    }
  }

  components.audit.configured =
    components.audit.transport === 'stdout' || !type.isNone(components.audit.connectionId);

  return components;
}

export default buildAudit;
