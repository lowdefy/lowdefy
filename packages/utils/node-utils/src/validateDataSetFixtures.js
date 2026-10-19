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

// Fixture values stay as written: dates as { '~d': ... } and ObjectIds as { _oid: '<hex>' } are
// converted by the loader, not here. Document bodies are data, so only their top-level keys are
// checked for operator-looking names.
function validateDataSetFixtures({ fixtures, fail }) {
  if (type.isNone(fixtures)) return {};
  if (!type.isObject(fixtures)) {
    fail('"fixtures" should be an object keyed by connection id.');
  }
  Object.entries(fixtures).forEach(([connectionId, documents]) => {
    if (connectionId.startsWith('_')) {
      fail(`fixtures key "${connectionId}" looks like an operator; data sets are plain YAML.`);
    }
    if (!type.isArray(documents)) {
      fail(`fixtures.${connectionId} should be an array of documents.`);
    }
    documents.forEach((document, index) => {
      if (!type.isObject(document)) {
        fail(`fixtures.${connectionId}[${index}] should be an object.`);
      }
      Object.keys(document).forEach((key) => {
        if (key.startsWith('_') && key !== '_id') {
          fail(
            `fixtures.${connectionId}[${index}] key "${key}" looks like an operator; data sets are plain YAML.`
          );
        }
      });
    });
  });
  return fixtures;
}

export default validateDataSetFixtures;
