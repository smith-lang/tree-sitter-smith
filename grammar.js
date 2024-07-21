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
        $.map,
        $.tuple,
        $.if,
        $.for,
        $.index,
        $.range,
      ),

    binary_op: ($) =>
      choice(
        ...[
          ["|", 1],
          [">", 1],
          ["<", 1],
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

    unary_op: ($) =>
      prec(
        4,
        choice(
          seq("-", $.expr),
          seq("not", $.expr),
          seq("*", $.expr),
          seq("?", $.expr),
          seq($.array, $.expr),
        ),
      ),

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

    pair: ($) => seq(field("key", $.symbol), ":", field("value", $.expr)),

    pairs: ($) => seq($.pair, repeat(seq(",", $.pair)), optional(",")),

    map: ($) => seq("{", optional($.pairs), "}"),

    tuple: ($) =>
      seq(
        "(",
        optional(seq($.expr, ",", repeat(seq($.expr, optional(","))))),
        ")",
      ),

    else_if: ($) =>
      seq("else if", field("condition", $.expr), field("then", $.block)),

    if: ($) =>
      seq(
        "if",
        field("condition", $.expr),
        field("then", $.block),
        repeat($.else_if),
        optional(seq("else", field("else", $.block))),
      ),

    index_var: ($) => seq($.symbol, optional(seq("in", $.expr))),

    for: ($) =>
      seq(
        "for",
        $.index_var,
        repeat(seq(",", $.index_var)),
        optional(","),
        $.block,
      ),

    index: ($) => prec.left(6, seq($.expr, "[", $.expr, "]")),

    range_type: () => choice("..=", "..>", "..<"),

    range: ($) =>
      choice(
        seq(
          "[",
          field("first", $.expr),
          optional(seq(",", field("second", $.expr))),
          field("range_type", $.range_type),
          field("last", $.expr),
          "]",
        ),
        seq("[", field("first", $.expr), "..", "]"),
        seq("[", field("range_type", $.range_type), field("last", $.expr), "]"),
        seq("[", "..", "]"),
      ),
  },
});
