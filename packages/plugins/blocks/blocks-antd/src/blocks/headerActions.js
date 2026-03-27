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
import { Avatar, Badge, Dropdown } from 'antd';
import { type } from '@lowdefy/helpers';

import { buildMenuItems, flattenLinks } from './buildMenuItems.js';

function getDarkMode() {
  return window.__lowdefy_isDark ?? false;
}

function getDarkModePreference() {
  return window.localStorage?.getItem('lowdefy_darkMode') ?? 'system';
}

function getDarkModeIcon() {
  const pref = getDarkModePreference();
  if (pref === 'dark') return 'AiOutlineSun';
  if (pref === 'light') return 'AiOutlineMoon';
  return 'AiOutlineLaptop';
}

function renderNotifications({
  blockId,
  classNames,
  styles,
  properties,
  events,
  Icon,
  Link,
  iconsColor,
}) {
  if (type.isNone(properties.notifications)) return null;
  const notif = properties.notifications;
  const badge = (
    <Badge
      count={notif.count}
      dot={notif.dot}
      showZero={notif.showZero}
      overflowCount={notif.overflowCount ?? 99}
      color={notif.color}
      className={classNames.notificationsBadge}
      style={styles.notificationsBadge}
      size="small"
    >
      <Icon
        blockId={`${blockId}_notifications_icon`}
        events={events}
        properties={notif.icon ?? { name: 'AiOutlineBell' }}
        styles={{ element: { fontSize: 16, color: iconsColor, ...styles.notificationsIcon } }}
      />
    </Badge>
  );
  const link = notif.link;
  if (link) {
    return (
      <Link
        id={`${blockId}_notifications_link`}
        pageId={link.pageId}
        url={link.url}
        newTab={link.newTab}
        className={classNames.notifications}
        style={{ lineHeight: 1, ...styles.notifications }}
      >
        {badge}
      </Link>
    );
  }
  return (
    <div className={classNames.notifications} style={{ lineHeight: 1, ...styles.notifications }}>
      {badge}
    </div>
  );
}

function renderProfile({
  blockId,
  classNames,
  styles,
  properties,
  methods,
  events,
  Icon,
  Link,
  ShortcutBadge,
}) {
  if (type.isNone(properties.profile)) return null;
  const prof = properties.profile;
  const avatarProps = prof.avatar ?? {};

  const avatar = (
    <Avatar
      id={`${blockId}_profile_avatar`}
      className={classNames.profileAvatar}
      style={{
        cursor: 'pointer',
        backgroundColor: !avatarProps.src && avatarProps.color,
        ...styles.profileAvatar,
      }}
      src={avatarProps.src}
      size={avatarProps.size ?? 'small'}
      shape={avatarProps.shape ?? 'circle'}
      icon={
        !avatarProps.src &&
        !avatarProps.content && (
          <Icon
            blockId={`${blockId}_profile_avatar_icon`}
            events={events}
            properties={avatarProps.icon ?? { name: 'AiOutlineUser' }}
          />
        )
      }
    >
      {avatarProps.content}
    </Avatar>
  );

  const links = prof.links ?? [];
  if (links.length === 0) {
    return (
      <div className={classNames.profile} style={styles.profile}>
        {avatar}
      </div>
    );
  }

  const items = buildMenuItems({
    links,
    components: { Icon, Link, ShortcutBadge },
    classNames,
    styles,
    events,
  });
  const linkMap = flattenLinks(links);

  return (
    <Dropdown
      className={classNames.profile}
      style={{ cursor: 'pointer', ...styles.profile }}
      menu={{
        items,
        onClick: ({ key, keyPath }) => {
          const link = linkMap[key];
          methods.triggerEvent({
            name: 'onProfileMenuClick',
            event: { key, keyPath, pageId: link?.pageId, url: link?.url },
          });
        },
      }}
      trigger={[prof.trigger ?? 'click']}
      placement={prof.placement ?? 'bottomRight'}
      arrow={prof.arrow}
      popupClassName={classNames.profileMenu}
      popupStyle={styles.profileMenu}
      onOpenChange={(open) =>
        methods.triggerEvent({
          name: 'onProfileMenuOpen',
          event: { open },
        })
      }
    >
      <div>{avatar}</div>
    </Dropdown>
  );
}

function renderDarkModeToggle({ blockId, classNames, styles, methods, events, Icon, iconsColor }) {
  return (
    <div
      className={classNames.darkModeToggle}
      style={{ cursor: 'pointer', lineHeight: 1, ...styles.darkModeToggle }}
      onClick={() => methods.triggerEvent({ name: '__toggleDarkMode' })}
    >
      <Icon
        blockId={`${blockId}_dark_mode_toggle_icon`}
        events={events}
        properties={{ name: getDarkModeIcon() }}
        styles={{ element: { fontSize: 16, color: iconsColor } }}
      />
    </div>
  );
}

function renderHeaderActions({
  blockId,
  classNames = {},
  styles = {},
  properties,
  methods,
  events,
  components: { Icon, Link, ShortcutBadge },
  iconsColor,
}) {
  const hasNotifications = !type.isNone(properties.notifications);
  const hasProfile = !type.isNone(properties.profile);
  const hasDarkMode = properties.darkModeToggle;

  if (!hasNotifications && !hasProfile && !hasDarkMode) return null;

  const ctx = {
    blockId,
    classNames,
    styles,
    properties,
    methods,
    events,
    Icon,
    Link,
    ShortcutBadge,
    iconsColor,
  };

  return (
    <div
      className={classNames.headerActions ?? 'flex items-center gap-4 ml-4'}
      style={styles.headerActions}
    >
      {hasNotifications && renderNotifications(ctx)}
      {hasProfile && renderProfile(ctx)}
      {hasDarkMode && renderDarkModeToggle(ctx)}
    </div>
  );
}

function registerDarkModeMethod(methods) {
  methods.registerEvent({
    name: '__toggleDarkMode',
    actions: [{ id: '__set_dark_mode', type: 'SetDarkMode' }],
  });
  methods.registerMethod('toggleDarkMode', () => {
    methods.triggerEvent({ name: '__toggleDarkMode' });
  });
}

export { getDarkMode, renderHeaderActions, registerDarkModeMethod };
