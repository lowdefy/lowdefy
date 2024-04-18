/*
  Copyright (C) 2024 Lowdefy, Inc
  Use of this software is governed by the Business Source License included in the LICENSE file and at www.mariadb.com/bsl11.

  Change Date: 2028-01-16

  On the date above, in accordance with the Business Source License, use
  of this software will be governed by the Apache License, Version 2.0.
*/

// What if this fails?
// What about public usage

function createLogUsage({ usageDataRef }) {
  let lastTimestamp = 0;
  let isOffline = false;
  let machine = localStorage.getItem('lowdefy_machine_id');
  if (!machine) {
    machine = crypto.randomUUID();
    localStorage.setItem('lowdefy_machine_id', machine);
  }

  async function logUsage() {
    if (isOffline || lastTimestamp > Date.now() - 1000 * 60 * 15) {
      return;
    }
    lastTimestamp = Date.now();

    const res = await fetch('/api/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: usageDataRef.current.user, machine }),
    });
    const { offline, data } = await res.json();
    if (offline) {
      isOffline = true;
      return;
    }
    await fetch('https://billing.lowdefy.net/v4/billing/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }
  return logUsage;
}

export default createLogUsage;
