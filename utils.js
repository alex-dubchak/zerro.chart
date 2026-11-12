const ensureAppRoot = (el = '.container') => {
    let app = document.getElementById('app');
    if (!app) {
        console.debug('Creating app root element');
        const container = document.querySelector(el) || document.body;
        container.innerHTML = '';
        app = document.createElement('div');
        app.id = 'app';
        container.appendChild(app);
    }
};

const ensureScript = (u) => {
    const existingScript = document.getElementById('app-script');
    if (!existingScript) {
        console.debug('Loading Vue script dynamically');
        // Load Vue script dynamically as ES module
        const script = document.createElement('script');
        script.id = 'app-script';
        script.type = 'module';
        script.src = u + '?t=' + Date.now(); // Vite dev server
        document.head.appendChild(script);
        return true;
    }
    return false;
}

const ensureStyle = (u, id = 'app-style') => {
    const existingStyle = document.getElementById(id);
    if (!existingStyle) {
        console.debug('Loading CSS dynamically');
        // Load CSS dynamically
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = u + '?t=' + Date.now(); // Add timestamp to prevent caching
        link.onload = () => console.debug('CSS loaded successfully:', u);
        link.onerror = (e) => console.error('Failed to load CSS:', u, e);
        document.head.appendChild(link);
        return true;
    }
    return false;
}

const waitForElement = (selector, callback, timeout = 10000) => {
    const el = document.querySelector(selector);
    if (el) {
        callback(el);
        return;
    }

    const observer = new MutationObserver((mutations, obs) => {
        const el = document.querySelector(selector);
        if (el) {
            obs.disconnect();
            callback(el);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Optional timeout to avoid running forever
    setTimeout(() => observer.disconnect(), timeout);
}

export { ensureAppRoot, ensureScript, ensureStyle, waitForElement };