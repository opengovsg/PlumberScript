# PlumberScript

A safe programming sandbox for Plumber Compute, implemented in TypeScript.

## Getting Started

### Development

Get your repository set up with:

```bash
git clone https://github.com/opengovsg/PlumberScript.git
cd PlumberScript
npm install
```

### Library usage

Example in Typescript:

```typescript
import { PlumberScript } from '@opengovsg/plumberscript'

const plumber = new PlumberScript()

plumber.evaluate(`let x = 1;`)
plumber.evaluate(`let y = 2;`)
const value = plumber.evaluate(`x + y`)

console.log(value) // 3
```

### REPL usage

Build and run the compiled version with

```bash
npm run build
npm run plumber # Interpreter mode
npm run plumber examples/fibonacci.plumber # File mode
```

For development:

```bash
npm run dev
```

which will fire up the interpreter.

## Syntax

### Arithmetic

- Negation Operator: `-` converts a number to it's negative representation
- Multiplication Operator: `*` multiplies two numbers together
- Division Operator: `/` divides two numbers together
- Addition/Concatenation Operator: `+` adds two numbers together, or concatenates two strings into a single string
- Subtraction Operator: `-` subtracts one number from another

### Logical Comparisons

- Equality Condition: `==` evaluates to `true` if two values are equal, and `false` otherwise
- Not Equal Condition: `!=` evaluates to `true` if two values are not equal to each other
- Greater Than Condition: `>` is `true` when one number is greater than another, and `false` otherwise
- Less Than Condition: `<` is `true` when one number is less than another, and `false` otherwise
- Greater Than or Equal Condition: `>=` is `true` when a value is greater than or equal to another, and `false` otherwise
- Less Than or Equal Condition: `<=` evaluates to `true` when a value is less than or equal to another, and `false` otherwise
- And Condition: `and` evaluates to `true` when two logical expressions both evaluate to `true`
- Or Condition: `or` evaluates to `true` when either of the logical expressions evaluate to `true`. The right expression is not evaluated of the left returns a truthy value.

### Plumber Functions

The following Plumber Functions are currently available:

- `ABS(number)`: Returns the absolute value of a number
- `POWER(base, exponent)`: Returns the result of a number raised to a power

These functions are implemented in [src/lib](src/lib), but more can be readily implemented when necessary.

## Advanced usage

PlumberScript can also be used to define and execute scripts, not just simple expressions.

For example, the following code prints the first ten Fibonacci numbers:

```javascript
function fibonacci(n) {
    if (n == 0) return 0;
    if (n == 1) return 1;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i=i+1) {
    print fibonacci(i);
}
```

## Motivation

We were inspired by compute features available in other products, such as [Zapier Formatter](https://help.zapier.com/hc/en-us/articles/8496181204877-Understand-spreadsheet-style-formula-functions#h_01HKMDCATJPZFV20YD8NMM6M33) and [Tableau's Calculated Fields](https://help.tableau.com/current/pro/desktop/en-us/functions_functions_tablecalculation.htm), which allowed flexible compute for users to transform their data.

At the same time, safely evaluating untrusted user-submitted code was an *extremely* difficult problem. We found that it was not trivial to implement this feature using open source options that could strike the right balance between user-friendliness with strict safety requirements. Libraries such as [math.js](https://www.npmjs.com/package/math.js) were highly domain-specific, while others such as [isolated-vm](https://www.npmjs.com/package/isolated-vm) would expose the full functionality of JavaScript to end users at the same time. Even NodeJS' own [VM module](https://nodejs.org/api/vm.html) put up big red warning signs stating that it is not a security mechanism.

With PlumberScript, we can sandbox untrusted code while retaining control of the syntax at the same time. Dangerous operations such as reading the file system, accessing `process` module, or performing network calls cannot be done because they have not been built into the language interpreter.

### Performance

PlumberScript is expected to be much slower (at least 100x) compared to an equivalent C or Rust implementation. As a tree-walk interpreter built on top of a high-level NodeJS runtime, it is unable to take advantage of many common compiler optimisations (e.g. memory layout, processor cache). However this is not a priority at the moment as users are expected to submit simple expressions most of the time.

## Caveat

This repository has not yet undergone VAPT or tested for code breakout.

## Acknowledgements

We would like to thank Robert Nystrom and his invaluable insights in his book *Crafting Interpreters*.
