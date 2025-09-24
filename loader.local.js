import { initializeApp } from './utils.js';


let lastUrl = location.href;
const scriptUrl = 'http://localhost:4173';

new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (currentUrl == 'https://zerro.app/review') {
            initializeApp(scriptUrl);
        }
    }
}).observe(document, { subtree: true, childList: true });

console.log('zerro.app Loader script initialized');

initializeApp(scriptUrl);
