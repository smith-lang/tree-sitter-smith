module.exports = grammar({
  name: "smith",

  word: ($) => $.symbol,

  rules: {
    source_file: ($) => repeat($.expr),

    expr: ($) =>
      choice(
        $.binary_op,
        $.unary_op,
        $.paren,
        $.int,
        $.float,
        $.str,
        $.bool,
        $.fn,
        $.call,
        $.symbol,
        $.def,
        $.struct,
        $.array,
      ),

    binary_op: ($) =>
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
              field("left", $.expr),
              field("operator", operator),
              field("right", $.expr),
            ),
          ),
        ),
      ),

    unary_op: ($) => prec(4, choice(seq("-", $.expr), seq("not", $.expr))),

    paren: ($) => seq("(", $.expr, ")"),

    int: () => /[0-9]+/,

    float: () => /[0-9]+\.[0-9]+/,

    str: () => /"[^"]*"/,

    bool: () => choice("true", "false"),

    symbol: () => /[a-zA-Z_]\w*/,

    param: ($) => seq(field("name", $.symbol), ":", field("type", $.expr)),

    params: ($) => seq($.param, repeat(seq(",", $.param))),

    block: ($) => seq("{", repeat($.expr), "}"),

    fn: ($) =>
      seq(
        "fn",
        "(",
        optional(field("params", $.params)),
        ")",
        field("return_type", $.expr),
        field("body", $.block),
      ),

    args: ($) => seq($.expr, repeat(seq(",", $.expr)), optional(",")),

    call: ($) =>
      prec(
        5,
        seq(field("fn", $.expr), "(", optional(field("args", $.args)), ")"),
      ),

    def: ($) =>
      prec.right(
        1,
        seq(
          field("name", $.symbol),
          optional(seq(":", field("type", $.expr))),
          "=",
          field("value", $.expr),
        ),
      ),

    field: ($) => seq(field("name", $.symbol), ":", field("type", $.expr)),

    fields: ($) => seq($.field, repeat(seq(",", $.field)), optional(",")),

    struct: ($) => seq("struct", "{", optional($.fields), "}"),

    array: ($) =>
      seq("[", optional($.expr), repeat(seq(",", $.expr)), optional(","), "]"),
  },
});
