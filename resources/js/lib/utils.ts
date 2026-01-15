import { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function isSameUrl(
    url1: NonNullable<InertiaLinkProps['href']>,
    url2: NonNullable<InertiaLinkProps['href']>,
) {
    return resolveUrl(url1) === resolveUrl(url2);
}

export function resolveUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    const resolved = typeof url === 'string' ? url : url.url;
    // Ensure we return a valid URL string, defaulting to empty string if invalid
    if (!resolved || typeof resolved !== 'string') {
        return '';
    }
    // Ensure the URL is properly formatted (relative URLs are fine)
    try {
        // If it's an absolute URL, validate it
        if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
            new URL(resolved);
        }
        return resolved;
    } catch {
        // If URL parsing fails, return the string as-is (might be a relative URL)
        return resolved;
    }
}
