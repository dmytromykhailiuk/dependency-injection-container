export interface Class<T = any, F extends Array<any> = any[]> {
    injectDependencies?: F;
    new (...args: F): T;
}
export interface DefaultProviderOptions<T extends Class = any> {
    provider: T;
    multi?: boolean;
}
export interface UseClassProviderOptions<T extends Class = any, F extends Class = any> extends DefaultProviderOptions<T> {
    useClass: F;
}
export interface UseValueProviderOptions<T = any, F = any> extends DefaultProviderOptions {
    provider: T;
    useValue: F;
}
export interface UseExistingProviderOptions<T = any, F = any> extends DefaultProviderOptions {
    provider: T;
    useExisting: F;
}
export interface UseFactoryProviderOptions<T extends Class = any, F = any, R extends Array<any> = any[]> extends DefaultProviderOptions<T> {
    useFactory: F;
    deps?: R;
}
export interface DefaultProviderOptionsWithDeps<R extends Array<any> = any[]> extends DefaultProviderOptions {
    deps?: R;
}
