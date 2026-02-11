/*
  Copyright 2020-2024 Lowdefy, Inc

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

function getValueAtPath(obj, instancePath) {
  if (!instancePath) return obj;
  const keys = instancePath.split('/').filter(Boolean);
  let value = obj;
  for (const key of keys) {
    if (type.isNone(value)) return undefined;
    value = value[key];
  }
  return value;
}

function formatValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  return JSON.stringify(value);
}

function formatValidationError({ err, pluginLabel, pluginName, fieldLabel, data }) {
  const fieldName = err.instancePath ? err.instancePath.slice(1).replace(/\//g, '.') : 'root';
  const received = getValueAtPath(data, err.instancePath);

  if (err.keyword === 'type') {
    const expected = err.params.type;
    const receivedType = received === null ? 'null' : typeof received;
    return `${pluginLabel} "${pluginName}" ${fieldLabel} "${fieldName}" must be type "${expected}". Received ${formatValue(
      received
    )} (${receivedType}).`;
  }
  if (err.keyword === 'enum') {
    const allowed = err.params.allowedValues.map(formatValue).join(', ');
    return `${pluginLabel} "${pluginName}" ${fieldLabel} "${fieldName}" must be one of [${allowed}]. Received ${formatValue(
      received
    )}.`;
  }
  if (err.keyword === 'additionalProperties') {
    return `${pluginLabel} "${pluginName}" ${fieldLabel} "${err.params.additionalProperty}" is not allowed.`;
  }
  if (err.keyword === 'required') {
    return `${pluginLabel} "${pluginName}" required ${fieldLabel} "${err.params.missingProperty}" is missing.`;
  }
  return `${pluginLabel} "${pluginName}" ${fieldLabel} "${fieldName}" ${
    err.message
  }. Received ${formatValue(received)}.`;
}

export default formatValidationError;
