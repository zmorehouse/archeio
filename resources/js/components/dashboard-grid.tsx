import { componentRegistry, type LayoutConfig } from '@/lib/component-registry';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface DashboardGridProps {
    layout: LayoutConfig;
    onLayoutChange: (layout: LayoutConfig) => void;
    children: (componentId: string) => React.ReactNode;
    className?: string;
    columnCount?: 1 | 2 | 3;
}

export function DashboardGrid({
    layout,
    onLayoutChange,
    children,
    className,
    columnCount = 3,
}: DashboardGridProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [itemPositions, setItemPositions] = useState<
        Map<string, { left: number; top: number; width: number }>
    >(new Map());
    const [containerHeight, setContainerHeight] = useState(0);

    // Get enabled items in the order they appear in the enabled array
    const enabledItems = layout.enabled
        .map((id) => layout.items.find((item) => item.i === id))
        .filter((item): item is NonNullable<typeof item> => item !== undefined);

    // Calculate masonry positions after items are rendered
    useEffect(() => {
        if (!containerRef.current || enabledItems.length === 0) {
            setItemPositions(new Map());
            setContainerHeight(0);
            return;
        }

        const calculateLayout = () => {
            const container = containerRef.current;
            if (!container) return;

            const gap = 16; // gap-4 = 1rem = 16px
            const containerWidth = container.offsetWidth;
            const columnWidth =
                (containerWidth - gap * (columnCount - 1)) / columnCount;
            const columnHeights = new Array(columnCount).fill(0);
            const positions = new Map<
                string,
                { left: number; top: number; width: number }
            >();

            enabledItems.forEach((item) => {
                const element = itemRefs.current.get(item.i);
                if (!element) return;

                // Find the shortest column
                const shortestColumn = columnHeights.indexOf(
                    Math.min(...columnHeights),
                );

                // Use getBoundingClientRect for more accurate height
                const rect = element.getBoundingClientRect();
                const height = Math.max(rect.height, element.scrollHeight, element.offsetHeight) || 200;
                const left = shortestColumn * (columnWidth + gap);
                const top = columnHeights[shortestColumn];

                positions.set(item.i, {
                    left,
                    top,
                    width: columnWidth,
                });

                columnHeights[shortestColumn] += height + gap;
            });

            setItemPositions(positions);
            setContainerHeight(Math.max(...columnHeights, 0));
        };

        // Wait for layout to settle and images to load
        const timeoutId = setTimeout(() => {
            const container = containerRef.current;
            if (!container) return;

            // Wait for images to load
            const images = container.querySelectorAll('img');
            let imagesLoaded = 0;
            const totalImages = images.length;

            if (totalImages === 0) {
                // No images, calculate immediately
                calculateLayout();
            } else {
                // Wait for images to load
                images.forEach((img) => {
                    if (img.complete) {
                        imagesLoaded++;
                    } else {
                        img.addEventListener('load', () => {
                            imagesLoaded++;
                            if (imagesLoaded === totalImages) {
                                calculateLayout();
                            }
                        }, { once: true });
                        img.addEventListener('error', () => {
                            imagesLoaded++;
                            if (imagesLoaded === totalImages) {
                                calculateLayout();
                            }
                        }, { once: true });
                    }
                });

                // If all images are already loaded
                if (imagesLoaded === totalImages) {
                    calculateLayout();
                } else {
                    // Fallback timeout in case some images don't load
                    setTimeout(calculateLayout, 1000);
                }
            }
        }, 100); // Small delay to ensure layout is complete

        // Also recalculate on window resize
        const handleResize = () => {
            calculateLayout();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', handleResize);
        };
    }, [enabledItems, columnCount]);

    return (
        <div
            ref={containerRef}
            className={cn('relative', className)}
            style={{ minHeight: containerHeight }}
        >
            {enabledItems.map((item) => {
                const position = itemPositions.get(item.i);

                return (
                    <div
                        key={item.i}
                        ref={(el) => {
                            if (el) {
                                itemRefs.current.set(item.i, el);
                            } else {
                                itemRefs.current.delete(item.i);
                            }
                        }}
                        className="rounded-lg border border-sidebar-border/70 bg-white transition-all duration-300 dark:border-sidebar-border dark:bg-neutral-900"
                        style={{
                            position: position ? 'absolute' : 'relative',
                            left: position ? `${position.left}px` : 'auto',
                            top: position ? `${position.top}px` : 'auto',
                            width: position ? `${position.width}px` : '100%',
                            opacity: position ? 1 : 0,
                            transition: position
                                ? 'left 0.3s ease, top 0.3s ease, opacity 0.2s ease'
                                : 'opacity 0.2s ease',
                        }}
                    >
                        <div className="p-4">{children(item.i)}</div>
                    </div>
                );
            })}
        </div>
    );
}
