import { esc } from './esc.js';

export function buildRows({ args }) {
  return (args.docs ?? []).map((doc) => `<li>${esc(doc.name)}</li>`).join('');
}
