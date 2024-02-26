import fs from 'fs'
import { createInterface } from 'readline'
import { Scanner } from './Scanner'
import { errorReporter } from './errors/ErrorReporter'
import { Parser } from './Parser'
import { Interpreter } from './Interpreter'
import { Token } from './ast/Token'
import { Resolver } from './Resolver'
import { color } from './color'

const usage = 'Usage: plumber [script]'
export class PlumberScript {
  private static readonly interpreter = new Interpreter()

  static runFile(path: string): void {
    const bytes = fs.readFileSync(path)
    PlumberScript.run(bytes.toString())

    if (errorReporter.hadCliError) {
      console.log(color.red(usage))
      process.exit(64)
    }
    if (errorReporter.hadSyntaxError) process.exit(65)
    if (errorReporter.hadRuntimeError) process.exit(70)
  }

  static runPrompt(): void {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: color.green('[plumber]> '),
    })

    rl.on('line', (input) => {
      const line = input.trim()

      if (line === 'exit') rl.close()

      if (line) {
        try {
          PlumberScript.run(line)
        } catch (error) {
          errorReporter.report(error as Error)
        }
      }
      errorReporter.hadRuntimeError = false
      errorReporter.hadSyntaxError = false

      console.log()
      rl.prompt()
    })

    rl.on('close', () => {
      console.log(color.green('(exiting)'))
      process.exit(0)
    })

    rl.prompt()
  }

  static run(source: string): void {
    const scanner = new Scanner(source)
    const tokens: Array<Token> = scanner.scanTokens()

    const parser = new Parser(tokens)
    const [statements, expr] = parser.parseRepl()

    // Stop if there was a syntax error
    if (errorReporter.hadSyntaxError) return

    const resolver = new Resolver(this.interpreter)
    resolver.resolve(statements)
    if (expr !== null) resolver.resolve(expr)

    // Stop if there was a resolution error
    if (errorReporter.hadResolvingError) return

    this.interpreter.interpret(statements)
    if (expr !== null) {
      const value = this.interpreter.evaluate(expr)
      console.log(color.green(this.interpreter.stringify(value)))
    }
  }
}
