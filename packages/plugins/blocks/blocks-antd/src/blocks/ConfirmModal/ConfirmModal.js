/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { Modal } from 'antd';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';

const ConfirmModal = ({ blockId, events, content, components: { Icon }, methods, properties }) => {
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      const additionalProps = {};
      if (properties.icon) {
        additionalProps.icon = (
          <Icon blockId={`${blockId}_icon`} events={events} properties={properties.icon} />
        );
      }
      methods.triggerEvent({ name: 'onOpen' });
      Modal[args.status || properties.status || 'confirm']({
        id: `${blockId}_confirm_modal`,
        title: renderHtml({ html: properties.title, methods }),
        bodyStyle: methods.makeCssClass(properties.bodyStyle, true),
        content:
          (content.content && content.content()) ??
          renderHtml({ html: properties.content, methods }),
        className: methods.makeCssClass(properties.modalStyle),
        closable: properties.closable,
        okText: properties.okText ?? 'Ok',
        okButtonProps: properties.okButton?.icon
          ? {
              ...properties.okButton,
              icon: properties.okButton.icon && (
                <Icon
                  blockId={`${blockId}_ok_icon`}
                  events={events}
                  properties={properties.okButton.icon}
                />
              ),
            }
          : properties.okButton,
        cancelButtonProps: properties.cancelButton?.icon
          ? {
              ...properties.cancelButton,
              icon: properties.cancelButton.icon && (
                <Icon
                  blockId={`${blockId}_ok_icon`}
                  events={events}
                  properties={properties.cancelButton.icon}
                />
              ),
            }
          : properties.cancelButton,
        cancelText: properties.cancelText ?? 'Cancel',
        centered: properties.centered ?? false,
        mask: properties.mask !== undefined ? properties.mask : true,
        maskClosable: properties.maskClosable ?? false,
        width: properties.width,
        zIndex: properties.zIndex,
        onOk: async () => {
          const response = await methods.triggerEvent({ name: 'onOk' });
          if (response.success === false && response.bounced !== true) throw response;
        },
        onCancel: async () => {
          const response = await methods.triggerEvent({ name: 'onCancel' });
          if (response.success === false && response.bounced !== true) throw response;
        },
        ...additionalProps,
      });
    });
  });
  return <div id={blockId} />;
};

ConfirmModal.defaultProps = blockDefaultProps;
ConfirmModal.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/ConfirmModal/style.less'],
};

export default ConfirmModal;
