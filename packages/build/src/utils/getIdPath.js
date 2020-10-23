/*
  Copyright 2020 Lowdefy, Inc

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

import { get } from '@lowdefy/helpers';

function getIdPath(path, app) {
  const segments = path.split('.');
  const ids = segments.map((segment, i) => {
    const combinedSeg = segments.reduce((acc, cur, idx) => {
      if (idx === 0) {
        return cur;
      }
      if (idx <= i) {
        return acc.concat('.', cur);
      }
      return acc;
    }, '');
    const id = get(app, `${combinedSeg}.id`);
    return id || segment;
  });
  return ids.reduce((acc, cur, idx) => {
    if (idx === 0) {
      return cur;
    }
    return acc.concat(' > ', cur);
  }, '');
}

export default getIdPath;
