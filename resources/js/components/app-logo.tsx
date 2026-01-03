import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const page = usePage<SharedData>();
    const version = page.props.appVersion || '1.0.0';

    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary-foreground">
                <AppLogoIcon className="size-7" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold text-lg">
                    Archeio
                </span>
                <span className="text-xs text-muted-foreground">
                    v{version}
                </span>
            </div>
        </>
    );
}
