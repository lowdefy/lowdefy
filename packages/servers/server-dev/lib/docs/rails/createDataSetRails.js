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
import { normaliseBlockId } from '@lowdefy/node-utils';

import findAuthActionBlocks from './findAuthActionBlocks.js';
import findExternalBlocks from './findExternalBlocks.js';

// A list item's block (`rows.2.delete`) is listed by its template id
// (`rows.$.delete`).
function findListed({ blocks, blockId }) {
  const normalised = normaliseBlockId(blockId);
  const listed = Object.keys(blocks).find((id) => normaliseBlockId(id) === normalised);
  return type.isUndefined(listed) ? undefined : blocks[listed];
}

// What the connection's type declares, as the author would fix it.
function describeDeclaration({ type: connectionType, dataSet }) {
  if (type.isNone(connectionType)) return 'no connection artifact';
  if (type.isNone(dataSet)) return `${connectionType}, no dataSet declaration`;
  return `${connectionType}, dataSet: ${dataSet}`;
}

function describeReason({ dataSet }) {
  if (dataSet === 'external') return 'which reaches a real service';
  return 'which a data set cannot redirect';
}

function describeConnection(connection) {
  return `"${connection.connectionId}" (${describeDeclaration(connection)})`;
}

// The rails of a data-set journey run: a click on a block whose events reach a
// connection whose type declares meta.dataSet 'external', declares nothing, or
// has no artifact would reach a real service or be refused by the gate, and
// one on a block that runs an auth-engine action fails for a harness reason
// (the journey's callers are injected and have no auth session). Declarations
// are read from connections, the plugin connection map the gate reads.
// refusal({ pageId, blockId }) says why such a click is refused, or null when
// the block may be clicked. Each page's lists are read from the build once per
// run.
function createDataSetRails({ buildDirectory, connections }) {
  const pages = new Map();
  function readPage(pageId) {
    if (!pages.has(pageId)) {
      pages.set(pageId, {
        external: findExternalBlocks({ buildDirectory, pageId, connections }).blocks,
        auth: findAuthActionBlocks({ buildDirectory, pageId }),
      });
    }
    return pages.get(pageId);
  }
  function refusal({ pageId, blockId }) {
    const { external, auth } = readPage(pageId);
    const refused = findListed({ blocks: external, blockId });
    if (!type.isUndefined(refused)) {
      const reasons = refused
        .map(
          (connection) =>
            `connection ${describeConnection(connection)}, ${describeReason(connection)}`
        )
        .join(', and ');
      const named = refused.map(describeConnection).join(', ');
      return {
        message: `Block "${blockId}" reaches ${reasons}, so a data-set journey cannot click it.`,
        actual: `a click that reaches connection ${named}`,
      };
    }
    const actions = findListed({ blocks: auth, blockId });
    if (!type.isUndefined(actions)) {
      return {
        message: `Block "${blockId}" runs the auth action ${actions.join(
          ', '
        )}, so a data-set journey cannot click it: its users are injected and have no auth session.`,
        actual: `a click that runs the auth action ${actions.join(', ')}`,
      };
    }
    return null;
  }
  return { refusal };
}

export default createDataSetRails;
