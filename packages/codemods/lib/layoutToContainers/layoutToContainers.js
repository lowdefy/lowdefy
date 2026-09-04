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

import areaToContainer from './areaToContainer.js';
import classifyChild from './classifyChild.js';
import namespaceContainerId from './namespaceContainerId.js';
import spanRunToClasses from './spanRunToClasses.js';
import { isMap, isScalar, isSeq, mapKeys, scalarValue } from './nodeHelpers.js';

const AREA_KEYS = ['direction', 'align', 'justify', 'wrap', 'gap', 'overflow'];
const CONTAINER_TYPE = { grid: 'Grid', row: 'Row', stack: 'Stack' };

// Area keys live either on the slot itself or, for the content slot, on the
// parent block's layout: — layoutParamsToArea reads both. The owner is kept so
// the key is deleted from the node it actually came from.
function readArea({ slotNode, layoutNode, isContentSlot }) {
  const area = {};
  const owners = new Map();
  AREA_KEYS.forEach((key) => {
    if (slotNode && slotNode.get(key, true) !== undefined) {
      area[key] = scalarValue(slotNode, key);
      owners.set(key, slotNode);
      return;
    }
    if (isContentSlot && layoutNode && layoutNode.get(key, true) !== undefined) {
      area[key] = scalarValue(layoutNode, key);
      owners.set(key, layoutNode);
    }
  });
  return { area, owners };
}

function mergeClass({ node, classes }) {
  if (classes.length === 0) return;
  const existing = node.get('class', true);
  const value = isScalar(existing) ? `${existing.value} ${classes.join(' ')}` : classes.join(' ');
  node.set('class', value);
}

function dropConsumedLayout({ node, consumed }) {
  if (consumed.length === 0) return;
  const layout = node.get('layout', true);
  consumed.forEach((key) => layout.delete(key));
  if (mapKeys(layout).length === 0) node.delete('layout');
}

// A run is a maximal stretch of consecutive siblings that becomes one
// container. A child with no layout: joins whatever run is open, because it
// shared the same area before the rewrite; a child the codemod refuses to
// touch closes the run so nothing is moved across it.
function buildRuns(classified) {
  const runs = [];
  let open = null;
  classified.forEach((child, index) => {
    if (child.kind === 'skip') {
      open = null;
      return;
    }
    if (child.kind === 'plain') {
      if (open) open.indexes.push(index);
      return;
    }
    if (!open || open.kind !== child.kind) {
      open = { kind: child.kind, indexes: [index] };
      runs.push(open);
    } else {
      open.indexes.push(index);
    }
  });
  return runs;
}

function applyGridClasses({ run, classified, children, report, path }) {
  const { placements, overflowed } = spanRunToClasses(
    run.indexes.map((index) => ({ span: classified[index].span, offset: classified[index].offset }))
  );
  if (overflowed) {
    report.push({
      path,
      action: 'review',
      message:
        'The offsets in this run accumulate past 24 columns, so the grid wraps where the flex row did. Check the wrap points against the rendered page.',
    });
  }
  run.indexes.forEach((index, position) => {
    const placement = placements[position];
    if (placement.unplaceable) {
      report.push({
        path: `${path}[${index}]`,
        action: 'manual',
        message: 'layout.offset + layout.span exceeds 24 columns, so no col-start places it.',
      });
      return;
    }
    mergeClass({
      node: children[index],
      classes: [...placement.classes, ...classified[index].classes],
    });
    dropConsumedLayout({ node: children[index], consumed: classified[index].consumed });
  });
}

function applyFlexClasses({ run, classified, children }) {
  run.indexes.forEach((index) => {
    mergeClass({ node: children[index], classes: classified[index].classes });
    dropConsumedLayout({ node: children[index], consumed: classified[index].consumed });
  });
}

function createContainer({ doc, id, type, properties, classes, nodes }) {
  const container = doc.createNode({ id, type });
  if (Object.keys(properties).length > 0) container.set('properties', doc.createNode(properties));
  if (classes.length > 0) container.set('class', classes.join(' '));
  const blocks = doc.createNode([]);
  nodes.forEach((node) => blocks.items.push(node));
  container.set('blocks', blocks);
  return container;
}

function rewriteSlot({
  doc,
  blockId,
  seq,
  slotNode,
  layoutNode,
  isContentSlot,
  path,
  report,
  counters,
}) {
  const children = seq.items.filter((item) => isMap(item));
  if (children.length !== seq.items.length || children.length === 0) return;

  const { area, owners } = readArea({ slotNode, layoutNode, isContentSlot });
  const isColumn = area.direction === 'column';

  if (area.direction === 'column-reverse') {
    report.push({
      path,
      action: 'manual',
      message: 'direction: column-reverse has no arrangement block. Reorder the blocks by hand.',
    });
    return;
  }

  const classified = children.map((node) => classifyChild({ node }));
  classified.forEach((child, index) => {
    if (child.kind !== 'skip') return;
    report.push({
      path: `${path}[${index}]`,
      action: child.reason.includes('operator-valued') ? 'dynamic' : 'manual',
      message: child.reason.includes('operator-valued')
        ? `${child.reason}. Dynamic: convert to class: { _if: … } by hand.`
        : child.reason,
    });
  });

  const runs = isColumn
    ? [{ kind: 'stack', indexes: children.map((_, index) => index) }]
    : buildRuns(classified);
  if (runs.length === 0) return;

  if (isColumn && classified.some((child) => child.kind === 'grid')) {
    report.push({
      path,
      action: 'review',
      message:
        'A column area with span children became a Stack; span constrained width, which a Stack does not reproduce. Add width classes if the blocks changed size.',
    });
  }

  if (typeof blockId !== 'string' || blockId === '') {
    report.push({
      path,
      action: 'manual',
      message: 'The parent block has no literal id, so a container id cannot be namespaced.',
    });
    return;
  }

  // The area's own properties only move onto a container that replaces the
  // whole area. A partial run leaves the area in place, so its keys stay.
  const wholeArea = runs.length === 1 && runs[0].indexes.length === children.length;

  // Containers are built in document order so the generated ids and the report
  // read top to bottom, and only the splices run back to front, where they
  // leave the earlier runs' indexes valid.
  const planned = runs.map((run) => {
    if (run.kind === 'grid') applyGridClasses({ run, classified, children, report, path });
    if (run.kind === 'row') applyFlexClasses({ run, classified, children });
    if (run.kind === 'stack') applyFlexClasses({ run, classified, children });

    const type = CONTAINER_TYPE[run.kind];
    const properties = run.kind === 'grid' ? { columns: 24 } : {};
    let classes = [];
    if (wholeArea) {
      const mapped = areaToContainer({ type, area });
      Object.assign(properties, mapped.properties);
      classes = mapped.classes;
      mapped.notes.forEach((note) =>
        report.push({ path, action: 'review', message: `Area ${note}.` })
      );
      owners.forEach((owner, key) => owner.delete(key));
    }

    counters[run.kind] = (counters[run.kind] ?? 0) + 1;
    const id = namespaceContainerId({
      parentId: blockId,
      kind: run.kind,
      index: counters[run.kind],
    });
    const nodes = run.indexes.map((index) => children[index]);
    const container = createContainer({ doc, id, type, properties, classes, nodes });

    report.push({
      path,
      action: 'rewrite',
      message: `Wrapped ${nodes.length} block${nodes.length === 1 ? '' : 's'} in ${type} "${id}".`,
    });
    return { run, container };
  });

  [...planned].reverse().forEach(({ run, container }) => {
    seq.items.splice(run.indexes[0], run.indexes.length, container);
  });
}

function processBlock({ doc, node, path, report }) {
  const blockId = scalarValue(node, 'id');
  const layoutNode = isMap(node.get('layout', true)) ? node.get('layout', true) : null;
  const counters = {};

  const slots = [];
  const shorthand = node.get('blocks', true);
  if (isSeq(shorthand)) {
    slots.push({ seq: shorthand, slotNode: null, isContentSlot: true, path: `${path}.blocks` });
  }
  ['areas', 'slots'].forEach((key) => {
    const group = node.get(key, true);
    if (!isMap(group)) return;
    mapKeys(group).forEach((slotKey) => {
      const slotNode = group.get(slotKey, true);
      if (!isMap(slotNode)) return;
      const seq = slotNode.get('blocks', true);
      if (!isSeq(seq)) return;
      slots.push({
        seq,
        slotNode,
        isContentSlot: slotKey === 'content',
        path: `${path}.${key}.${slotKey}.blocks`,
      });
    });
  });

  // Depth first: a child's own area is rewritten before the child is moved
  // into a container, so its layout: is already reduced when it is classified.
  slots.forEach((slot) => {
    slot.seq.items.forEach((child, index) => {
      if (isMap(child)) processBlock({ doc, node: child, path: `${slot.path}[${index}]`, report });
    });
  });

  slots.forEach((slot) => {
    rewriteSlot({
      doc,
      blockId,
      seq: slot.seq,
      slotNode: slot.slotNode,
      layoutNode,
      isContentSlot: slot.isContentSlot,
      path: slot.path,
      report,
      counters,
    });
  });

  if (layoutNode && mapKeys(layoutNode).length === 0) node.delete('layout');
}

/*
  Rewrites one parsed page document from per-block layout: to the Row, Grid and
  Stack container blocks. The document is mutated in place through the yaml
  node API, so every comment on a node the rewrite does not touch survives.

  Returns { config, report }. Nothing that cannot be rewritten faithfully is
  rewritten: operator-valued layout, responsive breakpoint objects, push/pull
  and column-reverse areas are reported for the author instead.
*/
function layoutToContainers({ config }) {
  const report = [];
  const root = config.contents;
  if (isMap(root)) processBlock({ doc: config, node: root, path: 'root', report });
  if (isSeq(root)) {
    root.items.forEach((item, index) => {
      if (isMap(item)) processBlock({ doc: config, node: item, path: `root[${index}]`, report });
    });
  }
  return { config, report };
}

export default layoutToContainers;
