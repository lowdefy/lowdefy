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

import buildIconImports from './buildIconImports.js';
import defaultIconsDev from './defaultIconsDev.js';
import defaultIconsProd from './defaultIconsProd.js';

function buildImportClass(types) {
  return Object.entries(types).map(([typeName, type]) => ({
    originalTypeName: type.originalTypeName ?? typeName,
    package: type.package,
    typeName,
  }));
}

// Builds the import lists for the mobile client bundle — blocks, actions,
// client operators, and icons only; everything else is served by the server.
function buildImportsMobile({ components, context }) {
  // Apps without a mobile key never build the mobile bundle — write empty
  // import lists so their mobile plugin artifacts stay contentless.
  if (components.mobile?.configured !== true) {
    components.importsMobile = {
      actions: [],
      blocks: [],
      icons: [],
      operators: { client: [] },
    };
    return;
  }
  let actions;
  let blocks;
  let operatorsClient;
  if (context.stage === 'dev') {
    // Dev builds page content JIT, so types are not counted at skeleton time.
    // The mobile map only contains mobile-capable packages — import all of it
    // so JIT-resolved pages always find their types in the bundle.
    actions = buildImportClass(context.typesMapMobile.actions);
    blocks = buildImportClass(context.typesMapMobile.blocks);
    operatorsClient = buildImportClass(context.typesMapMobile.operators.client);
  } else {
    actions = buildImportClass(components.typesMobile.actions);
    blocks = buildImportClass(components.typesMobile.blocks);
    operatorsClient = buildImportClass(components.typesMobile.operators.client);
  }

  components.importsMobile = {
    actions,
    blocks,
    icons: buildIconImports({
      blocks,
      components,
      context,
      defaults: context.stage === 'dev' ? defaultIconsDev : defaultIconsProd,
      scan: {
        global: components.global,
        menus: components.mobile?.menus,
        pages: components.mobile?.pages,
      },
      iconsMap: context.typesMapMobile.icons,
    }),
    operators: {
      client: operatorsClient,
    },
  };
}

export default buildImportsMobile;
