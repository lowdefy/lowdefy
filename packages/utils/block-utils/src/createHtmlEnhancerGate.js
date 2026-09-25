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

// A test for HTML that names one of the enhancers' attributes. Whole names only,
// so a test hook like data-testid, or data-avatar-overlay next to data-avatar,
// keeps markup on the plain path.
function createHtmlEnhancerGate(enhancers) {
  const names = enhancers.flatMap((enhancer) => enhancer.attributes.map((name) => name.slice(5)));
  return new RegExp(`(?<![\\w-])data-(?:${names.join('|')})(?![\\w-])`, 'i');
}

export default createHtmlEnhancerGate;
