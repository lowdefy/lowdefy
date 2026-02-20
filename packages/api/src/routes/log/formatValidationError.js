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

function formatValidationError({ ajvError, pluginLabel, typeName, fieldLabel }) {
  const path = ajvError.instancePath ? ajvError.instancePath.substring(1).replace(/\//g, '.') : null;
  const fieldName = path || ajvError.params?.missingProperty || 'unknown';

  switch (ajvError.keyword) {
    case 'type':
      return `${pluginLabel} "${typeName}" ${fieldLabel} "${fieldName}" must be type "${ajvError.params.type}".`;
    case 'enum':
      return `${pluginLabel} "${typeName}" ${fieldLabel} "${fieldName}" must be one of ${JSON.stringify(ajvError.params.allowedValues)}.`;
    case 'additionalProperties':
      return `${pluginLabel} "${typeName}" ${fieldLabel} "${ajvError.params.additionalProperty}" is not allowed.`;
    case 'required':
      return `${pluginLabel} "${typeName}" required ${fieldLabel} "${ajvError.params.missingProperty}" is missing.`;
    default:
      return `${pluginLabel} "${typeName}" ${fieldLabel} "${fieldName}" ${ajvError.message}.`;
  }
}

export default formatValidationError;
