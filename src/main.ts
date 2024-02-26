import { color } from './color'
import { PlumberScript } from './Plumber'

const args = process.argv.slice(2)

if (args.length > 1) {
    console.log(color.green('Usage: plumber [script]'))
    process.exit(64)
} else if (args.length === 1) {
    PlumberScript.runFile(args[0])
} else {
    PlumberScript.runPrompt()
}
