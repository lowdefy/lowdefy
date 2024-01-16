/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

import pino from 'pino';

// TODO: Pino does not serialize error.cause properties if the cause object is not an Error (or Error-like)
const logger = pino({
  name: 'lowdefy_server',
  level: process.env.LOWDEFY_LOG_LEVEL ?? 'info',
  base: { pid: undefined, hostname: undefined },
});

function createLogger(metadata = {}) {
  return logger.child(metadata);
}

export default createLogger;
