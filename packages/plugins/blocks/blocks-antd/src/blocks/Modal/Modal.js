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

import React, { useState, useEffect } from 'react';
import { blockDefaultProps, renderHtml } from '@lowdefy/block-utils';
import { get } from '@lowdefy/helpers';
import { Modal } from 'antd';

const triggerSetOpen = ({ methods, setOpen, state }) => {
  if (!state) {
    methods.triggerEvent({ name: 'onClose' });
  }
  if (state) {
    methods.triggerEvent({ name: 'onOpen' });
  }
  setOpen(state);
};

const ModalBlock = ({ blockId, content, events, methods, properties }) => {
  const [openState, setOpen] = useState(false);
  useEffect(() => {
    methods.registerMethod('toggleOpen', () =>
      triggerSetOpen({ state: !openState, setOpen, methods })
    );
    methods.registerMethod('setOpen', ({ open }) =>
      triggerSetOpen({ state: !!open, setOpen, methods })
    );
  });
  const extraProps = {};
  if (content.footer) {
    extraProps.footer = content.footer();
  }
  if (properties.footer === false) {
    extraProps.footer = null;
  }
  return (
    <div id={blockId}>
      <Modal
        id={`${blockId}_modal`}
        afterClose={() => methods.triggerEvent({ name: 'afterClose' })}
        bodyStyle={methods.makeCssClass(properties.bodyStyle, true)}
        cancelButtonProps={properties.cancelButtonProps}
        cancelText={properties.cancelText ?? 'Cancel'}
        centered={!!properties.centered}
        closable={properties.closable !== undefined ? properties.closable : true}
        confirmLoading={get(events, 'onOk.loading')}
        mask={properties.mask !== undefined ? properties.mask : true}
        maskClosable={properties.maskClosable !== undefined ? properties.maskClosable : true}
        maskStyle={methods.makeCssClass(properties.maskStyle, true)}
        okButtonProps={properties.okButtonProps}
        okText={properties.okText ?? 'Ok'}
        okType={properties.okButtonType ?? 'primary'}
        style={properties.style}
        title={renderHtml({ html: properties.title, methods })}
        visible={openState}
        width={properties.width}
        wrapClassName={methods.makeCssClass(properties.wrapperStyle)}
        zIndex={properties.zIndex}
        onOk={async () => {
          const response = await methods.triggerEvent({ name: 'onOk' });
          if (response.success === false) return;
          if (response.bounced !== true) {
            triggerSetOpen({ state: false, setOpen, methods });
          }
        }}
        onCancel={async () => {
          const response = await methods.triggerEvent({ name: 'onCancel' });
          if (response.success === false) return;
          if (response.bounced !== true) {
            triggerSetOpen({ state: false, setOpen, methods });
          }
        }}
        {...extraProps}
      >
        {content.content && content.content()}
      </Modal>
    </div>
  );
};

ModalBlock.defaultProps = blockDefaultProps;
ModalBlock.meta = {
  category: 'container',
  icons: [],
  styles: ['blocks/Modal/style.less'],
};

export default ModalBlock;
