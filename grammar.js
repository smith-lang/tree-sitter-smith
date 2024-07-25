module.exports = grammar({
  name: "smith",

  extras: ($) => [$.comment, /[\s\f\uFEFF\u2060\u200B]|\r?\n/],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($.statement),

    statement: ($) => choice($.expression, $.variable_definition, $.test),

    expression: ($) =>
      choice(
        $.binary_operation,
        $.unary_operation,
        $.parenthesized_expression,
        $.integer_literal,
        $.float_literal,
        $.string_literal,
        $.boolean_literal,
        $.function_definition,
        $.function_call,
        $.identifier,
        $.struct_definition,
        $.array_literal,
        $.map_literal,
        $.tuple_literal,
        $.if_expression,
        $.for_expression,
        $.index_expression,
        $.range_expression,
      ),

    or: () => "or",
    greater: () => ">",
    less: () => "<",
    equal: () => "==",
    add_assign: () => "+=",
    add: () => "+",
    subtract: () => "-",
    multiply: () => "*",
    divide: () => "/",
    in: () => "in",
    dot: () => ".",

    binary_operation: ($) =>
      choice(
        ...[
          [$.or, 2],
          [$.greater, 2],
          [$.less, 2],
          [$.equal, 2],
          [$.add_assign, 2],
          [$.add, 3],
          [$.subtract, 3],
          [$.multiply, 4],
          [$.divide, 4],
          [$.in, 5],
          [$.dot, 6],
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

    negative: () => "-",
    not: () => "not",
    pointer: () => "*",
    option: () => "?",

    unary_operation: ($) =>
      prec(
        8,
        choice(
          seq($.negative, $.expression),
          seq($.not, $.expression),
          seq($.pointer, $.expression),
          seq($.option, $.expression),
          seq($.array_literal, $.expression),
        ),
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    integer_literal: () => /[0-9]+/,

    float_literal: () => /[0-9]+\.[0-9]+/,

    string_literal: () => /"[^"]*"/,

    boolean_literal: () => choice("true", "false"),

    identifier: () => /[a-zA-Z_]\w*/,

    function_parameter: ($) =>
      seq(
        field("pattern", $.pattern_expression),
        ":",
        field("type", $.expression),
      ),

    function_parameters: ($) =>
      seq($.function_parameter, repeat(seq(",", $.function_parameter))),

    block: ($) => seq("{", repeat($.statement), "}"),

    function_definition: ($) =>
      seq(
        "fn",
        "(",
        optional(field("parameters", $.function_parameters)),
        ")",
        field("return_type", $.expression),
        field("body", $.block),
      ),

    function_arguments: ($) =>
      seq($.expression, repeat(seq(",", $.expression)), optional(",")),

    function_call: ($) =>
      prec(
        9,
        seq(
          field("function", $.expression),
          "(",
          optional(field("arguments", $.function_arguments)),
          ")",
        ),
      ),

    struct_field: ($) =>
      seq(field("name", $.identifier), ":", field("type", $.expression)),

    struct_fields: ($) =>
      seq($.struct_field, repeat(seq(",", $.struct_field)), optional(",")),

    struct_definition: ($) =>
      seq("struct", "{", optional($.struct_fields), "}"),

    array_literal: ($) =>
      seq(
        "[",
        optional($.expression),
        repeat(seq(",", $.expression)),
        optional(","),
        "]",
      ),

    map_pair: ($) =>
      seq(
        field("key", $.identifier),
        optional(seq(":", field("value", $.expression))),
      ),

    map_pairs: ($) =>
      seq($.map_pair, repeat(seq(",", $.map_pair)), optional(",")),

    map_literal: ($) => seq("{", optional($.map_pairs), "}"),

    tuple_literal: ($) =>
      seq(
        "(",
        optional(
          seq($.expression, ",", repeat(seq($.expression, optional(",")))),
        ),
        ")",
      ),

    else_if: ($) =>
      seq("else if", field("condition", $.expression), field("then", $.block)),

    if_expression: ($) =>
      seq(
        "if",
        field("condition", $.expression),
        field("then", $.block),
        repeat($.else_if),
        optional(seq("else", field("else", $.block))),
      ),

    index_variable: ($) => seq($.identifier, optional(seq("in", $.expression))),

    for_expression: ($) =>
      seq(
        "for",
        $.index_variable,
        repeat(seq(",", $.index_variable)),
        optional(","),
        $.block,
      ),

    index_expression: ($) =>
      prec.left(9, seq($.expression, "[", $.expression, "]")),

    range_type: () => choice("..=", "..>", "..<"),

    range_expression: ($) =>
      choice(
        seq(
          "[",
          field("first", $.expression),
          optional(seq(",", field("second", $.expression))),
          field("range_type", $.range_type),
          field("last", $.expression),
          "]",
        ),
        seq(
          "[",
          field("first", $.expression),
          optional(seq(",", field("second", $.expression))),
          "..",
          "]",
        ),
        seq(
          "[",
          field("range_type", $.range_type),
          field("last", $.expression),
          "]",
        ),
        seq("[", "..", "]"),
      ),

    tuple_pattern: ($) =>
      prec(
        10,
        seq(
          "(",
          optional(
            seq(
              $.pattern_expression,
              ",",
              repeat(seq($.pattern_expression, optional(","))),
            ),
          ),
          ")",
        ),
      ),

    array_pattern: ($) =>
      prec(
        10,
        seq(
          "[",
          optional(
            seq(
              $.pattern_expression,
              ",",
              repeat(seq($.pattern_expression, optional(","))),
            ),
          ),
          "]",
        ),
      ),

    map_pattern: ($) =>
      prec(
        10,
        seq(
          "{",
          optional(
            seq(
              $.map_pattern_field,
              repeat(seq(",", $.map_pattern_field)),
              optional(","),
            ),
          ),
          "}",
        ),
      ),

    map_pattern_field: ($) =>
      prec(
        10,
        seq(
          field("key", $.identifier),
          optional(seq(":", field("value", $.pattern_expression))),
        ),
      ),

    pattern_expression: ($) =>
      prec(
        10,
        choice($.identifier, $.tuple_pattern, $.array_pattern, $.map_pattern),
      ),

    mut: () => "mut",

    variable_definition: ($) =>
      prec(
        1,
        seq(
          optional(field("mut", $.mut)),
          field("pattern", $.pattern_expression),
          optional(seq(":", field("type", $.expression))),
          "=",
          field("value", $.expression),
        ),
      ),

    test: ($) =>
      seq("test", field("name", $.string_literal), field("body", $.block)),

    comment: ($) => token(seq("#", /.*/)),
  },
});
