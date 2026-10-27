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
import { ConfigError } from '@lowdefy/errors';

import collectExceptions from '../../utils/collectExceptions.js';

function suggestNativeType(blockType) {
  if (blockType.startsWith('AgGrid') || blockType === 'Table') {
    return ' Use "List" with "ListItem" on mobile.';
  }
  return '';
}

function sharedPageNote({ page }) {
  if (page.target !== 'both') {
    return '';
  }
  return ' The page is in both "pages" and "mobile.pages", so each type it uses must exist on web and on mobile.';
}

// A shell renders a shell plugin's native type only when it carries the
// plugin, and a page goes to every shell, so each shell must list the package.
// Built-in @lowdefy/* types are in every shell. An app with no shells skips this.
function findShellWithoutPlugin({ definition, context }) {
  const packageName = definition.package;
  if (!type.isString(packageName) || packageName.startsWith('@lowdefy/')) {
    return null;
  }
  return (context.mobileShells ?? []).find((shell) => !shell.plugins.includes(packageName)) ?? null;
}

function shellPluginMessage({ packageName, shell }) {
  return `comes from shell plugin "${packageName}", which mobile shell "${shell.id}" does not list in its "plugins". A mobile page may use a shell plugin's types only when every shell carries the plugin.`;
}

function walkBlocks(block, visit) {
  visit(block);
  Object.values(block.slots ?? {}).forEach((slot) => {
    (slot.blocks ?? []).forEach((child) => walkBlocks(child, visit));
  });
}

// A shared page is one config rendered by two block sets, so a type must mean
// the same on both: the same category (display, input, container, list) and
// the same value type, or state written on one surface breaks the other.
function checkSharedBlockMeta({ block, page, context }) {
  const webMeta = context.blockMetas[block.type] ?? {};
  const nativeMeta = context.blockMetasMobile[block.type] ?? {};
  const webValueType = webMeta.valueType ?? null;
  const nativeValueType = nativeMeta.valueType ?? null;
  if (webMeta.category === nativeMeta.category && webValueType === nativeValueType) {
    return;
  }
  collectExceptions(
    context,
    new ConfigError(
      `Block type "${block.type}" on block "${block.blockId}" on shared page "${page.pageId}" differs between web and mobile: web is category "${webMeta.category}" with value type "${webValueType}", mobile is category "${nativeMeta.category}" with value type "${nativeValueType}".`,
      { configKey: block['~k'], checkSlug: 'types' }
    )
  );
}

// A shell renders only the types it carries, so a mobile page (or a page shared
// with mobile) that uses a type with no native version fails the build here,
// naming the page and block. buildTypesMobile builds the native type stores
// from the counted types and leaves these out.
function validateNativePageTypes({ page, pageCounters, context }) {
  const nativeTypes = context.typesMapMobile;
  walkBlocks(page, (block) => {
    if (!type.isString(block.type)) {
      return;
    }
    if (!nativeTypes.blocks[block.type]) {
      collectExceptions(
        context,
        new ConfigError(
          `Block type "${block.type}" on block "${block.blockId}" on page "${
            page.pageId
          }" has no native version, so a mobile shell cannot render it.${suggestNativeType(
            block.type
          )}${sharedPageNote({ page })}`,
          { configKey: block['~k'], checkSlug: 'types' }
        )
      );
      return;
    }
    const shell = findShellWithoutPlugin({ definition: nativeTypes.blocks[block.type], context });
    if (shell) {
      collectExceptions(
        context,
        new ConfigError(
          `Block type "${block.type}" on block "${block.blockId}" on page "${
            page.pageId
          }" ${shellPluginMessage({ packageName: nativeTypes.blocks[block.type].package, shell })}`,
          { configKey: block['~k'], checkSlug: 'types' }
        )
      );
      return;
    }
    if (page.target === 'both') {
      checkSharedBlockMeta({ block, page, context });
    }
  });
  Object.keys(pageCounters.actions.getCounts()).forEach((actionType) => {
    if (nativeTypes.actions[actionType]) {
      const shell = findShellWithoutPlugin({
        definition: nativeTypes.actions[actionType],
        context,
      });
      if (shell) {
        collectExceptions(
          context,
          new ConfigError(
            `Action type "${actionType}" on page "${page.pageId}" ${shellPluginMessage({
              packageName: nativeTypes.actions[actionType].package,
              shell,
            })}`,
            { configKey: pageCounters.actions.getLocation(actionType), checkSlug: 'types' }
          )
        );
      }
      return;
    }
    collectExceptions(
      context,
      new ConfigError(
        `Action type "${actionType}" on page "${
          page.pageId
        }" has no native version, so a mobile shell cannot run it.${sharedPageNote({ page })}`,
        { configKey: pageCounters.actions.getLocation(actionType), checkSlug: 'types' }
      )
    );
  });
}

export default validateNativePageTypes;
