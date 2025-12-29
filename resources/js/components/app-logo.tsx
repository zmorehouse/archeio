import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-10 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-primary-foreground">
                <AppLogoIcon className="size-7" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold text-lg">
                    Archeio
                </span>
            </div>
        </>
    );
}
