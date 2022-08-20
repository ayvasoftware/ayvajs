import GeneratorBehavior from './generator-behavior.js';

/**
 * A behavior that allows the execution of scripts stored in a string.
 *
 * WARNING: Scripts are run inside of a rudimentary sandbox. The sandbox is NOT secure.
 *          Care should be taken to avoid running scripts from untrusted sources.
 *
 * For full details on how to use this class, see the {@tutorial behavior-api} tutorial.
 */
class ScriptBehavior extends GeneratorBehavior {
  #code;

  constructor (script) {
    super();

    // Escape quotes and backslashes.
    this.#code = script.replace(/["'`\\]/g, (v) => `\\${v}`);
  }

  * generate (ayva) {
    const generator = this.#createSandboxGenerator(ayva);

    /* c8 ignore start */
    // We turn off code coverage for this block because the branch at
    // the end of the loop is never hit due to how generators work... or something like that :)
    while (!this.complete) {
      // We only perform this in a loop so we do not have to recreate the sandbox each iteration.
      yield* generator(ayva);

      // Force a yield in case the sandbox generator did not yield a value.
      // This prevents an infinite loop.
      yield;
    }
    /* c8 ignore stop */
  }

  #createSandboxGenerator (ayva) {
    let sandboxFunction = 'new Function(';

    for (const prop in globalThis) { // eslint-disable-line guard-for-in
      // Blacklist globals.
      sandboxFunction += `"${prop}", `;
    }

    // Blacklist eval and Function
    sandboxFunction += '"eval", "Function", ';

    // Create the generate function from script.
    sandboxFunction += `\`
      return (function*(ayva) { 
        ${this.#expose(ayva)}
        ${this.#code} 
      }).bind(this);\`);`;

    try {
      const sandbox = eval(sandboxFunction); // eslint-disable-line no-eval
      return sandbox.call(this);
    } catch (error) {
      throw new SyntaxError('Invalid AyvaScript.');
    }
  }

  #expose (ayva) {
    return `const { ${Object.keys(ayva.$).join(', ')} } = ayva.$;`;
  }
}

export default ScriptBehavior;
