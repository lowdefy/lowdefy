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
import path from 'path';

import readExercised from '../../test/readExercised.js';
import getExercisedPath from '../../test/getExercisedPath.js';
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

function recordedBuildId({ directories }) {
  try {
    return JSON.parse(fs.readFileSync(getExercisedPath({ directories }), 'utf8')).buildId ?? null;
  } catch {
    return null;
  }
}

// With --page, only a journey that can reach one of those pages can kill a
// mutant on them (scopeMutants keeps a mutant for the journeys whose baseline
// exercised it), so the rest need no baseline run. A journey stays in the
// baseline unless its last measured run (.lowdefy/test/exercised.json) is
// current and shows it touched none of the pages, and its own pageId and goto
// steps name none either. Any doubt keeps it: no pages given, no record for
// the journey, a record from a changed journey, or one measured on a build
// other than the one being served, which keeps every journey.
function narrowBaseline({ items, pages, directories, buildId }) {
  if (type.isNone(pages) || pages.length === 0) {
    return { items, skipped: 0 };
  }
  if (type.isNone(buildId) || recordedBuildId({ directories }) !== buildId) {
    return { items, skipped: 0 };
  }
  const kept = items.filter((item) => {
    if (!type.isObject(item.journey) || declaredReach({ journey: item.journey, pages })) {
      return true;
    }
    const entry = readExercised({
      directories,
      file: path.relative(directories.config, item.filePath),
      journey: item.journey,
    });
    if (type.isNone(entry) || !type.isArray(entry.exercised?.pages)) {
      return true;
    }
    return entry.exercised.pages.some((pageId) => pages.includes(pageId));
  });
  return { items: kept, skipped: items.length - kept.length };
}

export default narrowBaseline;
