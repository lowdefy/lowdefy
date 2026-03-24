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

import React, { useState, useEffect } from 'react';
import { Avatar, Badge, Dropdown } from 'antd';
import { get, mergeObjects, type } from '@lowdefy/helpers';
import { withBlockDefaults } from '@lowdefy/block-utils';

import Affix from '../Affix/Affix.js';
import Breadcrumb from '../Breadcrumb/Breadcrumb.js';
import Button from '../Button/Button.js';
import Content from '../Content/Content.js';
import Footer from '../Footer/Footer.js';
import Header from '../Header/Header.js';
import Layout from '../Layout/Layout.js';
import Menu from '../Menu/Menu.js';
import MobileMenu from '../MobileMenu/MobileMenu.js';
import Sider from '../Sider/Sider.js';
import { buildMenuItems, flattenLinks } from '../buildMenuItems.js';

function getDarkMode() {
  const stored = window.localStorage?.getItem('lowdefy_darkMode');
  if (stored !== null) return stored === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
}

const PageSiderMenu = ({
  basePath,
  blockId,
  classNames = {},
  components: { Icon, Link, ShortcutBadge },
  events,
  content,
  menus,
  methods,
  pageId,
  properties,
  styles = {},
}) => {
  const [openSiderState, setSiderOpen] = useState(!properties.sider?.initialCollapsed);
  useEffect(() => {
    methods.registerEvent({
      name: '__toggleDarkMode',
      actions: [{ id: '__set_dark_mode', type: 'SetDarkMode' }],
    });
    methods.registerMethod('toggleDarkMode', () => {
      methods.triggerEvent({ name: '__toggleDarkMode' });
    });
    methods.registerMethod('toggleSiderOpen', () => {
      methods._toggleSiderOpen({ open: !openSiderState });
      setSiderOpen(!openSiderState);
    });
    methods.registerMethod('setSiderOpen', ({ open }) => {
      methods._toggleSiderOpen({ open });
      setSiderOpen(open);
    });
  });

  function renderNotifications() {
    if (type.isNone(properties.notifications)) return null;
    const notif = properties.notifications;
    return (
      <div
        className={classNames.notifications}
        style={{ cursor: 'pointer', lineHeight: 1, ...styles.notifications }}
        onClick={() => methods.triggerEvent({ name: 'onNotificationClick' })}
      >
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
            styles={{ element: { fontSize: 16, ...styles.notificationsIcon } }}
          />
        </Badge>
      </div>
    );
  }

  function renderProfile() {
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
        <div
          className={classNames.profile}
          style={{ cursor: 'pointer', ...styles.profile }}
          onClick={() => methods.triggerEvent({ name: 'onProfileClick' })}
        >
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

  function renderDarkModeToggle() {
    if (!properties.darkModeToggle) return null;
    return (
      <div
        className={classNames.darkModeToggle}
        style={{ cursor: 'pointer', lineHeight: 1, ...styles.darkModeToggle }}
        onClick={() => methods.triggerEvent({ name: '__toggleDarkMode' })}
      >
        <Icon
          blockId={`${blockId}_dark_mode_toggle_icon`}
          events={events}
          properties={{ name: getDarkMode() ? 'AiOutlineSun' : 'AiOutlineMoon' }}
          styles={{ element: { fontSize: 16 } }}
        />
      </div>
    );
  }

  return (
    <Layout
      blockId={blockId}
      components={{ Icon, Link, ShortcutBadge }}
      events={events}
      styles={{
        element: mergeObjects([{ minHeight: '100vh' }, styles.element]),
      }}
      content={{
        content: () => (
          <>
            <Header
              blockId={`${blockId}_header`}
              components={{ Icon, Link, ShortcutBadge }}
              classNames={{ element: classNames.header }}
              events={events}
              properties={{}}
              styles={{
                element: mergeObjects([
                  {
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'row-reverse',
                  },
                  styles.header,
                ]),
              }}
              content={{
                content: () => (
                  <>
                    <div className="flex flex-auto items-center justify-end">
                      {content.header &&
                        content.header(
                          mergeObjects([
                            { width: 'auto', alignItems: 'center', flexWrap: 'nowrap' },
                            styles.headerContent,
                          ])
                        )}
                      {(!type.isNone(properties.notifications) ||
                        !type.isNone(properties.profile) ||
                        properties.darkModeToggle) && (
                        <div
                          className={classNames.headerActions ?? 'flex items-center gap-4 ml-4'}
                          style={styles.headerActions}
                        >
                          {renderNotifications()}
                          {renderProfile()}
                          {renderDarkModeToggle()}
                        </div>
                      )}
                      <MobileMenu
                        classNames={{ element: classNames.mobileMenu ?? 'block lg:hidden pl-4' }}
                        styles={{ element: styles.mobileMenu }}
                        blockId={`${blockId}_mobile_menu`}
                        components={{ Icon, Link, ShortcutBadge }}
                        basePath={basePath}
                        events={events}
                        methods={methods}
                        menus={menus}
                        pageId={pageId}
                        properties={mergeObjects([
                          { mode: 'inline' },
                          properties.menu,
                          properties.menuMd,
                        ])}
                        rename={{
                          methods: {
                            toggleOpen: 'toggleMobileMenuOpen',
                            setOpen: 'setMobileMenuOpen',
                          },
                          events: {
                            onClose: 'onMobileMenuClose',
                            onOpen: 'onMobileMenuOpen',
                          },
                        }}
                      />
                    </div>
                    <Link home={true}>
                      <picture>
                        <source
                          media={`(min-width:${properties.logo?.breakpoint ?? 577}px)`}
                          srcSet={
                            properties.logo?.src ??
                            `${basePath}/logo-${getDarkMode() ? 'dark' : 'light'}-theme.png`
                          }
                        />
                        <img
                          src={
                            properties.logo?.srcMobile ??
                            properties.logo?.src ??
                            `${basePath}/logo-square-${getDarkMode() ? 'dark' : 'light'}-theme.png`
                          }
                          alt={properties.logo?.alt ?? 'Lowdefy'}
                          className={
                            classNames.logo ??
                            'mr-[30px] shrink w-10 sm:w-[130px] mx-1.5 sm:mx-2.5 md:mx-4'
                          }
                          style={styles.logo}
                        />
                      </picture>
                    </Link>
                  </>
                ),
              }}
            />
            <Layout
              blockId={`${blockId}_layout`}
              components={{ Icon, Link, ShortcutBadge }}
              events={events}
              properties={{ hasSider: true, ...properties.layout }}
              styles={{ element: styles.layout }}
              classNames={{ element: classNames.layout }}
              content={{
                content: () => (
                  <>
                    <Sider
                      blockId={`${blockId}_sider`}
                      components={{ Icon, Link, ShortcutBadge }}
                      events={events}
                      methods={methods}
                      properties={properties.sider ?? {}}
                      classNames={{ element: classNames.sider ?? 'hidden lg:block' }}
                      styles={{ element: styles.sider }}
                      rename={{
                        methods: {
                          toggleOpen: '_toggleSiderOpen',
                          setOpen: '_setSiderOpen',
                        },
                      }}
                      content={{
                        content: () => (
                          <div
                            style={{
                              display: 'flex',
                              height: '100%',
                              flexDirection: 'column',
                            }}
                          >
                            <Menu
                              blockId={`${blockId}_menu`}
                              components={{ Icon, Link, ShortcutBadge }}
                              basePath={basePath}
                              classNames={{ element: classNames.menu ?? 'hidden lg:block' }}
                              events={events}
                              methods={methods}
                              menus={menus}
                              pageId={pageId}
                              properties={mergeObjects([
                                { mode: 'inline' },
                                properties.menu,
                                properties.menuLg,
                              ])}
                              styles={{ element: styles.menu }}
                              rename={{
                                events: {
                                  onClick: 'onMenuItemClick',
                                  onSelect: 'onMenuItemSelect',
                                  onToggleMenuGroup: 'onToggleMenuGroup',
                                },
                              }}
                            />
                            <div style={{ flex: '1 0 auto' }}>
                              {content.sider && content.sider()}
                            </div>
                            {!get(properties, 'sider.hideToggleButton') && (
                              <Affix
                                blockId={`${blockId}_toggle_sider_affix`}
                                components={{ Icon, Link, ShortcutBadge }}
                                events={events}
                                properties={{ offsetBottom: 0 }}
                                methods={methods}
                                rename={{
                                  events: {
                                    onChange: 'onChangeToggleSiderAffix',
                                  },
                                }}
                                content={{
                                  content: () => (
                                    <Button
                                      blockId={`${blockId}_toggle_sider`}
                                      components={{ Icon, Link, ShortcutBadge }}
                                      events={events}
                                      properties={{
                                        hideTitle: true,
                                        type: 'link',
                                        block: true,
                                        icon: {
                                          name: openSiderState
                                            ? 'AiOutlineMenuFold'
                                            : 'AiOutlineMenuUnfold',
                                        },
                                        ...(properties.toggleSiderButton ?? {}),
                                      }}
                                      methods={methods}
                                      onClick={() => methods.toggleSiderOpen()}
                                      rename={{
                                        events: {
                                          onClick: 'onToggleSider',
                                        },
                                      }}
                                    />
                                  ),
                                }}
                              />
                            )}
                          </div>
                        ),
                      }}
                    />
                    <Content
                      blockId={`${blockId}_content`}
                      components={{ Icon, Link, ShortcutBadge }}
                      classNames={{ element: classNames.content }}
                      events={events}
                      properties={properties.content ?? {}}
                      styles={{
                        element: mergeObjects([
                          {
                            padding: '0 40px 40px 40px',
                            minWidth: 0,
                          },
                          styles.content,
                        ]),
                      }}
                      content={{
                        content: () => (
                          <>
                            {!type.isNone(properties.breadcrumb) ? (
                              <Breadcrumb
                                blockId={`${blockId}_breadcrumb`}
                                basePath={basePath}
                                components={{ Icon, Link, ShortcutBadge }}
                                classNames={{ element: classNames.breadcrumb }}
                                events={events}
                                methods={methods}
                                properties={properties.breadcrumb}
                                styles={{
                                  element: mergeObjects([{ margin: '16px 0' }, styles.breadcrumb]),
                                }}
                                rename={{
                                  events: {
                                    onClick: 'onBreadcrumbClick',
                                  },
                                }}
                              />
                            ) : (
                              <div className="py-1.5 sm:py-1.5 md:py-2.5 lg:py-5" />
                            )}
                            {content.content && content.content()}
                            {content.footer && (
                              <Footer
                                blockId={`${blockId}_footer`}
                                components={{ Icon, Link, ShortcutBadge }}
                                classNames={{ element: classNames.footer }}
                                events={events}
                                properties={properties.footer}
                                styles={{
                                  element: styles.footer,
                                }}
                                content={{
                                  content: () => content.footer(),
                                }}
                              />
                            )}
                          </>
                        ),
                      }}
                    />
                  </>
                ),
              }}
            />
          </>
        ),
      }}
    />
  );
};

export default withBlockDefaults(PageSiderMenu);
