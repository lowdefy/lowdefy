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

import basicTypes from '@lowdefy/blocks-basic/types';
import loaderTypes from '@lowdefy/blocks-loaders/types';
import buildTypeClass from '../utils/buildTypeClass.js';

// Builds the type stores for the mobile client bundle. Only client-side type
// classes are per-target — server-side classes (requests, connections, server
// operators) from mobile pages are counted into the shared counters and land
// in components.types (see createContext).
function buildTypesMobile({ components, context }) {
  const { typeCountersMobile } = context;

  // Add Mandatory Types
  // Add operators used by form validation
  typeCountersMobile.operators.client.increment('_not');
  typeCountersMobile.operators.client.increment('_type');
  // Add loaders and basic
  basicTypes.blocks.forEach((block) => typeCountersMobile.blocks.increment(block));
  loaderTypes.blocks.forEach((block) => typeCountersMobile.blocks.increment(block));
  // Used for DisplayMessage in @lowdefy/client — resolves to the Toast-based
  // Message block in @lowdefy/blocks-antd-mobile.
  typeCountersMobile.blocks.increment('Message');

  components.typesMobile = {
    actions: {},
    blocks: {},
    operators: {
      client: {},
    },
  };

  buildTypeClass(context, {
    counter: typeCountersMobile.actions,
    definitions: context.typesMapMobile.actions,
    store: components.typesMobile.actions,
    typeClass: 'Action',
  });

  buildTypeClass(context, {
    counter: typeCountersMobile.blocks,
    definitions: context.typesMapMobile.blocks,
    store: components.typesMobile.blocks,
    typeClass: 'Block',
  });

  buildTypeClass(context, {
    counter: typeCountersMobile.operators.client,
    definitions: context.typesMapMobile.operators.client,
    store: components.typesMobile.operators.client,
    typeClass: 'Operator',
    warnIfMissing: true,
  });
}

export default buildTypesMobile;
