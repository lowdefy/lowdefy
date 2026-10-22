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

import React, { useEffect, useRef, useState } from 'react';
import { Avatar, Drawer, Dropdown, Tooltip } from 'antd';
import { cn, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import { buildMenuItems, flattenLinks } from '../buildMenuItems.js';
import getDropdownMenuIcons from '../getDropdownMenuIcons.js';
import { getDarkModeIcon, getDarkModeLabel, registerDarkModeMethod } from '../headerActions.js';
import useItemShortcuts from '../useItemShortcuts.js';
import withPageTheme from '../withPageTheme.js';
import { getPanelLimits } from './clampPanelWidth.js';
import Crumbs from './Crumbs.js';
import Mark from './Mark.js';
import PanelResizeHandle, { PANEL_WIDTH_VAR } from './PanelResizeHandle.js';
import getBadge from './getBadge.js';
import { getPlaceBadge, getPlaceKey } from './placeKeys.js';
import RailItem from './RailItem.js';
import SwitcherList from './SwitcherList.js';
import useLayoutMode from './useLayoutMode.js';
import usePanelState from './usePanelState.js';
import useSwipeToClose from './useSwipeToClose.js';
import './style.css';

const DARK_MODE_KEY = '__lf_dark_mode';
const DEFAULT_SHORTCUT = 'mod+\\';
const contentPadding = { default: '24px 32px 40px', compact: '16px', none: 0 };

const isMac =
  typeof navigator !== 'undefined' &&
  (navigator.userAgentData?.platform === 'macOS' ||
    /Mac|iPhone|iPad|iPod/.test(navigator.platform ?? ''));

function shortcutLabel(shortcut) {
  if (!shortcut) return null;
  return shortcut
    .split('+')
    .map((part) => {
      const key = part.toLowerCase();
      if (key === 'mod') return isMac ? '⌘' : 'Ctrl+';
      if (key === 'shift') return isMac ? '⇧' : 'Shift+';
      if (key === 'alt') return isMac ? '⌥' : 'Alt+';
      if (key === 'ctrl') return isMac ? '⌃' : 'Ctrl+';
      return part.length === 1 ? part.toUpperCase() : part;
    })
    .join('');
}

function getPlaces({ menus, menu }) {
  let links = menu?.links;
  if (!type.isArray(links)) {
    const found = (menus ?? []).find((item) => item.menuId === (menu?.menuId ?? 'default'));
    links = (found ?? menus?.[0] ?? {}).links;
  }
  // A place is one link: the panel, not a group in the rail, is where a place's pages go.
  return (links ?? []).filter((link) => !link.type || link.type === 'MenuLink');
}

function getLinkTarget(link) {
  return {
    pageId: link.pageId,
    url: link.url ?? link.properties?.url,
    newTab: link.newTab ?? link.properties?.newTab,
    urlQuery: link.urlQuery,
  };
}

function PageRailLayout({
  blockId,
  classNames = {},
  components,
  content,
  events,
  menus,
  methods,
  pageId,
  properties,
  styles = {},
}) {
  const { Icon, Link } = components;
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);

  const panelProps = properties.panel ?? {};
  const limits = getPanelLimits(panelProps);
  const mode = useLayoutMode({
    drawerBreakpoint: panelProps.drawerBreakpoint ?? 1100,
    mobileBreakpoint: properties.mobileBreakpoint ?? 768,
  });
  const isPhone = mode === 'phone';
  const hasPanel = !!content.panel;
  const panel = usePanelState({ methods, panel: panelProps, limits, mode });
  const panelOpen = hasPanel && panel.open;
  const [moreOpen, setMoreOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  const places = getPlaces({ menus, menu: properties.menu });
  const selectedKeys = properties.menu?.selectedKeys ?? [pageId];
  const badges = properties.badges ?? {};
  const footItems = properties.footItems ?? [];
  const notifications = properties.notifications;
  const profile = properties.profile;
  const crumbs = (properties.crumbs ?? []).filter((crumb) => crumb && crumb.label !== undefined);
  const switchers = crumbs.filter((crumb) => crumb.switcher);
  const toggleShortcut =
    panelProps.shortcut === null ? null : panelProps.shortcut ?? DEFAULT_SHORTCUT;
  const isActive = (link) => selectedKeys.includes(link.pageId ?? link.id);

  // Methods, re-registered each render so they act on the current state.
  const latest = useRef({});
  latest.current = { panel };
  useEffect(() => {
    registerDarkModeMethod(methods);
    methods.registerMethod('openPanel', () => latest.current.panel.setOpen(true, 'method'));
    methods.registerMethod('closePanel', () => latest.current.panel.setOpen(false, 'method'));
    methods.registerMethod('togglePanel', () => latest.current.panel.toggle('method'));
  }, []);

  useEffect(() => {
    if (mode !== 'phone') {
      setMoreOpen(false);
      setContextOpen(false);
    }
  }, [mode]);

  // A drawer takes focus when it opens and gives it back to the toggle when it closes; Escape
  // closes it.
  useEffect(() => {
    if (!panel.isDrawer || !hasPanel) return undefined;
    if (panel.open) {
      const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
      const onKey = (event) => {
        if (event.key === 'Escape') panel.setOpen(false, 'escape');
      };
      window.addEventListener('keydown', onKey);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('keydown', onKey);
      };
    }
    if (panelRef.current?.contains(document.activeElement))
      toggleRef.current?.focus({ preventScroll: true });
    return undefined;
  }, [panel.open, panel.isDrawer, hasPanel]);

  useItemShortcuts({
    items: [
      ...(hasPanel && toggleShortcut ? [{ key: '__panel', shortcut: toggleShortcut }] : []),
      ...places
        .filter((link) => link.properties?.shortcut)
        .map((link) => ({ key: getPlaceKey(link), shortcut: link.properties.shortcut })),
    ],
    onMatch: (key) => {
      if (key === '__panel') {
        latest.current.panel.toggle('shortcut');
        return;
      }
      document.getElementById(`${blockId}_place_${key}`)?.click();
    },
  });

  const swipe = useSwipeToClose({
    enabled: panel.isDrawer && panelOpen,
    onClose: (source) => panel.setOpen(false, source),
    rootRef,
    target: panelRef,
  });

  function placeProps(link, index) {
    const key = link.pageId ?? link.id;
    return {
      active: isActive(link),
      badge: getPlaceBadge(badges, link),
      blockId: `${blockId}_place_${getPlaceKey(link)}`,
      components,
      events,
      icon: link.properties?.icon,
      link: getLinkTarget(link),
      shortcutLabel: shortcutLabel(link.properties?.shortcut),
      tip: link.properties?.tip ?? link.properties?.tooltip,
      title: link.properties?.title ?? link.pageId ?? link.id,
      hideTip: isPhone,
      onClick: (event) => {
        setMoreOpen(false);
        // The place already open toggles its panel instead of reloading the page.
        if (hasPanel && link.pageId === pageId && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          panel.toggle('rail');
          return;
        }
        methods.triggerEvent({ name: 'onMenuItemClick', event: { key, keyPath: [key], index } });
      },
    };
  }

  function footItemProps(item) {
    return {
      badge: item.badge,
      blockId: `${blockId}_foot_${item.id}`,
      components,
      events,
      hideTip: isPhone,
      icon: item.icon,
      link: getLinkTarget(item),
      shortcutLabel: shortcutLabel(item.shortcut),
      tip: item.tip,
      title: item.title,
      onClick: () => {
        setMoreOpen(false);
        if (!item.pageId && !item.url) {
          methods.triggerEvent({ name: 'onFootItemClick', event: { id: item.id } });
        }
      },
    };
  }

  function notificationsProps() {
    return {
      badge: {
        count: notifications.count ?? 0,
        dot: notifications.dot,
        overflowCount: notifications.overflowCount,
        tone: notifications.tone ?? 'error',
        label: notifications.count ? `${notifications.count} unread` : undefined,
      },
      blockId: `${blockId}_notifications`,
      className: classNames.notifications,
      components,
      events,
      hideTip: isPhone,
      icon: notifications.icon ?? { name: 'bell' },
      link: notifications.link && getLinkTarget(notifications.link),
      style: styles.notifications,
      tip: notifications.tip,
      title: notifications.title ?? 'Alerts',
      onClick: () => {
        setMoreOpen(false);
        methods.triggerEvent({ name: 'onNotificationsClick' });
      },
    };
  }

  function renderAvatar(size) {
    const avatar = profile?.avatar ?? {};
    return (
      <Avatar
        id={`${blockId}_profile_avatar`}
        className={classNames.profileAvatar}
        style={{ backgroundColor: !avatar.src ? avatar.color : undefined, ...styles.profileAvatar }}
        src={avatar.src}
        size={size}
        shape={avatar.shape ?? 'circle'}
        icon={
          !avatar.src &&
          !avatar.content && (
            <Icon
              blockId={`${blockId}_profile_avatar_icon`}
              events={events}
              properties={avatar.icon ?? { name: 'user' }}
            />
          )
        }
      >
        {avatar.content}
      </Avatar>
    );
  }

  function triggerProfileLink(link) {
    methods.triggerEvent({
      name: 'onProfileMenuClick',
      event: { key: link.id, keyPath: [link.id], pageId: link.pageId, url: link.url },
    });
  }

  function renderProfile() {
    const links = profile.links ?? [];
    const linkMap = flattenLinks(links);
    const items = buildMenuItems({ links, components, classNames: {}, styles: {}, events });
    // The theme sits above the app's own links, so a menu ends with the app's last link (sign out).
    if (properties.darkModeToggle) {
      if (items.length > 0) items.unshift({ type: 'divider', key: `${DARK_MODE_KEY}_divider` });
      items.unshift({
        key: DARK_MODE_KEY,
        label: `Theme: ${getDarkModeLabel()}`,
        icon: (
          <Icon
            blockId={`${blockId}_dark_mode_icon`}
            events={events}
            properties={{ name: getDarkModeIcon() }}
          />
        ),
      });
    }
    const header = (profile.name || profile.email) && {
      key: '__lf_profile_header',
      type: 'group',
      label: (
        <span className="lf-rail-profile-head">
          {profile.name && <span className="lf-rail-profile-name">{profile.name}</span>}
          {profile.email && <span className="lf-rail-profile-email">{profile.email}</span>}
        </span>
      ),
    };
    const trigger = (
      <RailItem
        blockId={`${blockId}_profile`}
        className={cn('lf-rail-item-profile', classNames.profile)}
        components={components}
        events={events}
        hideTip
        iconNode={renderAvatar(28)}
        style={styles.profile}
        title={profile.title ?? 'Account'}
      />
    );
    return (
      <Dropdown
        menu={{
          ...getDropdownMenuIcons({ blockId: `${blockId}_profile_menu`, Icon }),
          items: header
            ? [header, { type: 'divider', key: '__lf_profile_divider' }, ...items]
            : items,
          onClick: ({ key }) => {
            if (key === DARK_MODE_KEY) {
              methods.triggerEvent({ name: '__toggleDarkMode' });
              return;
            }
            triggerProfileLink(linkMap[key] ?? { id: key });
          },
        }}
        trigger={['click']}
        placement="rightBottom"
        classNames={{ root: cn('lf-rail-portal lf-rail-profile-menu', classNames.profileMenu) }}
        styles={{ root: styles.profileMenu }}
        onOpenChange={(open) =>
          methods.triggerEvent({ name: 'onProfileMenuOpen', event: { open } })
        }
      >
        <span className="lf-rail-dropdown-anchor">{trigger}</span>
      </Dropdown>
    );
  }

  function onSwitch(crumb, option) {
    setContextOpen(false);
    methods.triggerEvent({
      name: 'onSwitch',
      event: { crumbId: crumb.id, optionId: option.id, pageId: option.pageId, url: option.url },
    });
  }

  function onSwitcherAction(crumb, action) {
    setContextOpen(false);
    methods.triggerEvent({
      name: 'onSwitcherAction',
      event: { crumbId: crumb.id, actionId: action.id },
    });
  }

  function renderPanelToggle() {
    if (!hasPanel) return null;
    const label = panelOpen ? 'Hide panel' : 'Show panel';
    const button = (
      <button
        ref={toggleRef}
        type="button"
        id={`${blockId}_panel_toggle`}
        className="lf-rail-bar-button lf-rail-panel-toggle"
        aria-label={label}
        aria-expanded={panelOpen}
        aria-controls={`${blockId}_panel`}
        onClick={() => panel.toggle('button')}
      >
        <Icon
          blockId={`${blockId}_panel_toggle_icon`}
          events={events}
          properties={{
            name: panelOpen && !panel.isDrawer ? 'sidebar-collapse' : 'sidebar-expand',
          }}
        />
      </button>
    );
    if (isPhone) return button;
    return (
      <Tooltip
        title={
          <span className="lf-rail-tip-title">
            {label}
            {toggleShortcut && (
              <kbd className="lf-rail-tip-kbd">{shortcutLabel(toggleShortcut)}</kbd>
            )}
          </span>
        }
        placement="bottomLeft"
        mouseEnterDelay={0.4}
        classNames={{ root: 'lf-rail-portal' }}
      >
        {button}
      </Tooltip>
    );
  }

  function renderPhoneContext() {
    const lead = switchers[switchers.length - 1];
    const last = crumbs[crumbs.length - 1];
    return (
      <>
        {lead && (
          <button
            type="button"
            id={`${blockId}_context`}
            className="lf-rail-context-pill"
            aria-haspopup="dialog"
            aria-label={`${lead.label}, switch`}
            onClick={() => setContextOpen(true)}
          >
            <span className="lf-rail-context-marks">
              {switchers.map((crumb) => (
                <Mark
                  key={crumb.id}
                  blockId={`${blockId}_context_${crumb.id}`}
                  components={components}
                  events={events}
                  mark={crumb.mark}
                  size={20}
                />
              ))}
            </span>
            <span className="lf-rail-context-label">{lead.label}</span>
            <Icon
              blockId={`${blockId}_context_chevron`}
              events={events}
              properties={{ name: 'chevron-down' }}
            />
          </button>
        )}
        {last && !last.switcher && <span className="lf-rail-bar-title">{last.label}</span>}
      </>
    );
  }

  function renderBar() {
    if (!hasPanel && crumbs.length === 0 && !content.header) return null;
    return (
      <header
        id={`${blockId}_bar`}
        className={cn('lf-rail-bar', classNames.bar)}
        style={styles.bar}
      >
        {renderPanelToggle()}
        {isPhone
          ? renderPhoneContext()
          : crumbs.length > 0 && (
              <Crumbs
                blockId={blockId}
                className={classNames.crumbs}
                components={components}
                crumbs={crumbs}
                events={events}
                onAction={onSwitcherAction}
                onCrumbClick={(crumb) =>
                  methods.triggerEvent({ name: 'onCrumbClick', event: { id: crumb.id } })
                }
                onSelect={onSwitch}
                style={styles.crumbs}
              />
            )}
        <div className={cn('lf-rail-bar-extra', classNames.header)} style={styles.header}>
          {content.header &&
            (!isPhone || properties.headerOnPhone === true) &&
            content.header({
              width: 'auto',
              flex: '0 1 auto',
              alignItems: 'center',
              flexWrap: 'nowrap',
              justifyContent: 'flex-end',
              gap: 8,
            })}
        </div>
      </header>
    );
  }

  function renderRail() {
    const logo = properties.logo;
    return (
      <nav
        id={`${blockId}_rail`}
        aria-label="Primary"
        className={cn('lf-rail', classNames.rail)}
        style={styles.rail}
      >
        {logo?.src && (
          <Link
            home={true}
            id={`${blockId}_logo`}
            ariaLabel={logo.alt ?? 'Home'}
            className="lf-rail-logo"
          >
            <img src={logo.src} alt="" className={classNames.logo} style={styles.logo} />
          </Link>
        )}
        <div className="lf-rail-places">
          {places.map((link, index) => (
            <RailItem key={getPlaceKey(link)} {...placeProps(link, index)} />
          ))}
        </div>
        <div className={cn('lf-rail-foot', classNames.railFoot)} style={styles.railFoot}>
          {footItems.map((item) => (
            <RailItem key={item.id} {...footItemProps(item)} />
          ))}
          {!type.isNone(notifications) && <RailItem {...notificationsProps()} />}
          {!type.isNone(profile) && renderProfile()}
        </div>
      </nav>
    );
  }

  function renderPanel() {
    if (!hasPanel) return null;
    const title = panelProps.title;
    return (
      <aside
        id={`${blockId}_panel`}
        ref={panelRef}
        tabIndex={-1}
        aria-label={title ?? 'Panel'}
        aria-hidden={panel.isDrawer && !panelOpen ? true : undefined}
        className={cn('lf-rail-panel', classNames.panel)}
        style={styles.panel}
        onClickCapture={(event) => {
          // Following a link from the drawer closes it, so the page it opens is in view.
          if (!panel.isDrawer || panelProps.closeOnNavigate === false) return;
          if (event.target.closest?.('a[href]')) panel.setOpen(false, 'navigate');
        }}
        {...(panel.isDrawer ? swipe : {})}
      >
        <div className="lf-rail-panel-clip">
          <div className="lf-rail-panel-inner">
            {panel.isDrawer && (
              <div className="lf-rail-panel-top">
                <span className="lf-rail-panel-title">{title}</span>
                <button
                  type="button"
                  id={`${blockId}_panel_close`}
                  className="lf-rail-bar-button"
                  aria-label="Close panel"
                  onClick={() => panel.setOpen(false, 'button')}
                >
                  <Icon
                    blockId={`${blockId}_panel_close_icon`}
                    events={events}
                    properties={{ name: 'close' }}
                  />
                </button>
              </div>
            )}
            {content.panelHeader && (
              <div
                className={cn('lf-rail-panel-header', classNames.panelHeader)}
                style={styles.panelHeader}
              >
                {content.panelHeader()}
              </div>
            )}
            <div
              className={cn('lf-rail-panel-body', classNames.panelBody)}
              style={styles.panelBody}
            >
              {content.panel()}
            </div>
          </div>
        </div>
        {!panel.isDrawer && (
          <PanelResizeHandle
            blockId={blockId}
            className={cn('lf-rail-panel-handle', classNames.resizeHandle)}
            limits={limits}
            onCollapse={(source) => panel.setOpen(false, source)}
            onCommit={(width, options) => panel.commitWidth(width, options)}
            open={panelOpen}
            rootRef={rootRef}
            style={styles.resizeHandle}
            width={panel.width}
          />
        )}
      </aside>
    );
  }

  function renderMoreRow(key, props) {
    return (
      <RailItem
        key={key}
        {...props}
        blockId={`${blockId}_more_${key}`}
        className="lf-rail-more-row"
        hideTip
      />
    );
  }

  function renderTabBar() {
    const tabCount = properties.mobileTabs ?? 4;
    const tabs = places.slice(0, tabCount);
    const overflow = places.slice(tabCount);
    const profileLinks = Object.values(flattenLinks(profile?.links)).filter(
      (link) => !link.type || link.type === 'MenuLink'
    );
    const hasMore =
      overflow.length > 0 ||
      footItems.length > 0 ||
      !type.isNone(notifications) ||
      !type.isNone(profile);
    const moreNeedsYou =
      overflow.some((link) => getBadge(getPlaceBadge(badges, link))) ||
      footItems.some((item) => getBadge(item.badge)) ||
      (!type.isNone(notifications) && (notifications.count ?? 0) > 0);
    return (
      <>
        <nav
          id={`${blockId}_tab_bar`}
          aria-label="Primary"
          className={cn('lf-rail-tab-bar', classNames.tabBar)}
          style={styles.tabBar}
        >
          {tabs.map((link, index) => (
            <RailItem
              key={getPlaceKey(link)}
              {...placeProps(link, index)}
              className="lf-rail-tab"
            />
          ))}
          {hasMore && (
            <RailItem
              blockId={`${blockId}_more`}
              className="lf-rail-tab"
              components={components}
              events={events}
              hideTip
              active={moreOpen || overflow.some(isActive)}
              icon={{ name: 'more' }}
              title="More"
              badge={moreNeedsYou ? { dot: true, tone: 'error' } : undefined}
              onClick={() => setMoreOpen(true)}
            />
          )}
        </nav>
        <Drawer
          open={moreOpen}
          placement="bottom"
          size="auto"
          closable={false}
          onClose={() => setMoreOpen(false)}
          rootClassName={cn('lf-rail-portal lf-rail-sheet', classNames.moreSheet)}
          styles={{ body: styles.moreSheet }}
        >
          <div id={`${blockId}_more_sheet`} className="lf-rail-sheet-content">
            <div className="lf-rail-sheet-grab" aria-hidden="true" />
            {overflow.map((link, index) =>
              renderMoreRow(`place_${getPlaceKey(link)}`, placeProps(link, tabCount + index))
            )}
            {footItems.map((item) => renderMoreRow(`foot_${item.id}`, footItemProps(item)))}
            {!type.isNone(notifications) && renderMoreRow('notifications', notificationsProps())}
            {!type.isNone(profile) && (
              <>
                <div className="lf-rail-sheet-profile">
                  {renderAvatar(36)}
                  <span className="lf-rail-profile-head">
                    <span className="lf-rail-profile-name">
                      {profile.name ?? profile.title ?? 'Account'}
                    </span>
                    {profile.email && (
                      <span className="lf-rail-profile-email">{profile.email}</span>
                    )}
                  </span>
                </div>
                {properties.darkModeToggle &&
                  renderMoreRow('dark_mode', {
                    blockId: `${blockId}_more_dark_mode`,
                    components,
                    events,
                    icon: { name: getDarkModeIcon() },
                    title: `Theme: ${getDarkModeLabel()}`,
                    onClick: () => methods.triggerEvent({ name: '__toggleDarkMode' }),
                  })}
                {profileLinks.map((link) =>
                  renderMoreRow(`profile_${getPlaceKey(link)}`, {
                    blockId: `${blockId}_more_profile_${getPlaceKey(link)}`,
                    components,
                    events,
                    icon: link.properties?.icon,
                    link: getLinkTarget(link),
                    title: link.properties?.title ?? link.pageId ?? link.id,
                    onClick: () => {
                      setMoreOpen(false);
                      triggerProfileLink(link);
                    },
                  })
                )}
              </>
            )}
          </div>
        </Drawer>
      </>
    );
  }

  function renderContextSheet() {
    if (switchers.length === 0) return null;
    return (
      <Drawer
        open={contextOpen}
        placement="bottom"
        size="auto"
        closable={false}
        destroyOnHidden
        onClose={() => setContextOpen(false)}
        rootClassName="lf-rail-portal lf-rail-sheet"
      >
        <div id={`${blockId}_context_sheet`} className="lf-rail-sheet-content">
          <div className="lf-rail-sheet-grab" aria-hidden="true" />
          {/* The switcher on the pill, the one changed most, comes first. */}
          {[...switchers].reverse().map((crumb) => (
            <section key={crumb.id} className="lf-rail-sheet-section">
              <SwitcherList
                autoFocus={false}
                blockId={`${blockId}_crumb_${crumb.id}_sheet`}
                components={components}
                crumb={{
                  ...crumb,
                  switcher: { title: crumb.switcher.title ?? crumb.label, ...crumb.switcher },
                }}
                events={events}
                onAction={(action) => onSwitcherAction(crumb, action)}
                onDone={() => setContextOpen(false)}
                onSelect={(option) => onSwitch(crumb, option)}
              />
            </section>
          ))}
        </div>
      </Drawer>
    );
  }

  let panelState = 'none';
  if (hasPanel) panelState = panelOpen ? 'open' : 'closed';
  const aside = properties.aside ?? {};
  const asideOpen = !!content.aside && aside.open === true;

  return (
    <div
      id={blockId}
      ref={rootRef}
      className={cn('lf-rail-layout', classNames.element)}
      data-mode={mode}
      data-panel={panelState}
      data-aside={asideOpen ? 'open' : 'closed'}
      style={{
        [PANEL_WIDTH_VAR]: `${panelOpen && !panel.isDrawer ? panel.width : 0}px`,
        '--lf-rail-panel-width-open': `${panel.width}px`,
        '--lf-rail-aside-current': `${aside.width ?? 400}px`,
        ...styles.element,
      }}
    >
      <a className="lf-rail-skip" href={`#${blockId}_main`}>
        Skip to content
      </a>
      {!isPhone && renderRail()}
      <div className="lf-rail-stage">
        {renderBar()}
        <div className="lf-rail-body">
          {renderPanel()}
          {hasPanel && panel.isDrawer && (
            <div
              className="lf-rail-scrim"
              aria-hidden="true"
              onClick={() => panel.setOpen(false, 'scrim')}
            />
          )}
          <main
            id={`${blockId}_main`}
            tabIndex={-1}
            className={cn('lf-rail-main', classNames.main)}
            style={{ padding: contentPadding[properties.padding ?? 'default'], ...styles.main }}
          >
            {content.content && content.content()}
          </main>
          {asideOpen && (
            <>
              {mode !== 'desktop' && (
                <div
                  className="lf-rail-scrim lf-rail-aside-scrim"
                  aria-hidden="true"
                  onClick={() => methods.triggerEvent({ name: 'onAsideClose' })}
                />
              )}
              <aside
                id={`${blockId}_aside`}
                aria-label={aside.title ?? 'Side panel'}
                className={cn('lf-rail-aside', classNames.aside)}
                style={styles.aside}
              >
                {content.aside()}
              </aside>
            </>
          )}
        </div>
      </div>
      {isPhone && renderTabBar()}
      {isPhone && renderContextSheet()}
    </div>
  );
}

export default withBlockDefaults(withPageTheme(PageRailLayout));
