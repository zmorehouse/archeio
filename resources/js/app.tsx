import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'Archeio';

// Filter out Inertia history encryption debug logs
if (typeof window !== 'undefined') {
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
        // Filter out objects that look like Inertia encrypted history keys
        // These are objects with a single property that's a short alphanumeric string
        const shouldFilter = args.some((arg) => {
            if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
                const keys = Object.keys(arg);
                // Check if it's an object with a single key that's a short alphanumeric string
                if (keys.length === 1) {
                    const key = keys[0];
                    const value = (arg as Record<string, unknown>)[key];
                    // Pattern: short alphanumeric key (like "AKGCx8") with a short value (like "b")
                    if (
                        /^[A-Za-z0-9]{4,10}$/.test(key) &&
                        (typeof value === 'string' && value.length <= 2)
                    ) {
                        return true;
                    }
                }
            }
            return false;
        });

        if (!shouldFilter) {
            originalLog.apply(console, args);
        }
    };
}

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
