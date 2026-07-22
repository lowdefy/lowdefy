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

// The audit half of `tenant: authored` (amendment-1): the wall never rewrites
// the inside of a stage, so stages the prepended $match can not scope carry a
// developer-authored tenant clause instead - and the wall refuses to run the
// request unless that clause is present, on the tenant field, with a value
// strictly equal to the resolved verdict. A mistake is a refused request with
// the fix in the error message - never an unscoped query, never a silent
// blank.
//
// Acceptance is deliberately strict: the clause must sit where AND semantics
// are guaranteed - a direct element of $search compound.filter, or a direct
// equality (optionally inside a top-level $and) for MQL positions. An
// equality buried in $or/$nor does not count: it could be widened away.

// $search / $searchMeta: body.compound.filter must contain
// { equals: { path: <field>, value: <verdict value> } } as a direct element.
function auditSearchCompound({ body, field, value, stage }) {
  const filter = type.isObject(body) && type.isObject(body.compound) ? body.compound.filter : null;
  const clauses = Array.isArray(filter) ? filter : filter ? [filter] : [];
  const found = clauses.some(
    (clause) =>
      type.isObject(clause) &&
      type.isObject(clause.equals) &&
      clause.equals.path === field &&
      clause.equals.value === value
  );
  if (!found) {
    throw new Error(
      `Request declares "tenant: authored", but its "${stage}" stage has no "compound.filter" equals clause on tenant field "${field}" matching the caller's organization. The request was not run. Author the clause inside the stage:
  compound:
    filter:
      - equals:
          path: ${field}
          value:
            _user: organizationId`
    );
  }
}

// MQL equality positions ($vectorSearch.filter, $geoNear.query,
// $graphLookup.restrictSearchWithMatch): the tenant equality must be a direct
// clause - { <field>: <value> } or { <field>: { $eq: <value> } } - at the top
// level or inside a top-level $and. $or/$nor do not qualify (AND semantics
// are not guaranteed there).
function mqlHasTenantEquality({ query, field, value }) {
  if (!type.isObject(query)) {
    return false;
  }
  const clause = query[field];
  if (clause === value) {
    return true;
  }
  if (type.isObject(clause) && clause.$eq === value) {
    return true;
  }
  if (Array.isArray(query.$and)) {
    return query.$and.some((sub) => mqlHasTenantEquality({ query: sub, field, value }));
  }
  return false;
}

function auditMqlEquality({ query, field, value, stage, position }) {
  if (!mqlHasTenantEquality({ query, field, value })) {
    throw new Error(
      `Request declares "tenant: authored", but its "${stage}" stage has no "${position}" equality on tenant field "${field}" matching the caller's organization. The request was not run. Author the clause inside the stage:
  ${position}:
    ${field}:
      _user: organizationId`
    );
  }
}

export { auditSearchCompound, auditMqlEquality };
