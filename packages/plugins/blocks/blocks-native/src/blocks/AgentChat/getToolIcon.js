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

import { type } from '@lowdefy/helpers';

// By the verb a tool's name starts with: an SF Symbol, and the Lucide icon drawn where there are
// no SF Symbols. Listed in meta.icons.
const ICONS = [
  {
    verbs: ['search', 'find', 'list', 'lookup', 'query'],
    symbol: 'magnifyingglass',
    fallback: 'Search',
  },
  {
    verbs: ['get', 'read', 'fetch', 'load', 'open', 'whoami'],
    symbol: 'doc.text',
    fallback: 'FileText',
  },
  {
    verbs: [
      'write',
      'create',
      'add',
      'update',
      'save',
      'set',
      'edit',
      'log',
      'file',
      'reply',
      'answer',
    ],
    symbol: 'square.and.pencil',
    fallback: 'SquarePen',
  },
  { verbs: ['delete', 'remove', 'archive'], symbol: 'trash', fallback: 'Trash2' },
  { verbs: ['send', 'notify', 'email', 'message'], symbol: 'paperplane', fallback: 'Send' },
];
const PAGE_STATE = { symbol: 'slider.horizontal.3', fallback: 'SlidersHorizontal' };
const SUB_AGENT = { symbol: 'sparkles', fallback: 'Sparkles' };
const DEFAULT = { symbol: 'wrench.and.screwdriver', fallback: 'Wrench' };

/**
 * The glyph of a tool call's card, from what the tool does as its name says.
 *
 * @param {Object} params
 * @param {string} params.toolName
 * @param {boolean} [params.isSubAgent] The call ran another agent.
 * @returns {{ symbol: string, fallback: string }}
 */
function getToolIcon({ isSubAgent = false, toolName }) {
  if (isSubAgent) return SUB_AGENT;
  if (toolName === 'update-page-state') return PAGE_STATE;
  if (!type.isString(toolName)) return DEFAULT;
  const firstWord = toolName
    .split('__')
    .pop()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_\-./:]+/)[0]
    .toLowerCase();
  const match = ICONS.find(({ verbs }) => verbs.includes(firstWord));
  if (match === undefined) return DEFAULT;
  return { symbol: match.symbol, fallback: match.fallback };
}

export default getToolIcon;
