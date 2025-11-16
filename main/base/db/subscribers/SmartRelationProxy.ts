import { BaseEntity } from '../BaseEntity.js';

/**
 * Smart relation proxy that provides transparent lazy loading
 *
 * Behaves differently based on context:
 * - Returns Promise when awaited (await entity.relation)
 * - Returns empty array when TypeORM iterates (save operations)
 * - Loads relation on-demand for normal access
 */

const SMART_RELATION_TIMEOUT_MS = 500; // 500ms timeout to prevent infinite loading

// eslint-disable-next-line @codeblocks/class-props-limit
class SmartRelationProxy {
  private loadedData: any = undefined; // undefined = not loaded, null = loaded as null
  private loadingPromise: Promise<any> | null = null;
  private isArray: boolean;

  constructor(
    private entity: BaseEntity,
    private relationName: string,
    private loadFunction: () => Promise<any>,
    isArray: boolean = true
  ) {
    this.isArray = isArray;
  }

  /**
   * Create the actual Proxy that handles all property access
   */
  createProxy(): any {
    return new Proxy(this.isArray ? [] : {}, {
      get: (target, prop) => this.handleGet(target, prop),
      has: (target, prop) => this.handleHas(target, prop),
      ownKeys: (target) => this.handleOwnKeys(target),
      getOwnPropertyDescriptor: (target, prop) => this.handleGetOwnPropertyDescriptor(target, prop)
    });
  }

  private async ensureLoaded(): Promise<any> {
    if (this.loadedData !== undefined) {
      return this.loadedData;
    }

    if (this.loadingPromise === null) {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Relation '${this.relationName}' loading timeout`)), SMART_RELATION_TIMEOUT_MS);
      });

      this.loadingPromise = Promise.race([
        this.loadFunction(),
        timeoutPromise
      ])
        .then((data) => {
          this.loadedData = data;
          return data;
        })
        .catch((error) => {
          this.loadedData = this.isArray ? [] : null;
          return this.loadedData;
        });
    }

    return this.loadingPromise;
  }

  private handleGet(target: any, prop: string | symbol): any {
    // Handle Promise operations (await, .then(), .catch())
    if (prop === 'then') {
      return (onFulfilled: (value: any) => any, onRejected?: (reason: any) => any) => {
        return this.ensureLoaded().then(onFulfilled, onRejected);
      };
    }

    if (prop === 'catch') {
      return (onRejected: (reason: any) => any) => {
        return this.ensureLoaded().catch(onRejected);
      };
    }

    if (prop === 'finally') {
      return (onFinally: () => void) => {
        return this.ensureLoaded().finally(onFinally);
      };
    }

    // Handle array iteration and methods (TypeORM save operations)
    if (this.isArray) {
      if (prop === 'length' || prop === Symbol.iterator ||
        typeof (Array.prototype as any)[prop] === 'function') {
        // Return default empty array behavior until loaded
        const self = this;
        return function (...args: any[]) {
          if (self.loadedData !== undefined) {
            return (self.loadedData as any)[prop](...args);
          }

          // Default empty array behavior
          if (prop === 'length') return 0;
          if (prop === Symbol.iterator) return [][Symbol.iterator]();
          return (Array.prototype as any)[prop].apply([], args);
        };
      }
    }

    // Handle property access on the loaded data
    if (this.loadedData !== undefined) {
      // If loaded data is null, return null
      if (this.loadedData === null) {
        return null;
      }
      return this.loadedData[prop];
    }

    // For synchronous access, return a Promise that will resolve
    return this.ensureLoaded().then((data) => data?.[prop]);
  }

  private handleHas(target: any, prop: string | symbol): boolean {
    if (this.loadedData !== undefined) {
      // If loaded data is null, return false
      if (this.loadedData === null) {
        return false;
      }
      return prop in this.loadedData;
    }

    // Default behavior for empty array/object
    return this.isArray ? prop in [] : prop in {};
  }

  private handleOwnKeys(target: any): (string | symbol)[] {
    if (this.loadedData !== undefined) {
      // If loaded data is null, return empty array
      if (this.loadedData === null) {
        return [];
      }
      return Reflect.ownKeys(this.loadedData);
    }

    return this.isArray ? Object.keys([]) : Object.keys({});
  }

  private handleGetOwnPropertyDescriptor(target: any, prop: string | symbol): PropertyDescriptor | undefined {
    if (this.loadedData !== undefined) {
      // If loaded data is null, return undefined
      if (this.loadedData === null) {
        return undefined;
      }
      return Object.getOwnPropertyDescriptor(this.loadedData, prop);
    }

    return this.isArray
      ? Object.getOwnPropertyDescriptor([], prop)
      : Object.getOwnPropertyDescriptor({}, prop);
  }
}

export default SmartRelationProxy;