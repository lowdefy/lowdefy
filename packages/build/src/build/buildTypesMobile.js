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

import buildTypeClass from '../utils/buildTypeClass.js';
import mandatoryClientTypesMobile from './mandatoryClientTypesMobile.js';

// validateNativePageTypes already failed the build for each block and action
// type a mobile page uses that the native map lacks, naming the page and
// block, so the store takes the defined types only.
function buildNativeTypeClass({ counter, definitions, store }) {
  Object.entries(counter.getCounts()).forEach(([typeName, count]) => {
    if (!definitions[typeName]) {
      return;
    }
    store[typeName] = {
      originalTypeName: definitions[typeName].originalTypeName ?? typeName,
      package: definitions[typeName].package,
      version: definitions[typeName].version,
      count,
    };
  });
}

// The client types of mobile and shared pages, resolved against the native
// types map. Kept on the context, not components, so an app without mobile
// pages builds exactly the components it did before.
function buildTypesMobile({ components, context }) {
  const { typeCountersMobile, typesMapMobile } = context;
  const hasMobilePages = (components.pages ?? []).some(
    (page) => page.target === 'mobile' || page.target === 'both'
  );
  if (hasMobilePages) {
    mandatoryClientTypesMobile.actions.forEach((action) =>
      typeCountersMobile.actions.increment(action)
    );
    mandatoryClientTypesMobile.blocks.forEach((block) =>
      typeCountersMobile.blocks.increment(block)
    );
    mandatoryClientTypesMobile.operators.forEach((operator) =>
      typeCountersMobile.operators.client.increment(operator)
    );
  }

  context.typesMobile = {
    actions: {},
    blocks: {},
    operators: {
      client: {},
    },
  };

  buildNativeTypeClass({
    counter: typeCountersMobile.actions,
    definitions: typesMapMobile.actions,
    store: context.typesMobile.actions,
  });

  buildNativeTypeClass({
    counter: typeCountersMobile.blocks,
    definitions: typesMapMobile.blocks,
    store: context.typesMobile.blocks,
  });

  buildTypeClass(context, {
    counter: typeCountersMobile.operators.client,
    definitions: typesMapMobile.operators.client,
    store: context.typesMobile.operators.client,
    typeClass: 'Operator',
    warnIfMissing: true,
  });
}

export default buildTypesMobile;
