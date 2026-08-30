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
import { type } from '@lowdefy/helpers';

import assertTenantFieldNotAuthored from './assertTenantFieldNotAuthored.js';
import { auditSearchCompound, auditMqlEquality } from './auditAuthoredClause.js';

// Recursive tenant injection over the whole pipeline tree - not a pass over
// the top-level stage array. The wall has exactly ONE pipeline move:
// prepending { $match: { <field>: <value> } } at a pipeline entry - the root
// pipeline and every $lookup/$unionWith sub-pipeline entry, recursing through
// $facet branches to any depth. It never rewrites the inside of a stage:
// injected behavior must be obvious from that one documented rule.
//
// Stages the prepend can not scope are the request author's (amendment-1):
// - First-stage-only entry stages ($search, $searchMeta, $vectorSearch,
//   $geoNear) - nothing can be prepended before them.
// - $graphLookup at any position - the traversal reads its target collection
//   by name, so an entry $match does not constrain it.
// Without `tenant: authored` on the request these are REFUSED. With it, the
// author writes the tenant clause into the stage's documented position and
// this injector AUDITS it (field + value strictly equal to the verdict)
// before the pipeline runs - see auditAuthoredClause.js. No trailing $match
// is injected after an audited stage: what the author wrote is what runs,
// and the audit, not a second hidden filter, is the enforcement. The rest of
// an authored request's pipeline is still walled mechanically.
//
// The contract this enforces: every collection reachable from a tenant
// connection carries the tenant field - a collection without it fails closed
// (the injected filter matches nothing).
//
// `trace` is an optional dev-only collector (the `explain` flag of the dev
// tools). When present, every rewrite pushes an entry onto trace.rewritten:
// { at, injected } for a prepended $match and { at, audited: true } for an
// audited authored stage. `at` is a path into the authored pipeline -
// '$match[0]' for the root prepend, '$lookup[<i>].pipeline' /
// '$unionWith[<i>].pipeline' / '$facet.<branch>' composed as the recursion
// descends, and '<stage>[<i>]' for an audited stage. Nothing reads trace to
// decide anything: the wall's moves, refusals and audits are identical
// without it.

// Entry stages MongoDB requires to be a pipeline's first stage, which the
// prepended $match therefore can not scope. Each maps to the position the
// authored tenant clause must sit in.
const AUTHORED_ENTRY_STAGES = {
  $search: 'compound.filter',
  $searchMeta: 'compound.filter',
  $vectorSearch: 'filter',
  $geoNear: 'query',
};

function refusalError({ stageKey, field, position }) {
  const snippet =
    stageKey === '$search' || stageKey === '$searchMeta'
      ? `  compound:
    filter:
      - equals:
          path: ${field}
          value:
            _user: organization_id`
      : `  ${position}:
    ${field}:
      _user: organization_id`;
  return new Error(
    `Aggregation pipelines on a tenant connection can not contain "${stageKey}" unless the request declares "tenant: authored" - the tenant wall does not scope this stage mechanically. Author the organization clause inside the stage:
${snippet}
then declare "tenant: authored" on the request to confirm it owns its organization scoping.`
  );
}

function injectTenantIntoPipeline({ pipeline, tenant, trace }) {
  const { field, value } = tenant;
  const authored = tenant.authored === true;
  const tenantMatch = () => ({ $match: { [field]: value } });
  // Counts the authored-responsibility sites seen, so `tenant: authored` on a
  // pipeline with nothing to author is refused rather than silently accepted.
  let authoredSites = 0;

  function recordInjected({ at }) {
    if (trace) {
      trace.rewritten.push({ at, injected: { $match: { [field]: value } } });
    }
  }

  function recordAudited({ at }) {
    if (trace) {
      trace.rewritten.push({ at, audited: true });
    }
  }

  // `at` is the path of the containing pipeline in the authored properties -
  // '' for the root, '$lookup[2].pipeline.' for a sub-pipeline - so a nested
  // rewrite names the exact stage it happened under.
  function transformStage(stage, index, at) {
    if (!type.isObject(stage)) {
      return stage;
    }
    if (stage.$out !== undefined || stage.$merge !== undefined) {
      throw new ConfigError(
        'Aggregation pipelines on a tenant connection can not contain "$out" or "$merge" - they write whole collections outside the tenant stamp path.'
      );
    }
    if (stage.$collStats !== undefined || stage.$indexStats !== undefined) {
      throw new ConfigError(
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
      return {
        ...stage,
        $lookup: {
          ...lookup,
          pipeline: injectEntry(lookup.pipeline ?? [], `${at}$lookup[${index}].pipeline`),
        },
      };
    }
    if (stage.$unionWith !== undefined) {
      const unionWith = stage.$unionWith;
      if (typeof unionWith === 'string') {
        return {
          ...stage,
          $unionWith: {
            coll: unionWith,
            pipeline: injectEntry([], `${at}$unionWith[${index}].pipeline`),
          },
        };
      }
      if (type.isObject(unionWith)) {
        return {
          ...stage,
          $unionWith: {
            ...unionWith,
            pipeline: injectEntry(unionWith.pipeline ?? [], `${at}$unionWith[${index}].pipeline`),
          },
        };
      }
      return stage;
    }
    if (type.isObject(stage.$graphLookup)) {
      // The traversal reads its target collection by name - the entry $match
      // does not constrain it, and merging into restrictSearchWithMatch would
      // be in-stage rewriting. The clause is the author's (amendment-1).
      if (!authored) {
        throw refusalError({
          stageKey: '$graphLookup',
          field,
          position: 'restrictSearchWithMatch',
        });
      }
      authoredSites += 1;
      auditMqlEquality({
        query: stage.$graphLookup.restrictSearchWithMatch,
        field,
        value,
        stage: '$graphLookup',
        position: 'restrictSearchWithMatch',
      });
      recordAudited({ at: `${at}$graphLookup[${index}]` });
      return stage;
    }
    if (type.isObject(stage.$facet)) {
      // A branch in the walk, not a terminal: the documents entering a facet
      // are already tenant-filtered, but each sub-pipeline may reach another
      // collection - recurse without re-injecting at the entry. (MongoDB
      // forbids $out/$merge and $search inside $facet.)
      const facet = {};
      Object.entries(stage.$facet).forEach(([key, subPipeline]) => {
        facet[key] = Array.isArray(subPipeline)
          ? subPipeline.map((subStage, subIndex) =>
              transformStage(subStage, subIndex, `${at}$facet.${key}.`)
            )
          : subPipeline;
      });
      return { ...stage, $facet: facet };
    }
    return stage;
  }

  // Injection at a pipeline's entry - the root pipeline and every sub-pipeline
  // that reads a collection ($lookup, $unionWith).
  function injectEntry(stages, at) {
    const transformed = (stages ?? []).map((stage, index) =>
      transformStage(stage, index, at === '' ? '' : `${at}.`)
    );
    const first = transformed[0];
    const entryKey =
      type.isObject(first) &&
      Object.keys(AUTHORED_ENTRY_STAGES).find((key) => first[key] !== undefined);
    if (entryKey) {
      const position = AUTHORED_ENTRY_STAGES[entryKey];
      if (!authored) {
        throw refusalError({ stageKey: entryKey, field, position });
      }
      authoredSites += 1;
      if (entryKey === '$search' || entryKey === '$searchMeta') {
        auditSearchCompound({ body: first[entryKey], field, value, stage: entryKey });
      } else {
        auditMqlEquality({
          query: type.isObject(first[entryKey]) ? first[entryKey][position] : null,
          field,
          value,
          stage: entryKey,
          position,
        });
      }
      // No prepend before (invalid - the stage must be first) and no trailing
      // $match after: the audited authored clause is the enforcement.
      recordAudited({ at: `${at === '' ? '' : `${at}.`}${entryKey}[0]` });
      return transformed;
    }
    recordInjected({ at: at === '' ? '$match[0]' : at });
    return [tenantMatch(), ...transformed];
  }

  const result = injectEntry(pipeline ?? [], '');
  if (authored && authoredSites === 0) {
    throw new ConfigError(
      'Request declares "tenant: authored" but its pipeline contains no stage that requires an authored tenant clause - the tenant wall scopes this pipeline mechanically. Remove "tenant: authored".'
    );
  }
  return result;
}

export default injectTenantIntoPipeline;
