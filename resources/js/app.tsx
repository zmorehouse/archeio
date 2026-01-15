import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Archeio';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Handle navigation errors that might occur with replaceState
// This is often caused by URL mismatches or Cloudflare cookie issues
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        // Silently handle NS_ERROR_ILLEGAL_VALUE errors from replaceState
        // These are often caused by Cloudflare cookie issues or URL mismatches
        if (event.message?.includes('NS_ERROR_ILLEGAL_VALUE') || 
            event.message?.includes('replaceState') ||
            event.error?.message?.includes('NS_ERROR_ILLEGAL_VALUE')) {
            console.warn('Navigation error caught and handled:', event.message);
            event.preventDefault();
            return false;
        }
    }, true);

    // Also handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        if (event.reason?.message?.includes('NS_ERROR_ILLEGAL_VALUE') ||
            event.reason?.message?.includes('replaceState')) {
            console.warn('Navigation promise rejection caught and handled:', event.reason);
            event.preventDefault();
        }
    });
}
