import { registerHooks } from 'node:module';

/**
 * Node's built-in type stripping does not rewrite import specifiers, but
 * NodeNext requires our relative imports to be written as `./foo.js` while the
 * sources on disk are `./foo.ts`. Fall back to the `.ts` file whenever the
 * literal `.js` specifier does not resolve, so `npm run dev` can execute the
 * sources directly.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (
        error?.code === 'ERR_MODULE_NOT_FOUND' &&
        specifier.startsWith('.') &&
        specifier.endsWith('.js')
      ) {
        return nextResolve(`${specifier.slice(0, -3)}.ts`, context);
      }
      throw error;
    }
  },
});
