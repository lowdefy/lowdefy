const d = '/Users/puffin/.puffin/work/51839/lowdefy-ldf1164/packages/utils/journey-headless/';
let s = performance.now();
await import(d + 'dist/blockText/markdownToHtml.js');
console.log('mdast/micromark text model import', (performance.now() - s).toFixed(0), 'ms');
s = performance.now(); await import(d + 'dist/index.js'); console.log('rest of journey-headless import', (performance.now() - s).toFixed(0), 'ms');
const { default: m } = await import(d + 'dist/blockText/markdownToHtml.js');
const md = '# Title\n\nSome **bold** text with a [link](http://x) and a list:\n\n- one\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n';
s = performance.now(); for (let i = 0; i < 200; i++) m({ markdown: md }); console.log('markdownToHtml per call', ((performance.now() - s) / 200).toFixed(2), 'ms');
