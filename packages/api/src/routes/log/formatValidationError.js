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

function getValueAtPath(obj, instancePath) {
  if (!instancePath) return obj;
  const keys = instancePath.split('/').filter(Boolean);
  let value = obj;
  for (const key of keys) {
    if (value == null) return undefined;
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

function formatValidationError(err, blockType, properties) {
  const propName = err.instancePath ? err.instancePath.slice(1).replace(/\//g, '.') : 'root';
  const received = getValueAtPath(properties, err.instancePath);

  if (err.keyword === 'type') {
    const expected = err.params.type;
    return `Block "${blockType}" property "${propName}" must be type "${expected}". Received ${formatValue(received)} (${typeof received}).`;
  }
  if (err.keyword === 'enum') {
    const allowed = err.params.allowedValues.map(formatValue).join(', ');
    return `Block "${blockType}" property "${propName}" must be one of [${allowed}]. Received ${formatValue(received)}.`;
  }
  if (err.keyword === 'additionalProperties') {
    return `Block "${blockType}" property "${err.params.additionalProperty}" is not allowed.`;
  }
  if (err.keyword === 'required') {
    return `Block "${blockType}" required property "${err.params.missingProperty}" is missing.`;
  }
  return `Block "${blockType}" property "${propName}" ${err.message}. Received ${formatValue(received)}.`;
}

export default formatValidationError;
