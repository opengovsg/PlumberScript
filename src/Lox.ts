import fs from 'fs'
import { createInterface } from 'readline'
import { Scanner } from './Scanner'
import { errorReporter } from './errors/ErrorReporter'
import { Parser } from './Parser'
import { Interpreter } from './Interpreter'
import { Token } from './ast/Token'
import { Resolver } from './Resolver'

const usage = 'Usage: tslox [script]'
export class Lox {
  private static readonly interpreter = new Interpreter()

  static main(): void {
    const args = process.argv.slice(2)

    if (args.length > 1) {
      console.log(usage)
      process.exit(64)
    } else if (args.length === 1) {
      Lox.runFile(args[0])
    } else {
      Lox.runPrompt()
    }
  }

  private static runFile(path: string): void {
    const bytes = fs.readFileSync(path)
    Lox.run(bytes.toString())

    if (errorReporter.hadCliError) {
      console.log(usage)
      process.exit(64)
    }
    if (errorReporter.hadSyntaxError) process.exit(65)
    if (errorReporter.hadRuntimeError) process.exit(70)
  }

  private static runPrompt(): void {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '[tslox]> ',
    })

    rl.on('line', (input) => {
      const line = input.trim()

      if (line === 'exit') rl.close()

      if (line) {
        try {
          Lox.run(line)
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
      console.log('(exiting)')
      process.exit(0)
    })

    rl.prompt()
  }

  private static run(source: string) {
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
      console.log(this.interpreter.stringify(value))
    }
  }
}
