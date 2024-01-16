/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import Page from '../../lib/client/Page.js';

export async function getStaticProps() {
  const rootConfig = {
    home: {
      configured: false,
      pageId: '',
    },
    lowdefyGlobal: {},
    menus: [],
  };
  const pageConfig = {
    id: 'page:licence-invalid',
    type: 'Result',
    style: { minHeight: '100vh' },
    properties: {
      status: 'warning',
      title: {
        _get: {
          key: { _url_query: 'code' },
          from: {
            EXPIRED: 'Expired  License',
            NOT_ENTITLED_AUTH: 'Not Entitled To Use Authentication',
            NO_LICENSE: 'Missing License',
          },
          default: 'Invalid License',
        },
      },
      subTitle: {
        _get: {
          key: { _url_query: 'code' },
          from: {
            EXPIRED: 'The Lowdefy license associated with this app has expired.',
            NOT_ENTITLED_AUTH:
              'The Lowdefy license associated with this app is not entitled to use user authentication.',
            NO_LICENSE: 'There is no Lowdefy license associated with this app.',
          },
          default: 'The Lowdefy license associated with this app is invalid.',
        },
      },
    },
    areas: {
      extra: {
        blocks: [
          {
            id: 'block:licence-invalid:proceed_button:0',
            type: 'Button',
            properties: { title: 'Proceed to App', type: 'danger' },
            blockId: 'proceed_button',
            events: {
              onClick: {
                try: [{ id: 'link', type: 'Link', params: { home: true } }],
                catch: [],
              },
            },
          },
        ],
      },
      content: {
        blocks: [
          {
            id: 'block:licence-invalid:more_text:0',
            type: 'Html',
            style: { maxWidth: '600px' },
            properties: {
              html: '<p>Lowdefy paid features may not be used in production without a valid license. Please contact the app developer to resolve this issue as soon as possible to ensure compliance.</p><p>To learn more about the Lowdefy terms of use see the <a href="https://lowdefy.com/licensing-faq">licensing FAQ page</a>.</p>',
            },
            blockId: 'more_text',
          },
        ],
      },
    },
    auth: { public: true },
    pageId: 'licence-invalid',
    blockId: 'licence-invalid',
    requests: [],
  };

  return {
    props: {
      pageConfig,
      rootConfig,
    },
  };
}

export default Page;
