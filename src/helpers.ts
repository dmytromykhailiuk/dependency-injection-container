export const isClass = (variable: any) =>
  Boolean(
    typeof variable === 'function' &&
      variable.prototype &&
      !Object.getOwnPropertyDescriptor(variable, 'prototype')?.writable,
  );
