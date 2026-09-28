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

import React, { useMemo, useRef, useState } from 'react';
import { Button } from 'antd';
import normalizeOptions from '@lowdefy/blocks-antd/table/normalizeOptions.js';

import buildColumnFilter from './buildColumnFilter.js';
import ChoiceFilter from './ChoiceFilter.js';
import DateFilter from './DateFilter.js';
import FilterBuilder from './FilterBuilder.js';
import getColumnConditions from './getColumnConditions.js';
import getDistinctOptions from './getDistinctOptions.js';
import getFilterKind from './getFilterKind.js';
import getPlainTitle from './getPlainTitle.js';
import getTopLevelConditions from './getTopLevelConditions.js';
import NumberFilter from './NumberFilter.js';
import OptionsFilter from './OptionsFilter.js';
import parseColumnFilter from './parseColumnFilter.js';
import TextFilter from './TextFilter.js';
import useSyncedState from './useSyncedState.js';

function booleanChoices(column) {
  return [
    { value: 'any', label: 'Any' },
    { value: 'isTrue', label: column.cell?.trueLabel ?? 'Yes' },
    { value: 'isFalse', label: column.cell?.falseLabel ?? 'No' },
  ];
}

const PRESENCE_CHOICES = [
  { value: 'any', label: 'Any' },
  { value: 'notEmpty', label: 'Not empty' },
  { value: 'empty', label: 'Empty' },
];

function SimpleEditor({ api, column, kind, state, onChange }) {
  const options = useMemo(() => {
    if (kind !== 'options') return null;
    return (
      normalizeOptions(column.options) ??
      getDistinctOptions({ rows: api.table.getCoreRowModel().rows, column })
    );
  }, [kind, column]);
  switch (kind) {
    case 'options':
      return (
        <OptionsFilter
          onChange={(selected) => onChange({ selected })}
          options={options}
          selected={state.selected}
        />
      );
    case 'text':
      return <TextFilter onChange={onChange} state={state} />;
    case 'number':
      return <NumberFilter onChange={onChange} state={state} />;
    case 'date':
      return <DateFilter column={column} onChange={onChange} state={state} />;
    case 'boolean':
      return <ChoiceFilter choices={booleanChoices(column)} onChange={onChange} state={state} />;
    default:
      return <ChoiceFilter choices={PRESENCE_CHOICES} onChange={onChange} state={state} />;
  }
}

// The column filter popover body: a simple editor for the column's type, or the filter builder
// (limited to this column) for anything the simple editor cannot express. Either writes the
// column's conditions into `view.filter`, replacing the ones it had.
function ColumnFilter({ api, column }) {
  const kind = getFilterKind(column);
  const [conditions, setConditions] = useSyncedState({
    value: getColumnConditions({ filter: api.state.filter, key: column.key }),
    onChange: (next) =>
      api.actions.updateColumnFilter({ key: column.key, condition: { and: next } }),
  });
  const simple = parseColumnFilter({ kind, conditions });
  const [advanced, setAdvanced] = useState(simple === null);
  const showAdvanced = advanced || simple === null;

  // The builder gets back the condition it last wrote while that still says the same thing, so
  // its own grouping (a root `or`, a single nested group) is not reshaped into a top-level `and`.
  const builderCondition = useRef(null);
  if (
    builderCondition.current === null ||
    JSON.stringify(getTopLevelConditions(builderCondition.current)) !== JSON.stringify(conditions)
  ) {
    builderCondition.current = conditions.length ? { and: conditions } : null;
  }

  function write(condition) {
    setConditions(getTopLevelConditions(condition));
  }

  function writeFromBuilder(condition) {
    builderCondition.current = condition;
    write(condition);
  }

  return (
    <div
      className="lf-table-column-filter"
      data-col-key={column.key}
      data-lf-column-filter=""
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        api.actions.closeColumnFilter({ restoreFocus: true });
      }}
    >
      <div className="lf-table-overlay-title">{getPlainTitle(column)}</div>
      {showAdvanced ? (
        <FilterBuilder
          columns={[column]}
          condition={builderCondition.current}
          onChange={writeFromBuilder}
          user={api.config.user}
        />
      ) : (
        <SimpleEditor
          api={api}
          column={column}
          kind={kind}
          onChange={(next) => write(buildColumnFilter({ kind, key: column.key, state: next }))}
          state={simple}
        />
      )}
      <div className="lf-table-overlay-footer">
        <Button
          disabled={showAdvanced && simple === null}
          onClick={() => setAdvanced(!showAdvanced)}
          size="small"
          type="link"
        >
          {showAdvanced ? 'Simple' : 'Advanced'}
        </Button>
        <Button disabled={conditions.length === 0} onClick={() => write(null)} size="small">
          Clear
        </Button>
      </div>
    </div>
  );
}

export default ColumnFilter;
