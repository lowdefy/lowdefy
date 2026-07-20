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

import assertTenantFieldNotAuthored from './assertTenantFieldNotAuthored.js';

// Recursive tenant injection over the whole pipeline tree - not a pass over
// the top-level stage array. Every pipeline that reads a collection (the root
// pipeline, $lookup sub-pipelines, $unionWith sub-pipelines) gets the tenant
// $match injected at its entry, and the walk recurses into $facet branches and
// nested sub-pipelines to any depth, so no cross-collection stage reaches
// another collection unfiltered. The contract this enforces: every collection
// reachable from a tenant connection carries the tenant field - a collection
// without it fails closed (the injected filter matches nothing).
//
// Atlas Search: $search/$searchMeta must be a pipeline's first stage, so a
// stage-0 $match can not be injected before them. Instead the injector
// rewrites the stage itself, adding the tenant equality as a compound.filter
// `equals` clause (filter clauses do not contribute to scoring, so matching
// AND relevance ordering are preserved), which also makes $search-computed
// counts (count, $$SEARCH_META) tenant-correct. For $search a standard $match
// is additionally injected immediately after the stage as defense in depth
// ($searchMeta returns metadata documents that carry no tenant field, so the
// trailing $match is omitted there). This requires the tenant field to be
// mapped as the `token` type in the Atlas Search index - and included in
// storedSource wherever returnStoredSource is used - a documented consumer
// requirement; a missing mapping fails closed (the equals clause matches
// nothing).
//
// Other first-stage-only stages get the same in-stage treatment: $vectorSearch
// is rewritten with the tenant equality merged into its `filter` (requires the
// tenant field indexed as the `filter` type in the Atlas Vector Search index)
// plus a trailing $match as defense in depth, and $geoNear has the tenant
// equality merged into its `query` (plain MQL - full server-side enforcement,
// no index requirement). $collStats and $indexStats are rejected outright:
// they return collection-wide statistics that can not be tenant-scoped.

// Stage-level $search options that sit beside the operator being wrapped.
// This allowlist must track Atlas $search stage-level options: an option
// missing here is wrapped into compound.must as if it were an operator and
// rejected by Atlas - fail-closed, but a needless error until the key is
// added.
const SEARCH_OPTION_KEYS = new Set([
  'index',
  'count',
  'highlight',
  'concurrent',
  'returnStoredSource',
  'scoreDetails',
  'searchAfter',
  'searchBefore',
  'sort',
  'tracking',
]);

// The authored-tenant-field rejection extends into $search internals: a
// clause on the tenant field's path can not bypass the wall (the injected
// filter still ANDs in), but rejecting it loudly beats a baffling silent
// no-match - the same DX rationale as the $match positions.
function assertNoAuthoredSearchPath({ node, field }) {
  if (Array.isArray(node)) {
    node.forEach((item) => assertNoAuthoredSearchPath({ node: item, field }));
    return;
  }
  if (!type.isObject(node)) {
    return;
  }
  Object.entries(node).forEach(([key, value]) => {
    if (key === 'path') {
      const paths = Array.isArray(value) ? value : [value];
      if (paths.some((p) => p === field || (typeof p === 'string' && p.startsWith(`${field}.`)))) {
        throw new Error(
          `Tenant field "${field}" can not be used as a $search path on a tenant connection - the tenant wall injects the organization filter mechanically.`
        );
      }
    }
    assertNoAuthoredSearchPath({ node: value, field });
  });
}

function rewriteSearchBody({ body, tenant }) {
  const { field, value } = tenant;
  assertNoAuthoredSearchPath({ node: body, field });
  const equalsClause = { equals: { path: field, value } };

  if (type.isObject(body.compound)) {
    const existingFilter = body.compound.filter;
    const filter = [
      ...(Array.isArray(existingFilter) ? existingFilter : existingFilter ? [existingFilter] : []),
      equalsClause,
    ];
    return { ...body, compound: { ...body.compound, filter } };
  }

  // A bare top-level operator (text, autocomplete, phrase, ...) is wrapped as
  // compound.must - any top-level operator may nest in a compound clause, and
  // filter clauses don't score, so matching and relevance are preserved.
  const options = {};
  const must = [];
  Object.entries(body).forEach(([key, val]) => {
    if (SEARCH_OPTION_KEYS.has(key)) {
      options[key] = val;
    } else {
      must.push({ [key]: val });
    }
  });
  const compound = must.length ? { must, filter: [equalsClause] } : { filter: [equalsClause] };
  return { ...options, compound };
}

// $vectorSearch takes a `filter` of MQL match expressions over fields indexed
// as the `filter` type. The tenant equality is $and-merged in ($eq form -
// vector search filters take explicit comparison operators), which keeps the
// top-`limit` candidate set tenant-correct; the caller adds a trailing $match
// as defense in depth, so a missing filter-type index mapping fails closed
// rather than open.
function rewriteVectorSearchBody({ body, tenant }) {
  const { field, value } = tenant;
  assertTenantFieldNotAuthored({ value: body.filter, field, position: 'a $vectorSearch filter' });
  const equalsExpression = { [field]: { $eq: value } };
  const filter = body.filter ? { $and: [body.filter, equalsExpression] } : equalsExpression;
  return { ...body, filter };
}

function injectTenantIntoPipeline({ pipeline, tenant }) {
  const { field, value } = tenant;
  const tenantMatch = () => ({ $match: { [field]: value } });

  function transformStage(stage) {
    if (!type.isObject(stage)) {
      return stage;
    }
    if (stage.$out !== undefined || stage.$merge !== undefined) {
      throw new Error(
        'Aggregation pipelines on a tenant connection can not contain "$out" or "$merge" - they write whole collections outside the tenant stamp path.'
      );
    }
    if (stage.$collStats !== undefined || stage.$indexStats !== undefined) {
      throw new Error(
        'Aggregation pipelines on a tenant connection can not contain "$collStats" or "$indexStats" - collection-level statistics can not be tenant-scoped.'
      );
    }
    if (stage.$match !== undefined) {
      assertTenantFieldNotAuthored({ value: stage.$match, field, position: 'a $match stage' });
      return stage;
    }
    if (type.isObject(stage.$lookup)) {
      const lookup = stage.$lookup;
      // A localField/foreignField lookup gains a pipeline (valid since
      // MongoDB 5.0 - it filters the joined docs in addition to the equality
      // match); a pipeline-form lookup gets the injection at its entry.
      return { ...stage, $lookup: { ...lookup, pipeline: injectEntry(lookup.pipeline ?? []) } };
    }
    if (stage.$unionWith !== undefined) {
      const unionWith = stage.$unionWith;
      if (typeof unionWith === 'string') {
        return { ...stage, $unionWith: { coll: unionWith, pipeline: injectEntry([]) } };
      }
      if (type.isObject(unionWith)) {
        return {
          ...stage,
          $unionWith: { ...unionWith, pipeline: injectEntry(unionWith.pipeline ?? []) },
        };
      }
      return stage;
    }
    if (type.isObject(stage.$graphLookup)) {
      const graphLookup = stage.$graphLookup;
      const restrict = graphLookup.restrictSearchWithMatch;
      assertTenantFieldNotAuthored({
        value: restrict,
        field,
        position: 'restrictSearchWithMatch',
      });
      const merged = restrict ? { $and: [restrict, { [field]: value }] } : { [field]: value };
      return { ...stage, $graphLookup: { ...graphLookup, restrictSearchWithMatch: merged } };
    }
    if (type.isObject(stage.$facet)) {
      // A branch in the walk, not a terminal: the documents entering a facet
      // are already tenant-filtered, but each sub-pipeline may reach another
      // collection - recurse without re-injecting at the entry. (MongoDB
      // forbids $out/$merge and $search inside $facet.)
      const facet = {};
      Object.entries(stage.$facet).forEach(([key, subPipeline]) => {
        facet[key] = Array.isArray(subPipeline) ? subPipeline.map(transformStage) : subPipeline;
      });
      return { ...stage, $facet: facet };
    }
    return stage;
  }

  // Injection at a pipeline's entry - the root pipeline and every sub-pipeline
  // that reads a collection ($lookup, $unionWith).
  function injectEntry(stages) {
    const transformed = (stages ?? []).map(transformStage);
    const first = transformed[0];
    if (type.isObject(first) && type.isObject(first.$search)) {
      const rewritten = { ...first, $search: rewriteSearchBody({ body: first.$search, tenant }) };
      return [rewritten, tenantMatch(), ...transformed.slice(1)];
    }
    if (type.isObject(first) && type.isObject(first.$searchMeta)) {
      // $searchMeta returns metadata documents (counts, facets) that carry no
      // tenant field - the in-stage filter is the whole enforcement, a
      // trailing $match would blank correct results.
      const rewritten = {
        ...first,
        $searchMeta: rewriteSearchBody({ body: first.$searchMeta, tenant }),
      };
      return [rewritten, ...transformed.slice(1)];
    }
    if (type.isObject(first) && type.isObject(first.$vectorSearch)) {
      const rewritten = {
        ...first,
        $vectorSearch: rewriteVectorSearchBody({ body: first.$vectorSearch, tenant }),
      };
      return [rewritten, tenantMatch(), ...transformed.slice(1)];
    }
    if (type.isObject(first) && type.isObject(first.$geoNear)) {
      // $geoNear's `query` is plain MQL applied server-side against the
      // documents - merging the tenant equality there is full enforcement.
      const geoNear = first.$geoNear;
      assertTenantFieldNotAuthored({ value: geoNear.query, field, position: 'a $geoNear query' });
      const query = geoNear.query
        ? { $and: [geoNear.query, { [field]: value }] }
        : { [field]: value };
      return [{ ...first, $geoNear: { ...geoNear, query } }, ...transformed.slice(1)];
    }
    return [tenantMatch(), ...transformed];
  }

  return injectEntry(pipeline ?? []);
}

export default injectTenantIntoPipeline;
