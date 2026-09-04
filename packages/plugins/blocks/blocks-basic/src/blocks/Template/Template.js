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

import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'dompurify';
import { blockRootProps, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';
import { createTemplateFunction } from '@lowdefy/nunjucks';

function renderTemplateHtml({ template, context }) {
  if (type.isNone(template)) return '';
  const render = createTemplateFunction(template);
  const value = type.isObject(context) ? context : { value: context };
  // DOMPurify keeps data-* attributes, so the {% slot %} markers survive; <style> and <script>
  // do not, which is why CSS goes through properties.css.
  return DOMPurify.sanitize(render(value));
}

// properties.css is written into a <style> inside a single scoping rule, so a value that closes
// more braces than it opens escapes the scope and styles the whole app. Config is trusted but css
// can be operator-valued, so the value is checked rather than assumed. Quoted CSS strings are
// opaque - content: "}" is legal.
function assertBalancedCss(css) {
  let depth = 0;
  let quote = null;
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;
    if (depth < 0) {
      throw new Error(
        `Template css has an unmatched "}" at position ${i}, which would break out of the block's style scope. Received ${JSON.stringify(
          css
        )}.`
      );
    }
  }
  if (depth !== 0) {
    throw new Error(`Template css has ${depth} unclosed "{". Received ${JSON.stringify(css)}.`);
  }
}

// Reads the slot markers out of newly rendered html, reusing the live node of any slot that was
// already on the page. A React portal remounts its children whenever its container node changes,
// so a template or context change would otherwise reset the state of every slotted block.
function attachHtml({ container, html, previousNodes }) {
  const staging = document.createElement('div');
  staging.innerHTML = html;
  staging.querySelectorAll('[data-ldf-slot]').forEach((marker) => {
    const kept = previousNodes[marker.getAttribute('data-ldf-slot')];
    if (kept) marker.replaceWith(kept);
  });
  container.replaceChildren(...staging.childNodes);
  const nodes = {};
  container.querySelectorAll('[data-ldf-slot]').forEach((node) => {
    nodes[node.getAttribute('data-ldf-slot')] = node;
  });
  return nodes;
}

const TemplateBlock = ({ blockId, classNames, content = {}, properties, styles }) => {
  const containerRef = useRef(null);
  const slotNodesRef = useRef({});
  const warnedSlotsRef = useRef(new Set());
  const [slotNodes, setSlotNodes] = useState({});
  const html = renderTemplateHtml({ template: properties.template, context: properties.context });

  useLayoutEffect(() => {
    const nodes = attachHtml({
      container: containerRef.current,
      html,
      previousNodes: slotNodesRef.current,
    });
    slotNodesRef.current = nodes;
    setSlotNodes(nodes);
    // A configured slot the template never places renders nothing at all, which looks like the
    // blocks failing rather than the name not matching.
    Object.keys(content).forEach((name) => {
      if (nodes[name] || warnedSlotsRef.current.has(name)) return;
      warnedSlotsRef.current.add(name);
      // eslint-disable-next-line no-console
      console.warn(
        `Template "${blockId}" has blocks configured under slots.${name}, but the rendered template has no {% slot "${name}" %}.`
      );
    });
  }, [html]);

  const hasCss = type.isString(properties.css) && properties.css.trim() !== '';
  if (hasCss) assertBalancedCss(properties.css);

  return (
    <div {...blockRootProps({ blockId, classNames, styles })}>
      {/* An attribute selector, not #bl-<id>: a blockId inside a List is dotted (rows.0.card), */}
      {/* which an id selector reads as an id plus two class names and matches nothing. */}
      {hasCss && <style>{`[id="bl-${blockId}"] { ${properties.css} }`}</style>}
      <div ref={containerRef} />
      {Object.keys(slotNodes).map((name) => {
        if (!content[name]) return null;
        return createPortal(content[name](), slotNodes[name], name);
      })}
    </div>
  );
};

export default withBlockDefaults(TemplateBlock);
