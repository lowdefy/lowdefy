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

import readJourneyRef from './readJourneyRef.js';

// A journey file's value with every `_ref` replaced by the file it names, anywhere in it: a
// journey, a step list, one step, a case table, a stub. A referred file may refer on; `chain`
// holds the absolute paths of the files on the way, so a loop fails the file. Throws an Error
// naming the ref when one cannot be read.
function resolveJourneyRefs({ value, configDirectory, chain }) {
  if (type.isArray(value)) {
    return value.map((entry) => resolveJourneyRefs({ value: entry, configDirectory, chain }));
  }
  if (!type.isObject(value)) {
    return value;
  }
  if (Object.hasOwn(value, '_ref')) {
    if (Object.keys(value).length > 1) {
      throw new Error(
        `_ref ${JSON.stringify(value._ref)} has other keys beside it (${Object.keys(value)
          .filter((key) => key !== '_ref')
          .join(', ')}), which a journey file would drop. Move them into the referred file.`
      );
    }
    const { content, absolutePath } = readJourneyRef({
      refDefinition: value._ref,
      configDirectory,
      chain,
    });
    return resolveJourneyRefs({
      value: content,
      configDirectory,
      chain: [...chain, absolutePath],
    });
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      resolveJourneyRefs({ value: entry, configDirectory, chain }),
    ])
  );
}

export default resolveJourneyRefs;
