import fs from 'fs'
import { createInterface } from 'readline'
import { Scanner } from './Scanner'
import { errorReporter } from './ErrorReporter'
import { Parser } from './Parser'
import { Interpreter } from './Interpreter'

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

  private static run(source: string): void {
    const scanner = new Scanner(source)
    const tokens = scanner.scanTokens()
    const parser = new Parser(tokens)
    const expression = parser.parse()

    // Stop if there was a syntax error
    if (errorReporter.hadSyntaxError) return

    this.interpreter.interpret(expression)
  }
}

Lox.main()
