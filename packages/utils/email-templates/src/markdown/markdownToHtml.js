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

import MarkdownIt from 'markdown-it';

import defaultTheme from '../defaultTheme.js';

const headingStyles = {
  h1: 'margin:0 0 16px 0;font-size:22px;line-height:30px;color:#111111;',
  h2: 'margin:0 0 16px 0;font-size:18px;line-height:26px;color:#111111;',
  h3: 'margin:0 0 12px 0;font-size:16px;line-height:24px;color:#111111;',
};

function createStyledRule(getStyle) {
  return function styledRule(tokens, idx, options, env, self) {
    const style = getStyle(tokens[idx]);
    if (style) {
      tokens[idx].attrSet('style', style);
    }
    return self.renderToken(tokens, idx, options);
  };
}

function markdownToHtml({ markdown, theme }) {
  const primaryColor = theme?.primaryColor ?? defaultTheme.primaryColor;
  // html: false escapes raw HTML in the markdown to entities, so markdown can never
  // smuggle scripts or tags into the rendered email.
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false, breaks: true });

  md.renderer.rules.paragraph_open = createStyledRule(
    () => 'margin:0 0 16px 0;font-size:14px;line-height:22px;color:#333333;'
  );
  md.renderer.rules.bullet_list_open = createStyledRule(
    () => 'margin:0 0 16px 0;padding:0 0 0 24px;'
  );
  md.renderer.rules.ordered_list_open = createStyledRule(
    () => 'margin:0 0 16px 0;padding:0 0 0 24px;'
  );
  md.renderer.rules.list_item_open = createStyledRule(
    () => 'margin:0 0 4px 0;font-size:14px;line-height:22px;color:#333333;'
  );
  md.renderer.rules.blockquote_open = createStyledRule(
    () => 'margin:0 0 16px 0;padding:0 0 0 12px;border-left:3px solid #d9d9d9;color:#595959;'
  );
  md.renderer.rules.heading_open = createStyledRule((token) => headingStyles[token.tag]);
  md.renderer.rules.link_open = function linkOpen(tokens, idx, options, env, self) {
    tokens[idx].attrSet('style', `color:${primaryColor};`);
    tokens[idx].attrSet('target', '_blank');
    return self.renderToken(tokens, idx, options);
  };

  return md.render(markdown);
}

export default markdownToHtml;
