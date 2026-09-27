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

import { type } from '@lowdefy/helpers';

// Marks an object parsed from a copy of a _function body as data when its
// content matches data the body held. Only tracked objects are in the index,
// and tracking follows from content, so any other object simply finds no match.
function markDataShape({ literalData, dataShapes, digest, value }) {
  if (!type.isObject(value)) {
    return;
  }
  const origin = dataShapes.get(digest(value));
  if (!type.isUndefined(origin)) {
    literalData.dataObjects.set(value, origin);
  }
}

export default markDataShape;
