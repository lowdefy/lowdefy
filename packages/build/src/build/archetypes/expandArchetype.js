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
import { ConfigError } from '@lowdefy/errors';

import archetypes from './registry.js';
import validateComponentProps from '../buildPages/buildBlock/validateComponentProps.js';

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

  // An archetype is a page, not a reusable block — its props are page concerns
  // (rowLink, filters). It may only be a page's root type.
  if (block.id !== pageContext.rootBlockId) {
    throw new ConfigError(
      `Archetype "${archetypeName}" can only be a page's root type, not a nested block "${block.id}" on page "${pageContext.pageId}".`,
      { configKey, checkSlug: 'archetype' }
    );
  }

  const properties = type.isObject(block.properties) ? block.properties : {};

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

  const { layoutType, layoutProperties, events, requests, blocks } = def.generate({
    properties,
    pageId: pageContext.pageId,
    collections: pageContext.context.collections,
    configKey,
  });

  block.type = layoutType;
  block.properties = layoutProperties;
  block.blocks = blocks;
  block.requests = requests;
  block.events = events;
  delete block.props;
  delete block.slots;
  delete block.areas;
}

export default expandArchetype;
