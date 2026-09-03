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

// llms.txt lists Concepts/Tutorial first so agents land on core concepts and the
// tutorial before the long, alphabetical block/operator/action reference sections.
const SECTION_PRIORITY = ['Concepts', 'Tutorial'];

function groupDocsBySection(docs) {
  const sections = new Map();
  docs.forEach((doc) => {
    if (!sections.has(doc.section)) {
      sections.set(doc.section, []);
    }
    sections.get(doc.section).push(doc);
  });

  const orderedSectionNames = [
    ...SECTION_PRIORITY.filter((section) => sections.has(section)),
    ...[...sections.keys()].filter((section) => !SECTION_PRIORITY.includes(section)),
  ];

  return orderedSectionNames.map((section) => ({ section, docs: sections.get(section) }));
}

export default groupDocsBySection;
