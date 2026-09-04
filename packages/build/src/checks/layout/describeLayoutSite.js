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

const DYNAMIC_ADVICE = 'Dynamic: convert to class: { _if: … } by hand.';
const FOOTER = 'layout: keeps working in v8. The "layout-to-containers" codemod does the rewrite.';

const FLEX_KEYS = ['flex', 'grow', 'shrink', 'size'];
const BREAKPOINT_KEYS = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
const ORDER_KEYS = ['order', 'push', 'pull'];

function has(keys, candidates) {
  return keys.some((key) => candidates.includes(key));
}

// One sentence per wrapper the site needs, in the order an author would apply
// them: the container first, then the classes that go on the children.
function buildAdvice(site) {
  const advice = [];
  const { areaKeys, columnDirection, itemKeys } = site;

  if (has(itemKeys, ['span', 'offset'])) {
    advice.push(
      'Wrap the siblings in a `Grid` (columns: 24) and set `class: col-span-N` on each child' +
        (itemKeys.includes('offset') ? ', with offset accumulated into `col-start-N`.' : '.')
    );
  }
  if (has(itemKeys, FLEX_KEYS)) {
    advice.push(
      'Wrap the siblings in a `Row` and express flex with Tailwind utilities (`grow`, `shrink-0`, `basis-1/3`, `w-64`).'
    );
  }
  if (columnDirection) {
    advice.push('Replace the column area with a `Stack`.');
  }
  if (itemKeys.includes('selfAlign')) {
    advice.push('Replace layout.selfAlign with a `self-*` class on the child.');
  }
  if (has(itemKeys, BREAKPOINT_KEYS)) {
    advice.push(
      'Responsive keys become responsive classes on the child (`md:col-span-8`, `lg:grow`).'
    );
  }
  if (has(itemKeys, ORDER_KEYS)) {
    advice.push('order, push and pull become `order-*` and `col-start-*` classes on the child.');
  }

  const containerKeys = areaKeys.filter((key) => key !== 'direction' && key !== 'overflow');
  if (containerKeys.length > 0) {
    advice.push(
      `Move ${containerKeys.join(', ')} onto the ${
        columnDirection ? '`Stack`' : '`Row`'
      } properties.`
    );
  }
  if (areaKeys.includes('overflow')) {
    advice.push('Set overflow with a class (`overflow-auto`, `overflow-hidden`).');
  }
  if (areaKeys.includes('direction') && !columnDirection) {
    advice.push('A row-direction area is a `Row`.');
  }
  return advice;
}

function describeLayoutSite(site) {
  const where = `Block "${site.blockId}" on page "${site.pageId}"`;

  if (site.dynamicLayout) {
    return `${where} has an operator-valued layout:. ${DYNAMIC_ADVICE} ${FOOTER}`;
  }

  const keys = site.keys.join(', ');
  const subject =
    site.scope === 'layout'
      ? `${where} uses layout: (${keys})`
      : `${where} sets area layout keys on ${site.scope} (${keys})`;

  const sentences = buildAdvice(site);
  if (site.dynamicKeys.length > 0) {
    const verb = site.dynamicKeys.length === 1 ? 'is' : 'are';
    sentences.push(`${site.dynamicKeys.join(', ')} ${verb} operator-valued. ${DYNAMIC_ADVICE}`);
  }
  return [`${subject}.`, ...sentences, FOOTER].join(' ');
}

export default describeLayoutSite;
