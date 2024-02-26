import { SyntaxError, RuntimeError, CliError, ResolvingError, PlumberError } from './error'

class ErrorReporter {
  error: PlumberError | undefined
  hadCliError = false
  hadSyntaxError = false
  hadRuntimeError = false
  hadResolvingError = false

  report(error: Error): void {
    this.error = error

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
    else if (error instanceof ResolvingError) this.hadResolvingError = true
    else this.hadCliError = true
  }
}

export const errorReporter = new ErrorReporter()
