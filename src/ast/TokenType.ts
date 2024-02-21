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
  And = 'And', // '&&'
  Class = 'Class',
  Else = 'Else',
  Extends = 'Extends',
  False = 'False',
  Function = 'Function',
  For = 'For',
  If = 'If',
  Null = 'Null',
  Or = 'Or', // '||'
  Print = 'Print',
  Return = 'Return',
  Super = 'Super',
  This = 'This',
  True = 'True',
  Let = 'Let',
  While = 'While',

  EOF = 'EOF',
}
