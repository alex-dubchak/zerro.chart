const ensureAppRoot = async (el = '.container') => {
    let app = document.getElementById('app');
    if (!app) {
        console.debug('Creating app root element');
        const container = document.querySelector(el) || document.body;
        container.innerHTML = '';
        app = document.createElement('div');
        app.id = 'app';
        container.appendChild(app);
    }
    return app;
};

const ensureScript = async (u) => {
    const existingScript = document.getElementById('app-script');
    if (!existingScript) {
        console.debug('Loading Vue script dynamically');
        // Load Vue script dynamically as ES module
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = 'app-script';
            script.type = 'module';
            script.src = u + '?t=' + Date.now(); // Vite dev server
            
            script.onload = () => {
                console.debug('Script loaded successfully:', u);
                resolve(script);
            };
            
            script.onerror = (e) => {
                console.error('Failed to load script:', u, e);
                reject(e);
            };
            
            document.head.appendChild(script);
        });
    } else {
        console.debug('Script already loaded:', u);
        return existingScript;
    }
};

const ensureStyle = async (u, id = 'app-style') => {
    const existingStyle = document.getElementById(id);
    if (!existingStyle) {
        console.debug('Loading CSS dynamically');
        // Load CSS dynamically
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = u + '?t=' + Date.now(); // Add timestamp to prevent caching
            
            link.onload = () => {
                console.debug('CSS loaded successfully:', u);
                resolve(link);
            };
            
            link.onerror = (e) => {
                console.error('Failed to load CSS:', u, e);
                reject(e);
            };
            
            document.head.appendChild(link);
        });
    } else {
        return existingStyle;
    }
};

const waitForElement = async (selector, timeout = 10000) => {
    const el = document.querySelector(selector);
    if (el) {
        return el;
    }

    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations, obs) => {
            const el = document.querySelector(selector);
            if (el) {
                obs.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Optional timeout to avoid running forever
        setTimeout(() => {
            observer.disconnect();
            resolve(null); // Resolve with null if element wasn't found
        }, timeout);
    });
};


async function initializeApp(baseUrl) {
  try {
    console.log('Initializing app with base URL:', baseUrl);
    const rootEl = '.container';
    await waitForElement(rootEl);
    await ensureAppRoot(rootEl);
    await ensureScript(`${baseUrl}/assets/index.js`);
    await ensureStyle(`${baseUrl}/assets/index.css`);
    
    if (window.runZerroChartApp) {
        window.runZerroChartApp();
    }else {
        throw new Error('runZerroChartApp function not found');
    }

    console.log('App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
}

export { initializeApp};