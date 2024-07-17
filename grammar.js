module.exports = grammar({
  name: "smith",

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($.expression),

    expression: ($) =>
      choice(
        $.binary_expression,
        $.unary_expression,
        $.parenthesized_expression,
        $.int,
        $.float,
        $.string,
        $.boolean,
        $.function_definition,
        $.function_call,
        $.identifier,
      ),

    binary_expression: ($) =>
      choice(
        ...[
          [">", 1],
          ["+", 2],
          ["-", 2],
          ["*", 3],
          ["/", 3],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $.expression),
              field("operator", operator),
              field("right", $.expression),
            ),
          ),
        ),
      ),

    unary_expression: ($) =>
      prec(4, choice(seq("-", $.expression), seq("not", $.expression))),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    int: ($) => /[0-9]+/,

    float: ($) => /[0-9]+\.[0-9]+/,

    string: ($) => /"[^"]*"/,

    boolean: ($) => choice("true", "false"),

    identifier: ($) => /[a-zA-Z_]\w*/,

    type: ($) => $.identifier,

    parameter: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.type)),

    parameter_list: ($) =>
      seq("(", optional(seq($.parameter, repeat(seq(",", $.parameter)))), ")"),

    type_parameter: ($) => $.identifier,

    type_parameter_list: ($) =>
      seq(
        "[",
        optional(seq($.type_parameter, repeat(seq(",", $.type_parameter)))),
        "]",
      ),

    block: ($) => seq("{", repeat($.expression), "}"),

    function_definition: ($) =>
      seq(
        "fn",
        field("name", $.identifier),
        optional(field("type_parameters", $.type_parameter_list)),
        field("parameters", $.parameter_list),
        "->",
        field("return_type", $.type),
        field("body", $.block),
      ),

    argument_list: ($) =>
      seq(
        "(",
        optional(seq($.expression, repeat(seq(",", $.expression)))),
        ")",
      ),

    function_call: ($) =>
      prec(
        5,
        seq(field("name", $.identifier), field("arguments", $.argument_list)),
      ),
  },
});
