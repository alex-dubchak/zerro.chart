import { ensureAppRoot, ensureScript, waitForElement } from './utils.js';
import { runApp } from 'http://localhost:5173/src/main.js';

console.debug('Waiting for container element to be available');
const rootEl = '.container';

waitForElement(rootEl, () => {
    console.debug('Container element found, proceeding with app initialization');
    ensureAppRoot(rootEl);
    runApp();
});



