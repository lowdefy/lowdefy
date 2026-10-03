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
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';
import { get } from '@lowdefy/helpers';
import { Modal } from 'antd';

import getMask from '../getMask.js';
import withTheme from '../withTheme.js';

// antd pads the whole modal box, with the header, body and footer inside it. The close button is
// placed by antd on its own, so the top insets keep the title centred with it.
const containerPadding = { compact: '16px 16px 12px', none: 0 };
// With no box padding the header and footer carry their own inset, and only the body is flush.
const headerSpacing = { none: { padding: '16px 24px 8px', marginBottom: 0 } };
const footerSpacing = { none: { padding: '12px 24px 16px', marginTop: 0 } };

const triggerSetOpen = ({ methods, setOpen, state }) => {
  if (!state) {
    methods.triggerEvent({ name: 'onClose' });
  }
  if (state) {
    methods.triggerEvent({ name: 'onOpen' });
  }
  setOpen(state);
};

const ModalBlock = ({
  blockId,
  classNames = {},
  content,
  events,
  methods,
  properties,
  styles = {},
}) => {
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
        afterOpenChange={(open) =>
          methods.triggerEvent({ name: 'afterOpenChange', event: { open } })
        }
        cancelButtonProps={properties.cancelButtonProps}
        cancelText={properties.cancelText}
        centered={!!properties.centered}
        closable={properties.closable ?? true}
        confirmLoading={get(events, 'onOk.loading')}
        destroyOnHidden={properties.destroyOnHidden}
        focusable={properties.focusable}
        forceRender={properties.forceRender}
        keyboard={properties.keyboard}
        loading={properties.loading}
        mask={getMask({ mask: properties.mask, maskClosable: properties.maskClosable })}
        okButtonProps={properties.okButtonProps}
        okText={properties.okText}
        okType={properties.okButtonType ?? 'primary'}
        scrollLock={properties.scrollLock}
        title={renderHtml({ html: properties.title, methods })}
        open={openState}
        width={properties.width ?? undefined}
        zIndex={properties.zIndex}
        className={classNames.element}
        classNames={{
          header: classNames.header,
          title: classNames.title,
          body: classNames.body,
          footer: classNames.footer,
          mask: classNames.mask,
          // antd 6 renamed the Modal content area from `content` to `container`.
          container: classNames.content,
          wrapper: classNames.wrapper,
        }}
        style={styles.element}
        styles={{
          header: { ...headerSpacing[properties.padding], ...styles.header },
          title: styles.title,
          body: styles.body,
          footer: { ...footerSpacing[properties.padding], ...styles.footer },
          mask: styles.mask,
          container: { padding: containerPadding[properties.padding], ...styles.content },
          wrapper: styles.wrapper,
        }}
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

export default withTheme('Modal', withBlockDefaults(ModalBlock));
