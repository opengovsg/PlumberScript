export enum TokenType {
  // Single character tokens
  LeftParen = 'LeftParen', // '('
  RightParen = 'RightParen', // ')'
  LeftBrace = 'LeftBrace', // '{'
  RightBrace = 'RightBrace', // '}'
  Comma = 'Comma', // ','
  Dot = 'Dot', // '.'
  Minus = 'Minus', // '-'
  Plus = 'Plus', // '+'
  Semicolon = 'Semicolon', // ';'
  Slash = 'Slash', // '/'
  Star = 'Star', // '*'

  // One or two character tokens
  Bang = 'Bang', // '!'
  BangEqual = 'BangEqual', // '!='
  Equal = 'Equal', // '='
  EqualEqual = 'EqualEqual', // '=='
  Greater = 'Greater', // '>'
  GreaterEqual = 'GreaterEqual', // '>='
  Less = 'Less', // '<'
  LessEqual = 'LessEqual', // '<='

  // Literals
  Identifier = 'Identifier',
  String = 'String',
  Number = 'Number',

  // Keywords
  And = 'And',
  Class = 'Class',
  Else = 'Else',
  False = 'False',
  Fun = 'Fun',
  For = 'For',
  If = 'If',
  Nil = 'Nil',
  Or = 'Or',
  Print = 'Print',
  Return = 'Return',
  Super = 'Super',
  This = 'This',
  True = 'True',
  Var = 'Var',
  While = 'While',

  EOF = 'EOF',
}
