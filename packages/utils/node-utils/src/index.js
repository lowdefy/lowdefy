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

import cleanDirectory from './cleanDirectory.js';
import collectBlockTypes from './journeyCompiler/collectBlockTypes.js';
import compileSession from './journeyCompiler/compileSession.js';
import compileTrace from './journeyCompiler/compileTrace.js';
import copyFileOrDirectory from './copyFileOrDirectory.js';
import findAvailablePort from './findAvailablePort.js';
import findIncompleteExpectation from './journeyGrammar/findIncompleteExpectation.js';
import getFileExtension, { getFileSubExtension } from './getFileExtension.js';
import getMigrationLedgerPath from './migrations/getMigrationLedgerPath.js';
import getJourneyTouches from './journeyGrammar/getJourneyTouches.js';
import getRejectExpectation from './journeyGrammar/getRejectExpectation.js';
import getSecretsFromEnv from './getSecretsFromEnv.js';
import getStepKey from './journeyGrammar/getStepKey.js';
import installIfPackageJsonChanged from './installIfPackageJsonChanged.js';
import isPortAvailable from './isPortAvailable.js';
import moduleLockfileName from './modules/moduleLockfileName.js';
import spawnProcess from './spawnProcess.js';
import readFile from './readFile.js';
import readFixture from './readFixture.js';
import readMigrationLedger from './migrations/readMigrationLedger.js';
import readModuleLockfile from './modules/readModuleLockfile.js';
import resolveMigrationStage from './migrations/resolveMigrationStage.js';
import validateJourney from './journeyGrammar/validateJourney.js';
import validateJourneySteps from './journeyGrammar/validateJourneySteps.js';
import validateRequestTest from './journeyGrammar/validateRequestTest.js';
import writeFile from './writeFile.js';
import writeFileIfChanged from './writeFileIfChanged.js';
import writeMigrationLedger from './migrations/writeMigrationLedger.js';
import writeModuleLockfile from './modules/writeModuleLockfile.js';

import {
  EXPECT_DOM_KEYS,
  EXPECT_KEYS,
  EXPECT_STATE_KEYS,
  EXPECT_TEXT_KEYS,
  JOURNEY_KEYS,
  JOURNEY_STEP_KEYS,
  REQUEST_EXPECT_MARKERS,
  REQUEST_TEST_KEYS,
  WAIT_KEYS,
} from './journeyGrammar/journeyGrammarKeys.js';

export {
  EXPECT_DOM_KEYS,
  EXPECT_KEYS,
  EXPECT_STATE_KEYS,
  EXPECT_TEXT_KEYS,
  JOURNEY_KEYS,
  JOURNEY_STEP_KEYS,
  REQUEST_EXPECT_MARKERS,
  REQUEST_TEST_KEYS,
  WAIT_KEYS,
  cleanDirectory,
  collectBlockTypes,
  compileSession,
  compileTrace,
  copyFileOrDirectory,
  findAvailablePort,
  findIncompleteExpectation,
  getFileExtension,
  getFileSubExtension,
  getJourneyTouches,
  getMigrationLedgerPath,
  getRejectExpectation,
  getSecretsFromEnv,
  getStepKey,
  installIfPackageJsonChanged,
  isPortAvailable,
  moduleLockfileName,
  spawnProcess,
  readFile,
  readFixture,
  readMigrationLedger,
  readModuleLockfile,
  resolveMigrationStage,
  validateJourney,
  validateJourneySteps,
  validateRequestTest,
  writeFile,
  writeFileIfChanged,
  writeMigrationLedger,
  writeModuleLockfile,
};
