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

import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';

import collectStringLeaves from './collectStringLeaves.js';

// A known string must be at least this long to be found inside a longer text,
// so a one-letter label or a "1" does not make every grid row known.
const MIN_FIND_LENGTH = 3;

function readArtifact({ buildDirectory, artifact }) {
  const filePath = path.join(buildDirectory, artifact);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Build artifact ${artifact} not found in ${buildDirectory}.`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// The known-text set: the strings that are safe to show outside the machine
// (to a policy model, in a PR comment, in a compiled expect.state), because
// they come from the app's config or the journey's own data set. It reads
// only build artifacts and a parsed data set: no dev server.
//
// Sources: the page artifacts pages/<pageId>.json for each of pageIds,
// menus.json, the default locale's messages in i18n.json, the data set's
// fixture documents and users (dataSet is parseDataSet's result, or null),
// and typed: values the walk or journey typed earlier.
//
// Returns a frozen object:
//   has(text)     true when text, trimmed, is a known string;
//   findIn(text)  the longest known string of 3 or more characters that
//                 text contains, or null (a grid row's text holds a known
//                 value among others);
//   values        the Set of known strings.
function collectKnownText({ buildDirectory, pageIds = [], dataSet = null, typed = [] }) {
  const texts = new Set();
  pageIds.forEach((pageId) => {
    collectStringLeaves({
      value: readArtifact({ buildDirectory, artifact: path.join('pages', `${pageId}.json`) }),
      texts,
    });
  });
  collectStringLeaves({ value: readArtifact({ buildDirectory, artifact: 'menus.json' }), texts });
  const i18n = readArtifact({ buildDirectory, artifact: 'i18n.json' });
  if (!type.isNone(i18n.defaultLocale)) {
    collectStringLeaves({ value: i18n.messages?.[i18n.defaultLocale], texts });
  }
  if (!type.isNone(dataSet)) {
    collectStringLeaves({ value: dataSet.fixtures, texts });
    collectStringLeaves({ value: dataSet.users, texts });
  }
  collectStringLeaves({ value: typed, texts });

  const findable = [...texts]
    .filter((text) => text.length >= MIN_FIND_LENGTH)
    .sort((a, b) => b.length - a.length);

  function has(text) {
    return type.isString(text) && texts.has(text.trim());
  }

  function findIn(text) {
    if (!type.isString(text)) return null;
    return findable.find((known) => text.includes(known)) ?? null;
  }

  return Object.freeze({ has, findIn, values: texts });
}

export default collectKnownText;
