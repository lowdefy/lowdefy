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

import createFeatureSet from './createFeatureSet.js';
import createMethodStubs from './createMethodStubs.js';
import features from '../features/index.js';
import loadOptionalFeature from './loadOptionalFeature.js';

const sets = new Map();

// The feature set a table renders with (`TableRoot`'s `features`, then `api.features`): the
// always-on features and the optional ones its config needs (editing, server mode, group rows,
// trees, expandable rows, the toolbar, saved views), in registry order. Until the needed chunks
// have loaded this suspends, so the lazy block's fallback stays up and its methods are registered
// only once the whole table is there. Sets are shared by signature (the needed optional names);
// the table remounts when its signature changes (Table.lazy keys TableRoot on it).
function useFeatureSet({ content, input, properties, rowWindowStrategy }) {
  const context = { content, input: input === true, properties, rowWindowStrategy };
  const needed = features.filter((entry) => entry.optional && entry.needs(context));
  const signature = needed.map((entry) => entry.name).join(',');
  const existing = sets.get(signature);
  if (existing !== undefined) return existing;
  const records = needed.map(loadOptionalFeature);
  const failed = records.find((record) => record.error !== null);
  if (failed) throw failed.error;
  const pending = records.filter((record) => record.feature === null);
  if (pending.length > 0) throw Promise.all(pending.map((record) => record.promise));
  const list = features.map((entry) => {
    if (!entry.optional) return entry;
    const index = needed.indexOf(entry);
    return index === -1 ? createMethodStubs(entry) : records[index].feature;
  });
  const set = { ...createFeatureSet(list), signature };
  sets.set(signature, set);
  return set;
}

export default useFeatureSet;
