import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestAuthContext {
  token?: string;
}

const authStorage = new AsyncLocalStorage<RequestAuthContext>();

export function runWithAuthContext<R>(context: RequestAuthContext, fn: () => R): R {
  return authStorage.run(context, fn);
}

export function getCurrentToken(): string | undefined {
  return authStorage.getStore()?.token;
}
