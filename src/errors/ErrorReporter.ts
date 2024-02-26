import { SyntaxError, RuntimeError, CliError, ResolvingError, PlumberError } from './error'

class ErrorReporter {
  error: PlumberError | undefined
  hadCliError = false
  hadSyntaxError = false
  hadRuntimeError = false
  hadResolvingError = false

  report(error: PlumberError): void {
    this.error = error
    console.error(`${error.toString()} ${error.message}`)

    if (error instanceof RuntimeError) this.hadRuntimeError = true
    else if (error instanceof SyntaxError) this.hadSyntaxError = true
    else if (error instanceof ResolvingError) this.hadResolvingError = true
    else this.hadCliError = true
  }
}

export const errorReporter = new ErrorReporter()
