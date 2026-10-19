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

// A described segment without the compiler's working fields: what evidence,
// coverage and the production profile read.
function publicSegment(segment) {
  const { hash, sequence, steps, persons, orgs, roles, failure, session } = segment;
  return {
    hash,
    sequence,
    steps,
    persons,
    orgs,
    roles,
    failure,
    session,
    first_seen: segment.first_seen,
    last_seen: segment.last_seen,
    page_id: segment.page_id,
    pages: segment.pages,
    failure_path: segment.failure_path,
    frustrations: segment.frustrations,
    text_clicks: segment.text_clicks,
  };
}

export default publicSegment;
