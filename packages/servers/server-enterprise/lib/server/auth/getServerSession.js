/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import { getServerSession as getNextAuthServerSession } from 'next-auth/next';

import authJson from '../../../build/auth.json';

function getServerSession({ authOptions, req, res }) {
  if (authJson.configured === true) {
    return getNextAuthServerSession(req, res, authOptions);
  }
  return undefined;
}

export default getServerSession;
