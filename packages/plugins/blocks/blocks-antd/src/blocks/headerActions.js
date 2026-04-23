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
  if (pref === 'dark') return 'AiOutlineMoon';
  if (pref === 'light') return 'AiOutlineSun';
  return 'AiOutlineLaptop';
}

function getDarkModeLabel() {
  const pref = getDarkModePreference();
  if (pref === 'dark') return 'Dark mode';
  if (pref === 'light') return 'Light mode';
  return 'System';
}

// Wraps a header action row for the expanded sider. Icon cell has a fixed
// basis so bell / avatar / sun share a vertical line regardless of their
// own intrinsic size; label fills the remaining width. Row gets a subtle
// hover background so it reads as interactive (matches menu items above).
const EXPANDED_ROW_BASE = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 12px',
  width: '100%',
  borderRadius: 6,
  transition: 'background 0.15s',
};

const EXPANDED_ROW_BUTTON_RESET = {
  background: 'transparent',
  border: 'none',
  textAlign: 'left',
  font: 'inherit',
  color: 'inherit',
};

function ExpandedRow({ children, label, className, style, onClick }) {
  // `onClick` is only used when the row stands alone as the click target
  // (e.g., dark-mode toggle). Notifications wraps this in a <Link> and
  // profile wraps it in a <Dropdown> — in those cases interactivity comes
  // from the parent, but the row should still hover-highlight.
  const Tag = onClick ? 'button' : 'div';
  const [hover, setHover] = React.useState(false);
  const rowStyle = {
    ...EXPANDED_ROW_BASE,
    cursor: 'pointer',
    ...(onClick ? EXPANDED_ROW_BUTTON_RESET : null),
    ...(hover
      ? { background: 'color-mix(in srgb, var(--ant-color-text) 6%, transparent)' }
      : null),
    ...style,
  };
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={className}
      style={rowStyle}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: '0 0 24px',
          lineHeight: 1,
        }}
      >
        {children}
      </span>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </span>
    </Tag>
  );
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
  expanded,
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
  if (expanded) {
    const row = (
      <ExpandedRow
        className={classNames.notifications}
        style={styles.notifications}
        label={notif.title ?? 'Notifications'}
      >
        {badge}
      </ExpandedRow>
    );
    if (link) {
      return (
        <Link
          id={`${blockId}_notifications_link`}
          pageId={link.pageId}
          url={link.url}
          newTab={link.newTab}
          style={{ display: 'block', color: 'inherit' }}
        >
          {row}
        </Link>
      );
    }
    return row;
  }
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
  expanded,
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

  const trigger = expanded ? (
    <ExpandedRow
      className={classNames.profile}
      style={styles.profile}
      label={prof.title ?? 'Profile'}
    >
      {avatar}
    </ExpandedRow>
  ) : (
    <div className={classNames.profile} style={styles.profile}>
      {avatar}
    </div>
  );

  const links = prof.links ?? [];
  if (links.length === 0) {
    return trigger;
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
      style={{ cursor: 'pointer' }}
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
      // Row-style trigger (expanded) expects click; small avatar (collapsed) uses hover.
      trigger={[prof.trigger ?? (expanded ? 'click' : 'hover')]}
      placement={prof.placement ?? (expanded ? 'topRight' : 'bottomRight')}
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
      {/* Antd Dropdown attaches its trigger handlers to the immediate child
          DOM element; wrapping in a div (instead of passing the ExpandedRow
          function component directly) ensures click/hover listeners land. */}
      <div>{trigger}</div>
    </Dropdown>
  );
}

function renderDarkModeToggle({
  blockId,
  classNames,
  styles,
  methods,
  events,
  Icon,
  iconsColor,
  expanded,
}) {
  const icon = (
    <Icon
      blockId={`${blockId}_dark_mode_toggle_icon`}
      events={events}
      properties={{ name: getDarkModeIcon() }}
      styles={{ element: { fontSize: 16, color: iconsColor } }}
    />
  );
  if (expanded) {
    return (
      <ExpandedRow
        className={classNames.darkModeToggle}
        style={styles.darkModeToggle}
        label={getDarkModeLabel()}
        onClick={() => methods.triggerEvent({ name: '__toggleDarkMode' })}
      >
        {icon}
      </ExpandedRow>
    );
  }
  return (
    <div
      className={classNames.darkModeToggle}
      style={{ cursor: 'pointer', lineHeight: 1, ...styles.darkModeToggle }}
      onClick={() => methods.triggerEvent({ name: '__toggleDarkMode' })}
    >
      {icon}
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
  expanded = false,
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
    expanded,
  };

  const defaultClassName = expanded
    ? 'flex flex-col items-stretch gap-1 w-full'
    : 'flex items-center gap-4 ml-4';

  return (
    <div
      className={classNames.headerActions ?? defaultClassName}
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
