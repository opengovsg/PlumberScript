import fs from 'fs'
import { createInterface } from 'readline'
import { Scanner } from './Scanner'

export class Lox {
  private static hadError: boolean = false // TODO: ErrorReporter class

  static main(): void {
    const args = process.argv.slice(2)

    if (args.length > 1) {
      console.log('Usage: tslox [script]')
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

    // Indicate an error in the exit code
    if (this.hadError) process.exit(65)
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

      Lox.run(line)
      this.hadError = false

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
    console.log(tokens) // TODO
  }

  static error(line: number, message: string): void {
    Lox.report(line, '', message)
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`)
    Lox.hadError = true
  }
}

Lox.main()
