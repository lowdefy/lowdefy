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

import getFromObject from './getFromObject.js';
import { urlQuery } from '@lowdefy/helpers';

function createGetUrlQuery({ arrayIndices, blockId, context }) {
  return function getUrlQuery(params) {
    const { window } = context._internal.lowdefy._internal.globals;
    if (!window?.location) {
      throw new Error(
        `Browser window.location not available for getUrlQuery. Received: ${JSON.stringify(
          params
        )} on blockId: ${blockId}.`
      );
    }
    return getFromObject({
      arrayIndices,
      location: blockId,
      object: urlQuery.parse(window.location.search.slice(1)),
      method: 'getUrlQuery',
      params,
    });
  };
}

export default createGetUrlQuery;
