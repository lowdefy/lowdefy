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

import HeadlessStepError from '../HeadlessStepError.js';
import pollUntil from '../pollUntil.js';
import readShownBlock from '../readShownBlock.js';
import readStandInState from '../readStandInState.js';
import describeBlock from './describeBlock.js';
import findGridColumn from './findGridColumn.js';
import findGridRow from './findGridRow.js';
import findOneControl from './findOneControl.js';
import matchGridRows from './matchGridRows.js';
import refuseGeneratedRowKey from './refuseGeneratedRowKey.js';

// The click and expect parts of a grid block's stand-in (AgGrid, Table). `fix` says how to give
// the grid's rows keys of their own, for a refused generated key or a missing one. The grid's own
// readGrid({ actor, block, state }) reads the block as its component draws it:
// - browserOnly: why the rows a person sees can differ from the data, or the grid keeps state the
//   stand-in does not model (a sort, a filter, pagination...), else null: the step is the
//   browser's.
// - rows: [{ row, key, index }], the block's data with each row's key (null for a key the grid
//   generates) and its index in the data, which is the displayed index on every grid a stand-in
//   covers.
// - columns: the shown columns, in display order, each { id, ... }: id is what `column` names.
// - columnBrowserOnly({ column, entry }): why the column's cell in the row is the browser's (a
//   link or input cell, an html cell holding a link), else null, or a promise of either.
// - listControls({ column, entry }): the controls the cell draws for the row, in order, hidden ones
//   left out: { kind, key, disabled, click() }. A cell menu's trigger comes first (kind trigger,
//   no key), then its items.
// - clickCell({ column, entry }): a click on the cell itself (onCellClick, onRowClick, a row link).

function describeTarget(target) {
  const parts = [`block "${target.blockId}"`, `row key "${target.rowKey}"`];
  if (!type.isUndefined(target.column)) {
    parts.push(`column "${target.column}"`);
  }
  return parts.join(' ');
}

function refuseDisabledControl({ block, control, entry }) {
  if (control.disabled !== true) {
    return;
  }
  const description = describeBlock(block);
  const what = type.isNone(control.key) ? `The ${control.kind}` : `Control "${control.key}"`;
  throw new HeadlessStepError(`${what} in row "${entry.key}" of ${description} is disabled.`, {
    actual: 'disabled',
    expected: `an enabled ${control.kind} in ${description}`,
  });
}

async function pushColumnBrowserOnly({ actor, column, entry, grid }) {
  const reason = await grid.columnBrowserOnly({ column, entry });
  if (reason === null) {
    return false;
  }
  actor.browserOnly.push(reason);
  return true;
}

// A control target: the one control keyed `control` among the cells of the named row (every row
// without rowKey) and column (every shown column without one), as the browser clicks only a single
// visible match. A closed cell menu opens first in the browser; it fires nothing.
async function clickControl({ actor, block, entries, grid, target }) {
  const columns = type.isUndefined(target.column)
    ? grid.columns
    : [findGridColumn({ block, grid, column: target.column })];
  const controls = entries.flatMap((entry) =>
    columns.flatMap((column) =>
      grid
        .listControls({ column, entry })
        .filter((control) => !type.isNone(control.key))
        .map((control) => ({ ...control, key: String(control.key), column, entry }))
    )
  );
  const control = findOneControl({
    block,
    control: String(target.control),
    controls,
    noun: 'control',
  });
  if (await pushColumnBrowserOnly({ actor, column: control.column, entry: control.entry, grid })) {
    return;
  }
  refuseDisabledControl({ block, control, entry: control.entry });
  control.click();
}

// A row or cell target: the browser clicks the first control in the cell (a button, a switch, a
// cell menu's trigger), or the cell itself when it has none.
async function clickRowCell({ actor, block, entry, grid, target }) {
  const column = findGridColumn({ block, grid, column: target.column });
  if (await pushColumnBrowserOnly({ actor, column, entry, grid })) {
    return;
  }
  const [first] = grid.listControls({ column, entry });
  if (type.isUndefined(first)) {
    grid.clickCell({ column, entry });
    return;
  }
  // The trigger opens the cell's menu, which fires no event.
  if (first.kind === 'trigger') {
    return;
  }
  refuseDisabledControl({ block, control: first, entry });
  first.click();
}

function createGridStandIn({ fix, readGrid }) {
  // A click with rowKey, control or both. The step runner waits for the block to show.
  async function click({ actor, block, state, target }) {
    const grid = readGrid({ actor, block, state });
    if (grid.browserOnly !== null) {
      actor.browserOnly.push(grid.browserOnly);
      return;
    }
    let entries = grid.rows;
    if (!type.isUndefined(target.rowKey)) {
      refuseGeneratedRowKey({ block, fix, rowKey: target.rowKey });
      entries = [findGridRow({ block, fix, grid, rowKey: target.rowKey })];
    }
    if (!type.isUndefined(target.control)) {
      await clickControl({ actor, block, entries, grid, target });
      return;
    }
    await clickRowCell({ actor, block, entry: entries[0], grid, target });
  }

  // expect.visible or expect.hidden on a row by key (and a column): the block shows, the row is in
  // its data and the column is shown. The step runner does not wait for the block, so the check
  // reads whether it shows, as the browser waits up to `timeout` ms.
  async function expect({ actor, block, kind, target, timeout }) {
    if (!type.isUndefined(target.control)) {
      actor.browserOnly.push(
        `expect.${kind} on a control of ${describeBlock(block)}: the headless stand-in reads a grid's rows, not its cell controls, so the step runs in a browser.`
      );
      return;
    }
    refuseGeneratedRowKey({ block, fix, rowKey: target.rowKey });
    const shown = kind === 'visible';
    const read = () => {
      const current = readShownBlock({ actor, blockId: target.blockId });
      if (current === null) {
        return { count: 0 };
      }
      const grid = readGrid({
        actor,
        block: current,
        state: readStandInState({ actor, block: current }),
      });
      if (grid.browserOnly !== null) {
        return { browserOnly: grid.browserOnly };
      }
      const columnShown =
        type.isUndefined(target.column) ||
        grid.columns.some((column) => column.id === String(target.column));
      return {
        count: columnShown ? matchGridRows({ rows: grid.rows, rowKey: target.rowKey }).length : 0,
      };
    };
    const { held, value } = await pollUntil({
      check: (read) =>
        !type.isUndefined(read.browserOnly) || (shown ? read.count > 0 : read.count === 0),
      read,
      timeout,
    });
    if (!type.isUndefined(value.browserOnly)) {
      actor.browserOnly.push(value.browserOnly);
      return;
    }
    const description = `${describeTarget(target)} to be ${kind}`;
    if (!held) {
      throw new HeadlessStepError(`Expected ${description}.`, {
        actual: shown ? 'not visible' : 'visible',
        expected: description,
      });
    }
    if (value.count > 1) {
      throw new HeadlessStepError(
        `Expected ${description}, and matched ${value.count} rows with key "${target.rowKey}"; a row key names one row, so give each row its own key.`,
        { actual: `${value.count} rows`, expected: `exactly one row with key "${target.rowKey}"` }
      );
    }
  }

  return { click, expect };
}

export default createGridStandIn;
