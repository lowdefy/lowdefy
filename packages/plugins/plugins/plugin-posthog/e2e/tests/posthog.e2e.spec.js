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

import { test, expect } from '@playwright/test';
import { getBlock, navigateToTestPage } from '@lowdefy/block-dev-e2e';

// posthog-js sends one JSON body per request with compression and batching off: an event, a
// list of events, or { batch }.
function eventsOf(request) {
  const body = request.postData();
  if (!body) {
    return [];
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (error) {
    return [];
  }
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (Array.isArray(parsed.batch)) {
    return parsed.batch;
  }
  return [parsed];
}

// posthog-js only turns autocapture on once remote config says the project has not opted out,
// and loads config.js as a script.
function respondTo(request) {
  const { pathname } = new URL(request.url());
  if (pathname.endsWith('/config')) {
    return {
      contentType: 'application/json',
      body: JSON.stringify({ autocapture_opt_out: false, elementsChainAsString: true }),
    };
  }
  if (pathname.endsWith('.js')) {
    return { contentType: 'application/javascript', body: '' };
  }
  return { contentType: 'application/json', body: '{}' };
}

// Routes every PostHog request to the page's own /ingest, records the events and answers them.
async function recordPostHog(page) {
  const events = [];
  await page.route('**/ingest/**', async (route) => {
    const request = route.request();
    events.push(...eventsOf(request).filter((event) => typeof event.event === 'string'));
    if (new URL(request.url()).pathname.endsWith('/config')) {
      events.configServed = true;
    }
    await route.fulfill({ status: 200, ...respondTo(request) });
  });
  return events;
}

function find(events, predicate) {
  return events.find(predicate);
}

async function waitFor(events, predicate) {
  await expect.poll(() => find(events, predicate) !== undefined, { timeout: 15000 }).toBe(true);
  return find(events, predicate);
}

// PostHog has started and autocapture is on: the first pageview was sent and remote config
// was answered.
async function waitForPostHog(events) {
  await waitFor(events, (event) => event.event === '$pageview');
  await expect.poll(() => events.configServed === true, { timeout: 15000 }).toBe(true);
}

test.describe('PostHog events carry Lowdefy semantics', () => {
  test('pageviews carry the page id of the page they were captured on', async ({ page }) => {
    const events = await recordPostHog(page);
    await navigateToTestPage(page, 'home');
    const first = await waitFor(events, (event) => event.event === '$pageview');
    expect(first.properties.lowdefy_page_id).toBe('home');
    expect(first.properties.environment).toBeUndefined();
    expect(typeof first.properties.lowdefy_build_id).toBe('string');
    await getBlock(page, 'go_button').locator('button').click();
    await expect(getBlock(page, 'second_title')).toBeVisible();
    const second = await waitFor(
      events,
      (event) => event.event === '$pageview' && event.properties.lowdefy_page_id === 'second'
    );
    expect(second.properties.$current_url).toContain('/second');
  });

  test('a Button click carries its block id, type and enclosing block ids', async ({ page }) => {
    const events = await recordPostHog(page);
    await navigateToTestPage(page, 'home');
    await waitForPostHog(events);
    await getBlock(page, 'save_button').locator('button').click();
    const click = await waitFor(
      events,
      (event) =>
        event.event === '$autocapture' && event.properties.lowdefy_block_id === 'save_button'
    );
    expect(click.properties.lowdefy_page_id).toBe('home');
    expect(click.properties.lowdefy_block_type).toBe('Button');
    expect(click.properties.lowdefy_block_ids[0]).toBe('save_button');
    expect(click.properties.lowdefy_option).toBeUndefined();
  });

  test('picking a Selector option carries the Selector and lowdefy_option', async ({ page }) => {
    const events = await recordPostHog(page);
    await navigateToTestPage(page, 'home');
    await waitForPostHog(events);
    await getBlock(page, 'country').locator('.ant-select').click();
    await getBlock(page, 'country')
      .locator('.ant-select-item-option')
      .filter({ hasText: 'Kenya' })
      .click();
    const pick = await waitFor(
      events,
      (event) => event.event === '$autocapture' && event.properties.lowdefy_option === true
    );
    expect(pick.properties.lowdefy_block_id).toBe('country');
    expect(pick.properties.lowdefy_block_type).toBe('Selector');
  });

  test('a click on a grid cell button carries the row and column', async ({ page }) => {
    const events = await recordPostHog(page);
    await navigateToTestPage(page, 'home');
    await waitForPostHog(events);
    await getBlock(page, 'tasks')
      .locator('.ag-row[row-index="1"] .ag-cell[col-id="actions"] button')
      .click();
    const click = await waitFor(
      events,
      (event) => event.event === '$autocapture' && event.properties.lowdefy_block_id === 'tasks'
    );
    expect(click.properties.lowdefy_row).toBe(1);
    expect(click.properties.lowdefy_column).toBe('actions');
    expect(click.properties.lowdefy_block_type).toBe('AgGridLowdefy');
  });

  test('a failed Validate sends one lowdefy_event_failed timed with the click', async ({
    page,
  }) => {
    const events = await recordPostHog(page);
    await navigateToTestPage(page, 'home');
    await waitForPostHog(events);
    await getBlock(page, 'submit_button').locator('button').click();
    const failure = await waitFor(events, (event) => event.event === 'lowdefy_event_failed');
    const click = await waitFor(
      events,
      (event) =>
        event.event === '$autocapture' && event.properties.lowdefy_block_id === 'submit_button'
    );
    expect(failure.properties).toMatchObject({
      lowdefy_event_scope: 'page',
      lowdefy_page_id: 'home',
      lowdefy_block_id: 'submit_button',
      lowdefy_block_type: 'Button',
      lowdefy_event_name: 'onClick',
      lowdefy_debounce_ms: 0,
      lowdefy_action_id: 'check_form',
      lowdefy_action_type: 'Validate',
      lowdefy_error_name: 'UserError',
      lowdefy_invalid_blocks: ['name'],
    });
    expect(typeof failure.properties.lowdefy_config_key).toBe('string');
    const failedAt = new Date(failure.timestamp).getTime();
    const clickedAt = new Date(click.timestamp).getTime();
    expect(failedAt).toBeLessThanOrEqual(clickedAt + failure.properties.lowdefy_debounce_ms + 1000);
    await page.waitForTimeout(500);
    expect(events.filter((event) => event.event === 'lowdefy_event_failed')).toHaveLength(1);
  });

  test('a failing app onInit, before PostHog starts, sends lowdefy_event_failed', async ({
    page,
  }) => {
    const events = await recordPostHog(page);
    await page.goto('/home?failAppInit=1');
    const failure = await waitFor(events, (event) => event.event === 'lowdefy_event_failed');
    expect(failure.properties).toMatchObject({
      lowdefy_event_scope: 'app',
      lowdefy_page_id: 'home',
      lowdefy_block_id: 'app',
      lowdefy_event_name: 'onInit',
      lowdefy_action_id: 'app_init_check',
      lowdefy_action_type: 'Throw',
    });
    expect(failure.properties.lowdefy_block_type).toBeUndefined();
    await page.waitForTimeout(500);
    expect(events.filter((event) => event.event === 'lowdefy_event_failed')).toHaveLength(1);
  });

  test('a failing app onInitAsync sends lowdefy_event_failed with scope app', async ({ page }) => {
    const events = await recordPostHog(page);
    await page.goto('/home?failApp=1');
    const failure = await waitFor(events, (event) => event.event === 'lowdefy_event_failed');
    expect(failure.properties).toMatchObject({
      lowdefy_event_scope: 'app',
      lowdefy_page_id: 'home',
      lowdefy_block_id: 'app',
      lowdefy_event_name: 'onInitAsync',
      lowdefy_action_id: 'app_check',
      lowdefy_action_type: 'Throw',
    });
    expect(failure.properties.lowdefy_block_type).toBeUndefined();
  });

  test('a failing app event at the app root names the home page it loaded on', async ({ page }) => {
    const events = await recordPostHog(page);
    await page.goto('/?failApp=1');
    const failure = await waitFor(events, (event) => event.event === 'lowdefy_event_failed');
    expect(failure.properties.$pathname).toBe('/');
    expect(failure.properties).toMatchObject({
      lowdefy_event_scope: 'app',
      lowdefy_page_id: 'home',
      lowdefy_block_id: 'app',
      lowdefy_event_name: 'onInitAsync',
    });
  });
});

// The strings the customers endpoint returns. None is in the app's config.
const DATA_TEXTS = ['Amara Okonkwo', 'Bertil Lindqvist', 'Chidi Nwosu', 'Okonkwo', 'Lindqvist'];

function expectNoDataText(value) {
  const serialised = JSON.stringify(value);
  DATA_TEXTS.forEach((text) => expect(serialised).not.toContain(text));
}

async function openCustomers(page, events) {
  await navigateToTestPage(page, 'customers');
  await waitForPostHog(events);
  await expect(
    getBlock(page, 'customers_grid').locator('.ag-row[row-index="0"] .ag-cell[col-id="name"]')
  ).toHaveText('Amara Okonkwo');
}

test.describe('PostHog events carry no data text', () => {
  test('a click on a grid cell showing data sends no cell text but keeps row and column', async ({
    page,
  }) => {
    const events = await recordPostHog(page);
    await openCustomers(page, events);
    // Each click lands on the element holding the text, so posthog-js would record it unmasked.
    await getBlock(page, 'customers_grid')
      .locator('.ag-row[row-index="0"] .ag-cell[col-id="name"]')
      .getByText('Amara Okonkwo', { exact: true })
      .click();
    const click = await waitFor(
      events,
      (event) =>
        event.event === '$autocapture' &&
        event.properties.lowdefy_block_id === 'customers_grid' &&
        event.properties.lowdefy_column === 'name'
    );
    expect(click.properties.lowdefy_row).toBe(0);
    expect(click.properties.lowdefy_page_id).toBe('customers');
    expect(click.properties.$el_text).toBeUndefined();
    expect(click.properties.$elements_chain).not.toContain('text=');
    expect(click.properties.$elements_chain).toContain('attr__row-index="0"');
    expectNoDataText(click);
  });

  test('picking a Selector option filled by a request sends no label text or title', async ({
    page,
  }) => {
    const events = await recordPostHog(page);
    await openCustomers(page, events);
    await getBlock(page, 'customer_select').locator('.ant-select').click();
    await getBlock(page, 'customer_select')
      .locator('.ant-select-item-option-content')
      .getByText('Bertil Lindqvist', { exact: true })
      .click();
    const pick = await waitFor(
      events,
      (event) =>
        event.event === '$autocapture' &&
        event.properties.lowdefy_option === true &&
        event.properties.lowdefy_block_id === 'customer_select'
    );
    expect(pick.properties.$el_text).toBeUndefined();
    expect(pick.properties.$elements_chain).not.toContain('attr__title=');
    expectNoDataText(pick);
  });

  test('a DropdownMenu item built from a request, portaled to the body, sends no label text', async ({
    page,
  }) => {
    const events = await recordPostHog(page);
    await openCustomers(page, events);
    await getBlock(page, 'customer_menu').locator('button').click();
    await page
      .locator('.ant-dropdown-menu-item')
      .getByText('Amara Okonkwo', { exact: true })
      .click();
    const pick = await waitFor(
      events,
      (event) =>
        event.event === '$autocapture' &&
        event.properties.$elements_chain.includes('ant-dropdown-menu-item')
    );
    expect(pick.properties.$el_text).toBeUndefined();
    expectNoDataText(pick);
    await page.waitForTimeout(500);
    expectNoDataText(events);
  });

  test('a literal Button title and a literal Selector option keep their text', async ({ page }) => {
    const events = await recordPostHog(page);
    await navigateToTestPage(page, 'home');
    await waitForPostHog(events);
    await getBlock(page, 'save_button').locator('button').click();
    const click = await waitFor(
      events,
      (event) =>
        event.event === '$autocapture' && event.properties.lowdefy_block_id === 'save_button'
    );
    expect(click.properties.$el_text).toBe('Save');
    expect(click.properties.$elements_chain).toContain('text="Save"');
    await getBlock(page, 'country').locator('.ant-select').click();
    await getBlock(page, 'country')
      .locator('.ant-select-item-option-content')
      .getByText('Kenya', { exact: true })
      .click();
    const pick = await waitFor(
      events,
      (event) => event.event === '$autocapture' && event.properties.lowdefy_option === true
    );
    expect(pick.properties.$el_text).toBe('Kenya');
    expect(pick.properties.$elements_chain).toContain('text="Kenya"');
  });

  test('an AgGrid column header keeps its headerName text', async ({ page }) => {
    const events = await recordPostHog(page);
    await openCustomers(page, events);
    await getBlock(page, 'customers_grid')
      .locator('.ag-header-cell[col-id="name"] .ag-header-cell-text')
      .click();
    const click = await waitFor(
      events,
      (event) =>
        event.event === '$autocapture' &&
        event.properties.lowdefy_block_id === 'customers_grid' &&
        event.properties.$elements_chain.includes('ag-header-cell')
    );
    expect(click.properties.$el_text).toBe('Customer name');
    expect(click.properties.$elements_chain).toContain('text="Customer name"');
  });
});
