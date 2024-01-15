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

function custom_filter_default_value({ params }) {
  const { value, defaultValue } = params;
  const isEmptyObject = (obj) => type.isObject(obj) && Object.keys(obj).length === 0;

  const getNestedValue = (obj, path) => {
    const keys = [...path];
    const key = keys.shift();
    const value = obj[key];
    if (keys.length > 0 && type.isObject(value)) return getNestedValue(value, keys);
    return value;
  };

  const filterObject = ({ obj, path }) => {
    Object.keys(obj).forEach((key) => {
      const propPath = path.concat([key]);
      if (type.isObject(obj[key])) {
        filterObject({ obj: obj[key], path: propPath });
      }
      const dv = getNestedValue(defaultValue, propPath);
      if (obj[key] === dv) {
        delete obj[key];
      }
      if (obj[key] === null || isEmptyObject(obj[key])) {
        delete obj[key];
      }
    });
    return obj;
  };
  return filterObject({ obj: value, path: [] });
}

export default custom_filter_default_value;
