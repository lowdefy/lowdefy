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

function describeQuery(candidate) {
  const parts = [];
  if (candidate.equality.length > 0) {
    parts.push(`equality on ${candidate.equality.map((key) => key.field).join(', ')}`);
  }
  if (candidate.sort.length > 0) {
    parts.push(`a sort on ${candidate.sort.map((key) => key.field).join(', ')}`);
  }
  if (candidate.range.length > 0) {
    parts.push(`a range on ${candidate.range.map((key) => key.field).join(', ')}`);
  }
  return parts.join(' with ');
}

export default describeQuery;
