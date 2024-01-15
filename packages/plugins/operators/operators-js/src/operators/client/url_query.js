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

import { getFromObject } from '@lowdefy/operators';
import { urlQuery } from '@lowdefy/helpers';

function _url_query({ arrayIndices, globals, location, params }) {
  const { window } = globals;
  if (!window?.location) {
    throw new Error(
      `Operator Error: Browser window.location not available for _url_query. Received: ${JSON.stringify(
        params
      )} at ${location}.`
    );
  }
  return getFromObject({
    arrayIndices,
    location,
    object: urlQuery.parse(window.location.search.slice(1)),
    operator: '_url_query',
    params,
  });
}

export default _url_query;
