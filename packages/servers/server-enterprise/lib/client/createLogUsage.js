/*
  Copyright (C) 2023 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2027-10-09

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

function createLogUsage({ usageDataRef }) {
  let lastTimestamp = 0;
  let machineId = localStorage.getItem('lowdefy_machine_id');
  if (!machineId) {
    machineId = crypto.randomUUID();
    localStorage.setItem('lowdefy_machine_id', machineId);
  }

  async function logUsage() {
    if (usageDataRef.current.license.entitlements.includes['OFFLINE']) {
      return;
    }

    if (lastTimestamp > Date.now() - 1000 * 10) {
      return;
    }

    console.log({
      license_key: usageDataRef.current.license.id,
      user: usageDataRef.current.user,
      machine: machineId,
      timestamp: Date.now(),
    });
    lastTimestamp = Date.now();
  }
  return logUsage;
}

export default createLogUsage;