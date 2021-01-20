/*
  Copyright 2020-2021 Lowdefy, Inc

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

import axios from 'axios';
import { type as typeHelper } from '@lowdefy/helpers';

async function fetchMetaUrl({ location, type } = {}) {
  if (typeHelper.isNone(location)) {
    throw new Error('Failed to fetch meta, location is undefined.');
  }
  if (!typeHelper.isString(location.url)) {
    throw new Error(`Block type ${JSON.stringify(type)} url definition should be a string.`);
  }
  let res;
  try {
    res = await axios.get(location.url);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error(
        `Meta for type ${JSON.stringify(type)} could not be found at ${JSON.stringify(location)}.`
      );
    }
    throw error;
  }
  return res.data;
}

export default fetchMetaUrl;
