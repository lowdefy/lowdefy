#!/usr/bin/env node
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

/*
  Print the size of every skill in skills/: total lines, generated lines (between the markers)
  and hand-written recipe lines (from "## Recipe" to the end). The recipe count is the design's
  shrink metric - as the framework encodes a recipe, its lines here should fall.

  Usage:
    pnpm skills:metrics
*/

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import collectSkillMetrics, { formatSkillMetrics } from './lib/skills/collectSkillMetrics.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const metrics = collectSkillMetrics({ skillsDirectory: path.join(REPO_ROOT, 'skills') });
console.log(formatSkillMetrics(metrics));
