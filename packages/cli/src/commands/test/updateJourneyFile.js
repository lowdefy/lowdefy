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
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

// Fills one expectation in the file the developer wrote. The document is edited
// in place - only the `equals` and `from` keys of that step's `expect.state` are
// written - so comments, key order, quoting style and every other journey in the
// file survive `lowdefy test --update`. `journeyIndex` is the position of the
// journey in a file holding a list of them, and undefined in a file holding one.
// `from: recorded` says the value came from a run rather than from a human, so a
// reviewer knows which assertions still need reading.
function updateJourneyFile({ filePath, journeyIndex, stepIndex, equals }) {
  const document = YAML.parseDocument(fs.readFileSync(filePath, 'utf8'));
  const journeyPath = type.isNone(journeyIndex) ? [] : [journeyIndex];
  const statePath = [...journeyPath, 'steps', stepIndex, 'expect', 'state'];
  document.setIn([...statePath, 'equals'], document.createNode(equals));
  document.setIn([...statePath, 'from'], 'recorded');
  fs.writeFileSync(filePath, document.toString());
}

export default updateJourneyFile;
