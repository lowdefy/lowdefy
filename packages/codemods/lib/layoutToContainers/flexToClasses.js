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

// layout.flex/grow/shrink/size are the flex item shorthand deriveLayout turns
// into a `flex:` style. The Tailwind equivalents are the same three parts, so
// the mapping is one class per part. A number `size` is px, matching
// deriveLayout's sanitizeSize.
function growClass(grow) {
  if (grow === true || grow === 1) return 'grow';
  if (grow === false || grow === 0) return 'grow-0';
  if (typeof grow === 'number') return `grow-[${grow}]`;
  return null;
}

function shrinkClass(shrink) {
  if (shrink === true || shrink === 1) return 'shrink';
  if (shrink === false || shrink === 0) return 'shrink-0';
  if (typeof shrink === 'number') return `shrink-[${shrink}]`;
  return null;
}

function sizeClass(size) {
  if (typeof size === 'number') return `basis-[${size}px]`;
  if (size === 'auto') return 'basis-auto';
  if (typeof size === 'string') return `basis-[${size}]`;
  return null;
}

function flexToClasses({ flex, grow, shrink, size }) {
  const classes = [];
  const unresolved = [];

  if (flex !== undefined) {
    // `flex: true` is deriveLayout's "0 1 auto", which is flex-initial.
    if (flex === true) classes.push('flex-initial');
    else if (typeof flex === 'string') classes.push(`flex-[${flex.trim().replace(/\s+/g, '_')}]`);
    else unresolved.push('flex');
    return { classes, unresolved };
  }

  [
    ['grow', grow, growClass],
    ['shrink', shrink, shrinkClass],
    ['size', size, sizeClass],
  ].forEach(([name, value, toClass]) => {
    if (value === undefined) return;
    const className = toClass(value);
    if (className === null) unresolved.push(name);
    else classes.push(className);
  });

  return { classes, unresolved };
}

export default flexToClasses;
