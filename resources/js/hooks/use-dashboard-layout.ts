import { useCallback, useEffect, useState } from 'react';
import {
    componentRegistry,
    type LayoutConfig,
    type LayoutItem,
    type ComponentRegistry,
} from '@/lib/component-registry';

const STORAGE_KEY_PREFIX = 'dashboard_layout_';

function getStorageKey(pageType: string): string {
    return `${STORAGE_KEY_PREFIX}${pageType}`;
}

function getDefaultLayout(pageType: string, registry: ComponentRegistry = componentRegistry): LayoutConfig {
    const enabled: string[] = [];
    const items: LayoutItem[] = [];
    let x = 0;
    let y = 0;

    // Sort components to put overall-rankings first (for dashboard) or player-levels first (for player)
    const sortedComponents = Object.values(registry).sort((a, b) => {
        if (a.id === 'overall-rankings' || a.id === 'player-levels') return -1;
        if (b.id === 'overall-rankings' || b.id === 'player-levels') return 1;
        return 0;
    });

    sortedComponents.forEach((config) => {
        if (config.defaultEnabled) {
            enabled.push(config.id);
            items.push({
                i: config.id,
                x,
                y,
                w: config.defaultSize.w,
                h: config.defaultSize.h,
            });
            x += config.defaultSize.w;
            if (x >= 12) {
                // Move to next row
                x = 0;
                y += config.defaultSize.h;
            }
        }
    });

    return { items, enabled };
}

function loadLayout(pageType: string, registry: ComponentRegistry = componentRegistry): LayoutConfig {
    if (typeof window === 'undefined') {
        return getDefaultLayout(pageType, registry);
    }

    const stored = localStorage.getItem(getStorageKey(pageType));
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return getDefaultLayout(pageType, registry);
        }
    }

    return getDefaultLayout(pageType, registry);
}

function saveLayout(pageType: string, layout: LayoutConfig): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getStorageKey(pageType), JSON.stringify(layout));
}

export function useDashboardLayout(pageType: string = 'dashboard', registry: ComponentRegistry = componentRegistry) {
    const [layout, setLayout] = useState<LayoutConfig>(() =>
        loadLayout(pageType, registry),
    );

    useEffect(() => {
        saveLayout(pageType, layout);
    }, [pageType, layout]);

    const updateLayout = useCallback(
        (updater: (prev: LayoutConfig) => LayoutConfig) => {
            setLayout((prev) => {
                const updated = updater(prev);
                saveLayout(pageType, updated);
                return updated;
            });
        },
        [pageType],
    );

    const toggleComponent = useCallback(
        (componentId: string, enabled: boolean) => {
            updateLayout((prev) => {
                const config = registry[componentId];
                if (!config) return prev;

                let newEnabled: string[];
                let newItems: LayoutItem[];

                if (enabled) {
                    // Add component
                    newEnabled = prev.enabled.includes(componentId)
                        ? prev.enabled
                        : [...prev.enabled, componentId];

                    // Ensure item exists in layout
                    const existingItem = prev.items.find((item) => item.i === componentId);
                    if (existingItem) {
                        newItems = prev.items;
                    } else {
                        newItems = [
                            ...prev.items,
                            {
                                i: componentId,
                                x: 0,
                                y: 0,
                                w: config.defaultSize.w,
                                h: config.defaultSize.h,
                            },
                        ];
                    }
                } else {
                    // Remove component
                    newEnabled = prev.enabled.filter((id) => id !== componentId);
                    newItems = prev.items.filter((item) => item.i !== componentId);
                }

                return { items: newItems, enabled: newEnabled };
            });
        },
        [updateLayout, registry],
    );

    const updateItemLayout = useCallback(
        (itemId: string, updates: Partial<LayoutItem>) => {
            updateLayout((prev) => {
                const newItems = prev.items.map((item) =>
                    item.i === itemId ? { ...item, ...updates } : item,
                );
                return { ...prev, items: newItems };
            });
        },
        [updateLayout],
    );

    const reorderComponents = useCallback(
        (newOrder: string[]) => {
            updateLayout((prev) => {
                // Validate that all IDs in newOrder exist in enabled
                const validOrder = newOrder.filter((id) =>
                    prev.enabled.includes(id),
                );
                // Add any missing enabled items to the end
                const missing = prev.enabled.filter(
                    (id) => !validOrder.includes(id),
                );
                return { ...prev, enabled: [...validOrder, ...missing] };
            });
        },
        [updateLayout],
    );

    const resetLayout = useCallback(() => {
        const defaultLayout = getDefaultLayout(pageType, registry);
        setLayout(defaultLayout);
        saveLayout(pageType, defaultLayout);
    }, [pageType, registry]);

    return {
        layout,
        toggleComponent,
        updateItemLayout,
        reorderComponents,
        resetLayout,
        updateLayout,
    };
}

