import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';
import { Button } from '@/components/ui/button';
import { Github, Heart, FileText } from 'lucide-react';
import { ChangelogDialog } from '@/components/changelog-dialog';
import { useState } from 'react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const [changelogOpen, setChangelogOpen] = useState(false);

    return (
        <>
            <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
                <div className="flex items-center gap-2">
                    <SidebarTrigger className="-ml-1" />
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
                <div className="flex items-center gap-2">
                    <AppearanceToggleDropdown />
                    <span className="text-neutral-400 dark:text-neutral-600">|</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                        onClick={() => setChangelogOpen(true)}
                        aria-label="View Changelog"
                    >
                        <FileText className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                        asChild
                    >
                        <a
                            href="https://github.com/zmorehouse/archeio"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View on GitHub"
                        >
                            <Github className="h-5 w-5" />
                        </a>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-md"
                        asChild
                    >
                        <a
                            href="https://zmorehouse.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="View Portfolio"
                        >
                            <Heart className="h-5 w-5" />
                        </a>
                    </Button>
                </div>
            </header>
            <ChangelogDialog open={changelogOpen} onOpenChange={setChangelogOpen} />
        </>
    );
}
