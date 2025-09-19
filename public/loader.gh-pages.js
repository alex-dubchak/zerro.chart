import { ensureAppRoot, ensureScript, ensureStyle, waitForElement } from './utils.js';

console.debug('Waiting for container element to be available');
const rootEl = '.container';

waitForElement(rootEl, () => {
    console.debug('Container element found, proceeding with app initialization');
    ensureAppRoot(rootEl);

    ensureScript('https://alex-dubchak.github.io/zerro.chart/assets/index.js')
    ensureStyle('https://alex-dubchak.github.io/zerro.chart/assets/index.css');

});