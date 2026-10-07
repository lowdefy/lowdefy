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

import acquireMachineSlot from './acquireMachineSlot.js';
import bindCredentialScrub from './bindCredentialScrub.js';
import checkEnvironmentGuards from './checkEnvironmentGuards.js';
import cleanDirectory from './cleanDirectory.js';
import collectEnvironmentGuards from './collectEnvironmentGuards.js';
import compareProcessStartTimes from './compareProcessStartTimes.js';
import copyFileOrDirectory from './copyFileOrDirectory.js';
import createConnectPublic from './createConnectPublic.js';
import createClientAddressResolver from './createClientAddressResolver.js';
import createLookupPublicAddress from './createLookupPublicAddress.js';
import createSecretScrubber from './createSecretScrubber.js';
import devPassiveHeader from './devPassiveHeader.js';
import dataSetNamePattern from './dataSetNamePattern.js';
import findAvailablePort from './findAvailablePort.js';
import findPnpmWorkspaceRoot from './findPnpmWorkspaceRoot.js';
import findWorkspacePackages from './findWorkspacePackages.js';
import getDevInstancePath from './getDevInstancePath.js';
import getFileExtension, { getFileSubExtension } from './getFileExtension.js';
import getMarkedCredentials from './getMarkedCredentials.js';
import getLowdefyHome from './getLowdefyHome.js';
import getProcessStartTime from './getProcessStartTime.js';
import getSecretsFromEnv from './getSecretsFromEnv.js';
import installIfPackageJsonChanged from './installIfPackageJsonChanged.js';
import isPidAlive from './isPidAlive.js';
import isProcessAlive from './isProcessAlive.js';
import isPublicAddress from './isPublicAddress.js';
import isProcessStartTime from './isProcessStartTime.js';
import isPortAvailable from './isPortAvailable.js';
import linkDependenciesToWorkspace from './linkDependenciesToWorkspace.js';
import linkWorkspaceDependencies from './linkWorkspaceDependencies.js';
import countDataSetDocuments from './countDataSetDocuments.js';
import listDataSets from './listDataSets.js';
import matchPagePath from './matchPagePath.js';
import parseDataSet from './parseDataSet.js';
import parseIpRange from './parseIpRange.js';
import parseSince from './parseSince.js';
import parsePsStartTime from './parsePsStartTime.js';
import readDevInstance from './readDevInstance.js';
import readDevInstanceAsync from './readDevInstanceAsync.js';
import readProcessStartTime from './readProcessStartTime.js';
import readServerRegistry from './readServerRegistry.js';
import registerServer from './registerServer.js';
import listRecordingFiles, { RECORDING_SOURCES } from './recordings/listRecordingFiles.js';
import readRecordings from './recordings/readRecordings.js';
import runInCredentialScope from './runInCredentialScope.js';
import scrubCredentials from './scrubCredentials.js';
import spawnProcess from './spawnProcess.js';
import readFile from './readFile.js';
import writeFile from './writeFile.js';
import writeFileAtomic from './writeFileAtomic.js';
import watchOwner from './watchOwner.js';
import writeFileIfChanged from './writeFileIfChanged.js';
import compileSegments from './journeyCompiler/compileSegments.js';
import countTextTokens from './journeyEvidence/countTextTokens.js';
import normaliseClickText from './journeyText/normaliseClickText.js';
import findPlaceholderStep from './journeyGrammar/findPlaceholderStep.js';
import failurePathKey from './journeyEvidence/failurePathKey.js';
import isBackedBy from './journeyEvidence/isBackedBy.js';
import normaliseBlockId from './journeyGrammar/normaliseBlockId.js';
import normaliseJourneySteps from './journeyGrammar/normaliseJourneySteps.js';
import journeyStepSchema, { JOURNEY_STEP_SCHEMAS } from './journeyGrammar/journeyStepSchema.js';
import hashSequence from './journeyCompiler/hashSequence.js';
import journeySequence from './journeyCompiler/journeySequence.js';
import listFailurePaths from './journeyCompiler/listFailurePaths.js';
import markCredential from './markCredential.js';
import parseTraceLines from './journeyCompiler/parseTraceLines.js';
import profileProduction from './journeyEvidence/profileProduction.js';
import buildSessionReport from './sessionLog/buildSessionReport.js';
import formatSessionLog from './sessionLog/formatSessionLog.js';
import formatSessionReport from './sessionLog/formatSessionReport.js';
import summariseSessions from './sessionLog/summariseSessions.js';
import stepIdentity from './journeyCompiler/stepIdentity.js';
import validateJourneySteps, {
  getStepKey,
  INTERACTION_STEP_KEYS,
  STEP_KEYS,
  TARGET_KEYS,
} from './journeyGrammar/validateJourneySteps.js';
import validateJourneyTags, { JOURNEY_TAG_PATTERN } from './journeyGrammar/validateJourneyTags.js';
import validateJourneyUser from './journeyGrammar/validateJourneyUser.js';
import validateTraceRecord from './journeyTrace/validateTraceRecord.js';

export {
  acquireMachineSlot,
  bindCredentialScrub,
  buildSessionReport,
  checkEnvironmentGuards,
  cleanDirectory,
  collectEnvironmentGuards,
  compareProcessStartTimes,
  compileSegments,
  copyFileOrDirectory,
  countDataSetDocuments,
  countTextTokens,
  createClientAddressResolver,
  createConnectPublic,
  createLookupPublicAddress,
  createSecretScrubber,
  devPassiveHeader,
  dataSetNamePattern,
  failurePathKey,
  findAvailablePort,
  findPlaceholderStep,
  findPnpmWorkspaceRoot,
  formatSessionLog,
  formatSessionReport,
  findWorkspacePackages,
  getDevInstancePath,
  getFileExtension,
  getFileSubExtension,
  getMarkedCredentials,
  getLowdefyHome,
  getProcessStartTime,
  getSecretsFromEnv,
  hashSequence,
  installIfPackageJsonChanged,
  isBackedBy,
  isPidAlive,
  isProcessAlive,
  isPublicAddress,
  isProcessStartTime,
  isPortAvailable,
  journeySequence,
  journeyStepSchema,
  linkDependenciesToWorkspace,
  linkWorkspaceDependencies,
  listDataSets,
  parseDataSet,
  listFailurePaths,
  listRecordingFiles,
  markCredential,
  matchPagePath,
  normaliseBlockId,
  normaliseJourneySteps,
  normaliseClickText,
  parseIpRange,
  parseSince,
  parsePsStartTime,
  parseTraceLines,
  profileProduction,
  readDevInstance,
  readDevInstanceAsync,
  readProcessStartTime,
  readServerRegistry,
  registerServer,
  readRecordings,
  RECORDING_SOURCES,
  runInCredentialScope,
  scrubCredentials,
  spawnProcess,
  stepIdentity,
  summariseSessions,
  readFile,
  writeFile,
  writeFileAtomic,
  watchOwner,
  writeFileIfChanged,
  getStepKey,
  INTERACTION_STEP_KEYS,
  JOURNEY_STEP_SCHEMAS,
  STEP_KEYS,
  TARGET_KEYS,
  validateJourneySteps,
  validateTraceRecord,
  JOURNEY_TAG_PATTERN,
  validateJourneyTags,
  validateJourneyUser,
};
