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

import commentText from './commentText.js';

const ORIGIN_HEADER = [
  'Recorded candidate, compiled by `lowdefy journeys compile`.',
  '`lowdefy test` does not run this directory. To promote it: move the file into',
  'tests/journeys/, name it something a human would recognise, add the fixtures it',
  'needs, and run `lowdefy test --update` to fill the expectations left unfilled.',
  '',
];

// `origin` is a comment rather than a key because the journey grammar owns the
// keys of a journey file, and a candidate has to validate as a journey the day
// it is promoted - moving the file is the whole promotion. Writing it as YAML
// inside the comment keeps it readable by a person and parsable on the next
// run, which is what D11's "updates origin counts for a known hash" needs.
function buildOriginComment({ origin }) {
  const body = YAML.stringify({ origin }, { lineWidth: 0 }).trimEnd();
  return commentText({ lines: [...ORIGIN_HEADER, ...body.split('\n')] });
}

export { ORIGIN_HEADER };

export default buildOriginComment;
