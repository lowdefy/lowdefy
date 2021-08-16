/*
  Copyright 2020-2021 Lowdefy, Inc

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
import { blockDefaultProps, RenderHtml } from '@lowdefy/block-tools';
import { get } from '@lowdefy/helpers';
import { Modal } from 'antd';

const triggerSetOpen = ({ state, setOpen, methods }) => {
  if (!state) {
    methods.triggerEvent({ name: 'onClose' });
  }
  if (state) {
    methods.triggerEvent({ name: 'onOpen' });
  }
  setOpen(state);
};

const ModalBlock = ({ blockId, content, properties, events, methods }) => {
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
        title={<RenderHtml html={properties.title} methods={methods} />}
        bodyStyle={methods.makeCssClass(properties.bodyStyle, { styleObjectOnly: true })}
        visible={openState}
        onOk={async () => {
          const response = await methods.triggerEvent({ name: 'onOk' });
          if (response.success === false) return;
          triggerSetOpen({ state: false, setOpen, methods });
        }}
        onCancel={async () => {
          const response = await methods.triggerEvent({ name: 'onCancel' });
          if (response.success === false) return;
          triggerSetOpen({ state: false, setOpen, methods });
        }}
        afterClose={() => methods.triggerEvent({ name: 'afterClose' })}
        confirmLoading={get(events, 'onOk.loading')}
        okText={properties.okText || 'Ok'}
        cancelText={properties.cancelText || 'Cancel'}
        width={properties.width}
        centered={!!properties.centered}
        closable={properties.closable !== undefined ? properties.closable : true}
        mask={properties.mask !== undefined ? properties.mask : true}
        maskClosable={properties.maskClosable !== undefined ? properties.maskClosable : true}
        maskStyle={methods.makeCssClass(properties.maskStyle, { styleObjectOnly: true })}
        okType={properties.okButtonType || 'primary'}
        okButtonProps={properties.okButtonProps}
        cancelButtonProps={properties.cancelButtonProps}
        wrapClassName={methods.makeCssClass(properties.wrapperStyle)}
        zIndex={properties.zIndex}
        {...extraProps}
      >
        {content.content && content.content()}
      </Modal>
    </div>
  );
};

ModalBlock.defaultProps = blockDefaultProps;

export default ModalBlock;
