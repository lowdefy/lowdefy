/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import Page from '../../lib/client/Page.js';

// TODO: Use default blocks (basic only)

export async function getStaticProps() {
  const rootConfig = {
    home: {
      configured: false,
      pageId: '',
    },
    lowdefyGlobal: {},
    menus: [],
  };
  // TODO: ~k values here?
  const pageConfig = {
    id: 'page:licence-invalid',
    type: 'Result',
    style: { minHeight: '100vh' },
    properties: {
      status: 'warning',
      title: 'License Invalid',
      subTitle:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
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
              html: 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
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
