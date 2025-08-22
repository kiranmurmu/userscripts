export = GM;

declare namespace GM {
    interface RegisterMenuOptions {
        id?: number | string;
        accessKey?: string;
        autoClose?: boolean;
        title?: string;
    }
}

declare global {
    function GM_registerMenuCommand(name: string, callback: (event: MouseEvent | KeyboardEvent) => void, accessKey?: string): number | string;
    function GM_registerMenuCommand(name: string, callback: (event: MouseEvent | KeyboardEvent) => void, options?: GM.RegisterMenuOptions): number | string;
}
