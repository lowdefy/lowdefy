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
// import buildPage from './buildPage.js';
import createCheckDuplicateId from '../../utils/createCheckDuplicateId.js';
import createCounter from '../../utils/createCounter.js';

function buildApi({ components, context }) {
  const api = type.isArray(components.api) ? components.api : [];
  const checkDuplicateApiId = createCheckDuplicateId({
    message: 'Duplicate apiId "{{ id }}".',
  });
  api.map((api, index) => {
    if (type.isUndefined(api.id)) {
      throw new Error(`Api id missing at api ${index}.`);
    }
    if (!type.isString(api.id)) {
      throw new Error(
        `Api id is not a string at api ${index}. Received ${JSON.stringify(api.id)}.`
      );
    }
    checkDuplicateApiId({ id: api.id });
  });
  return components;
}

export default buildApi;
