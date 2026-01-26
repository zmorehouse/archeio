import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface ChangelogDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangelogDialog({ open, onOpenChange }: ChangelogDialogProps) {
    const [changelog, setChangelog] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            fetch('/api/changelog')
                .then((res) => res.json())
                .then((data) => {
                    const content = data.content || '';
                    // Strip the header lines: "# Changelog", blank line, and "All notable changes..." line
                    const lines = content.split('\n');
                    const filteredLines = lines.filter((line: string, index: number) => {
                        // Skip first line if it's "# Changelog"
                        if (index === 0 && line.trim() === '# Changelog') {
                            return false;
                        }
                        // Skip the "All notable changes..." line
                        if (line.includes('All notable changes to this project')) {
                            return false;
                        }
                        // Skip the format reference lines if present
                        if (line.includes('Keep a Changelog') || line.includes('Semantic Versioning')) {
                            return false;
                        }
                        return true;
                    });
                    // Remove any leading blank lines
                    while (filteredLines.length > 0 && filteredLines[0].trim() === '') {
                        filteredLines.shift();
                    }
                    setChangelog(filteredLines.join('\n'));
                    setLoading(false);
                })
                .catch(() => {
                    setChangelog('Failed to load changelog.');
                    setLoading(false);
                });
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[50vw] max-w-[calc(100%-2rem)] sm:max-w-none max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Changelog</DialogTitle>
                    <DialogDescription>
                        Recent changes and updates to Archeio
                    </DialogDescription>
                </DialogHeader>
                <div className="overflow-y-auto flex-1 pr-2 -mr-2">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading changelog...
                        </div>
                    ) : (
                        <div className="text-sm space-y-4">
                            <ReactMarkdown
                                components={{
                                    h2: ({ ...props }) => (
                                        <h2
                                            className="text-xl font-semibold mt-6 mb-3 pb-2 border-b border-sidebar-border/50 first:mt-0"
                                            {...props}
                                        />
                                    ),
                                    h3: ({ ...props }) => (
                                        <h3
                                            className="text-lg font-semibold mt-4 mb-2"
                                            {...props}
                                        />
                                    ),
                                    ul: ({ ...props }) => (
                                        <ul className="list-disc pl-6 mb-4 space-y-1" {...props} />
                                    ),
                                    li: ({ ...props }) => (
                                        <li className="text-neutral-700 dark:text-neutral-300" {...props} />
                                    ),
                                    p: ({ ...props }) => (
                                        <p className="mb-2 text-neutral-600 dark:text-neutral-400" {...props} />
                                    ),
                                    strong: ({ ...props }) => (
                                        <strong className="font-semibold" {...props} />
                                    ),
                                } as Components}
                            >
                                {changelog}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

