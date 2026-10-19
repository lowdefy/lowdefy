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
import { relativePosixPath } from '@lowdefy/node-utils';

import getExercisedPath from '../../test/getExercisedPath.js';
import hashJourney from '../../test/hashJourney.js';
import fs from 'fs';

function gotoTargets(journey) {
  const steps = type.isArray(journey.steps) ? journey.steps : [];
  return steps
    .filter((step) => type.isObject(step) && !type.isUndefined(step.goto))
    .map((step) => (type.isObject(step.goto) ? step.goto.pageId : step.goto));
}

// Whether the journey's declared start or a goto step might reach a page. A
// target that is not a plain string (an operator, say) is unknown, so it might.
function declaredReach({ journey, pages }) {
  return [journey.pageId, ...gotoTargets(journey)].some(
    (target) => !type.isString(target) || pages.includes(target)
  );
}

function readRecords({ directories }) {
  try {
    return JSON.parse(fs.readFileSync(getExercisedPath({ directories }), 'utf8')).journeys ?? {};
  } catch {
    return null;
  }
}

// With --page, only a journey that can reach one of those pages can kill a
// mutant on them (scopeMutants keeps a mutant for the journeys whose baseline
// exercised it), so the rest need no baseline run. A journey stays in the
// baseline unless its own pageId and goto steps name none of the pages and its
// last measured run (.lowdefy/test/exercised.json) is current and touched none
// of them. A record is current when the journey has not changed and the record
// was measured on the same config content as the build being served
// (`configHash`, not the buildId, which is new on every server start). Any
// doubt keeps the journey. `reasons` counts why journeys were kept without
// being judged by their record, so the caller can say why narrowing did little.
function narrowBaseline({ items, pages, directories, configHash }) {
  const reasons = { noRecord: 0, journeyChanged: 0, otherConfig: 0, noConfigHash: 0 };
  if (type.isNone(pages) || pages.length === 0) {
    return { items, skipped: 0, reasons, applicable: false };
  }
  const records = readRecords({ directories });
  const kept = items.filter((item) => {
    if (!type.isObject(item.journey) || declaredReach({ journey: item.journey, pages })) {
      return true;
    }
    const file = relativePosixPath({ from: directories.config, to: item.filePath });
    const entry = records?.[`${file}#${item.journey.name}`];
    if (type.isNone(entry)) {
      reasons.noRecord += 1;
      return true;
    }
    if (entry.hash !== hashJourney(item.journey)) {
      reasons.journeyChanged += 1;
      return true;
    }
    if (type.isNone(configHash) || type.isNone(entry.configHash)) {
      reasons.noConfigHash += 1;
      return true;
    }
    if (entry.configHash !== configHash) {
      reasons.otherConfig += 1;
      return true;
    }
    if (!type.isArray(entry.exercised?.pages)) {
      return true;
    }
    return entry.exercised.pages.some((pageId) => pages.includes(pageId));
  });
  return { items: kept, skipped: items.length - kept.length, reasons, applicable: true };
}

export default narrowBaseline;
