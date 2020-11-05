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

import React, { useState, useEffect } from 'react';
import { blockDefaultProps } from '@lowdefy/block-tools';
import { get, type } from '@lowdefy/helpers';
import { Modal } from 'antd';

const ModalBlock = ({ blockId, content, properties, actions, methods }) => {
  const [openState, setOpen] = useState(false);
  useEffect(() => {
    methods.registerMethod('toggleOpen', () => setOpen(!openState));
    methods.registerMethod('setOpen', ({ open }) => setOpen(!!open));
  }, [methods.registerMethod, setOpen]);
  const extraProps = {};
  if (content.footer) {
    extraProps.footer = content.footer();
  }
  if (properties.footer === false) {
    extraProps.footer = null;
  }
  return (
    <div id={blockId}>
      <div id={`${blockId}_popup`} />
      <Modal
        id={`${blockId}_modal`}
        title={properties.title}
        bodyStyle={methods.makeCssClass(properties.bodyStyle, { styleObjectOnly: true })}
        visible={type.isBoolean(properties.open) ? properties.open : openState}
        onOk={async () => {
          await methods.callAction({ action: 'onOk' });
          // the visible should only close if actions finished successfully
          setOpen(false);
        }}
        onCancel={async () => {
          await methods.callAction({ action: 'onCancel' });
          setOpen(false);
        }}
        afterClose={() => methods.callAction({ action: 'afterClose' })}
        getContainer={() => document.getElementById(`${blockId}_popup`)}
        confirmLoading={get(actions, 'onOk.loading')}
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
