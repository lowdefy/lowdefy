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

import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import { readVariantHeader } from './writeVariantHeader.js';

// Whose variant a file is: the source its header names and the journey its
// variant.of names. It is owned by a run of that source and journey, and the
// writer and the stale-file sweep both decide with this one test. A file with
// no generated header (written or rewritten by hand) is owned by no run.
// Returns { owned, edited, source, name }, source and name null when unknown.
function readVariantOwnership({ text, source, journey }) {
  const header = readVariantHeader(text);
  if (type.isNull(header)) {
    return { owned: false, edited: true, source: null, name: null };
  }
  // parseDocument collects errors instead of throwing, so an edited file
  // whose YAML no longer parses still reads as someone's file.
  const name = YAML.parseDocument(text).getIn(['variant', 'of']) ?? null;
  return {
    owned: header.source === source && name === journey.name,
    edited: header.edited,
    source: header.source,
    name,
  };
}

export default readVariantOwnership;
