import { ProviderOptions } from './interfaces';
export declare class Container {
    private parentContainer?;
    private instances;
    private providersToRegister;
    private providersWithParentDepsInInstances;
    private parentDepsInInstances;
    private requiredDepsForProvidersToRegister;
    private callbacks;
    constructor(parentContainer?: Container);
    onProviderRegistered(callback: (token: any) => void): void;
    inject<T = any>(token: any): T;
    has(token: any): boolean;
    registerProviders(providers: ProviderOptions[]): void;
    registerProvider(providerOptions: ProviderOptions): void;
    private setInstance;
    private registerValue;
    private registerDefaultProvider;
    private registerUseClassProvider;
    private registerUseFactoryProvider;
    private registerUseExistingProvider;
    private registerCreationProvider;
    private setRequiredDepsForProvidersToRegister;
    private setParentDepsInInstances;
    private getDepsMetadata;
    private tryRegisterProviders;
    private tryRegisterDependentProviders;
}
export declare const globalContainer: Container;
