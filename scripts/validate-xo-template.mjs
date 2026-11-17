import { p2pkhTemplate } from '@xo-cash/templates';
import { parseTemplate } from '@xo-cash/utils';

const template = parseTemplate(p2pkhTemplate);
if (!template || typeof template !== 'object' || typeof template.name !== 'string' || typeof template.version !== 'string') {
  throw new Error('The installed XO P2PKH template did not pass schema validation.');
}
console.log('XO P2PKH template schema is valid:', template.name, '(version ' + template.version + ')');
console.log('This validates the published template schema only. It does not prove Pact policy enforcement or deployment.');
