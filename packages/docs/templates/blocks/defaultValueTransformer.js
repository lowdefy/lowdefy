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

// we assume:
// anyOf, oneOf specifies default on property level.
// array must specify default on array level
function getDefaultValues(defaultValues, obj) {
  Object.keys(obj.properties || {}).forEach((key) => {
    if (obj.properties[key].default != null) {
      defaultValues[key] = obj.properties[key].default;
    }
    if (typeof defaultValues[key] === 'undefined' || obj.properties[key].type === 'object') {
      switch (obj.properties[key].type) {
        case 'boolean':
          defaultValues[key] = false;
          break;
        case 'array':
          defaultValues[key] = [];
          break;
        case 'object':
          defaultValues[key] = getDefaultValues(defaultValues[key] || {}, obj.properties[key]);
          // unset empty objects for style inputs
          if (Object.keys(defaultValues[key]).length === 0) {
            delete defaultValues[key];
          }
          break;
        default:
          defaultValues[key] = null;
          break;
      }
    }
  });
  return defaultValues;
}

const transformer = (obj) => {
  return getDefaultValues({}, obj.properties);
};

export default transformer;
