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

import React, { useMemo, useState } from 'react';

import collectRawColumns from '../editing/collectRawColumns.js';
import countRunStates from './countRunStates.js';
import EnrichmentLayer from './EnrichmentLayer.js';
import NewRow from './NewRow.js';
import readServerRunCounts from './readServerRunCounts.js';
import RunRowCell from './RunRowCell.js';
import AddColumnHeader from './AddColumnHeader.js';
import TRAILING_COLUMN_KEY from './trailingColumnKey.js';
import TRAILING_COLUMN_WIDTH from './trailingColumnWidth.js';

import './enrichment.css';

const EMPTY = [];
const INITIAL_UI = {
  deleting: null,
  details: null,
  importing: null,
  notice: null,
  picker: null,
  renaming: null,
};

// Block-level enrichment fragment. It owns the UI state (overlays, rename, notice), the raw
// column configs event payloads carry, and the header chips' run counts (over the rows TanStack
// sees; in server mode the response's `aggregates` when it counts them). It adds the trailing
// column (the "+" header, the rows' run buttons) and, under the grid, the overlay layer and
// Table's "+ New row". Nothing mounts for a table without enrichment config or columns.
function useEnrichment({ api, config, data }) {
  const { enrichment } = api;
  const [ui, setUi] = useState(INITIAL_UI);
  enrichment.ui = ui;
  enrichment.setUi = setUi;
  const settings = config.enrichment;
  enrichment.rawColumns = useMemo(
    () => collectRawColumns({ columns: api.properties.columns }),
    [config]
  );
  const aggregates = api.serverStore ? api.serverStore.getAggregates() : null;
  enrichment.counts = useMemo(() => {
    const counts = new Map();
    settings.runColumns.forEach((column) => {
      counts.set(
        column.key,
        readServerRunCounts({ aggregates, key: column.key }) ??
          countRunStates({ rows: data, column })
      );
    });
    return counts;
  }, [settings, data, aggregates]);

  const showAdd = Boolean(settings.addColumn);
  const showRunRow = Boolean(api.events.onRowRun) && settings.runColumns.length > 0;
  const trailingColumns = useMemo(() => {
    if (!showAdd && !showRunRow) return EMPTY;
    return [
      {
        key: TRAILING_COLUMN_KEY,
        special: 'enrich',
        cellClassName: 'lf-enrich-trailing',
        width: TRAILING_COLUMN_WIDTH,
        Header: AddColumnHeader,
        Cell: RunRowCell,
      },
    ];
  }, [showAdd, showRunRow]);

  const showNewRow = settings.addRow && !api.input;
  const hasOverlay = Object.values(ui).some((entry) => entry !== null);
  if (!hasOverlay && !showNewRow) return { trailingColumns };
  return {
    trailingColumns,
    regions: {
      bottom: (
        <>
          {showNewRow ? <NewRow api={api} /> : null}
          {hasOverlay ? <EnrichmentLayer api={api} ui={ui} /> : null}
        </>
      ),
    },
  };
}

export default useEnrichment;
