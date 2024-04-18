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

import { applyArrayIndices, get, serializer, type } from '@lowdefy/helpers';

const getFromObject = ({ arrayIndices, location, method, object, params }) => {
  if (params === true) params = { all: true };
  if (type.isString(params) || type.isInt(params)) params = { key: params };
  if (!type.isObject(params)) {
    throw new Error(
      `Method Error: ${method} params must be of type string, integer, boolean or object. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  if (params.key === null) return get(params, 'default', { default: null, copy: true });
  if (params.all === true) return serializer.copy(object);
  if (!type.isString(params.key) && !type.isInt(params.key)) {
    throw new Error(
      `Method Error: ${method} params.key must be of type string or integer. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  return get(object, applyArrayIndices(arrayIndices, params.key), {
    default: get(params, 'default', { default: null, copy: true }),
    copy: true,
  });
};

export default getFromObject;
