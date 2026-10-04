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

import buildDecisionState from './buildDecisionState.js';
import buildOpenBody from './buildOpenBody.js';
import chooseOption from './chooseOption.js';

// A redirect at open that is not a role-refused finding: the head config
// refusing the role. Access changed in this PR when the page's auth changed
// and the head does not admit the role; refused otherwise.
function refusalReason({ opened, scopePage }) {
  if (opened.admitted === false && scopePage.authChanged === true) return 'access-changed';
  return 'refused';
}

// One walk of a (page, role) target: open it on the dev server, then step
// until a stop rule ends it, and close it. Each step asks the policy to
// choose among the options buildDecisionState offers, sends the chosen
// grammar step, and keeps the findings the invariants decided. Stop reasons:
// steps, exhausted, off-topic (model policies only: the lowest relevance on
// two steps running), finding (an error finding), left-app, step-failed,
// budget, cost (from shouldStop), server-restarted (the walk is gone: a 404),
// and at open refused or access-changed (the head config refuses the role).
// Returns the walk's log, the record walks.jsonl keeps.
async function runWalk({
  client,
  run,
  walkId,
  walkIndex,
  target,
  scopePage,
  options,
  policy,
  progress,
  decisionContext,
  knownTextFor,
  fixtures,
  shouldStop,
  costs,
  now = Date.now,
}) {
  const log = {
    walk: walkId,
    walkIndex,
    pageId: target.pageId,
    user: target.user,
    roles: target.roles,
    startedAt: new Date(now()).toISOString(),
    open: null,
    steps: [],
    findings: [],
    stopReason: null,
    closeMs: null,
  };
  const openStart = now();
  const opened = await client.open(buildOpenBody({ target, run, walkId, options, record: true }));
  if (opened.status === 400) {
    throw new Error(`The dev server refused the walk on "${target.pageId}": ${opened.body.error}`);
  }
  if (opened.status !== 200) {
    log.open = { ms: now() - openStart, error: opened.body.error ?? `status ${opened.status}` };
    log.stopReason = 'step-failed';
    return log;
  }
  const {
    walkId: serverWalkId,
    observation: first,
    admitted,
    findings: openFindings,
  } = opened.body;
  log.open = {
    ms: now() - openStart,
    dataMs: opened.body.timings?.dataMs ?? null,
    pageMs: opened.body.timings?.pageMs ?? null,
    redirected: first.redirected === true,
    admitted,
  };
  try {
    if (openFindings.length > 0) {
      log.findings.push(...openFindings);
      log.stopReason = 'finding';
      return log;
    }
    if (first.redirected === true) {
      log.stopReason = refusalReason({ opened: opened.body, scopePage });
      return log;
    }
    progress.startWalk();
    let observation = first;
    const history = [];
    const typed = [];
    const pageIds = new Set([target.pageId]);
    let lowRelevance = 0;
    for (let stepIndex = 0; stepIndex < options.steps; stepIndex += 1) {
      if (observation.leftApp === true) {
        log.stopReason = 'left-app';
        return log;
      }
      const stop = shouldStop();
      if (stop !== null) {
        log.stopReason = stop;
        return log;
      }
      pageIds.add(observation.pageId);
      const {
        state,
        options: offered,
        optionToStep,
        truncated,
      } = buildDecisionState({
        context: decisionContext,
        pageId: target.pageId,
        role: target.user ?? 'default',
        url: observation.url,
        blockDiff: scopePage.blocks,
        observation,
        history,
        knownText: knownTextFor({ pageIds: [...pageIds], typed }),
        progress,
        fixtures,
      });
      const decideStart = now();
      const answer = await chooseOption({
        policy,
        step: {
          state,
          options: offered,
          optionToStep,
          firstStep: history.length === 0,
          pageId: target.pageId,
          role: target.user ?? 'default',
          walkIndex,
          stepIndex,
        },
      });
      const decideMs = now() - decideStart;
      costs.add(answer);
      if (type.isNone(answer.optionId)) {
        log.stopReason = 'exhausted';
        return log;
      }
      if (!type.isNone(policy.lowestRelevance) && history.length > 0) {
        lowRelevance = answer.relevance === policy.lowestRelevance ? lowRelevance + 1 : 0;
        if (lowRelevance >= 2) {
          log.stopReason = 'off-topic';
          return log;
        }
      }
      const chosen = optionToStep[answer.optionId];
      progress.record({ shape: observation.shape, candidate: chosen.candidate });
      const stepStart = now();
      const stepped = await client.step({ walkId: serverWalkId, step: chosen.step });
      const roundTripMs = now() - stepStart;
      if (stepped.status === 404) {
        log.stopReason = 'server-restarted';
        return log;
      }
      if (stepped.status !== 200) {
        throw new Error(
          `The dev server refused walk step ${JSON.stringify(chosen.step)}: ${stepped.body.error}`
        );
      }
      const { result, findings, screenshot } = stepped.body;
      if (!type.isUndefined(chosen.step.fill)) typed.push(String(chosen.step.fill.value));
      history.push(offered[answer.optionId]);
      log.steps.push({
        index: stepIndex,
        shape: observation.shape,
        url: observation.url,
        step: chosen.step,
        options: offered,
        truncated,
        rowText: chosen.candidate.rowText ?? null,
        answer: {
          optionId: answer.optionId,
          text: offered[answer.optionId],
          asked: answer.asked === true,
          confidence: answer.confidence ?? null,
          relevance: answer.relevance ?? null,
          fallback: answer.fallback ?? null,
          modelId: answer.modelId ?? null,
          usage: answer.usage ?? null,
          cost: answer.cost ?? null,
        },
        durations: {
          decideMs,
          actMs: result.durationMs,
          observeMs: Math.max(roundTripMs - result.durationMs, 0),
        },
        result,
        findings,
        screenshot: screenshot ?? null,
      });
      log.findings.push(...findings);
      if (findings.some((finding) => finding.severity === 'error')) {
        log.stopReason = 'finding';
        return log;
      }
      if (findings.some((finding) => finding.kind === 'environment')) {
        log.stopReason = 'environment';
        return log;
      }
      if (result.status !== 'ok') {
        log.stopReason = 'step-failed';
        return log;
      }
      observation = stepped.body.observation;
    }
    log.stopReason = 'steps';
    return log;
  } finally {
    const closeStart = now();
    await client.close({ walkId: serverWalkId }).catch(() => {});
    log.closeMs = now() - closeStart;
  }
}

export default runWalk;
