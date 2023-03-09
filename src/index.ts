import {
  UseFactoryProviderOptions,
  UseExistingProviderOptions,
  UseClassProviderOptions,
  UseValueProviderOptions,
  Class,
  ProviderOptions,
  DefaultProviderOptionsWithDeps,
} from './interfaces';
import { isClass } from './helpers';

export class Container {
  private instances = new Map();
  private providersToRegister = new Map<any, ProviderOptions>();
  private providersWithParentDepsInInstances = new Map<any, ProviderOptions>();

  private parentDepsInInstances = new Map<any, Map<any, true>>();
  private requiredDepsForProvidersToRegister = new Map<any, Map<any, true>>();

  private callbacks: ((token: any) => void)[] = [];

  constructor(private parentContainer?: Container) {
    if (parentContainer) {
      parentContainer.onProviderRegistered((token) => this.tryRegisterProviders(token));
    }
  }

  public onProviderRegistered(callback: (token: any) => void) {
    this.callbacks.push(callback);
  }

  public inject<T = any>(token: any): T {
    if (this.instances.has(token)) {
      return this.instances.get(token) as T;
    }

    if (this.parentContainer && this.parentContainer.has(token)) {
      return this.parentContainer.inject<T>(token) as T;
    }
  }

  public has(token: any): boolean {
    return this.instances.has(token) || (this.parentContainer && this.parentContainer.has(token));
  }

  public registerProviders(providers: ProviderOptions[]) {
    providers.forEach((provider) => this.registerProvider(provider));
  }

  public registerProvider(providerOptions: ProviderOptions) {
    if (isClass(providerOptions)) {
      this.registerDefaultProvider(providerOptions as Class);
    }
    if ((providerOptions as UseValueProviderOptions).useValue) {
      return this.registerValue(providerOptions as UseValueProviderOptions);
    }
    if ((providerOptions as UseClassProviderOptions).useClass) {
      return this.registerUseClassProvider(providerOptions as UseClassProviderOptions);
    }
    if ((providerOptions as UseExistingProviderOptions).useExisting) {
      return this.registerUseExistingProvider(providerOptions as UseExistingProviderOptions);
    }
    if ((providerOptions as UseFactoryProviderOptions).useFactory) {
      return this.registerUseFactoryProvider(providerOptions as UseFactoryProviderOptions);
    }
  }

  private setInstance(token: any, insnance: any, multi: boolean = false) {
    if (!multi && this.instances.has(token)) {
      throw Error(`You already have ${token} token in your container!`);
    }

    this.instances.set(token, !multi ? insnance : [...(this.inject(token) || []), insnance]);

    this.tryRegisterDependentProviders(token);
    this.tryRegisterProviders(token);
  }

  private registerValue(providerOptions: UseValueProviderOptions) {
    this.setInstance(providerOptions.provider, providerOptions.useValue, providerOptions.multi);
  }

  private registerDefaultProvider(provider: Class) {
    this.registerCreationProvider(
      {
        provider,
        useClass: provider,
        deps: provider.injectDependencies || [],
      } as DefaultProviderOptionsWithDeps,
      provider,
    );
  }

  private registerUseClassProvider(providerOptions: UseClassProviderOptions) {
    this.registerCreationProvider(providerOptions, providerOptions.useClass);
  }

  private registerUseFactoryProvider(providerOptions: UseFactoryProviderOptions) {
    this.registerCreationProvider(providerOptions, providerOptions.useFactory, (a, args = []) => a(...args));
  }

  private registerUseExistingProvider(providerOptions: UseExistingProviderOptions) {
    if (this.instances.has(providerOptions.provider)) {
      this.setInstance(providerOptions.provider, this.instances.get(providerOptions.provider), providerOptions.multi);
      return;
    }

    if (this.parentContainer && this.parentContainer.has(providerOptions.provider)) {
      this.providersWithParentDepsInInstances.set(providerOptions.provider, providerOptions);
      this.setParentDepsInInstances(providerOptions.provider, providerOptions.useExisting);

      this.setInstance(
        providerOptions.provider,
        this.parentContainer.inject(providerOptions.provider),
        providerOptions.multi,
      );

      return;
    }

    this.setRequiredDepsForProvidersToRegister(providerOptions.provider, providerOptions.useExisting);
    this.providersToRegister.set(providerOptions.provider, providerOptions);
  }

  private registerCreationProvider(
    providerOptions: DefaultProviderOptionsWithDeps,
    creationEntity: any,
    creationFunction: (a: any, args?: any[]) => any = (a, args: any[] = []) => new a(...args),
  ) {
    if (!providerOptions?.deps?.length) {
      this.setInstance(providerOptions.provider, creationFunction(creationEntity), providerOptions.multi);
      return;
    }

    const depsMetadata = this.getDepsMetadata(providerOptions.deps);

    if (
      !depsMetadata.every((data) => {
        if (data.hasInstance) {
          return true;
        }
        this.setRequiredDepsForProvidersToRegister(providerOptions.provider, data.token);

        return false;
      })
    ) {
      this.providersToRegister.set(providerOptions.provider, providerOptions as ProviderOptions);
      return;
    }

    if (depsMetadata.filter(({ isParent }) => isParent).length) {
      this.providersWithParentDepsInInstances.set(providerOptions.provider, providerOptions as ProviderOptions);
    }

    depsMetadata
      .filter(({ isParent }) => isParent)
      .forEach(({ token }) => this.setParentDepsInInstances(providerOptions.provider, token));

    this.setInstance(
      providerOptions.provider,
      creationFunction(
        creationEntity,
        depsMetadata.map(({ instance }) => instance),
      ),
      providerOptions.multi,
    );
  }

  private setRequiredDepsForProvidersToRegister(providerToken: any, requiredToken: any) {
    if (this.requiredDepsForProvidersToRegister.has(requiredToken)) {
      const requiredDepsForProvidersToRegisterMap = this.requiredDepsForProvidersToRegister.get(requiredToken);

      (requiredDepsForProvidersToRegisterMap as Map<any, true>).set(providerToken, true);

      this.requiredDepsForProvidersToRegister.set(
        requiredToken,
        requiredDepsForProvidersToRegisterMap as Map<any, true>,
      );
    } else {
      this.requiredDepsForProvidersToRegister.set(requiredToken, new Map<any, true>([[providerToken, true]]));
    }
  }

  private setParentDepsInInstances(providerToken: any, requiredToken: any) {
    if (this.parentDepsInInstances.has(requiredToken)) {
      const parentDepsInInstancesMap = this.parentDepsInInstances.get(requiredToken);

      (parentDepsInInstancesMap as Map<any, true>).set(providerToken, true);

      this.parentDepsInInstances.set(requiredToken, parentDepsInInstancesMap as Map<any, true>);
    } else {
      this.parentDepsInInstances.set(requiredToken, new Map<any, true>([[providerToken, true]]));
    }
  }

  private getDepsMetadata(deps: any[]) {
    return deps.map((token) => {
      if (this.instances.has(token)) {
        return {
          token,
          hasInstance: true,
          instance: this.instances.get(token),
          isParent: false,
        };
      }
      if (this.parentContainer && this.parentContainer.has(token)) {
        return {
          token,
          hasInstance: true,
          instance: this.parentContainer.inject(token),
          isParent: true,
        };
      }
      return {
        token,
        hasInstance: false,
        instance: undefined,
        isParent: true,
      };
    });
  }

  private tryRegisterProviders(token: any) {
    if (this.requiredDepsForProvidersToRegister.has(token)) {
      Array.from(this.requiredDepsForProvidersToRegister.get(token) as Map<any, true>)
        .filter(([providerToken]) => token !== providerToken)
        .forEach(([providerToken]) => {
          this.registerProvider(this.providersToRegister.get(providerToken) as ProviderOptions);
        });

      this.requiredDepsForProvidersToRegister.delete(token);
    }
  }

  private tryRegisterDependentProviders(token: any) {
    if (this.parentDepsInInstances.has(token)) {
      Array.from(this.parentDepsInInstances.get(token) as Map<any, true>)
        .filter(([providerToken]) => token !== providerToken)
        .forEach(([providerToken]) => {
          this.registerProvider(this.providersWithParentDepsInInstances.get(providerToken) as ProviderOptions);
        });

      this.parentDepsInInstances.delete(token);
    }
  }
}

export const globalContainer = new Container();
