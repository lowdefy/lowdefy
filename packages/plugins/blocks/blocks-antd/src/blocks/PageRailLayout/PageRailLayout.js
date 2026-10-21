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

import React, { useEffect, useState } from 'react';
import { Avatar, Drawer, Dropdown } from 'antd';
import { cn, withBlockDefaults } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import { buildMenuItems, flattenLinks } from '../buildMenuItems.js';
import getDropdownMenuIcons from '../getDropdownMenuIcons.js';
import { getDarkModeIcon, getDarkModeLabel, registerDarkModeMethod } from '../headerActions.js';
import withPageTheme from '../withPageTheme.js';
import { getPanelLimits } from './clampPanelWidth.js';
import getRailBadge from './getRailBadge.js';
import PanelResizeHandle from './PanelResizeHandle.js';
import RailItem from './RailItem.js';
import useLayoutMode from './useLayoutMode.js';
import usePanelWidth from './usePanelWidth.js';
import './style.css';

const darkModeKey = '__lf_dark_mode';
const contentPadding = { default: '24px 32px 32px', compact: '16px', none: 0 };

function getPlaces({ menus, menu }) {
  let links = menu?.links;
  if (!type.isArray(links)) {
    const found = (menus ?? []).find((item) => item.menuId === (menu?.menuId ?? 'default'));
    links = (found ?? menus?.[0] ?? {}).links;
  }
  // A place with a MenuGroup is not supported: the panel is where a place's pages go.
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
  basePath,
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
  const panelProps = properties.panel ?? {};
  const limits = getPanelLimits(panelProps);
  const drawerBreakpoint = panelProps.drawerBreakpoint ?? 1100;
  const mobileBreakpoint = properties.mobileBreakpoint ?? 768;
  const mode = useLayoutMode({ drawerBreakpoint, mobileBreakpoint });
  const { width, setWidth, commit } = usePanelWidth({ methods, panel: panelProps, limits });
  const [drawerOpen, setDrawerOpenState] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    registerDarkModeMethod(methods);
  }, []);
  useEffect(() => {
    if (mode !== 'tablet') setDrawerOpenState(false);
    if (mode !== 'phone') setMoreOpen(false);
  }, [mode]);

  function setDrawerOpen(open) {
    setDrawerOpenState(open);
    methods.triggerEvent({ name: 'onPanelDrawerToggle', event: { open } });
  }

  const hasPanel = !!content.panel;
  const places = getPlaces({ menus, menu: properties.menu });
  const selectedKeys = properties.menu?.selectedKeys ?? [pageId];
  const badges = properties.badges ?? {};
  const footItems = properties.footItems ?? [];
  const notifications = properties.notifications;
  const profile = properties.profile;
  const isActive = (link) => selectedKeys.includes(link.pageId ?? link.id);
  const isPhone = mode === 'phone';
  const isDesktop = mode === 'desktop';

  function placeProps(link, index) {
    const key = link.pageId ?? link.id;
    return {
      active: isActive(link),
      badge: badges[link.id] !== undefined ? getRailBadge(badges[link.id]) : undefined,
      blockId: `${blockId}_place_${link.id}`,
      components,
      events,
      icon: link.properties?.icon,
      link: getLinkTarget(link),
      tip: link.properties?.tip ?? link.properties?.tooltip,
      title: link.properties?.title ?? link.pageId ?? link.id,
      hideTip: isPhone,
      onClick: (event) => {
        // On a tablet the active place opens the panel drawer instead of reloading the page.
        if (mode === 'tablet' && isActive(link) && hasPanel) {
          event.preventDefault();
          setDrawerOpen(!drawerOpen);
          return;
        }
        methods.triggerEvent({
          name: 'onMenuItemClick',
          event: { key, keyPath: [key], index },
        });
      },
    };
  }

  function footItemProps(item) {
    return {
      blockId: `${blockId}_foot_${item.id}`,
      components,
      events,
      icon: item.icon,
      link: getLinkTarget(item),
      tip: item.tip,
      title: item.title,
      hideTip: isPhone,
      badge: item.badge !== undefined ? getRailBadge(item.badge) : undefined,
      onClick: () => {
        if (!item.pageId && !item.url) {
          methods.triggerEvent({ name: 'onFootItemClick', event: { id: item.id } });
        }
      },
    };
  }

  function notificationsProps() {
    return {
      blockId: `${blockId}_notifications`,
      className: classNames.notifications,
      components,
      events,
      icon: notifications.icon ?? { name: 'bell' },
      link: notifications.link && getLinkTarget(notifications.link),
      style: styles.notifications,
      tip: notifications.tip,
      title: notifications.title ?? 'Notifications',
      hideTip: isPhone,
      badge: {
        count: notifications.count ?? 0,
        dot: notifications.dot,
        showZero: notifications.showZero,
        overflowCount: notifications.overflowCount,
        color: notifications.color,
      },
      onClick: () => methods.triggerEvent({ name: 'onNotificationsClick' }),
    };
  }

  function renderProfileAvatar() {
    const avatarProps = profile.avatar ?? {};
    return (
      <Avatar
        id={`${blockId}_profile_avatar`}
        className={classNames.profileAvatar}
        style={{
          backgroundColor: !avatarProps.src && avatarProps.color,
          ...styles.profileAvatar,
        }}
        src={avatarProps.src}
        size={avatarProps.size ?? 24}
        shape={avatarProps.shape ?? 'circle'}
        icon={
          !avatarProps.src &&
          !avatarProps.content && (
            <Icon
              blockId={`${blockId}_profile_avatar_icon`}
              events={events}
              properties={avatarProps.icon ?? { name: 'user' }}
            />
          )
        }
      >
        {avatarProps.content}
      </Avatar>
    );
  }

  function toggleDarkMode() {
    methods.triggerEvent({ name: '__toggleDarkMode' });
  }

  function renderProfile() {
    const links = profile.links ?? [];
    const linkMap = flattenLinks(links);
    const items = buildMenuItems({
      links,
      components,
      classNames: {},
      styles: {},
      events,
    });
    if (properties.darkModeToggle) {
      if (items.length > 0) items.push({ type: 'divider', key: `${darkModeKey}_divider` });
      items.push({
        key: darkModeKey,
        label: getDarkModeLabel(),
        icon: (
          <Icon
            blockId={`${blockId}_dark_mode_toggle_icon`}
            events={events}
            properties={{ name: getDarkModeIcon() }}
          />
        ),
      });
    }
    const trigger = (
      <button
        type="button"
        className={cn('lf-rail-item', classNames.profile)}
        style={styles.profile}
        id={`${blockId}_profile`}
      >
        <span className="lf-rail-icon">{renderProfileAvatar()}</span>
        <span className="lf-rail-label">{profile.title ?? 'Profile'}</span>
      </button>
    );
    if (items.length === 0) return <div className="lf-rail-item-wrap">{trigger}</div>;
    return (
      <Dropdown
        menu={{
          ...getDropdownMenuIcons({ blockId: `${blockId}_profile_menu`, Icon }),
          items,
          onClick: ({ key, keyPath }) => {
            if (key === darkModeKey) {
              toggleDarkMode();
              return;
            }
            const link = linkMap[key];
            methods.triggerEvent({
              name: 'onProfileMenuClick',
              event: { key, keyPath, pageId: link?.pageId, url: link?.url },
            });
          },
        }}
        trigger={['click']}
        placement={isPhone ? 'topRight' : 'rightBottom'}
        classNames={{ root: classNames.profileMenu }}
        styles={{ root: styles.profileMenu }}
        onOpenChange={(open) =>
          methods.triggerEvent({ name: 'onProfileMenuOpen', event: { open } })
        }
      >
        <div className="lf-rail-item-wrap">{trigger}</div>
      </Dropdown>
    );
  }

  function renderBreadcrumb() {
    if (type.isNone(properties.breadcrumb)) return null;
    return (
      <Breadcrumb
        blockId={`${blockId}_breadcrumb`}
        basePath={basePath}
        components={components}
        classNames={{ element: classNames.breadcrumb }}
        events={events}
        methods={methods}
        properties={properties.breadcrumb}
        styles={{ element: { margin: 0, ...styles.breadcrumb } }}
        rename={{ events: { onClick: 'onBreadcrumbClick' } }}
      />
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
          <Link home={true} className="lf-rail-logo">
            <img
              src={logo.src}
              alt={logo.alt ?? ''}
              className={classNames.logo}
              style={styles.logo}
            />
          </Link>
        )}
        <div className="lf-rail-places">
          {places.map((link, index) => (
            <RailItem key={link.id} {...placeProps(link, index)} />
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

  function renderPanelBody() {
    return (
      <>
        {content.panelHeader && (
          <div
            className={cn('lf-rail-panel-header', classNames.panelHeader)}
            style={styles.panelHeader}
          >
            {content.panelHeader()}
          </div>
        )}
        <div className={cn('lf-rail-panel-body', classNames.panelBody)} style={styles.panelBody}>
          {content.panel()}
        </div>
      </>
    );
  }

  function renderContentHeader() {
    const breadcrumb = renderBreadcrumb();
    const toggle = mode === 'tablet' && hasPanel;
    if (!breadcrumb && !content.contentHeader && !toggle) return null;
    return (
      <header
        className={cn('lf-rail-content-header', classNames.contentHeader)}
        style={styles.contentHeader}
      >
        {toggle && (
          <button
            type="button"
            id={`${blockId}_panel_toggle`}
            className="lf-rail-icon-button"
            aria-label="Open panel"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <Icon
              blockId={`${blockId}_panel_toggle_icon`}
              events={events}
              properties={{ name: 'sidebar-expand' }}
            />
          </button>
        )}
        {breadcrumb}
        {content.contentHeader &&
          content.contentHeader({
            flex: '1 1 auto',
            width: 'auto',
            alignItems: 'center',
            flexWrap: 'nowrap',
            minWidth: 0,
          })}
      </header>
    );
  }

  function renderMain() {
    const body = (
      <>
        {renderContentHeader()}
        <div
          className={cn('lf-rail-content', classNames.content)}
          style={{ padding: contentPadding[properties.padding ?? 'default'], ...styles.content }}
        >
          {content.content && content.content()}
        </div>
      </>
    );
    if (isPhone) {
      return (
        <main
          className={cn('lf-rail-main lf-rail-main-phone', classNames.main)}
          style={styles.main}
        >
          {content.mobileHeader && (
            <div className="lf-rail-mobile-header">{content.mobileHeader()}</div>
          )}
          {hasPanel && (
            <section className={cn('lf-rail-panel-phone', classNames.panel)} style={styles.panel}>
              {renderPanelBody()}
            </section>
          )}
          {body}
        </main>
      );
    }
    return (
      <main className={cn('lf-rail-main', classNames.main)} style={styles.main}>
        {body}
      </main>
    );
  }

  function renderMoreRow({ key, icon, title, badge, link, onClick }) {
    return (
      <RailItem
        key={key}
        blockId={`${blockId}_more_${key}`}
        className="lf-rail-more-row"
        components={components}
        events={events}
        hideTip
        icon={icon}
        link={link}
        onClick={(event) => {
          setMoreOpen(false);
          if (onClick) onClick(event);
        }}
        title={title}
        badge={badge}
      />
    );
  }

  function renderTabBar() {
    const tabCount = properties.mobileTabs ?? 4;
    const tabs = places.slice(0, tabCount);
    const overflow = places.slice(tabCount);
    const overflowActive = overflow.some(isActive);
    const overflowBadge =
      overflow.some((link) => getRailBadge(badges[link.id]).count > 0) ||
      (!type.isNone(notifications) && notifications.count > 0) ||
      footItems.some((item) => item.badge !== undefined && getRailBadge(item.badge).count > 0);
    const hasMore =
      overflow.length > 0 ||
      footItems.length > 0 ||
      !type.isNone(notifications) ||
      !type.isNone(profile);
    const profileLinks = Object.values(flattenLinks(profile?.links)).filter(
      (link) => !link.type || link.type === 'MenuLink'
    );
    return (
      <>
        <nav
          id={`${blockId}_tab_bar`}
          aria-label="Primary"
          className={cn('lf-rail-tab-bar', classNames.tabBar)}
          style={styles.tabBar}
        >
          {tabs.map((link, index) => (
            <RailItem key={link.id} {...placeProps(link, index)} />
          ))}
          {hasMore && (
            <RailItem
              blockId={`${blockId}_more`}
              components={components}
              events={events}
              hideTip
              active={overflowActive}
              icon={{ name: 'more' }}
              title="More"
              badge={overflowBadge ? { count: 0, dot: true } : undefined}
              onClick={() => setMoreOpen(true)}
            />
          )}
        </nav>
        <Drawer
          open={moreOpen}
          placement="bottom"
          height="auto"
          closable={false}
          onClose={() => setMoreOpen(false)}
          rootClassName="lf-rail-portal"
          classNames={{ body: cn('lf-rail-more', classNames.moreSheet) }}
          styles={{ body: styles.moreSheet }}
        >
          <div id={`${blockId}_more_sheet`}>
            {overflow.map((link, index) =>
              renderMoreRow({ key: `place_${link.id}`, ...placeProps(link, tabCount + index) })
            )}
            {footItems.map((item) => {
              const itemProps = footItemProps(item);
              return renderMoreRow({ key: `foot_${item.id}`, ...itemProps });
            })}
            {!type.isNone(notifications) &&
              renderMoreRow({ key: 'notifications', ...notificationsProps() })}
            {!type.isNone(profile) && (
              <>
                <div className="lf-rail-more-heading">{profile.title ?? 'Profile'}</div>
                {profileLinks.map((link) =>
                  renderMoreRow({
                    key: `profile_${link.id}`,
                    icon: link.properties?.icon,
                    title: link.properties?.title ?? link.pageId ?? link.id,
                    link: getLinkTarget(link),
                    onClick: () =>
                      methods.triggerEvent({
                        name: 'onProfileMenuClick',
                        event: {
                          key: link.id,
                          keyPath: [link.id],
                          pageId: link.pageId,
                          url: link.url,
                        },
                      }),
                  })
                )}
                {properties.darkModeToggle &&
                  renderMoreRow({
                    key: 'dark_mode',
                    icon: { name: getDarkModeIcon() },
                    title: getDarkModeLabel(),
                    onClick: toggleDarkMode,
                  })}
              </>
            )}
          </div>
        </Drawer>
      </>
    );
  }

  const asideProps = properties.aside ?? {};
  const asideOpen = !!content.aside && asideProps.open === true;

  return (
    <div
      id={blockId}
      className={cn('lf-rail-layout', `lf-rail-layout-${mode}`, classNames.element)}
      style={styles.element}
    >
      {!isPhone && renderRail()}
      {isDesktop && hasPanel && (
        <aside
          id={`${blockId}_panel`}
          className={cn('lf-rail-panel', classNames.panel)}
          style={{ width, ...styles.panel }}
        >
          {renderPanelBody()}
          <PanelResizeHandle
            className={cn('lf-rail-resize-handle', classNames.resizeHandle)}
            style={styles.resizeHandle}
            limits={limits}
            width={width}
            setWidth={setWidth}
            commit={commit}
          />
        </aside>
      )}
      {renderMain()}
      {asideOpen && (
        <aside
          id={`${blockId}_aside`}
          className={cn('lf-rail-aside', classNames.aside)}
          style={{ width: asideProps.width ?? 400, ...styles.aside }}
        >
          {content.aside()}
        </aside>
      )}
      {isPhone && renderTabBar()}
      {mode === 'tablet' && hasPanel && (
        <Drawer
          open={drawerOpen}
          placement="left"
          size={width}
          closable={false}
          onClose={() => setDrawerOpen(false)}
          rootClassName="lf-rail-portal lf-rail-drawer"
          classNames={{ body: cn('lf-rail-drawer-body', classNames.drawer) }}
        >
          {/* Following a link inside the panel closes the drawer. */}
          <div
            id={`${blockId}_drawer`}
            className="lf-rail-drawer-panel"
            onClick={(event) => {
              if (event.target.closest?.('a')) setDrawerOpen(false);
            }}
          >
            {renderPanelBody()}
          </div>
        </Drawer>
      )}
    </div>
  );
}

export default withBlockDefaults(withPageTheme(PageRailLayout));
