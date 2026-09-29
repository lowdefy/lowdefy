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
import COLUMN_KINDS from '@lowdefy/blocks-antd/table/columnKinds.js';

import normalizeProviders from './normalizeProviders.js';

const RUN_KINDS = new Set(['enrichment', 'ai']);
const DETAIL_KINDS = new Set(['enrichment', 'ai', 'extract']);
const ALL_KINDS = Object.keys(COLUMN_KINDS);

function normalizeAddColumn(addColumn) {
  if (addColumn === true) return { kinds: ALL_KINDS };
  if (type.isNone(addColumn) || addColumn === false) return null;
  if (!type.isObject(addColumn)) {
    throw new Error(
      `Table "addColumn" must be true or { kinds }. Received ${JSON.stringify(addColumn)}.`
    );
  }
  const kinds = addColumn.kinds ?? ALL_KINDS;
  if (
    !type.isArray(kinds) ||
    kinds.length === 0 ||
    kinds.some((kind) => !ALL_KINDS.includes(kind))
  ) {
    throw new Error(
      `Table "addColumn.kinds" must list column kinds from: ${ALL_KINDS.join(
        ', '
      )}. Received ${JSON.stringify(kinds)}.`
    );
  }
  return { kinds };
}

// The enrichment table config (design E3, E6): the provider catalogue, the add-column picker's
// kinds (`addColumn: true | { kinds }`), where new input columns keep their values
// (`inputFieldPrefix`: `<prefix>.<key>`, else the key), the add-row row (`addRow`, Table only: TableInput adds
// rows to its changeset), CSV import (`importCsv`), the columns with a run state (`runColumns`,
// enrichment and ai) and the columns whose cells open the details panel (`detailColumns`, plus
// extract). The columns' providers are checked against the catalogue with the columns
// (normalizeColumns `providerIds`), so a user column with an unknown one is an error column.
const FIELD_PATH = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/;

function normalizeInputFieldPrefix(prefix) {
  if (type.isNone(prefix)) return null;
  if (!type.isString(prefix) || !FIELD_PATH.test(prefix)) {
    throw new Error(
      `Table "inputFieldPrefix" must be a dot path of letters, digits, "_" or "-". Received ${JSON.stringify(
        prefix
      )}.`
    );
  }
  return prefix;
}

function normalizeEnrichment({ properties, columns }) {
  const providers = normalizeProviders(properties.providers);
  return {
    providers,
    providersById: new Map(providers.map((provider) => [provider.id, provider])),
    addColumn: normalizeAddColumn(properties.addColumn),
    addRow: properties.addRow === true,
    addRowText: type.isString(properties.addRowText) ? properties.addRowText : null,
    importCsv: properties.importCsv === true,
    inputFieldPrefix: normalizeInputFieldPrefix(properties.inputFieldPrefix),
    runColumns: columns.filter((column) => RUN_KINDS.has(column.kind)),
    detailColumns: new Set(
      columns.filter((column) => DETAIL_KINDS.has(column.kind)).map((column) => column.key)
    ),
  };
}

export default normalizeEnrichment;
