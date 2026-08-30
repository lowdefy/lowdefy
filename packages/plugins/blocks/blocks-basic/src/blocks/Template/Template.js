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
import { withBlockDefaults } from '@lowdefy/block-utils';
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

const TemplateBlock = ({ blockId, classNames, content = {}, properties, styles }) => {
  const containerRef = useRef(null);
  const [slotNodes, setSlotNodes] = useState({});
  const html = renderTemplateHtml({ template: properties.template, context: properties.context });

  // Assigning innerHTML destroys the previous slot containers, so the portal targets are
  // re-read from the new DOM on every change of the rendered html.
  useLayoutEffect(() => {
    const el = containerRef.current;
    el.innerHTML = html;
    const nodes = {};
    el.querySelectorAll('[data-ldf-slot]').forEach((node) => {
      nodes[node.getAttribute('data-ldf-slot')] = node;
    });
    setSlotNodes(nodes);
  }, [html]);

  const hasCss = type.isString(properties.css) && properties.css.trim() !== '';

  return (
    <div id={blockId} data-testid={blockId} className={classNames?.element} style={styles?.element}>
      {hasCss && <style>{`#bl-${blockId} { ${properties.css} }`}</style>}
      <div ref={containerRef} />
      {Object.keys(slotNodes).map((name) => {
        if (!content[name]) return null;
        return createPortal(content[name](), slotNodes[name], name);
      })}
    </div>
  );
};

export default withBlockDefaults(TemplateBlock);
