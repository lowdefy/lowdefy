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

import crypto from 'crypto';

import mandatoryClientTypes from '../mandatoryClientTypes.js';

const CATEGORIES = ['actions', 'blocks', 'operators'];

function getTypeDefinitions({ components, category }) {
  if (category === 'operators') {
    return components.types.operators.client;
  }
  return components.types[category];
}

// Page building recorded the client types each page uses (createPageTypeCounters).
// Pages with the same type set share one module, keyed by a hash of the set, so
// the public registry never lists page ids.
function buildPageTypes({ components, context }) {
  components.pageTypes = {};
  components.pageTypeSets = {};
  (components.pages ?? []).forEach((page) => {
    const pageCounters = context.pageTypeCounters.get(page.pageId);
    const typeSet = {};
    const imports = {};
    CATEGORIES.forEach((category) => {
      const definitions = getTypeDefinitions({ components, category });
      const names = new Set([
        ...mandatoryClientTypes[category],
        ...Object.keys(pageCounters[category].getCounts()),
      ]);
      // Operators counted but not installed stay data at runtime, as in the
      // app-wide barrel (buildTypes warns about them).
      typeSet[category] = [...names].filter((name) => definitions[name]).sort();
      imports[category] = typeSet[category].map((typeName) => ({
        originalTypeName: definitions[typeName].originalTypeName,
        package: definitions[typeName].package,
        typeName,
      }));
    });
    const typesKey = crypto
      .createHash('sha256')
      .update(JSON.stringify(typeSet))
      .digest('hex')
      .slice(0, 12);
    page.typesKey = typesKey;
    components.pageTypes[typesKey] = imports;
    components.pageTypeSets[page.pageId] = typeSet;
  });
  return components;
}

export default buildPageTypes;
