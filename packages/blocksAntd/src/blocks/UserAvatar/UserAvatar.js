/*
  Copyright 2020 Lowdefy, Inc

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

import React, { useEffect } from 'react';
import { mergeObjects } from '@lowdefy/helpers';
import { blockDefaultProps } from '@lowdefy/block-tools';

import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';

const UserAvatar = ({ blockId, methods, properties, user }) => {
  useEffect(() => {
    methods.registerAction('onBlockLogin', [
      {
        id: 'login',
        type: 'Login',
      },
    ]);
    methods.registerAction('onBlockAvatar', [
      {
        id: 'profileClick',
        type: 'Link',
        params: { pageId: 'profile' },
      },
    ]);
  }, []);
  if (properties.disabled) {
    return '';
  }
  if (!user.name || properties.loggedIn === false) {
    return (
      <Button
        blockId={`${blockId}_button`}
        properties={mergeObjects([
          {
            title: 'Login',
            type: 'primary',
            shape: 'round',
            icon: { name: 'LoginOutlined' },
            style: { margin: 8 },
          },
          properties.loginButton,
        ])}
        methods={methods}
        onClick={async () => {
          await methods.callAction({ action: 'onLogin', hideLoading: true });
          methods.callAction({ action: 'onBlockLogin', hideLoading: true });
        }}
      />
    );
  }
  return (
    <div
      id={blockId}
      className={methods.makeCssClass([
        {
          alignItems: 'center',
          cursor: 'pointer',
          display: 'flex',
          outline: 'none',
        },
        properties.style,
      ])}
      onClick={async () => {
        await methods.callAction({ action: 'onClick', hideLoading: true });
        methods.callAction({ action: 'onBlockAvatar', hideLoading: true });
      }}
    >
      <div
        className={methods.makeCssClass({
          color: properties.theme !== 'light' && 'white',
          margin: 8,
          flex: '0 1 auto',
          lineHeight: 1.5,
        })}
      >
        {properties.name || user.name}
      </div>
      <Avatar
        blockId={`${blockId}_avatar`}
        properties={mergeObjects([
          {
            size: 'large',
            src: user.picture,
            style: {
              margin: 8,
              flex: '0 1 auto',
              order: properties.showName === 'right' ? -1 : 0,
            },
          },
          properties.avatar,
        ])}
        methods={methods}
      />
    </div>
  );
};

UserAvatar.defaultProps = blockDefaultProps;

export default UserAvatar;
