import fs from 'fs'
import { createInterface } from 'readline'
import { Scanner } from './Scanner'
import { errorReporter } from './errors/ErrorReporter'
import { Parser } from './Parser'
import { Interpreter } from './Interpreter'
import { Token } from './ast/Token'
import { Resolver } from './Resolver'
import { color } from './color'
import { PlumberObject } from './ast/types'

const usage = 'Usage: plumber [script]'
export class PlumberScript {
  private static readonly interpreter = new Interpreter()

  static runFile(path: string): void {
    const bytes = fs.readFileSync(path)
    PlumberScript.evaluate(bytes.toString())

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
          const value = PlumberScript.evaluate(line)
          if (value !== null) {
            console.log(color.green(this.interpreter.stringify(value)))
          }
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

  static evaluate(source: string): PlumberObject | null {
    const scanner = new Scanner(source)
    const tokens: Array<Token> = scanner.scanTokens()

    const parser = new Parser(tokens)
    const [statements, expr] = parser.parseRepl()

    // Stop if there was a syntax error
    if (errorReporter.hadSyntaxError) return null

    const resolver = new Resolver(this.interpreter)
    resolver.resolve(statements)
    if (expr !== null) resolver.resolve(expr)

    // Stop if there was a resolution error
    if (errorReporter.hadResolvingError) return null

    this.interpreter.interpret(statements)
    if (expr !== null) {
      return this.interpreter.evaluate(expr)
    }

    return null
  }
}
