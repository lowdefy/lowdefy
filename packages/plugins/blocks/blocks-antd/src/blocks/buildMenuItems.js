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

function getTitle({ id, properties, pageId, url }) {
  return properties?.title ?? pageId ?? url ?? id;
}

function buildMenuItems({
  links,
  components: { Icon, Link, ShortcutBadge },
  classNames,
  styles,
  events,
}) {
  return (links ?? []).map((link, i) => {
    if (link.type === 'MenuDivider') {
      return {
        type: 'divider',
        key: link.id ?? i,
        dashed: link.properties?.dashed,
        style: link.style,
      };
    }

    if (link.type === 'MenuGroup') {
      return {
        key: link.id,
        label: getTitle(link),
        icon: link.properties?.icon ? (
          <Icon
            blockId={`${link.id}_icon`}
            classNames={{ element: classNames.itemIcon }}
            events={events}
            properties={link.properties.icon}
            styles={{ element: styles.itemIcon }}
          />
        ) : undefined,
        children: buildMenuItems({
          links: link.links,
          components: { Icon, Link, ShortcutBadge },
          classNames,
          styles,
          events,
        }),
      };
    }

    // MenuLink (default)
    return {
      key: link.id,
      danger: link.properties?.danger,
      disabled: link.properties?.disabled,
      icon: link.properties?.icon ? (
        <Icon
          blockId={`${link.id}_icon`}
          classNames={{ element: classNames.itemIcon }}
          events={events}
          properties={link.properties.icon}
          styles={{ element: styles.itemIcon }}
        />
      ) : undefined,
      label: (
        <Link
          id={link.pageId ?? link.id ?? i}
          style={link.style}
          url={link.url ?? link.properties?.url}
          newTab={link.newTab ?? link.properties?.newTab}
          {...link}
        >
          {getTitle(link)}
          <ShortcutBadge shortcut={link.properties?.shortcut} />
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
