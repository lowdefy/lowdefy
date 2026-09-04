/* eslint-disable no-param-reassign */

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

import { getOperatorType, type } from '@lowdefy/helpers';
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

import archetypes from './registry.js';
import rekeyInstance from '../buildPages/buildBlock/rekeyInstance.js';
import validateComponentProps from '../buildPages/buildBlock/validateComponentProps.js';

// The consumer's own blocks, placed into the generated tree as they were
// authored. They are not clones, so they keep their keys.
function collectSlotFillers(slots) {
  const fillers = new Set();
  if (!type.isObject(slots)) return fillers;
  Object.values(slots).forEach((slot) => {
    if (!type.isObject(slot) || !type.isArray(slot.blocks)) return;
    slot.blocks.forEach((block) => {
      if (type.isObject(block)) fillers.add(block);
    });
  });
  return fillers;
}

// The config key an archetype declaration reads its props from. Named once so
// a future rename is a one-line change here rather than a sweep through every
// generator. Aligned with components (R10): archetypes read `props:`.
const ARCHETYPE_PROPS_KEY = 'props';

// Pre-rename key, kept working for one release with a ConfigWarning so an app
// written against the old `properties:` name is not broken by the rename.
const LEGACY_ARCHETYPE_PROPS_KEY = 'properties';

// The archetype expansion is allowed to change within a minor release, and
// `lowdefy expand` — the way out — is new. Until both the command and the
// escape-hatch slots have had a release to settle, an app opts in explicitly.
const EXPERIMENTAL_FLAG = 'config.experimental.archetypes';

function archetypesEnabled(context) {
  return context?.lowdefyConfig?.config?.experimental?.archetypes === true;
}

// Runs first in buildBlock (before expandComponent), so setBlockId, validateBlock
// and every other block step, plus buildSubBlocks' recursion, apply to the
// generated tree unchanged. A page whose root type is an archetype (ListPage,
// DetailPage, EditPage) is rewritten into its layout block carrying the
// generated blocks and page requests; the generated requests are picked up by
// buildRequests later in the same pipeline exactly as authored page requests
// are (design Decision 3).
function expandArchetype(block, pageContext) {
  if (!type.isObject(block)) return;
  const def = archetypes[block.type];
  if (type.isNone(def)) return;

  const configKey = block['~k'];
  const archetypeName = block.type;

  if (!archetypesEnabled(pageContext.context)) {
    throw new ConfigError(
      `Archetype "${archetypeName}" on page "${pageContext.pageId}" is experimental and must be enabled with "${EXPERIMENTAL_FLAG}: true". The block tree an archetype expands to may change within a minor release until "lowdefy expand" and the archetype slots are stable.`,
      { configKey, checkSlug: 'archetype' }
    );
  }

  // An archetype is a page, not a reusable block — its props are page concerns
  // (rowLink, filters). It may only be a page's root type.
  if (block.id !== pageContext.rootBlockId) {
    throw new ConfigError(
      `Archetype "${archetypeName}" can only be a page's root type, not a nested block "${block.id}" on page "${pageContext.pageId}".`,
      { configKey, checkSlug: 'archetype' }
    );
  }

  // The generator owns the root block's requests and events. Overwriting what
  // the author wrote there loses a page's own lookup request or onInit with no
  // warning, so the author is told to move it instead of losing it.
  ['requests', 'events'].forEach((key) => {
    if (type.isNone(block[key])) return;
    throw new ConfigError(
      `Archetype "${archetypeName}" on page "${pageContext.pageId}" generates the page's "${key}", so the page may not declare its own. Run "lowdefy expand ${pageContext.pageId}" to write the generated page out as ordinary config, then add "${key}" to it.`,
      { configKey, checkSlug: 'archetype' }
    );
  });

  let properties = {};
  if (type.isObject(block[ARCHETYPE_PROPS_KEY])) {
    properties = block[ARCHETYPE_PROPS_KEY];
  } else if (type.isObject(block[LEGACY_ARCHETYPE_PROPS_KEY])) {
    pageContext.context.handleWarning(
      new ConfigWarning(
        `Archetype "${archetypeName}" on page "${pageContext.pageId}" uses "properties:", which is deprecated for archetypes. Use "props:" instead.`,
        { configKey, checkSlug: 'archetype' }
      )
    );
    properties = block[LEGACY_ARCHETYPE_PROPS_KEY];
  }

  // An archetype expands at build — an operator can never be evaluated before
  // generation, so an operator-valued prop cannot be honoured. Failing loud
  // beats the silent wrongness of quietly falling back to the prop's default
  // (Decision 2). Operators nested inside object/array props (e.g. an
  // emptyState title) are fine: they flow into generated block properties and
  // evaluate at runtime.
  for (const [name, value] of Object.entries(properties)) {
    const operatorType = getOperatorType(value);
    if (operatorType !== null) {
      throw new ConfigError(
        `Archetype "${archetypeName}" prop "${name}" on page "${pageContext.pageId}" is an ` +
          `operator (${operatorType}). Archetype props are resolved at build time and must be ` +
          `literal values.`,
        { configKey, checkSlug: 'archetype' }
      );
    }
  }

  // Reuse the task-50 component prop validator: required/unknown/typed checks
  // with "did you mean", in the module-var shape the archetype props declare.
  validateComponentProps({
    def: { id: archetypeName, props: def.props },
    useProps: properties,
    instanceId: pageContext.pageId,
    configKey,
    context: pageContext.context,
  });

  const slotFillers = collectSlotFillers(block.slots);

  const { layoutType, layoutProperties, events, requests, blocks } = def.generate({
    properties,
    slots: block.slots,
    pageId: pageContext.pageId,
    collections: pageContext.context.collections,
    configKey,
  });

  block.type = layoutType;
  // The layout block's own properties — a block key, not the archetype's props
  // key, even when the two happen to share a name today.
  block.properties = layoutProperties;
  block.blocks = blocks;
  block.requests = requests;
  block.events = events;
  delete block.props;
  delete block.slots;
  delete block.areas;

  // A generator reads the author's props and may place one prop node at more
  // than one site in the tree it generates. Those nodes carry the author's ~k,
  // so each site is given a key of its own that still resolves to the prop's
  // line. Generated nodes with no key of their own are keyed by the next
  // addKeys pass, as before.
  rekeyInstance({
    tree: {
      blocks: block.blocks,
      events: block.events,
      properties: block.properties,
      requests: block.requests,
    },
    instanceKey: configKey,
    keyMap: pageContext.context.keyMap,
    skip: slotFillers,
  });
}

export { ARCHETYPE_PROPS_KEY, LEGACY_ARCHETYPE_PROPS_KEY, EXPERIMENTAL_FLAG };
export default expandArchetype;
