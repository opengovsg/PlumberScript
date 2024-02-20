const IS_TTY = process.stdout.isTTY && process.stderr.isTTY

const ANSI_RED = IS_TTY ? '\u001B[31m' : ''
const ANSI_GREEN = IS_TTY ? '\u001B[32m' : ''
const ANSI_WHITE = IS_TTY ? '\u001B[37m' : ''

export const color = {
  red: (text: string) => `${ANSI_RED}${text}${ANSI_WHITE}`,
  green: (text: string) => `${ANSI_GREEN}${text}${ANSI_WHITE}`,
}
