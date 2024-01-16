/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import { getNextAuthConfig } from '@lowdefy/api';
import { getSecretsFromEnv } from '@lowdefy/node-utils';

import adapters from '../../../build/plugins/auth/adapters.js';
import authJson from '../../../build/auth.json';
import callbacks from '../../../build/plugins/auth/callbacks.js';
import events from '../../../build/plugins/auth/events.js';
import providers from '../../../build/plugins/auth/providers.js';

function getAuthOptions({ logger }) {
  return getNextAuthConfig({
    authJson,
    logger,
    plugins: { adapters, callbacks, events, providers },
    secrets: getSecretsFromEnv(),
  });
}

export default getAuthOptions;
