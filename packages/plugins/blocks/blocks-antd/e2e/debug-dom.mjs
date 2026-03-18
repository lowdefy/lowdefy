import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function logHTML(url, selector, label, mode = 'innerHTML') {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PAGE: ${url}`);
  console.log(`SELECTOR: ${selector}`);
  console.log(`${'='.repeat(80)}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    // Give components a moment to fully render
    await page.waitForTimeout(1000);
    const el = await page.$(selector);
    if (!el) {
      console.log(`  >>> Element NOT FOUND: ${selector}`);
      return;
    }
    const html = mode === 'outerHTML'
      ? await el.evaluate((e) => e.outerHTML)
      : await el.evaluate((e) => e.innerHTML);
    console.log(html);
  } catch (err) {
    console.log(`  >>> ERROR: ${err.message}`);
  }
}

// 1. Splitter
await logHTML('http://localhost:3002/splitter_block', '#bl-sp_basic', 'Splitter bar');

// 2. Watermark
await logHTML('http://localhost:3002/watermark_block', '#bl-wm_text', 'Watermark');

// 3. QR Code
await logHTML('http://localhost:3002/qr_code', '#bl-qr_bordered .ant-qrcode', 'QR Code', 'outerHTML');

// 4. Float Button
await logHTML('http://localhost:3002/float_button', '#bl-fb_click', 'Float Button');

// 5. Dropdown Button
await logHTML('http://localhost:3002/dropdown_button', '#bl-db_icon', 'Dropdown Button icon');

// 6. Button - kbd elements
console.log(`\n${'='.repeat(80)}`);
console.log(`PAGE: http://localhost:3002/button`);
console.log(`SELECTOR: #bl-button_shortcut kbd elements`);
console.log(`${'='.repeat(80)}`);
try {
  await page.goto('http://localhost:3002/button', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  const container = await page.$('#bl-button_shortcut');
  if (!container) {
    console.log('  >>> Element NOT FOUND: #bl-button_shortcut');
  } else {
    const containerHTML = await container.evaluate((e) => e.innerHTML);
    console.log('Full innerHTML:');
    console.log(containerHTML);
    const kbds = await container.$$('kbd');
    console.log(`\nFound ${kbds.length} <kbd> elements`);
    for (const kbd of kbds) {
      const text = await kbd.evaluate((e) => e.outerHTML);
      console.log(`  kbd: ${text}`);
    }
  }
} catch (err) {
  console.log(`  >>> ERROR: ${err.message}`);
}

// 7. Config Provider
await logHTML('http://localhost:3002/config_provider', '#bl-cp_disabled_btn', 'ConfigProvider disabled btn');

await browser.close();
console.log('\nDone.');
