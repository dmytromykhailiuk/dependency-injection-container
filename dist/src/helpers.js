"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isClass = void 0;
const isClass = (variable) => {
    var _a;
    return Boolean(typeof variable === 'function' &&
        variable.prototype &&
        !((_a = Object.getOwnPropertyDescriptor(variable, 'prototype')) === null || _a === void 0 ? void 0 : _a.writable));
};
exports.isClass = isClass;
//# sourceMappingURL=helpers.js.map