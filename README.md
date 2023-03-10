# Dependency injection container

**Solution for Dependency creation and management**

(DI Container with inheritance similar to Angular and NestJS implementation)

## Installation

```sh
npm i @dmytromykhailiuk/dependency-injection-container
```

### Basic example of usage

```typescript

import { Container } from '@dmytromykhailiuk/dependency-injection-container';

class Logger {
  log(message: string) {
    console.log(message);
  }
}

class ApiService {
  static injectDependencies = [Logger];

  constructor(private logger: Logger) {}

  async makeCall(url: string) {
    this.logger.log(`makeCall to ${url}`);

    const result = await (await fetch(url)).json();

    this.logger.log(`makeCall to ${url} Success -> result: ${JSON.stringify(result)}`);

    return result;
  }
}

class UserService {
  static injectDependencies = [ApiService, USER_URL];

  constructor(private apiService: ApiService, private userUrl: string) {}

  getUser(id: string) {
    return this.apiService.makeCall(`${this.userUrl}/${id}`);
  }
}

class UserFacade {
  static injectDependencies = [UserService]; // need to define this property for DI

  currentUserId: string;

  constructor(private userService: UserService) {}

  getCurrentUser() {
    return this.userService.getUser(this.currentUserId);
  }
}

const container = new Container();

container.registerProviders([
  UserFacade,
  UserService,
  ApiService,
  Logger,
  {
    useValue: 'https://example-user/',
    provider: USER_URL,
  },
]);

const userFacade = container.inject<UserFacade>(UserFacade);

userFacade.getCurrentUser().then((user) => {
  console.log(user);
});

```

### Ways to register provider:

#### using Class

```typescript

container.registerProviders([SomeClass]); // instance of SomeClass will be created

```

#### using object with useValue proprty

```typescript

const SECRET_KEY_TOKEN = 'SECRET_KEY_TOKEN';

container.registerProviders([
  {
    useValue: 'secret_key',
    provider: SECRET_KEY_TOKEN
  }
]); // secret_key value will be registered using SECRET_KEY_TOKEN injection token

```

#### using object with useClass proprty

```typescript

class ClassABC {
  a() {  /* do something 1 */ }
  b() {  /* do something 2 */ }
  c() {  /* do something 3 */ }
}

abstract class ClassB {
  abstract b: () => void
}

container.registerProviders([
  {
    useClass: ClassABC,
    provider: ClassB
  }
]); // instance of class ClassABC will be created with ClassB type/token 

```

#### using object with useExisting proprty

```typescript

container.registerProviders([
  {
    useValue: 1
    provider: 'Token 1'
  },
  {
    useExisting: 'Token 1',
    provider: 'Token 2'
  }
]); // register new provider with extisting data/object in container

```

#### using object with useFactory proprty with deps

```typescript

container.registerProviders([
  {
    useValue: 1
    provider: 'Token 1'
  },
  {
    useValue: 2,
    provider: 'Token 2'
  }
  {
    useFactory: (dataFromFirstToken, dataFromSecondToken) => {
      // do something
      
      return newResultingProvider;
    }
    deps: ['Token 1', 'Token 2'],
    provider: 'Token 3'
  }
]); // call factory function to register provider

```

#### using multi true
```typescript

container.registerProviders([
  {
    useValue: 1,
    multi: true,
    provider: 'Token'
  },
  {
    useValue: 2,
    multi: true,
    provider: 'Token'
  }
]);

const data = container.inject<number>('Token'); // [1, 2] // return values for "Token" provider

```
