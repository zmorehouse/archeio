import { arrayMove } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { componentRegistry, type LayoutConfig, type ComponentRegistry } from '@/lib/component-registry';
import { ArrowDown, ArrowUp, Settings } from 'lucide-react';
import { useState } from 'react';

interface DashboardSettingsProps {
    layout: LayoutConfig;
    onToggle: (componentId: string, enabled: boolean) => void;
    onReorder: (newOrder: string[]) => void;
    onReset: () => void;
    registry?: ComponentRegistry;
}

interface ComponentItemProps {
    id: string;
    title: string;
    description?: string;
    isEnabled: boolean;
    index: number;
    totalItems: number;
    onToggle: (enabled: boolean) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}

function ComponentItem({
    id,
    title,
    description,
    isEnabled,
    index,
    totalItems,
    onToggle,
    onMoveUp,
    onMoveDown,
}: ComponentItemProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onMoveUp}
                        disabled={index === 0}
                    >
                        <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={onMoveDown}
                        disabled={index === totalItems - 1}
                    >
                        <ArrowDown className="h-3 w-3" />
                    </Button>
                </div>
                <div className="flex-1 min-w-0">
                    <Label htmlFor={id} className="text-sm font-medium">
                        {title}
                    </Label>
                    {description && (
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            {description}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex-shrink-0">
                <Switch
                    id={id}
                    checked={isEnabled}
                    onCheckedChange={onToggle}
                />
            </div>
        </div>
    );
}

export function DashboardSettings({
    layout,
    onToggle,
    onReorder,
    onReset,
    registry = componentRegistry,
}: DashboardSettingsProps) {
    const [open, setOpen] = useState(false);

    // Get enabled components in their current order
    const enabledComponents = layout.enabled
        .map((id) => registry[id])
        .filter(Boolean);

    const handleMoveUp = (componentId: string) => {
        const currentIndex = layout.enabled.indexOf(componentId);
        if (currentIndex > 0) {
            const newOrder = arrayMove(layout.enabled, currentIndex, currentIndex - 1);
            onReorder(newOrder);
        }
    };

    const handleMoveDown = (componentId: string) => {
        const currentIndex = layout.enabled.indexOf(componentId);
        if (currentIndex < layout.enabled.length - 1) {
            const newOrder = arrayMove(layout.enabled, currentIndex, currentIndex + 1);
            onReorder(newOrder);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="h-4 w-4" />
                    <span className="sr-only">Dashboard Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Dashboard Settings</DialogTitle>
                    <DialogDescription>
                        Use arrows to reorder components, toggle to show/hide them
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-4">
                    {enabledComponents.map((config, index) => {
                        const isEnabled = layout.enabled.includes(config.id);
                        return (
                            <ComponentItem
                                key={config.id}
                                id={config.id}
                                title={config.title}
                                description={config.description}
                                isEnabled={isEnabled}
                                index={index}
                                totalItems={enabledComponents.length}
                                onToggle={(checked) => onToggle(config.id, checked)}
                                onMoveUp={() => handleMoveUp(config.id)}
                                onMoveDown={() => handleMoveDown(config.id)}
                            />
                        );
                    })}
                </div>

                {/* Show disabled components - only if there are any */}
                {Object.values(registry).some(
                    (config) => !layout.enabled.includes(config.id),
                ) && (
                    <div className="space-y-2 border-t pt-4">
                        <Label className="text-sm font-semibold">
                            Disabled Components
                        </Label>
                        {Object.values(registry)
                            .filter((config) => !layout.enabled.includes(config.id))
                            .map((config) => {
                                const isEnabled = false;
                                return (
                                    <div
                                        key={config.id}
                                        className="flex items-center justify-between rounded-lg border border-sidebar-border/70 p-3 opacity-60 dark:border-sidebar-border"
                                    >
                                        <div className="flex-1">
                                            <Label
                                                htmlFor={config.id}
                                                className="text-sm font-medium"
                                            >
                                                {config.title}
                                            </Label>
                                            {config.description && (
                                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                                    {config.description}
                                                </p>
                                            )}
                                        </div>
                                        <Switch
                                            id={config.id}
                                            checked={isEnabled}
                                            onCheckedChange={(checked) => {
                                                onToggle(config.id, checked);
                                            }}
                                        />
                                    </div>
                                );
                            })}
                    </div>
                )}

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={onReset}>
                        Reset to Defaults
                    </Button>
                    <Button onClick={() => setOpen(false)}>Done</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

