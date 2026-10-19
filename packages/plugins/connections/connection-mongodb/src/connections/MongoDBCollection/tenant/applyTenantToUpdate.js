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

import { ConfigError } from '@lowdefy/errors';

import assertTenantPathNotAuthored from './assertTenantPathNotAuthored.js';

// Guard and stamp an update document on a tenant connection.
//
// The update selector is walled (applyTenantToFilter), but MongoDB applies
// the update document as authored - so authoring the tenant field in an
// update is the one write-escape the wall must reject outright: a $set could
// reassign an owned row into another tenant. Reads of the field elsewhere are
// fine; this scan covers only the update document.
//
// The scan is over document PATHS, not values. In { $set: { messages: [...] } }
// the path is `messages`; whatever the array holds is data, and a nested
// "organization_id" key in it (a stored tool result, a snapshot of another
// document) is not a write to the tenant field. Only a top-level key of an
// operator's argument - the field itself or a dotted path rooted in it - can
// move the row across the wall.
//
// Object-form updates ({ $set: ..., $inc: ... }):
// - the tenant field rejected as a path in every operator's argument,
//   including $unset and $setOnInsert; $rename's value side is checked too.
// - on upsert, the tenant field is added to $setOnInsert as belt-and-braces
//   alongside the merged filter equality that MongoDB extracts into the
//   upserted document.
//
// Pipeline-form updates ([{ $set: ... }, ...]):
// - the tenant field rejected as a path in every stage's argument ($set,
//   $addFields, $project, $replaceRoot's newRoot, $replaceWith); $unset's
//   string and array forms are checked too (a key scan alone would miss them).
// - a final { $set: { <field>: <value> } } stage is appended. This restamps
//   the field unconditionally, which covers the two shapes a key scan cannot:
//   a $replaceRoot/$replaceWith that omits the field (the row would fall
//   outside every walled read), and pipeline upserts, where $setOnInsert does
//   not exist.
function assertUnsetDoesNotDropTenantField({ stage, field }) {
  const unset = stage.$unset;
  if (unset === undefined) return;
  const paths = Array.isArray(unset) ? unset : [unset];
  paths.forEach((path) => {
    if (typeof path === 'string' && (path === field || path.startsWith(`${field}.`))) {
      throw new ConfigError(
        `Tenant field "${field}" can not be set in an update on a tenant connection - the tenant wall stamps and filters it mechanically.`
      );
    }
  });
}

// $rename writes into its VALUE-side path, so renaming another field onto the
// tenant field is a write into it - the key scan alone only sees the source.
function assertRenameDoesNotTargetTenantField({ update, field }) {
  const rename = update?.$rename;
  if (rename === undefined || rename === null || typeof rename !== 'object') return;
  Object.values(rename).forEach((target) => {
    if (typeof target === 'string' && (target === field || target.startsWith(`${field}.`))) {
      throw new ConfigError(
        `Tenant field "${field}" can not be set in an update on a tenant connection - the tenant wall stamps and filters it mechanically.`
      );
    }
  });
}

// Every top-level key of an object-form update is an operator whose argument
// maps document paths to values. A non-operator key (a replacement-shaped
// document MongoDB will reject anyway) is itself a path.
function assertUpdateDoesNotAuthorTenantField({ update, field }) {
  if (update === undefined || update === null || typeof update !== 'object') return;
  const position = 'an update';
  assertTenantPathNotAuthored({ value: update, field, position });
  Object.entries(update).forEach(([operator, argument]) => {
    if (operator.startsWith('$')) {
      assertTenantPathNotAuthored({ value: argument, field, position });
    }
  });
}

// The stages MongoDB allows in a pipeline update: the argument of $set,
// $addFields and $project maps paths to values; $replaceRoot / $replaceWith
// author a whole new root, whose top-level keys are the paths.
function assertStageDoesNotAuthorTenantField({ stage, field }) {
  if (stage === undefined || stage === null || typeof stage !== 'object') return;
  const position = 'an update';
  Object.entries(stage).forEach(([operator, argument]) => {
    if (operator === '$replaceRoot') {
      assertTenantPathNotAuthored({ value: argument?.newRoot, field, position });
      return;
    }
    assertTenantPathNotAuthored({ value: argument, field, position });
  });
}

function applyTenantToUpdate({ update, tenant, upsert = false }) {
  const { field, value } = tenant;

  if (Array.isArray(update)) {
    update.forEach((stage) => {
      assertStageDoesNotAuthorTenantField({ stage, field });
      assertUnsetDoesNotDropTenantField({ stage, field });
    });
    return [...update, { $set: { [field]: value } }];
  }

  assertUpdateDoesNotAuthorTenantField({ update, field });
  assertRenameDoesNotTargetTenantField({ update, field });
  if (upsert) {
    return {
      ...update,
      $setOnInsert: { ...(update?.$setOnInsert ?? {}), [field]: value },
    };
  }
  return update;
}

export default applyTenantToUpdate;
