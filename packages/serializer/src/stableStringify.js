/* eslint-disable no-continue */
/* eslint-disable no-plusplus */
/* eslint-disable consistent-return */
/* eslint-disable no-param-reassign */

import type from '@lowdefy/type';

// https://github.com/substack/json-stable-stringify
// https://github.com/substack/json-stable-stringify/LICENCE

// This software is released under the MIT license:

// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
// the Software, and to permit persons to whom the Software is furnished to do so,
// subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

function stableStringify(obj, opts) {
  if (!opts) opts = {};
  if (typeof opts === 'function') opts = { cmp: opts };
  let space = opts.space || '';
  if (typeof space === 'number') space = Array(space + 1).join(' ');
  const cycles = typeof opts.cycles === 'boolean' ? opts.cycles : false;
  const replacer = opts.replacer || ((key, value) => value);
  const cmp =
    opts.cmp &&
    ((f) => {
      return (node) => {
        return (a, b) => {
          const aobj = { key: a, value: node[a] };
          const bobj = { key: b, value: node[b] };
          return f(aobj, bobj);
        };
      };
    })(opts.cmp);

  const seen = [];
  return (function stringify(parent, key, node, level) {
    const indent = space ? `\n${new Array(level + 1).join(space)}` : '';
    const colonSeparator = space ? ': ' : ':';

    if (node && node.toJSON && typeof node.toJSON === 'function') {
      node = node.toJSON();
    }

    node = replacer.call(parent, key, node);

    if (node === undefined) {
      return;
    }
    if (typeof node !== 'object' || node === null) {
      return JSON.stringify(node);
    }
    if (type.isArray(node)) {
      const out = [];
      for (let i = 0; i < node.length; i++) {
        const item = stringify(node, i, node[i], level + 1) || JSON.stringify(null);
        out.push(indent + space + item);
      }
      return `[${out.join(',')}${indent}]`;
    }
    if (seen.indexOf(node) !== -1) {
      if (cycles) return JSON.stringify('__cycle__');
      throw new TypeError('Converting circular structure to JSON');
    } else seen.push(node);

    const keys = Object.keys(node).sort(cmp && cmp(node));
    const out = [];
    for (let i = 0; i < keys.length; i++) {
      const ky = keys[i];
      const value = stringify(node, ky, node[ky], level + 1);

      if (!value) continue;

      const keyValue = JSON.stringify(ky) + colonSeparator + value;
      out.push(indent + space + keyValue);
    }
    seen.splice(seen.indexOf(node), 1);
    return `{${out.join(',')}${indent}}`;
  })({ '': obj }, '', obj, 0);
}

export default stableStringify;
