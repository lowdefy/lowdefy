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

import fs from 'fs';
import path from 'path';
import { collectKnownText } from '@lowdefy/node-utils';
import { createTraceId, type } from '@lowdefy/helpers';

import appendWalkLog from './appendWalkLog.js';
import buildConfigTrees from './buildConfigTrees.js';
import checkLiveDataRule from './checkLiveDataRule.js';
import checkWriteOptIn from './checkWriteOptIn.js';
import createConfirmations from './createConfirmations.js';
import createCostTracker from './createCostTracker.js';
import createModelPolicy from './createModelPolicy.js';
import createSeededPolicy from './createSeededPolicy.js';
import createWalkClient from './createWalkClient.js';
import describeEmptyScope from './describeEmptyScope.js';
import diffBuilds from './diffBuilds.js';
import finishRun from './finishRun.js';
import formatScopeLines from './formatScopeLines.js';
import formatWalkPlan from './formatWalkPlan.js';
import listLiveDataConnections from './listLiveDataConnections.js';
import materialiseTree from './materialiseTree.js';
import orderTargets from './orderTargets.js';
import parseExploreOptions from './parseExploreOptions.js';
import pruneExploreDirectory from './pruneExploreDirectory.js';
import readBuildArtifacts from './readBuildArtifacts.js';
import readCoverage from './readCoverage.js';
import readPluginSets from './readPluginSets.js';
import resolveExploreDataSet from './resolveExploreDataSet.js';
import resolveExploreServer from './resolveExploreServer.js';
import resolvePolicy from './resolvePolicy.js';
import resolveRevisions from './resolveRevisions.js';
import resolveRoles from './resolveRoles.js';
import runWalk from './runWalk.js';
import scheduleWalks from './scheduleWalks.js';
import selectTargets from './selectTargets.js';
import writeScope from './writeScope.js';

// The walk overhead the plan assumes until the run's first walk measures it.
const ESTIMATED_WALK_OVERHEAD_MS = 6000;

// A run that cannot go on: the handler prints the message and exits 1.
function refuse(message) {
  throw new Error(message);
}

async function touch(directory) {
  const now = new Date();
  await fs.promises.utimes(directory, now, now).catch(() => {});
}

// Builds base and head, diffs them and writes scope.json.
async function scopeRun({ context, revisions, exploreDirectory, runDirectory, options }) {
  const tree = await materialiseTree({
    root: revisions.root,
    sha: revisions.base,
    configDirectory: context.directories.config,
    exploreDirectory,
  });
  await touch(tree.treeDirectory);
  const pluginSets = await readPluginSets({
    baseConfigDirectory: tree.configDirectory,
    headConfigDirectory: context.directories.config,
  });
  let builds;
  try {
    builds = await buildConfigTrees({
      context,
      revisions,
      baseConfigDirectory: tree.configDirectory,
      runDirectory,
      pluginSets,
    });
  } catch (error) {
    refuse(error.message);
  }
  await touch(path.dirname(builds.headBuild));
  if (builds.baseBuild !== null) await touch(path.dirname(builds.baseBuild));
  const headBuild = readBuildArtifacts({ buildDirectory: builds.headBuild });
  const baseBuild =
    builds.baseBuild === null ? null : readBuildArtifacts({ buildDirectory: builds.baseBuild });
  const targets = selectTargets({
    diff: baseBuild === null ? null : diffBuilds({ baseBuild, headBuild }),
    baseBuild,
    headBuild,
    coverage: readCoverage({ directories: context.directories }),
    manualPages: options.pages,
    baseError: builds.baseError,
  });
  const scope = await writeScope({
    runDirectory,
    revisions,
    targets,
    plugins: pluginSets,
    buildMs: builds.buildMs,
  });
  return { scope, warnings: targets.warnings, builds, headBuild };
}

function resolveTargets({ scope, coverage, dataSet, options }) {
  if (options.roles.length > 0 && type.isNone(dataSet)) {
    refuse('--role names data set users, but no data set resolved. Name one with --data.');
  }
  const targets = [];
  const notRun = [];
  scope.pages.forEach((page) => {
    const resolved = resolveRoles({
      pageId: page.pageId,
      coverage,
      dataSet,
      onlyUsers: options.roles,
    });
    targets.push(...resolved.targets);
    notRun.push(...resolved.notRun);
  });
  return { targets: orderTargets({ scopePages: scope.pages, targets }), notRun };
}

async function createPolicy({ policyConfig, seed }) {
  const seeded = createSeededPolicy({ seed });
  if (policyConfig.policy === 'seeded') return seeded;
  return createModelPolicy({
    backend: policyConfig.backend,
    modelId: policyConfig.modelId,
    apiKey: policyConfig.apiKey,
    seeded,
  });
}

function formatWalkLine(log) {
  const findings = log.findings.length === 0 ? '' : `, ${log.findings.length} findings`;
  return `  ${log.walk} ${log.pageId} as ${log.user ?? 'default user'}: ${
    log.steps.length
  } steps, ${log.stopReason}${findings}`;
}

// Everything after the scope: data, roles, policy, then the walks
// breadth-first under the budget and the spending cap.
async function walkRun({
  context,
  options,
  policyConfig,
  revisions,
  run,
  runDirectory,
  client,
  scoped,
}) {
  const { scope, builds, headBuild } = scoped;
  const { name: dataName, dataSet } = await resolveExploreDataSet({
    configDirectory: context.directories.config,
    data: options.data,
  });
  const liveRule = checkLiveDataRule({
    dataName,
    liveConnections: listLiveDataConnections({ headBuild }),
    liveData: options.liveData,
  });
  if (!type.isUndefined(liveRule.error)) refuse(liveRule.error);
  if (!type.isUndefined(liveRule.warning)) context.logger.warn(liveRule.warning);
  const coverage = readCoverage({ directories: context.directories });
  const { targets, notRun } = resolveTargets({ scope, coverage, dataSet, options });
  const policy = await createPolicy({ policyConfig, seed: options.seed });
  const costs = createCostTracker({
    maxCost: policyConfig.maxCost,
    onFirstEstimate: () =>
      context.logger.warn(
        'The Gateway reported no cost for a model call, so --max-cost is working from an estimate.'
      ),
  });
  const startBuildId = await client.buildId();
  const deadline = Date.now() + options.budgetMs;
  function shouldStop() {
    if (Date.now() >= deadline) return 'budget';
    if (costs.exceeded()) return 'cost';
    return null;
  }
  context.logger.info(
    `Plan      ${formatWalkPlan({
      targets,
      walks: options.walks,
      steps: options.steps,
      budgetMs: options.budgetMs,
      walkOverheadMs: ESTIMATED_WALK_OVERHEAD_MS,
    })}`
  );
  const scopePages = new Map(scope.pages.map((page) => [page.pageId, page]));
  const walkOptions = {
    steps: options.steps,
    data: dataName,
    liveData: options.liveData,
    allowExternal: options.allowExternal,
  };
  const confirmations = createConfirmations({ client, run, options: walkOptions, shouldStop });
  const targetsByWalk = new Map();
  const walkStarted = Date.now();
  const result = await scheduleWalks({
    targets,
    walks: options.walks,
    shouldStop,
    buildChanged: async () => (await client.buildId()) !== startBuildId,
    afterWalk: (log) => confirmations.afterWalk({ log, target: targetsByWalk.get(log.walk) }),
    runOne: async ({ target, walkId, walkIndex, progress }) => {
      targetsByWalk.set(walkId, target);
      const log = await runWalk({
        client,
        run,
        walkId,
        walkIndex,
        target,
        scopePage: scopePages.get(target.pageId),
        options: walkOptions,
        policy,
        progress,
        decisionContext: revisions.context,
        knownTextFor: ({ pageIds, typed }) =>
          collectKnownText({ buildDirectory: builds.headBuild, pageIds, dataSet, typed }),
        fixtures: dataSet?.fixtures ?? {},
        shouldStop,
        costs,
      });
      await appendWalkLog({ runDirectory, log });
      context.logger.info(formatWalkLine(log));
      return log;
    },
  });
  return {
    dataName,
    dataSet,
    policy,
    targets,
    costs: costs.totals(),
    walkMs: Date.now() - walkStarted,
    logs: result.logs,
    confirmations: confirmations.list(),
    findingsByWalk: confirmations.findingsByWalk,
    notRun: [...notRun, ...result.notRun],
    stopped: result.stopped,
  };
}

async function exploreOnServer({ context, options, policyConfig, revisions, server }) {
  const startedAt = new Date().toISOString();
  const exploreDirectory = path.join(context.directories.config, '.lowdefy', 'explore');
  const run = createTraceId();
  const runDirectory = path.join(exploreDirectory, run);
  const client = createWalkClient({ url: server.url });
  const scoped = await scopeRun({ context, revisions, exploreDirectory, runDirectory, options });
  scoped.warnings.forEach((warning) => context.logger.warn(warning));
  formatScopeLines({ scope: scoped.scope, cached: scoped.builds.cached }).forEach((line) =>
    context.logger.info(line)
  );
  if (options.scopeOnly) {
    if (options.json) process.stdout.write(`${JSON.stringify(scoped.scope, null, 2)}\n`);
    return { run, runDirectory, scope: scoped.scope, walked: null };
  }
  if (scoped.scope.pages.length === 0) {
    context.logger.info(describeEmptyScope({ scope: scoped.scope }));
    return { run, runDirectory, scope: scoped.scope, walked: null };
  }
  const walked = await walkRun({
    context,
    options,
    policyConfig,
    revisions,
    run,
    runDirectory,
    client,
    scoped,
  });
  if (walked.stopped?.reason === 'error') {
    context.logger.error(`The run stopped: ${walked.stopped.message}`);
    process.exitCode = 1;
  } else if (walked.stopped?.message) {
    context.logger.warn(walked.stopped.message);
  }
  const report = await finishRun({
    context,
    options,
    run,
    runDirectory,
    revisions,
    scope: scoped.scope,
    walked,
    buildDirectory: scoped.builds.headBuild,
    startedAt,
  });
  return { run, runDirectory, scope: scoped.scope, walked, report };
}

// lowdefy journeys explore (--pr <n> | --against <ref>): finds the pages a
// pull request changed by comparing full config builds of its base and head,
// walks each changed page as each role on a journey data set, with a policy
// choosing each step from generated options and fixed invariants deciding
// findings, and keeps the run in .lowdefy/explore/<run>/. Not a gate: exit 0
// when the run completes, with or without findings; 1 when it cannot run.
async function journeysExplore({ context }) {
  let server = null;
  try {
    const options = parseExploreOptions(context.options);
    await pruneExploreDirectory({
      exploreDirectory: path.join(context.directories.config, '.lowdefy', 'explore'),
    });
    const policyConfig = resolvePolicy({ options: context.options });
    const optInError = checkWriteOptIn({
      cliConfig: context.cliConfig,
      liveData: options.liveData,
      allowExternal: options.allowExternal,
    });
    if (!type.isUndefined(optInError)) refuse(optInError);
    const revisions = await resolveRevisions({
      pr: options.pr,
      against: options.against,
      cwd: context.directories.config,
    });
    server = await resolveExploreServer({ context, url: options.url });
    const explored = await exploreOnServer({ context, options, policyConfig, revisions, server });
    return explored;
  } catch (error) {
    context.logger.error(error.message);
    process.exitCode = 1;
    return null;
  } finally {
    if (server !== null) await server.stop();
    context.sendTelemetry();
  }
}

export default journeysExplore;
