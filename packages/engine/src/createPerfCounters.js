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

// The evaluation cost of one page, counted while the engine runs. Exists only
// when the app opted in (`lowdefy.perf`), so every call site is behind one
// property read and production allocates nothing.
//
// It answers one question: how much work does a single state change cost? One
// `update()` walks every block and parses nine expressions per block plus one
// per validation test, so `parses / updates` is the number that decides whether
// compiling operators to closures is worth building.
function createPerfCounters() {
  const byKind = {};
  const blocks = {};
  const updateMs = [];
  const totals = {
    updates: 0,
    blockVisits: 0,
    parses: 0,
    copyNodes: 0,
  };

  function countUpdate(ms) {
    totals.updates += 1;
    updateMs.push(ms);
  }

  function countBlockVisit() {
    totals.blockVisits += 1;
  }

  function countParse(kind) {
    totals.parses += 1;
    byKind[kind] = (byKind[kind] ?? 0) + 1;
  }

  // The walk the parser does per call: `serializer.copy` visits every node of
  // the input, which is the cost the closure work would remove.
  function countCopy({ location, ms, nodes }) {
    totals.copyNodes += nodes;
    const block = blocks[location] ?? { parses: 0, ms: 0, nodes: 0 };
    block.parses += 1;
    block.ms += ms;
    block.nodes += nodes;
    blocks[location] = block;
  }

  function reset() {
    totals.updates = 0;
    totals.blockVisits = 0;
    totals.parses = 0;
    totals.copyNodes = 0;
    updateMs.length = 0;
    Object.keys(byKind).forEach((kind) => delete byKind[kind]);
    Object.keys(blocks).forEach((location) => delete blocks[location]);
  }

  // Plain data only — a snapshot crosses the browser boundary to the dev
  // server's measure tool, so nothing here may be a function or a Date.
  function snapshot() {
    return {
      updates: totals.updates,
      blockVisits: totals.blockVisits,
      parses: { total: totals.parses, byKind: { ...byKind } },
      copyNodes: totals.copyNodes,
      updateMs: [...updateMs],
      blockCosts: Object.keys(blocks).map((location) => ({
        blockId: location,
        parses: blocks[location].parses,
        ms: blocks[location].ms,
        nodes: blocks[location].nodes,
      })),
    };
  }

  return { countUpdate, countBlockVisit, countParse, countCopy, reset, snapshot };
}

export default createPerfCounters;
