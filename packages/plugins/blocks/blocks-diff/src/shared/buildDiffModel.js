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

import diff from 'microdiff';
import { type } from '@lowdefy/helpers';

import breadcrumbLabel from './breadcrumbLabel.js';
import { CHANGE_TYPES, GROUP_ROOT } from './constants.js';
import {
  getValueAtPath,
  matchesPath,
  pathLabel,
  pathToString,
  resolveFormatter,
} from './pathUtils.js';

const MICRODIFF_TYPE_MAP = {
  CREATE: CHANGE_TYPES.CREATE,
  REMOVE: CHANGE_TYPES.REMOVE,
  CHANGE: CHANGE_TYPES.CHANGE,
};

// microdiff only accepts objects or arrays. Anything else (null, primitive)
// becomes an empty object so "before was nothing" still produces a clean diff.
function toInput(value) {
  if (type.isArray(value)) return value;
  if (type.isObject(value)) return value;
  return {};
}

function enrichChange(entry, { labels, format }) {
  const pathStr = pathToString(entry.path);
  const mappedType = MICRODIFF_TYPE_MAP[entry.type] ?? CHANGE_TYPES.CHANGE;
  let formatter = resolveFormatter(pathStr, format);
  if (
    type.isNone(formatter) &&
    mappedType === CHANGE_TYPES.CHANGE &&
    (type.isArray(entry.value) || type.isObject(entry.value))
  ) {
    formatter = { type: 'json' };
  }
  return {
    type: mappedType,
    path: entry.path.slice(),
    pathStr,
    displayPath: pathToString(entry.path, { display: true }),
    label: pathLabel(entry.path, labels),
    oldValue: entry.type === 'CREATE' ? undefined : entry.oldValue,
    newValue: entry.type === 'REMOVE' ? undefined : entry.value,
    formatter,
    depth: entry.path.length,
    breadcrumb: breadcrumbLabel(entry.path, labels),
  };
}

function collectLeafPaths(value, basePath, collected, visited) {
  if (type.isArray(value) || type.isObject(value)) {
    if (visited.has(value)) return;
    visited.add(value);
    const keys = type.isArray(value) ? value.map((_, i) => i) : Object.keys(value);
    if (keys.length === 0) {
      collected.push(basePath.slice());
      return;
    }
    keys.forEach((key) => {
      collectLeafPaths(value[key], basePath.concat(key), collected, visited);
    });
    return;
  }
  collected.push(basePath.slice());
}

function synthesiseUnchanged({ before, after, existingPathSet, labels, format }) {
  const leafPaths = [];
  collectLeafPaths(after, [], leafPaths, new WeakSet());
  collectLeafPaths(before, [], leafPaths, new WeakSet());
  const seen = new Set();
  const results = [];
  leafPaths.forEach((path) => {
    const pathStr = pathToString(path);
    if (!pathStr || seen.has(pathStr) || existingPathSet.has(pathStr)) return;
    seen.add(pathStr);
    const beforeVal = getValueAtPath(before, path);
    const afterVal = getValueAtPath(after, path);
    if (beforeVal === afterVal || JSON.stringify(beforeVal) === JSON.stringify(afterVal)) {
      results.push({
        type: CHANGE_TYPES.UNCHANGED,
        path: path.slice(),
        pathStr,
        displayPath: pathToString(path, { display: true }),
        label: pathLabel(path, labels),
        oldValue: beforeVal,
        newValue: afterVal,
        formatter: resolveFormatter(pathStr, format),
        depth: path.length,
        breadcrumb: breadcrumbLabel(path, labels),
      });
    }
  });
  return results;
}

function applyFilters(changes, { hide, show }) {
  let filtered = changes;
  if (type.isArray(show) && show.length > 0) {
    filtered = filtered.filter((change) => matchesPath(change.pathStr, show));
  }
  if (type.isArray(hide) && hide.length > 0) {
    filtered = filtered.filter((change) => !matchesPath(change.pathStr, hide));
  }
  return filtered;
}

function summariseGroup(changes) {
  const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  let hasArrayIndices = false;
  changes.forEach((change) => {
    if (change.type === CHANGE_TYPES.CREATE) summary.added += 1;
    else if (change.type === CHANGE_TYPES.REMOVE) summary.removed += 1;
    else if (change.type === CHANGE_TYPES.CHANGE) summary.changed += 1;
    else if (change.type === CHANGE_TYPES.UNCHANGED) summary.unchanged += 1;
    if (change.path.length > 1 && /^\d+$/.test(String(change.path[1]))) {
      hasArrayIndices = true;
    }
  });
  return { ...summary, hasArrayIndices };
}

function groupChanges(changes, { groupByRoot }) {
  if (!groupByRoot) {
    return [
      {
        key: GROUP_ROOT,
        label: '',
        changes,
        summary: summariseGroup(changes),
      },
    ];
  }
  const byKey = new Map();
  changes.forEach((change) => {
    const key = change.path.length <= 1 ? GROUP_ROOT : String(change.path[0]);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(change);
  });
  return Array.from(byKey.entries()).map(([key, groupChangesList]) => ({
    key,
    label: key === GROUP_ROOT ? '' : key,
    changes: groupChangesList,
    summary: summariseGroup(groupChangesList),
  }));
}

function collapseDeep(raw, { maxDepth, before, after }) {
  if (!type.isInt(maxDepth) || maxDepth < 1) return raw;
  const passthrough = [];
  const bucketOrder = [];
  const buckets = new Map();
  raw.forEach((entry) => {
    if (!type.isArray(entry.path) || entry.path.length <= maxDepth) {
      passthrough.push(entry);
      return;
    }
    const parent = entry.path.slice(0, maxDepth);
    const key = parent.join('.');
    if (!buckets.has(key)) {
      buckets.set(key, parent);
      bucketOrder.push(key);
    }
  });
  const collapsed = [];
  bucketOrder.forEach((key) => {
    const parent = buckets.get(key);
    const oldValue = getValueAtPath(before, parent);
    const newValue = getValueAtPath(after, parent);
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    collapsed.push({
      type: 'CHANGE',
      path: parent,
      oldValue,
      value: newValue,
    });
  });
  return passthrough.concat(collapsed);
}

function buildDiffModel({ before, after, options = {} }) {
  const {
    labels,
    hide,
    show,
    format,
    showUnchanged = false,
    groupByRoot = true,
    maxDepth = 4,
  } = options;

  const safeBefore = toInput(before);
  const safeAfter = toInput(after);
  const rawChanges = diff(safeBefore, safeAfter);
  const collapsedRaw = collapseDeep(rawChanges, {
    maxDepth,
    before: safeBefore,
    after: safeAfter,
  });

  const enriched = collapsedRaw.map((entry) => enrichChange(entry, { labels, format }));
  const changePathSet = new Set(enriched.map((change) => change.pathStr));

  let allChanges = enriched;
  if (showUnchanged) {
    const unchanged = synthesiseUnchanged({
      before: safeBefore,
      after: safeAfter,
      existingPathSet: changePathSet,
      labels,
      format,
    });
    allChanges = allChanges.concat(unchanged);
  }

  const filtered = applyFilters(allChanges, { hide, show });
  const groups = groupChanges(filtered, { groupByRoot });

  const hasMeaningfulChanges = filtered.some((change) => change.type !== CHANGE_TYPES.UNCHANGED);

  return {
    groups,
    empty: !hasMeaningfulChanges && filtered.length === 0,
    total: filtered.length,
  };
}

export default buildDiffModel;
