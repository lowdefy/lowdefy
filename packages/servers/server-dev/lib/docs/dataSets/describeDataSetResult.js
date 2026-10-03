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

const DAY_MS = 24 * 60 * 60 * 1000;

// The `data` a journey result carries: which data set it ran on, how long the load took, and the
// snapshot's age and size (null for a fixtures-only data set), which lowdefy test prints.
function describeDataSetResult({ dataSet, loadMs, now = Date.now() }) {
  if (type.isNone(dataSet.snapshot)) {
    return { name: dataSet.name, loadMs, snapshot: null };
  }
  const { pulledAt, collections } = dataSet.snapshot;
  const documents = Object.values(collections ?? {}).reduce(
    (sum, collection) => sum + (collection.count ?? 0),
    0
  );
  return {
    name: dataSet.name,
    loadMs,
    snapshot: {
      pulledAt,
      ageDays: Math.floor((now - Date.parse(pulledAt)) / DAY_MS),
      documents,
    },
  };
}

export default describeDataSetResult;
