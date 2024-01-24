import { SyntaxError, RuntimeError, CliError } from './error'

class ErrorReporter {
  hadCliError = false
  hadSyntaxError = false
  hadRuntimeError = false

  report(error: Error): void {
    let header = ''
    if (error instanceof SyntaxError && error.line) {
      header += `[${error.name} (line ${error.line}`
      if (error.where) header += ` at ${error.where}`
      header += ')'
    } else if (error instanceof RuntimeError) {
      header += `[${error.name} (line ${error.token.line})`
    } else if (error instanceof CliError) {
      header += `[${error.name}`
    } else {
      header += '[CliError'
    }
    header += ']'
    console.error(header + ' ' + error.message)

    if (error instanceof RuntimeError) this.hadRuntimeError = true
    else if (error instanceof SyntaxError) this.hadSyntaxError = true
    else this.hadCliError = true
  }
}

export const errorReporter = new ErrorReporter()
