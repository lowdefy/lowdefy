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

import React from 'react';
import { cn } from '@lowdefy/block-utils';

import normalizeItemClassAndStyle from './normalizeItemClassAndStyle.js';

function getTitle({ id, properties, pageId, url }) {
  return properties?.title ?? pageId ?? url ?? id;
}

function defaultGetKey(link) {
  return link.id;
}

function buildMenuItems({
  links,
  components: { Icon, Link, ShortcutBadge },
  classNames,
  styles,
  events,
  isTopLevel = true,
  wrapGroupLabel,
  nestedGroupAsGroup = false,
  getKey = defaultGetKey,
}) {
  return (links ?? []).map((link, i) => {
    const item = normalizeItemClassAndStyle(link);

    if (link.type === 'MenuDivider') {
      return {
        type: 'divider',
        key: link.id ?? i,
        dashed: link.properties?.dashed,
        className: cn(classNames?.item, item.class.element) || undefined,
        style: item.style.element,
      };
    }

    if (link.type === 'MenuGroup') {
      const labelText = getTitle(link);
      const groupLabel = wrapGroupLabel
        ? wrapGroupLabel({ link, labelText, classNames: item.class.label, styles: item.style.label })
        : labelText;
      const renderAsGroup = !isTopLevel && nestedGroupAsGroup;
      const groupItem = {
        key: getKey(link),
        label: groupLabel,
        className: cn(classNames?.item, item.class.element) || undefined,
        style: item.style.element,
        children: buildMenuItems({
          links: link.links,
          components: { Icon, Link, ShortcutBadge },
          classNames,
          styles,
          events,
          isTopLevel: false,
          wrapGroupLabel,
          nestedGroupAsGroup,
          getKey,
        }),
      };
      if (renderAsGroup) {
        // antd MenuItemGroupType supports neither icon, disabled, title, nor popupClassName.
        groupItem.type = 'group';
        return groupItem;
      }
      // SubMenu — supports icon, disabled, title (tooltip when collapsed), popupClassName.
      groupItem.disabled = link.properties?.disabled;
      groupItem.title = link.properties?.tooltip;
      if (link.properties?.icon) {
        groupItem.icon = (
          <Icon
            blockId={`${link.id}_icon`}
            classNames={{ element: cn(classNames?.itemIcon, item.class.icon) || undefined }}
            events={events}
            properties={link.properties.icon}
            styles={{ element: { ...styles?.itemIcon, ...item.style.icon } }}
          />
        );
      }
      if (item.class.popup) groupItem.popupClassName = item.class.popup;
      return groupItem;
    }

    // MenuLink (default)
    // Strip class/style from the spread so slot-keyed values don't reach Link as raw props.
    const { class: _omitClass, style: _omitStyle, ...linkRest } = link;
    const extra = link.properties?.extra;
    // antd v6's `extra` prop triggers a `display: inline-flex; width: 100%` layout
    // on `.ant-menu-title-content-with-extra` that interacts badly with the Lowdefy
    // `<Link>` wrapper (collapses the label). Render extra ourselves inside the Link
    // using float, which works regardless of the parent's display mode.
    return {
      key: getKey(link),
      danger: link.properties?.danger,
      disabled: link.properties?.disabled,
      title: link.properties?.tooltip,
      className: cn(classNames?.item, item.class.element) || undefined,
      style: item.style.element,
      icon: link.properties?.icon ? (
        <Icon
          blockId={`${link.id}_icon`}
          classNames={{ element: cn(classNames?.itemIcon, item.class.icon) || undefined }}
          events={events}
          properties={link.properties.icon}
          styles={{ element: { ...styles?.itemIcon, ...item.style.icon } }}
        />
      ) : undefined,
      label: (
        <Link
          {...linkRest}
          id={link.pageId ?? link.id ?? i}
          className={item.class.label || undefined}
          style={item.style.label}
          url={link.url ?? link.properties?.url}
          newTab={link.newTab ?? link.properties?.newTab}
        >
          {/*
            Both the shortcut badge and `extra` float right. Multiple floated-right
            elements stack in source order — the FIRST appears furthest right — so
            we render the shortcut badge first to keep it on the far right, with
            `extra` to its left. The title stays in normal inline flow on the left.
          */}
          {link.properties?.shortcut ? (
            <span style={{ float: 'right', marginInlineStart: 12 }}>
              <ShortcutBadge shortcut={link.properties.shortcut} />
            </span>
          ) : null}
          {extra ? (
            <span
              style={{
                float: 'right',
                marginInlineStart: 12,
                opacity: 0.65,
                fontSize: '0.9em',
                pointerEvents: 'none',
              }}
            >
              {extra}
            </span>
          ) : null}
          {getTitle(link)}
        </Link>
      ),
    };
  });
}

function flattenLinks(links) {
  const map = {};
  (links ?? []).forEach((link) => {
    map[link.id] = link;
    if (link.links) {
      Object.assign(map, flattenLinks(link.links));
    }
  });
  return map;
}

export { buildMenuItems, flattenLinks, getTitle };
