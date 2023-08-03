export const id = 451;
export const ids = [451];
export const modules = {

/***/ 3233:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

const path = __webpack_require__(1017);
const micromatch = __webpack_require__(6228);
const isGlob = __webpack_require__(4466);

function normalizeOptions(dir, opts = {}) {
  const { ignore, ...rest } = opts;

  if (Array.isArray(ignore)) {
    opts = { ...rest };

    for (const value of ignore) {
      if (isGlob(value)) {
        if (!opts.ignoreGlobs) {
          opts.ignoreGlobs = [];
        }

        const regex = micromatch.makeRe(value, {
          // We set `dot: true` to workaround an issue with the
          // regular expression on Linux where the resulting
          // negative lookahead `(?!(\\/|^)` was never matching
          // in some cases. See also https://bit.ly/3UZlQDm
          dot: true,
          // C++ does not support lookbehind regex patterns, they
          // were only added later to JavaScript engines
          // (https://bit.ly/3V7S6UL)
          lookbehinds: false
        });
        opts.ignoreGlobs.push(regex.source);
      } else {
        if (!opts.ignorePaths) {
          opts.ignorePaths = [];
        }

        opts.ignorePaths.push(path.resolve(dir, value));
      }
    }
  }

  return opts;
}

exports.K = (binding) => {
  return {
    writeSnapshot(dir, snapshot, opts) {
      return binding.writeSnapshot(
        path.resolve(dir),
        path.resolve(snapshot),
        normalizeOptions(dir, opts),
      );
    },
    getEventsSince(dir, snapshot, opts) {
      return binding.getEventsSince(
        path.resolve(dir),
        path.resolve(snapshot),
        normalizeOptions(dir, opts),
      );
    },
    async subscribe(dir, fn, opts) {
      dir = path.resolve(dir);
      opts = normalizeOptions(dir, opts);
      await binding.subscribe(dir, fn, opts);

      return {
        unsubscribe() {
          return binding.unsubscribe(dir, fn, opts);
        },
      };
    },
    unsubscribe(dir, fn, opts) {
      return binding.unsubscribe(
        path.resolve(dir),
        fn,
        normalizeOptions(dir, opts),
      );
    }
  };
};


/***/ }),

/***/ 610:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const stringify = __webpack_require__(8750);
const compile = __webpack_require__(9434);
const expand = __webpack_require__(5873);
const parse = __webpack_require__(6477);

/**
 * Expand the given pattern or create a regex-compatible string.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces('{a,b,c}', { compile: true })); //=> ['(a|b|c)']
 * console.log(braces('{a,b,c}')); //=> ['a', 'b', 'c']
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {String}
 * @api public
 */

const braces = (input, options = {}) => {
  let output = [];

  if (Array.isArray(input)) {
    for (let pattern of input) {
      let result = braces.create(pattern, options);
      if (Array.isArray(result)) {
        output.push(...result);
      } else {
        output.push(result);
      }
    }
  } else {
    output = [].concat(braces.create(input, options));
  }

  if (options && options.expand === true && options.nodupes === true) {
    output = [...new Set(output)];
  }
  return output;
};

/**
 * Parse the given `str` with the given `options`.
 *
 * ```js
 * // braces.parse(pattern, [, options]);
 * const ast = braces.parse('a/{b,c}/d');
 * console.log(ast);
 * ```
 * @param {String} pattern Brace pattern to parse
 * @param {Object} options
 * @return {Object} Returns an AST
 * @api public
 */

braces.parse = (input, options = {}) => parse(input, options);

/**
 * Creates a braces string from an AST, or an AST node.
 *
 * ```js
 * const braces = require('braces');
 * let ast = braces.parse('foo/{a,b}/bar');
 * console.log(stringify(ast.nodes[2])); //=> '{a,b}'
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.stringify = (input, options = {}) => {
  if (typeof input === 'string') {
    return stringify(braces.parse(input, options), options);
  }
  return stringify(input, options);
};

/**
 * Compiles a brace pattern into a regex-compatible, optimized string.
 * This method is called by the main [braces](#braces) function by default.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.compile('a/{b,c}/d'));
 * //=> ['a/(b|c)/d']
 * ```
 * @param {String} `input` Brace pattern or AST.
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.compile = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces.parse(input, options);
  }
  return compile(input, options);
};

/**
 * Expands a brace pattern into an array. This method is called by the
 * main [braces](#braces) function when `options.expand` is true. Before
 * using this method it's recommended that you read the [performance notes](#performance))
 * and advantages of using [.compile](#compile) instead.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.expand('a/{b,c}/d'));
 * //=> ['a/b/d', 'a/c/d'];
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.expand = (input, options = {}) => {
  if (typeof input === 'string') {
    input = braces.parse(input, options);
  }

  let result = expand(input, options);

  // filter out empty strings if specified
  if (options.noempty === true) {
    result = result.filter(Boolean);
  }

  // filter out duplicates if specified
  if (options.nodupes === true) {
    result = [...new Set(result)];
  }

  return result;
};

/**
 * Processes a brace pattern and returns either an expanded array
 * (if `options.expand` is true), a highly optimized regex-compatible string.
 * This method is called by the main [braces](#braces) function.
 *
 * ```js
 * const braces = require('braces');
 * console.log(braces.create('user-{200..300}/project-{a,b,c}-{1..10}'))
 * //=> 'user-(20[0-9]|2[1-9][0-9]|300)/project-(a|b|c)-([1-9]|10)'
 * ```
 * @param {String} `pattern` Brace pattern
 * @param {Object} `options`
 * @return {Array} Returns an array of expanded values.
 * @api public
 */

braces.create = (input, options = {}) => {
  if (input === '' || input.length < 3) {
    return [input];
  }

 return options.expand !== true
    ? braces.compile(input, options)
    : braces.expand(input, options);
};

/**
 * Expose "braces"
 */

module.exports = braces;


/***/ }),

/***/ 9434:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const fill = __webpack_require__(6330);
const utils = __webpack_require__(5207);

const compile = (ast, options = {}) => {
  let walk = (node, parent = {}) => {
    let invalidBlock = utils.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let invalid = invalidBlock === true || invalidNode === true;
    let prefix = options.escapeInvalid === true ? '\\' : '';
    let output = '';

    if (node.isOpen === true) {
      return prefix + node.value;
    }
    if (node.isClose === true) {
      return prefix + node.value;
    }

    if (node.type === 'open') {
      return invalid ? (prefix + node.value) : '(';
    }

    if (node.type === 'close') {
      return invalid ? (prefix + node.value) : ')';
    }

    if (node.type === 'comma') {
      return node.prev.type === 'comma' ? '' : (invalid ? node.value : '|');
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils.reduce(node.nodes);
      let range = fill(...args, { ...options, wrap: false, toRegex: true });

      if (range.length !== 0) {
        return args.length > 1 && range.length > 1 ? `(${range})` : range;
      }
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += walk(child, node);
      }
    }
    return output;
  };

  return walk(ast);
};

module.exports = compile;


/***/ }),

/***/ 8774:
/***/ ((module) => {



module.exports = {
  MAX_LENGTH: 1024 * 64,

  // Digits
  CHAR_0: '0', /* 0 */
  CHAR_9: '9', /* 9 */

  // Alphabet chars.
  CHAR_UPPERCASE_A: 'A', /* A */
  CHAR_LOWERCASE_A: 'a', /* a */
  CHAR_UPPERCASE_Z: 'Z', /* Z */
  CHAR_LOWERCASE_Z: 'z', /* z */

  CHAR_LEFT_PARENTHESES: '(', /* ( */
  CHAR_RIGHT_PARENTHESES: ')', /* ) */

  CHAR_ASTERISK: '*', /* * */

  // Non-alphabetic chars.
  CHAR_AMPERSAND: '&', /* & */
  CHAR_AT: '@', /* @ */
  CHAR_BACKSLASH: '\\', /* \ */
  CHAR_BACKTICK: '`', /* ` */
  CHAR_CARRIAGE_RETURN: '\r', /* \r */
  CHAR_CIRCUMFLEX_ACCENT: '^', /* ^ */
  CHAR_COLON: ':', /* : */
  CHAR_COMMA: ',', /* , */
  CHAR_DOLLAR: '$', /* . */
  CHAR_DOT: '.', /* . */
  CHAR_DOUBLE_QUOTE: '"', /* " */
  CHAR_EQUAL: '=', /* = */
  CHAR_EXCLAMATION_MARK: '!', /* ! */
  CHAR_FORM_FEED: '\f', /* \f */
  CHAR_FORWARD_SLASH: '/', /* / */
  CHAR_HASH: '#', /* # */
  CHAR_HYPHEN_MINUS: '-', /* - */
  CHAR_LEFT_ANGLE_BRACKET: '<', /* < */
  CHAR_LEFT_CURLY_BRACE: '{', /* { */
  CHAR_LEFT_SQUARE_BRACKET: '[', /* [ */
  CHAR_LINE_FEED: '\n', /* \n */
  CHAR_NO_BREAK_SPACE: '\u00A0', /* \u00A0 */
  CHAR_PERCENT: '%', /* % */
  CHAR_PLUS: '+', /* + */
  CHAR_QUESTION_MARK: '?', /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: '>', /* > */
  CHAR_RIGHT_CURLY_BRACE: '}', /* } */
  CHAR_RIGHT_SQUARE_BRACKET: ']', /* ] */
  CHAR_SEMICOLON: ';', /* ; */
  CHAR_SINGLE_QUOTE: '\'', /* ' */
  CHAR_SPACE: ' ', /*   */
  CHAR_TAB: '\t', /* \t */
  CHAR_UNDERSCORE: '_', /* _ */
  CHAR_VERTICAL_LINE: '|', /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: '\uFEFF' /* \uFEFF */
};


/***/ }),

/***/ 5873:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const fill = __webpack_require__(6330);
const stringify = __webpack_require__(8750);
const utils = __webpack_require__(5207);

const append = (queue = '', stash = '', enclose = false) => {
  let result = [];

  queue = [].concat(queue);
  stash = [].concat(stash);

  if (!stash.length) return queue;
  if (!queue.length) {
    return enclose ? utils.flatten(stash).map(ele => `{${ele}}`) : stash;
  }

  for (let item of queue) {
    if (Array.isArray(item)) {
      for (let value of item) {
        result.push(append(value, stash, enclose));
      }
    } else {
      for (let ele of stash) {
        if (enclose === true && typeof ele === 'string') ele = `{${ele}}`;
        result.push(Array.isArray(ele) ? append(item, ele, enclose) : (item + ele));
      }
    }
  }
  return utils.flatten(result);
};

const expand = (ast, options = {}) => {
  let rangeLimit = options.rangeLimit === void 0 ? 1000 : options.rangeLimit;

  let walk = (node, parent = {}) => {
    node.queue = [];

    let p = parent;
    let q = parent.queue;

    while (p.type !== 'brace' && p.type !== 'root' && p.parent) {
      p = p.parent;
      q = p.queue;
    }

    if (node.invalid || node.dollar) {
      q.push(append(q.pop(), stringify(node, options)));
      return;
    }

    if (node.type === 'brace' && node.invalid !== true && node.nodes.length === 2) {
      q.push(append(q.pop(), ['{}']));
      return;
    }

    if (node.nodes && node.ranges > 0) {
      let args = utils.reduce(node.nodes);

      if (utils.exceedsLimit(...args, options.step, rangeLimit)) {
        throw new RangeError('expanded array length exceeds range limit. Use options.rangeLimit to increase or disable the limit.');
      }

      let range = fill(...args, options);
      if (range.length === 0) {
        range = stringify(node, options);
      }

      q.push(append(q.pop(), range));
      node.nodes = [];
      return;
    }

    let enclose = utils.encloseBrace(node);
    let queue = node.queue;
    let block = node;

    while (block.type !== 'brace' && block.type !== 'root' && block.parent) {
      block = block.parent;
      queue = block.queue;
    }

    for (let i = 0; i < node.nodes.length; i++) {
      let child = node.nodes[i];

      if (child.type === 'comma' && node.type === 'brace') {
        if (i === 1) queue.push('');
        queue.push('');
        continue;
      }

      if (child.type === 'close') {
        q.push(append(q.pop(), queue, enclose));
        continue;
      }

      if (child.value && child.type !== 'open') {
        queue.push(append(queue.pop(), child.value));
        continue;
      }

      if (child.nodes) {
        walk(child, node);
      }
    }

    return queue;
  };

  return utils.flatten(walk(ast));
};

module.exports = expand;


/***/ }),

/***/ 6477:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const stringify = __webpack_require__(8750);

/**
 * Constants
 */

const {
  MAX_LENGTH,
  CHAR_BACKSLASH, /* \ */
  CHAR_BACKTICK, /* ` */
  CHAR_COMMA, /* , */
  CHAR_DOT, /* . */
  CHAR_LEFT_PARENTHESES, /* ( */
  CHAR_RIGHT_PARENTHESES, /* ) */
  CHAR_LEFT_CURLY_BRACE, /* { */
  CHAR_RIGHT_CURLY_BRACE, /* } */
  CHAR_LEFT_SQUARE_BRACKET, /* [ */
  CHAR_RIGHT_SQUARE_BRACKET, /* ] */
  CHAR_DOUBLE_QUOTE, /* " */
  CHAR_SINGLE_QUOTE, /* ' */
  CHAR_NO_BREAK_SPACE,
  CHAR_ZERO_WIDTH_NOBREAK_SPACE
} = __webpack_require__(8774);

/**
 * parse
 */

const parse = (input, options = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  let opts = options || {};
  let max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  if (input.length > max) {
    throw new SyntaxError(`Input length (${input.length}), exceeds max characters (${max})`);
  }

  let ast = { type: 'root', input, nodes: [] };
  let stack = [ast];
  let block = ast;
  let prev = ast;
  let brackets = 0;
  let length = input.length;
  let index = 0;
  let depth = 0;
  let value;
  let memo = {};

  /**
   * Helpers
   */

  const advance = () => input[index++];
  const push = node => {
    if (node.type === 'text' && prev.type === 'dot') {
      prev.type = 'text';
    }

    if (prev && prev.type === 'text' && node.type === 'text') {
      prev.value += node.value;
      return;
    }

    block.nodes.push(node);
    node.parent = block;
    node.prev = prev;
    prev = node;
    return node;
  };

  push({ type: 'bos' });

  while (index < length) {
    block = stack[stack.length - 1];
    value = advance();

    /**
     * Invalid chars
     */

    if (value === CHAR_ZERO_WIDTH_NOBREAK_SPACE || value === CHAR_NO_BREAK_SPACE) {
      continue;
    }

    /**
     * Escaped chars
     */

    if (value === CHAR_BACKSLASH) {
      push({ type: 'text', value: (options.keepEscaping ? value : '') + advance() });
      continue;
    }

    /**
     * Right square bracket (literal): ']'
     */

    if (value === CHAR_RIGHT_SQUARE_BRACKET) {
      push({ type: 'text', value: '\\' + value });
      continue;
    }

    /**
     * Left square bracket: '['
     */

    if (value === CHAR_LEFT_SQUARE_BRACKET) {
      brackets++;

      let closed = true;
      let next;

      while (index < length && (next = advance())) {
        value += next;

        if (next === CHAR_LEFT_SQUARE_BRACKET) {
          brackets++;
          continue;
        }

        if (next === CHAR_BACKSLASH) {
          value += advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET) {
          brackets--;

          if (brackets === 0) {
            break;
          }
        }
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Parentheses
     */

    if (value === CHAR_LEFT_PARENTHESES) {
      block = push({ type: 'paren', nodes: [] });
      stack.push(block);
      push({ type: 'text', value });
      continue;
    }

    if (value === CHAR_RIGHT_PARENTHESES) {
      if (block.type !== 'paren') {
        push({ type: 'text', value });
        continue;
      }
      block = stack.pop();
      push({ type: 'text', value });
      block = stack[stack.length - 1];
      continue;
    }

    /**
     * Quotes: '|"|`
     */

    if (value === CHAR_DOUBLE_QUOTE || value === CHAR_SINGLE_QUOTE || value === CHAR_BACKTICK) {
      let open = value;
      let next;

      if (options.keepQuotes !== true) {
        value = '';
      }

      while (index < length && (next = advance())) {
        if (next === CHAR_BACKSLASH) {
          value += next + advance();
          continue;
        }

        if (next === open) {
          if (options.keepQuotes === true) value += next;
          break;
        }

        value += next;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Left curly brace: '{'
     */

    if (value === CHAR_LEFT_CURLY_BRACE) {
      depth++;

      let dollar = prev.value && prev.value.slice(-1) === '$' || block.dollar === true;
      let brace = {
        type: 'brace',
        open: true,
        close: false,
        dollar,
        depth,
        commas: 0,
        ranges: 0,
        nodes: []
      };

      block = push(brace);
      stack.push(block);
      push({ type: 'open', value });
      continue;
    }

    /**
     * Right curly brace: '}'
     */

    if (value === CHAR_RIGHT_CURLY_BRACE) {
      if (block.type !== 'brace') {
        push({ type: 'text', value });
        continue;
      }

      let type = 'close';
      block = stack.pop();
      block.close = true;

      push({ type, value });
      depth--;

      block = stack[stack.length - 1];
      continue;
    }

    /**
     * Comma: ','
     */

    if (value === CHAR_COMMA && depth > 0) {
      if (block.ranges > 0) {
        block.ranges = 0;
        let open = block.nodes.shift();
        block.nodes = [open, { type: 'text', value: stringify(block) }];
      }

      push({ type: 'comma', value });
      block.commas++;
      continue;
    }

    /**
     * Dot: '.'
     */

    if (value === CHAR_DOT && depth > 0 && block.commas === 0) {
      let siblings = block.nodes;

      if (depth === 0 || siblings.length === 0) {
        push({ type: 'text', value });
        continue;
      }

      if (prev.type === 'dot') {
        block.range = [];
        prev.value += value;
        prev.type = 'range';

        if (block.nodes.length !== 3 && block.nodes.length !== 5) {
          block.invalid = true;
          block.ranges = 0;
          prev.type = 'text';
          continue;
        }

        block.ranges++;
        block.args = [];
        continue;
      }

      if (prev.type === 'range') {
        siblings.pop();

        let before = siblings[siblings.length - 1];
        before.value += prev.value + value;
        prev = before;
        block.ranges--;
        continue;
      }

      push({ type: 'dot', value });
      continue;
    }

    /**
     * Text
     */

    push({ type: 'text', value });
  }

  // Mark imbalanced braces and brackets as invalid
  do {
    block = stack.pop();

    if (block.type !== 'root') {
      block.nodes.forEach(node => {
        if (!node.nodes) {
          if (node.type === 'open') node.isOpen = true;
          if (node.type === 'close') node.isClose = true;
          if (!node.nodes) node.type = 'text';
          node.invalid = true;
        }
      });

      // get the location of the block on parent.nodes (block's siblings)
      let parent = stack[stack.length - 1];
      let index = parent.nodes.indexOf(block);
      // replace the (invalid) block with it's nodes
      parent.nodes.splice(index, 1, ...block.nodes);
    }
  } while (stack.length > 0);

  push({ type: 'eos' });
  return ast;
};

module.exports = parse;


/***/ }),

/***/ 8750:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const utils = __webpack_require__(5207);

module.exports = (ast, options = {}) => {
  let stringify = (node, parent = {}) => {
    let invalidBlock = options.escapeInvalid && utils.isInvalidBrace(parent);
    let invalidNode = node.invalid === true && options.escapeInvalid === true;
    let output = '';

    if (node.value) {
      if ((invalidBlock || invalidNode) && utils.isOpenOrClose(node)) {
        return '\\' + node.value;
      }
      return node.value;
    }

    if (node.value) {
      return node.value;
    }

    if (node.nodes) {
      for (let child of node.nodes) {
        output += stringify(child);
      }
    }
    return output;
  };

  return stringify(ast);
};



/***/ }),

/***/ 5207:
/***/ ((__unused_webpack_module, exports) => {



exports.isInteger = num => {
  if (typeof num === 'number') {
    return Number.isInteger(num);
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isInteger(Number(num));
  }
  return false;
};

/**
 * Find a node of the given type
 */

exports.find = (node, type) => node.nodes.find(node => node.type === type);

/**
 * Find a node of the given type
 */

exports.exceedsLimit = (min, max, step = 1, limit) => {
  if (limit === false) return false;
  if (!exports.isInteger(min) || !exports.isInteger(max)) return false;
  return ((Number(max) - Number(min)) / Number(step)) >= limit;
};

/**
 * Escape the given node with '\\' before node.value
 */

exports.escapeNode = (block, n = 0, type) => {
  let node = block.nodes[n];
  if (!node) return;

  if ((type && node.type === type) || node.type === 'open' || node.type === 'close') {
    if (node.escaped !== true) {
      node.value = '\\' + node.value;
      node.escaped = true;
    }
  }
};

/**
 * Returns true if the given brace node should be enclosed in literal braces
 */

exports.encloseBrace = node => {
  if (node.type !== 'brace') return false;
  if ((node.commas >> 0 + node.ranges >> 0) === 0) {
    node.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a brace node is invalid.
 */

exports.isInvalidBrace = block => {
  if (block.type !== 'brace') return false;
  if (block.invalid === true || block.dollar) return true;
  if ((block.commas >> 0 + block.ranges >> 0) === 0) {
    block.invalid = true;
    return true;
  }
  if (block.open !== true || block.close !== true) {
    block.invalid = true;
    return true;
  }
  return false;
};

/**
 * Returns true if a node is an open or close node
 */

exports.isOpenOrClose = node => {
  if (node.type === 'open' || node.type === 'close') {
    return true;
  }
  return node.open === true || node.close === true;
};

/**
 * Reduce an array of text nodes.
 */

exports.reduce = nodes => nodes.reduce((acc, node) => {
  if (node.type === 'text') acc.push(node.value);
  if (node.type === 'range') node.type = 'text';
  return acc;
}, []);

/**
 * Flatten an array
 */

exports.flatten = (...args) => {
  const result = [];
  const flat = arr => {
    for (let i = 0; i < arr.length; i++) {
      let ele = arr[i];
      Array.isArray(ele) ? flat(ele, result) : ele !== void 0 && result.push(ele);
    }
    return result;
  };
  flat(args);
  return result;
};


/***/ }),

/***/ 6330:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * fill-range <https://github.com/jonschlinkert/fill-range>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Licensed under the MIT License.
 */



const util = __webpack_require__(3837);
const toRegexRange = __webpack_require__(1861);

const isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);

const transform = toNumber => {
  return value => toNumber === true ? Number(value) : String(value);
};

const isValidValue = value => {
  return typeof value === 'number' || (typeof value === 'string' && value !== '');
};

const isNumber = num => Number.isInteger(+num);

const zeros = input => {
  let value = `${input}`;
  let index = -1;
  if (value[0] === '-') value = value.slice(1);
  if (value === '0') return false;
  while (value[++index] === '0');
  return index > 0;
};

const stringify = (start, end, options) => {
  if (typeof start === 'string' || typeof end === 'string') {
    return true;
  }
  return options.stringify === true;
};

const pad = (input, maxLength, toNumber) => {
  if (maxLength > 0) {
    let dash = input[0] === '-' ? '-' : '';
    if (dash) input = input.slice(1);
    input = (dash + input.padStart(dash ? maxLength - 1 : maxLength, '0'));
  }
  if (toNumber === false) {
    return String(input);
  }
  return input;
};

const toMaxLen = (input, maxLength) => {
  let negative = input[0] === '-' ? '-' : '';
  if (negative) {
    input = input.slice(1);
    maxLength--;
  }
  while (input.length < maxLength) input = '0' + input;
  return negative ? ('-' + input) : input;
};

const toSequence = (parts, options) => {
  parts.negatives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  parts.positives.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

  let prefix = options.capture ? '' : '?:';
  let positives = '';
  let negatives = '';
  let result;

  if (parts.positives.length) {
    positives = parts.positives.join('|');
  }

  if (parts.negatives.length) {
    negatives = `-(${prefix}${parts.negatives.join('|')})`;
  }

  if (positives && negatives) {
    result = `${positives}|${negatives}`;
  } else {
    result = positives || negatives;
  }

  if (options.wrap) {
    return `(${prefix}${result})`;
  }

  return result;
};

const toRange = (a, b, isNumbers, options) => {
  if (isNumbers) {
    return toRegexRange(a, b, { wrap: false, ...options });
  }

  let start = String.fromCharCode(a);
  if (a === b) return start;

  let stop = String.fromCharCode(b);
  return `[${start}-${stop}]`;
};

const toRegex = (start, end, options) => {
  if (Array.isArray(start)) {
    let wrap = options.wrap === true;
    let prefix = options.capture ? '' : '?:';
    return wrap ? `(${prefix}${start.join('|')})` : start.join('|');
  }
  return toRegexRange(start, end, options);
};

const rangeError = (...args) => {
  return new RangeError('Invalid range arguments: ' + util.inspect(...args));
};

const invalidRange = (start, end, options) => {
  if (options.strictRanges === true) throw rangeError([start, end]);
  return [];
};

const invalidStep = (step, options) => {
  if (options.strictRanges === true) {
    throw new TypeError(`Expected step "${step}" to be a number`);
  }
  return [];
};

const fillNumbers = (start, end, step = 1, options = {}) => {
  let a = Number(start);
  let b = Number(end);

  if (!Number.isInteger(a) || !Number.isInteger(b)) {
    if (options.strictRanges === true) throw rangeError([start, end]);
    return [];
  }

  // fix negative zero
  if (a === 0) a = 0;
  if (b === 0) b = 0;

  let descending = a > b;
  let startString = String(start);
  let endString = String(end);
  let stepString = String(step);
  step = Math.max(Math.abs(step), 1);

  let padded = zeros(startString) || zeros(endString) || zeros(stepString);
  let maxLen = padded ? Math.max(startString.length, endString.length, stepString.length) : 0;
  let toNumber = padded === false && stringify(start, end, options) === false;
  let format = options.transform || transform(toNumber);

  if (options.toRegex && step === 1) {
    return toRange(toMaxLen(start, maxLen), toMaxLen(end, maxLen), true, options);
  }

  let parts = { negatives: [], positives: [] };
  let push = num => parts[num < 0 ? 'negatives' : 'positives'].push(Math.abs(num));
  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    if (options.toRegex === true && step > 1) {
      push(a);
    } else {
      range.push(pad(format(a, index), maxLen, toNumber));
    }
    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return step > 1
      ? toSequence(parts, options)
      : toRegex(range, null, { wrap: false, ...options });
  }

  return range;
};

const fillLetters = (start, end, step = 1, options = {}) => {
  if ((!isNumber(start) && start.length > 1) || (!isNumber(end) && end.length > 1)) {
    return invalidRange(start, end, options);
  }


  let format = options.transform || (val => String.fromCharCode(val));
  let a = `${start}`.charCodeAt(0);
  let b = `${end}`.charCodeAt(0);

  let descending = a > b;
  let min = Math.min(a, b);
  let max = Math.max(a, b);

  if (options.toRegex && step === 1) {
    return toRange(min, max, false, options);
  }

  let range = [];
  let index = 0;

  while (descending ? a >= b : a <= b) {
    range.push(format(a, index));
    a = descending ? a - step : a + step;
    index++;
  }

  if (options.toRegex === true) {
    return toRegex(range, null, { wrap: false, options });
  }

  return range;
};

const fill = (start, end, step, options = {}) => {
  if (end == null && isValidValue(start)) {
    return [start];
  }

  if (!isValidValue(start) || !isValidValue(end)) {
    return invalidRange(start, end, options);
  }

  if (typeof step === 'function') {
    return fill(start, end, 1, { transform: step });
  }

  if (isObject(step)) {
    return fill(start, end, 0, step);
  }

  let opts = { ...options };
  if (opts.capture === true) opts.wrap = true;
  step = step || opts.step || 1;

  if (!isNumber(step)) {
    if (step != null && !isObject(step)) return invalidStep(step, opts);
    return fill(start, end, 1, step);
  }

  if (isNumber(start) && isNumber(end)) {
    return fillNumbers(start, end, step, opts);
  }

  return fillLetters(start, end, Math.max(Math.abs(step), 1), opts);
};

module.exports = fill;


/***/ }),

/***/ 806:
/***/ ((module) => {

/*!
 * is-extglob <https://github.com/jonschlinkert/is-extglob>
 *
 * Copyright (c) 2014-2016, Jon Schlinkert.
 * Licensed under the MIT License.
 */

module.exports = function isExtglob(str) {
  if (typeof str !== 'string' || str === '') {
    return false;
  }

  var match;
  while ((match = /(\\).|([@?!+*]\(.*\))/g.exec(str))) {
    if (match[2]) return true;
    str = str.slice(match.index + match[0].length);
  }

  return false;
};


/***/ }),

/***/ 4466:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * is-glob <https://github.com/jonschlinkert/is-glob>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

var isExtglob = __webpack_require__(806);
var chars = { '{': '}', '(': ')', '[': ']'};
var strictCheck = function(str) {
  if (str[0] === '!') {
    return true;
  }
  var index = 0;
  var pipeIndex = -2;
  var closeSquareIndex = -2;
  var closeCurlyIndex = -2;
  var closeParenIndex = -2;
  var backSlashIndex = -2;
  while (index < str.length) {
    if (str[index] === '*') {
      return true;
    }

    if (str[index + 1] === '?' && /[\].+)]/.test(str[index])) {
      return true;
    }

    if (closeSquareIndex !== -1 && str[index] === '[' && str[index + 1] !== ']') {
      if (closeSquareIndex < index) {
        closeSquareIndex = str.indexOf(']', index);
      }
      if (closeSquareIndex > index) {
        if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
          return true;
        }
        backSlashIndex = str.indexOf('\\', index);
        if (backSlashIndex === -1 || backSlashIndex > closeSquareIndex) {
          return true;
        }
      }
    }

    if (closeCurlyIndex !== -1 && str[index] === '{' && str[index + 1] !== '}') {
      closeCurlyIndex = str.indexOf('}', index);
      if (closeCurlyIndex > index) {
        backSlashIndex = str.indexOf('\\', index);
        if (backSlashIndex === -1 || backSlashIndex > closeCurlyIndex) {
          return true;
        }
      }
    }

    if (closeParenIndex !== -1 && str[index] === '(' && str[index + 1] === '?' && /[:!=]/.test(str[index + 2]) && str[index + 3] !== ')') {
      closeParenIndex = str.indexOf(')', index);
      if (closeParenIndex > index) {
        backSlashIndex = str.indexOf('\\', index);
        if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
          return true;
        }
      }
    }

    if (pipeIndex !== -1 && str[index] === '(' && str[index + 1] !== '|') {
      if (pipeIndex < index) {
        pipeIndex = str.indexOf('|', index);
      }
      if (pipeIndex !== -1 && str[pipeIndex + 1] !== ')') {
        closeParenIndex = str.indexOf(')', pipeIndex);
        if (closeParenIndex > pipeIndex) {
          backSlashIndex = str.indexOf('\\', pipeIndex);
          if (backSlashIndex === -1 || backSlashIndex > closeParenIndex) {
            return true;
          }
        }
      }
    }

    if (str[index] === '\\') {
      var open = str[index + 1];
      index += 2;
      var close = chars[open];

      if (close) {
        var n = str.indexOf(close, index);
        if (n !== -1) {
          index = n + 1;
        }
      }

      if (str[index] === '!') {
        return true;
      }
    } else {
      index++;
    }
  }
  return false;
};

var relaxedCheck = function(str) {
  if (str[0] === '!') {
    return true;
  }
  var index = 0;
  while (index < str.length) {
    if (/[*?{}()[\]]/.test(str[index])) {
      return true;
    }

    if (str[index] === '\\') {
      var open = str[index + 1];
      index += 2;
      var close = chars[open];

      if (close) {
        var n = str.indexOf(close, index);
        if (n !== -1) {
          index = n + 1;
        }
      }

      if (str[index] === '!') {
        return true;
      }
    } else {
      index++;
    }
  }
  return false;
};

module.exports = function isGlob(str, options) {
  if (typeof str !== 'string' || str === '') {
    return false;
  }

  if (isExtglob(str)) {
    return true;
  }

  var check = strictCheck;

  // optionally relax check
  if (options && options.strict === false) {
    check = relaxedCheck;
  }

  return check(str);
};


/***/ }),

/***/ 5680:
/***/ ((module) => {

/*!
 * is-number <https://github.com/jonschlinkert/is-number>
 *
 * Copyright (c) 2014-present, Jon Schlinkert.
 * Released under the MIT License.
 */



module.exports = function(num) {
  if (typeof num === 'number') {
    return num - num === 0;
  }
  if (typeof num === 'string' && num.trim() !== '') {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
};


/***/ }),

/***/ 6228:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const util = __webpack_require__(3837);
const braces = __webpack_require__(610);
const picomatch = __webpack_require__(8569);
const utils = __webpack_require__(479);
const isEmptyString = val => val === '' || val === './';

/**
 * Returns an array of strings that match one or more glob patterns.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm(list, patterns[, options]);
 *
 * console.log(mm(['a.js', 'a.txt'], ['*.js']));
 * //=> [ 'a.js' ]
 * ```
 * @param {String|Array<string>} `list` List of strings to match.
 * @param {String|Array<string>} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options)
 * @return {Array} Returns an array of matches
 * @summary false
 * @api public
 */

const micromatch = (list, patterns, options) => {
  patterns = [].concat(patterns);
  list = [].concat(list);

  let omit = new Set();
  let keep = new Set();
  let items = new Set();
  let negatives = 0;

  let onResult = state => {
    items.add(state.output);
    if (options && options.onResult) {
      options.onResult(state);
    }
  };

  for (let i = 0; i < patterns.length; i++) {
    let isMatch = picomatch(String(patterns[i]), { ...options, onResult }, true);
    let negated = isMatch.state.negated || isMatch.state.negatedExtglob;
    if (negated) negatives++;

    for (let item of list) {
      let matched = isMatch(item, true);

      let match = negated ? !matched.isMatch : matched.isMatch;
      if (!match) continue;

      if (negated) {
        omit.add(matched.output);
      } else {
        omit.delete(matched.output);
        keep.add(matched.output);
      }
    }
  }

  let result = negatives === patterns.length ? [...items] : [...keep];
  let matches = result.filter(item => !omit.has(item));

  if (options && matches.length === 0) {
    if (options.failglob === true) {
      throw new Error(`No matches found for "${patterns.join(', ')}"`);
    }

    if (options.nonull === true || options.nullglob === true) {
      return options.unescape ? patterns.map(p => p.replace(/\\/g, '')) : patterns;
    }
  }

  return matches;
};

/**
 * Backwards compatibility
 */

micromatch.match = micromatch;

/**
 * Returns a matcher function from the given glob `pattern` and `options`.
 * The returned function takes a string to match as its only argument and returns
 * true if the string is a match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matcher(pattern[, options]);
 *
 * const isMatch = mm.matcher('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @param {String} `pattern` Glob pattern
 * @param {Object} `options`
 * @return {Function} Returns a matcher function.
 * @api public
 */

micromatch.matcher = (pattern, options) => picomatch(pattern, options);

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.isMatch(string, patterns[, options]);
 *
 * console.log(mm.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(mm.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `[options]` See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);

/**
 * Backwards compatibility
 */

micromatch.any = micromatch.isMatch;

/**
 * Returns a list of strings that _**do not match any**_ of the given `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.not(list, patterns[, options]);
 *
 * console.log(mm.not(['a.a', 'b.b', 'c.c'], '*.a'));
 * //=> ['b.b', 'c.c']
 * ```
 * @param {Array} `list` Array of strings to match.
 * @param {String|Array} `patterns` One or more glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array} Returns an array of strings that **do not match** the given patterns.
 * @api public
 */

micromatch.not = (list, patterns, options = {}) => {
  patterns = [].concat(patterns).map(String);
  let result = new Set();
  let items = [];

  let onResult = state => {
    if (options.onResult) options.onResult(state);
    items.push(state.output);
  };

  let matches = new Set(micromatch(list, patterns, { ...options, onResult }));

  for (let item of items) {
    if (!matches.has(item)) {
      result.add(item);
    }
  }
  return [...result];
};

/**
 * Returns true if the given `string` contains the given pattern. Similar
 * to [.isMatch](#isMatch) but the pattern can match any part of the string.
 *
 * ```js
 * var mm = require('micromatch');
 * // mm.contains(string, pattern[, options]);
 *
 * console.log(mm.contains('aa/bb/cc', '*b'));
 * //=> true
 * console.log(mm.contains('aa/bb/cc', '*d'));
 * //=> false
 * ```
 * @param {String} `str` The string to match.
 * @param {String|Array} `patterns` Glob pattern to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any of the patterns matches any part of `str`.
 * @api public
 */

micromatch.contains = (str, pattern, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
  }

  if (Array.isArray(pattern)) {
    return pattern.some(p => micromatch.contains(str, p, options));
  }

  if (typeof pattern === 'string') {
    if (isEmptyString(str) || isEmptyString(pattern)) {
      return false;
    }

    if (str.includes(pattern) || (str.startsWith('./') && str.slice(2).includes(pattern))) {
      return true;
    }
  }

  return micromatch.isMatch(str, pattern, { ...options, contains: true });
};

/**
 * Filter the keys of the given object with the given `glob` pattern
 * and `options`. Does not attempt to match nested keys. If you need this feature,
 * use [glob-object][] instead.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.matchKeys(object, patterns[, options]);
 *
 * const obj = { aa: 'a', ab: 'b', ac: 'c' };
 * console.log(mm.matchKeys(obj, '*b'));
 * //=> { ab: 'b' }
 * ```
 * @param {Object} `object` The object with keys to filter.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Object} Returns an object with only keys that match the given patterns.
 * @api public
 */

micromatch.matchKeys = (obj, patterns, options) => {
  if (!utils.isObject(obj)) {
    throw new TypeError('Expected the first argument to be an object');
  }
  let keys = micromatch(Object.keys(obj), patterns, options);
  let res = {};
  for (let key of keys) res[key] = obj[key];
  return res;
};

/**
 * Returns true if some of the strings in the given `list` match any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.some(list, patterns[, options]);
 *
 * console.log(mm.some(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // true
 * console.log(mm.some(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test. Returns as soon as the first match is found.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any `patterns` matches any of the strings in `list`
 * @api public
 */

micromatch.some = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch(String(pattern), options);
    if (items.some(item => isMatch(item))) {
      return true;
    }
  }
  return false;
};

/**
 * Returns true if every string in the given `list` matches
 * any of the given glob `patterns`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.every(list, patterns[, options]);
 *
 * console.log(mm.every('foo.js', ['foo.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js']));
 * // true
 * console.log(mm.every(['foo.js', 'bar.js'], ['*.js', '!foo.js']));
 * // false
 * console.log(mm.every(['foo.js'], ['*.js', '!foo.js']));
 * // false
 * ```
 * @param {String|Array} `list` The string or array of strings to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if all `patterns` matches all of the strings in `list`
 * @api public
 */

micromatch.every = (list, patterns, options) => {
  let items = [].concat(list);

  for (let pattern of [].concat(patterns)) {
    let isMatch = picomatch(String(pattern), options);
    if (!items.every(item => isMatch(item))) {
      return false;
    }
  }
  return true;
};

/**
 * Returns true if **all** of the given `patterns` match
 * the specified string.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.all(string, patterns[, options]);
 *
 * console.log(mm.all('foo.js', ['foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', '!foo.js']));
 * // false
 *
 * console.log(mm.all('foo.js', ['*.js', 'foo.js']));
 * // true
 *
 * console.log(mm.all('foo.js', ['*.js', 'f*', '*o*', '*o.js']));
 * // true
 * ```
 * @param {String|Array} `str` The string to test.
 * @param {String|Array} `patterns` One or more glob patterns to use for matching.
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

micromatch.all = (str, patterns, options) => {
  if (typeof str !== 'string') {
    throw new TypeError(`Expected a string: "${util.inspect(str)}"`);
  }

  return [].concat(patterns).every(p => picomatch(p, options)(str));
};

/**
 * Returns an array of matches captured by `pattern` in `string, or `null` if the pattern did not match.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.capture(pattern, string[, options]);
 *
 * console.log(mm.capture('test/*.js', 'test/foo.js'));
 * //=> ['foo']
 * console.log(mm.capture('test/*.js', 'foo/bar.css'));
 * //=> null
 * ```
 * @param {String} `glob` Glob pattern to use for matching.
 * @param {String} `input` String to match
 * @param {Object} `options` See available [options](#options) for changing how matches are performed
 * @return {Array|null} Returns an array of captures if the input matches the glob pattern, otherwise `null`.
 * @api public
 */

micromatch.capture = (glob, input, options) => {
  let posix = utils.isWindows(options);
  let regex = picomatch.makeRe(String(glob), { ...options, capture: true });
  let match = regex.exec(posix ? utils.toPosixSlashes(input) : input);

  if (match) {
    return match.slice(1).map(v => v === void 0 ? '' : v);
  }
};

/**
 * Create a regular expression from the given glob `pattern`.
 *
 * ```js
 * const mm = require('micromatch');
 * // mm.makeRe(pattern[, options]);
 *
 * console.log(mm.makeRe('*.js'));
 * //=> /^(?:(\.[\\\/])?(?!\.)(?=.)[^\/]*?\.js)$/
 * ```
 * @param {String} `pattern` A glob pattern to convert to regex.
 * @param {Object} `options`
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

micromatch.makeRe = (...args) => picomatch.makeRe(...args);

/**
 * Scan a glob pattern to separate the pattern into segments. Used
 * by the [split](#split) method.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm.scan(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

micromatch.scan = (...args) => picomatch.scan(...args);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const mm = require('micromatch');
 * const state = mm.parse(pattern[, options]);
 * ```
 * @param {String} `glob`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as regex source string.
 * @api public
 */

micromatch.parse = (patterns, options) => {
  let res = [];
  for (let pattern of [].concat(patterns || [])) {
    for (let str of braces(String(pattern), options)) {
      res.push(picomatch.parse(str, options));
    }
  }
  return res;
};

/**
 * Process the given brace `pattern`.
 *
 * ```js
 * const { braces } = require('micromatch');
 * console.log(braces('foo/{a,b,c}/bar'));
 * //=> [ 'foo/(a|b|c)/bar' ]
 *
 * console.log(braces('foo/{a,b,c}/bar', { expand: true }));
 * //=> [ 'foo/a/bar', 'foo/b/bar', 'foo/c/bar' ]
 * ```
 * @param {String} `pattern` String with brace pattern to process.
 * @param {Object} `options` Any [options](#options) to change how expansion is performed. See the [braces][] library for all available options.
 * @return {Array}
 * @api public
 */

micromatch.braces = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  if ((options && options.nobrace === true) || !/\{.*\}/.test(pattern)) {
    return [pattern];
  }
  return braces(pattern, options);
};

/**
 * Expand braces
 */

micromatch.braceExpand = (pattern, options) => {
  if (typeof pattern !== 'string') throw new TypeError('Expected a string');
  return micromatch.braces(pattern, { ...options, expand: true });
};

/**
 * Expose micromatch
 */

module.exports = micromatch;


/***/ }),

/***/ 8569:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



module.exports = __webpack_require__(3322);


/***/ }),

/***/ 6099:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const path = __webpack_require__(1017);
const WIN_SLASH = '\\\\/';
const WIN_NO_SLASH = `[^${WIN_SLASH}]`;

/**
 * Posix glob regex
 */

const DOT_LITERAL = '\\.';
const PLUS_LITERAL = '\\+';
const QMARK_LITERAL = '\\?';
const SLASH_LITERAL = '\\/';
const ONE_CHAR = '(?=.)';
const QMARK = '[^/]';
const END_ANCHOR = `(?:${SLASH_LITERAL}|$)`;
const START_ANCHOR = `(?:^|${SLASH_LITERAL})`;
const DOTS_SLASH = `${DOT_LITERAL}{1,2}${END_ANCHOR}`;
const NO_DOT = `(?!${DOT_LITERAL})`;
const NO_DOTS = `(?!${START_ANCHOR}${DOTS_SLASH})`;
const NO_DOT_SLASH = `(?!${DOT_LITERAL}{0,1}${END_ANCHOR})`;
const NO_DOTS_SLASH = `(?!${DOTS_SLASH})`;
const QMARK_NO_DOT = `[^.${SLASH_LITERAL}]`;
const STAR = `${QMARK}*?`;

const POSIX_CHARS = {
  DOT_LITERAL,
  PLUS_LITERAL,
  QMARK_LITERAL,
  SLASH_LITERAL,
  ONE_CHAR,
  QMARK,
  END_ANCHOR,
  DOTS_SLASH,
  NO_DOT,
  NO_DOTS,
  NO_DOT_SLASH,
  NO_DOTS_SLASH,
  QMARK_NO_DOT,
  STAR,
  START_ANCHOR
};

/**
 * Windows glob regex
 */

const WINDOWS_CHARS = {
  ...POSIX_CHARS,

  SLASH_LITERAL: `[${WIN_SLASH}]`,
  QMARK: WIN_NO_SLASH,
  STAR: `${WIN_NO_SLASH}*?`,
  DOTS_SLASH: `${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$)`,
  NO_DOT: `(?!${DOT_LITERAL})`,
  NO_DOTS: `(?!(?:^|[${WIN_SLASH}])${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  NO_DOT_SLASH: `(?!${DOT_LITERAL}{0,1}(?:[${WIN_SLASH}]|$))`,
  NO_DOTS_SLASH: `(?!${DOT_LITERAL}{1,2}(?:[${WIN_SLASH}]|$))`,
  QMARK_NO_DOT: `[^.${WIN_SLASH}]`,
  START_ANCHOR: `(?:^|[${WIN_SLASH}])`,
  END_ANCHOR: `(?:[${WIN_SLASH}]|$)`
};

/**
 * POSIX Bracket Regex
 */

const POSIX_REGEX_SOURCE = {
  alnum: 'a-zA-Z0-9',
  alpha: 'a-zA-Z',
  ascii: '\\x00-\\x7F',
  blank: ' \\t',
  cntrl: '\\x00-\\x1F\\x7F',
  digit: '0-9',
  graph: '\\x21-\\x7E',
  lower: 'a-z',
  print: '\\x20-\\x7E ',
  punct: '\\-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
  space: ' \\t\\r\\n\\v\\f',
  upper: 'A-Z',
  word: 'A-Za-z0-9_',
  xdigit: 'A-Fa-f0-9'
};

module.exports = {
  MAX_LENGTH: 1024 * 64,
  POSIX_REGEX_SOURCE,

  // regular expressions
  REGEX_BACKSLASH: /\\(?![*+?^${}(|)[\]])/g,
  REGEX_NON_SPECIAL_CHARS: /^[^@![\].,$*+?^{}()|\\/]+/,
  REGEX_SPECIAL_CHARS: /[-*+?.^${}(|)[\]]/,
  REGEX_SPECIAL_CHARS_BACKREF: /(\\?)((\W)(\3*))/g,
  REGEX_SPECIAL_CHARS_GLOBAL: /([-*+?.^${}(|)[\]])/g,
  REGEX_REMOVE_BACKSLASH: /(?:\[.*?[^\\]\]|\\(?=.))/g,

  // Replace globs with equivalent patterns to reduce parsing time.
  REPLACEMENTS: {
    '***': '*',
    '**/**': '**',
    '**/**/**': '**'
  },

  // Digits
  CHAR_0: 48, /* 0 */
  CHAR_9: 57, /* 9 */

  // Alphabet chars.
  CHAR_UPPERCASE_A: 65, /* A */
  CHAR_LOWERCASE_A: 97, /* a */
  CHAR_UPPERCASE_Z: 90, /* Z */
  CHAR_LOWERCASE_Z: 122, /* z */

  CHAR_LEFT_PARENTHESES: 40, /* ( */
  CHAR_RIGHT_PARENTHESES: 41, /* ) */

  CHAR_ASTERISK: 42, /* * */

  // Non-alphabetic chars.
  CHAR_AMPERSAND: 38, /* & */
  CHAR_AT: 64, /* @ */
  CHAR_BACKWARD_SLASH: 92, /* \ */
  CHAR_CARRIAGE_RETURN: 13, /* \r */
  CHAR_CIRCUMFLEX_ACCENT: 94, /* ^ */
  CHAR_COLON: 58, /* : */
  CHAR_COMMA: 44, /* , */
  CHAR_DOT: 46, /* . */
  CHAR_DOUBLE_QUOTE: 34, /* " */
  CHAR_EQUAL: 61, /* = */
  CHAR_EXCLAMATION_MARK: 33, /* ! */
  CHAR_FORM_FEED: 12, /* \f */
  CHAR_FORWARD_SLASH: 47, /* / */
  CHAR_GRAVE_ACCENT: 96, /* ` */
  CHAR_HASH: 35, /* # */
  CHAR_HYPHEN_MINUS: 45, /* - */
  CHAR_LEFT_ANGLE_BRACKET: 60, /* < */
  CHAR_LEFT_CURLY_BRACE: 123, /* { */
  CHAR_LEFT_SQUARE_BRACKET: 91, /* [ */
  CHAR_LINE_FEED: 10, /* \n */
  CHAR_NO_BREAK_SPACE: 160, /* \u00A0 */
  CHAR_PERCENT: 37, /* % */
  CHAR_PLUS: 43, /* + */
  CHAR_QUESTION_MARK: 63, /* ? */
  CHAR_RIGHT_ANGLE_BRACKET: 62, /* > */
  CHAR_RIGHT_CURLY_BRACE: 125, /* } */
  CHAR_RIGHT_SQUARE_BRACKET: 93, /* ] */
  CHAR_SEMICOLON: 59, /* ; */
  CHAR_SINGLE_QUOTE: 39, /* ' */
  CHAR_SPACE: 32, /*   */
  CHAR_TAB: 9, /* \t */
  CHAR_UNDERSCORE: 95, /* _ */
  CHAR_VERTICAL_LINE: 124, /* | */
  CHAR_ZERO_WIDTH_NOBREAK_SPACE: 65279, /* \uFEFF */

  SEP: path.sep,

  /**
   * Create EXTGLOB_CHARS
   */

  extglobChars(chars) {
    return {
      '!': { type: 'negate', open: '(?:(?!(?:', close: `))${chars.STAR})` },
      '?': { type: 'qmark', open: '(?:', close: ')?' },
      '+': { type: 'plus', open: '(?:', close: ')+' },
      '*': { type: 'star', open: '(?:', close: ')*' },
      '@': { type: 'at', open: '(?:', close: ')' }
    };
  },

  /**
   * Create GLOB_CHARS
   */

  globChars(win32) {
    return win32 === true ? WINDOWS_CHARS : POSIX_CHARS;
  }
};


/***/ }),

/***/ 2139:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const constants = __webpack_require__(6099);
const utils = __webpack_require__(479);

/**
 * Constants
 */

const {
  MAX_LENGTH,
  POSIX_REGEX_SOURCE,
  REGEX_NON_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_BACKREF,
  REPLACEMENTS
} = constants;

/**
 * Helpers
 */

const expandRange = (args, options) => {
  if (typeof options.expandRange === 'function') {
    return options.expandRange(...args, options);
  }

  args.sort();
  const value = `[${args.join('-')}]`;

  try {
    /* eslint-disable-next-line no-new */
    new RegExp(value);
  } catch (ex) {
    return args.map(v => utils.escapeRegex(v)).join('..');
  }

  return value;
};

/**
 * Create the message for a syntax error
 */

const syntaxError = (type, char) => {
  return `Missing ${type}: "${char}" - use "\\\\${char}" to match literal characters`;
};

/**
 * Parse the given input string.
 * @param {String} input
 * @param {Object} options
 * @return {Object}
 */

const parse = (input, options) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }

  input = REPLACEMENTS[input] || input;

  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;

  let len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  const bos = { type: 'bos', value: '', output: opts.prepend || '' };
  const tokens = [bos];

  const capture = opts.capture ? '' : '?:';
  const win32 = utils.isWindows(options);

  // create constants based on platform, for windows or posix
  const PLATFORM_CHARS = constants.globChars(win32);
  const EXTGLOB_CHARS = constants.extglobChars(PLATFORM_CHARS);

  const {
    DOT_LITERAL,
    PLUS_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOT_SLASH,
    NO_DOTS_SLASH,
    QMARK,
    QMARK_NO_DOT,
    STAR,
    START_ANCHOR
  } = PLATFORM_CHARS;

  const globstar = opts => {
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const nodot = opts.dot ? '' : NO_DOT;
  const qmarkNoDot = opts.dot ? QMARK : QMARK_NO_DOT;
  let star = opts.bash === true ? globstar(opts) : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  // minimatch options support
  if (typeof opts.noext === 'boolean') {
    opts.noextglob = opts.noext;
  }

  const state = {
    input,
    index: -1,
    start: 0,
    dot: opts.dot === true,
    consumed: '',
    output: '',
    prefix: '',
    backtrack: false,
    negated: false,
    brackets: 0,
    braces: 0,
    parens: 0,
    quotes: 0,
    globstar: false,
    tokens
  };

  input = utils.removePrefix(input, state);
  len = input.length;

  const extglobs = [];
  const braces = [];
  const stack = [];
  let prev = bos;
  let value;

  /**
   * Tokenizing helpers
   */

  const eos = () => state.index === len - 1;
  const peek = state.peek = (n = 1) => input[state.index + n];
  const advance = state.advance = () => input[++state.index] || '';
  const remaining = () => input.slice(state.index + 1);
  const consume = (value = '', num = 0) => {
    state.consumed += value;
    state.index += num;
  };

  const append = token => {
    state.output += token.output != null ? token.output : token.value;
    consume(token.value);
  };

  const negate = () => {
    let count = 1;

    while (peek() === '!' && (peek(2) !== '(' || peek(3) === '?')) {
      advance();
      state.start++;
      count++;
    }

    if (count % 2 === 0) {
      return false;
    }

    state.negated = true;
    state.start++;
    return true;
  };

  const increment = type => {
    state[type]++;
    stack.push(type);
  };

  const decrement = type => {
    state[type]--;
    stack.pop();
  };

  /**
   * Push tokens onto the tokens array. This helper speeds up
   * tokenizing by 1) helping us avoid backtracking as much as possible,
   * and 2) helping us avoid creating extra tokens when consecutive
   * characters are plain text. This improves performance and simplifies
   * lookbehinds.
   */

  const push = tok => {
    if (prev.type === 'globstar') {
      const isBrace = state.braces > 0 && (tok.type === 'comma' || tok.type === 'brace');
      const isExtglob = tok.extglob === true || (extglobs.length && (tok.type === 'pipe' || tok.type === 'paren'));

      if (tok.type !== 'slash' && tok.type !== 'paren' && !isBrace && !isExtglob) {
        state.output = state.output.slice(0, -prev.output.length);
        prev.type = 'star';
        prev.value = '*';
        prev.output = star;
        state.output += prev.output;
      }
    }

    if (extglobs.length && tok.type !== 'paren') {
      extglobs[extglobs.length - 1].inner += tok.value;
    }

    if (tok.value || tok.output) append(tok);
    if (prev && prev.type === 'text' && tok.type === 'text') {
      prev.value += tok.value;
      prev.output = (prev.output || '') + tok.value;
      return;
    }

    tok.prev = prev;
    tokens.push(tok);
    prev = tok;
  };

  const extglobOpen = (type, value) => {
    const token = { ...EXTGLOB_CHARS[value], conditions: 1, inner: '' };

    token.prev = prev;
    token.parens = state.parens;
    token.output = state.output;
    const output = (opts.capture ? '(' : '') + token.open;

    increment('parens');
    push({ type, value, output: state.output ? '' : ONE_CHAR });
    push({ type: 'paren', extglob: true, value: advance(), output });
    extglobs.push(token);
  };

  const extglobClose = token => {
    let output = token.close + (opts.capture ? ')' : '');
    let rest;

    if (token.type === 'negate') {
      let extglobStar = star;

      if (token.inner && token.inner.length > 1 && token.inner.includes('/')) {
        extglobStar = globstar(opts);
      }

      if (extglobStar !== star || eos() || /^\)+$/.test(remaining())) {
        output = token.close = `)$))${extglobStar}`;
      }

      if (token.inner.includes('*') && (rest = remaining()) && /^\.[^\\/.]+$/.test(rest)) {
        // Any non-magical string (`.ts`) or even nested expression (`.{ts,tsx}`) can follow after the closing parenthesis.
        // In this case, we need to parse the string and use it in the output of the original pattern.
        // Suitable patterns: `/!(*.d).ts`, `/!(*.d).{ts,tsx}`, `**/!(*-dbg).@(js)`.
        //
        // Disabling the `fastpaths` option due to a problem with parsing strings as `.ts` in the pattern like `**/!(*.d).ts`.
        const expression = parse(rest, { ...options, fastpaths: false }).output;

        output = token.close = `)${expression})${extglobStar})`;
      }

      if (token.prev.type === 'bos') {
        state.negatedExtglob = true;
      }
    }

    push({ type: 'paren', extglob: true, value, output });
    decrement('parens');
  };

  /**
   * Fast paths
   */

  if (opts.fastpaths !== false && !/(^[*!]|[/()[\]{}"])/.test(input)) {
    let backslashes = false;

    let output = input.replace(REGEX_SPECIAL_CHARS_BACKREF, (m, esc, chars, first, rest, index) => {
      if (first === '\\') {
        backslashes = true;
        return m;
      }

      if (first === '?') {
        if (esc) {
          return esc + first + (rest ? QMARK.repeat(rest.length) : '');
        }
        if (index === 0) {
          return qmarkNoDot + (rest ? QMARK.repeat(rest.length) : '');
        }
        return QMARK.repeat(chars.length);
      }

      if (first === '.') {
        return DOT_LITERAL.repeat(chars.length);
      }

      if (first === '*') {
        if (esc) {
          return esc + first + (rest ? star : '');
        }
        return star;
      }
      return esc ? m : `\\${m}`;
    });

    if (backslashes === true) {
      if (opts.unescape === true) {
        output = output.replace(/\\/g, '');
      } else {
        output = output.replace(/\\+/g, m => {
          return m.length % 2 === 0 ? '\\\\' : (m ? '\\' : '');
        });
      }
    }

    if (output === input && opts.contains === true) {
      state.output = input;
      return state;
    }

    state.output = utils.wrapOutput(output, state, options);
    return state;
  }

  /**
   * Tokenize input until we reach end-of-string
   */

  while (!eos()) {
    value = advance();

    if (value === '\u0000') {
      continue;
    }

    /**
     * Escaped characters
     */

    if (value === '\\') {
      const next = peek();

      if (next === '/' && opts.bash !== true) {
        continue;
      }

      if (next === '.' || next === ';') {
        continue;
      }

      if (!next) {
        value += '\\';
        push({ type: 'text', value });
        continue;
      }

      // collapse slashes to reduce potential for exploits
      const match = /^\\+/.exec(remaining());
      let slashes = 0;

      if (match && match[0].length > 2) {
        slashes = match[0].length;
        state.index += slashes;
        if (slashes % 2 !== 0) {
          value += '\\';
        }
      }

      if (opts.unescape === true) {
        value = advance();
      } else {
        value += advance();
      }

      if (state.brackets === 0) {
        push({ type: 'text', value });
        continue;
      }
    }

    /**
     * If we're inside a regex character class, continue
     * until we reach the closing bracket.
     */

    if (state.brackets > 0 && (value !== ']' || prev.value === '[' || prev.value === '[^')) {
      if (opts.posix !== false && value === ':') {
        const inner = prev.value.slice(1);
        if (inner.includes('[')) {
          prev.posix = true;

          if (inner.includes(':')) {
            const idx = prev.value.lastIndexOf('[');
            const pre = prev.value.slice(0, idx);
            const rest = prev.value.slice(idx + 2);
            const posix = POSIX_REGEX_SOURCE[rest];
            if (posix) {
              prev.value = pre + posix;
              state.backtrack = true;
              advance();

              if (!bos.output && tokens.indexOf(prev) === 1) {
                bos.output = ONE_CHAR;
              }
              continue;
            }
          }
        }
      }

      if ((value === '[' && peek() !== ':') || (value === '-' && peek() === ']')) {
        value = `\\${value}`;
      }

      if (value === ']' && (prev.value === '[' || prev.value === '[^')) {
        value = `\\${value}`;
      }

      if (opts.posix === true && value === '!' && prev.value === '[') {
        value = '^';
      }

      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * If we're inside a quoted string, continue
     * until we reach the closing double quote.
     */

    if (state.quotes === 1 && value !== '"') {
      value = utils.escapeRegex(value);
      prev.value += value;
      append({ value });
      continue;
    }

    /**
     * Double quotes
     */

    if (value === '"') {
      state.quotes = state.quotes === 1 ? 0 : 1;
      if (opts.keepQuotes === true) {
        push({ type: 'text', value });
      }
      continue;
    }

    /**
     * Parentheses
     */

    if (value === '(') {
      increment('parens');
      push({ type: 'paren', value });
      continue;
    }

    if (value === ')') {
      if (state.parens === 0 && opts.strictBrackets === true) {
        throw new SyntaxError(syntaxError('opening', '('));
      }

      const extglob = extglobs[extglobs.length - 1];
      if (extglob && state.parens === extglob.parens + 1) {
        extglobClose(extglobs.pop());
        continue;
      }

      push({ type: 'paren', value, output: state.parens ? ')' : '\\)' });
      decrement('parens');
      continue;
    }

    /**
     * Square brackets
     */

    if (value === '[') {
      if (opts.nobracket === true || !remaining().includes(']')) {
        if (opts.nobracket !== true && opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('closing', ']'));
        }

        value = `\\${value}`;
      } else {
        increment('brackets');
      }

      push({ type: 'bracket', value });
      continue;
    }

    if (value === ']') {
      if (opts.nobracket === true || (prev && prev.type === 'bracket' && prev.value.length === 1)) {
        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      if (state.brackets === 0) {
        if (opts.strictBrackets === true) {
          throw new SyntaxError(syntaxError('opening', '['));
        }

        push({ type: 'text', value, output: `\\${value}` });
        continue;
      }

      decrement('brackets');

      const prevValue = prev.value.slice(1);
      if (prev.posix !== true && prevValue[0] === '^' && !prevValue.includes('/')) {
        value = `/${value}`;
      }

      prev.value += value;
      append({ value });

      // when literal brackets are explicitly disabled
      // assume we should match with a regex character class
      if (opts.literalBrackets === false || utils.hasRegexChars(prevValue)) {
        continue;
      }

      const escaped = utils.escapeRegex(prev.value);
      state.output = state.output.slice(0, -prev.value.length);

      // when literal brackets are explicitly enabled
      // assume we should escape the brackets to match literal characters
      if (opts.literalBrackets === true) {
        state.output += escaped;
        prev.value = escaped;
        continue;
      }

      // when the user specifies nothing, try to match both
      prev.value = `(${capture}${escaped}|${prev.value})`;
      state.output += prev.value;
      continue;
    }

    /**
     * Braces
     */

    if (value === '{' && opts.nobrace !== true) {
      increment('braces');

      const open = {
        type: 'brace',
        value,
        output: '(',
        outputIndex: state.output.length,
        tokensIndex: state.tokens.length
      };

      braces.push(open);
      push(open);
      continue;
    }

    if (value === '}') {
      const brace = braces[braces.length - 1];

      if (opts.nobrace === true || !brace) {
        push({ type: 'text', value, output: value });
        continue;
      }

      let output = ')';

      if (brace.dots === true) {
        const arr = tokens.slice();
        const range = [];

        for (let i = arr.length - 1; i >= 0; i--) {
          tokens.pop();
          if (arr[i].type === 'brace') {
            break;
          }
          if (arr[i].type !== 'dots') {
            range.unshift(arr[i].value);
          }
        }

        output = expandRange(range, opts);
        state.backtrack = true;
      }

      if (brace.comma !== true && brace.dots !== true) {
        const out = state.output.slice(0, brace.outputIndex);
        const toks = state.tokens.slice(brace.tokensIndex);
        brace.value = brace.output = '\\{';
        value = output = '\\}';
        state.output = out;
        for (const t of toks) {
          state.output += (t.output || t.value);
        }
      }

      push({ type: 'brace', value, output });
      decrement('braces');
      braces.pop();
      continue;
    }

    /**
     * Pipes
     */

    if (value === '|') {
      if (extglobs.length > 0) {
        extglobs[extglobs.length - 1].conditions++;
      }
      push({ type: 'text', value });
      continue;
    }

    /**
     * Commas
     */

    if (value === ',') {
      let output = value;

      const brace = braces[braces.length - 1];
      if (brace && stack[stack.length - 1] === 'braces') {
        brace.comma = true;
        output = '|';
      }

      push({ type: 'comma', value, output });
      continue;
    }

    /**
     * Slashes
     */

    if (value === '/') {
      // if the beginning of the glob is "./", advance the start
      // to the current index, and don't add the "./" characters
      // to the state. This greatly simplifies lookbehinds when
      // checking for BOS characters like "!" and "." (not "./")
      if (prev.type === 'dot' && state.index === state.start + 1) {
        state.start = state.index + 1;
        state.consumed = '';
        state.output = '';
        tokens.pop();
        prev = bos; // reset "prev" to the first token
        continue;
      }

      push({ type: 'slash', value, output: SLASH_LITERAL });
      continue;
    }

    /**
     * Dots
     */

    if (value === '.') {
      if (state.braces > 0 && prev.type === 'dot') {
        if (prev.value === '.') prev.output = DOT_LITERAL;
        const brace = braces[braces.length - 1];
        prev.type = 'dots';
        prev.output += value;
        prev.value += value;
        brace.dots = true;
        continue;
      }

      if ((state.braces + state.parens) === 0 && prev.type !== 'bos' && prev.type !== 'slash') {
        push({ type: 'text', value, output: DOT_LITERAL });
        continue;
      }

      push({ type: 'dot', value, output: DOT_LITERAL });
      continue;
    }

    /**
     * Question marks
     */

    if (value === '?') {
      const isGroup = prev && prev.value === '(';
      if (!isGroup && opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('qmark', value);
        continue;
      }

      if (prev && prev.type === 'paren') {
        const next = peek();
        let output = value;

        if (next === '<' && !utils.supportsLookbehinds()) {
          throw new Error('Node.js v10 or higher is required for regex lookbehinds');
        }

        if ((prev.value === '(' && !/[!=<:]/.test(next)) || (next === '<' && !/<([!=]|\w+>)/.test(remaining()))) {
          output = `\\${value}`;
        }

        push({ type: 'text', value, output });
        continue;
      }

      if (opts.dot !== true && (prev.type === 'slash' || prev.type === 'bos')) {
        push({ type: 'qmark', value, output: QMARK_NO_DOT });
        continue;
      }

      push({ type: 'qmark', value, output: QMARK });
      continue;
    }

    /**
     * Exclamation
     */

    if (value === '!') {
      if (opts.noextglob !== true && peek() === '(') {
        if (peek(2) !== '?' || !/[!=<:]/.test(peek(3))) {
          extglobOpen('negate', value);
          continue;
        }
      }

      if (opts.nonegate !== true && state.index === 0) {
        negate();
        continue;
      }
    }

    /**
     * Plus
     */

    if (value === '+') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        extglobOpen('plus', value);
        continue;
      }

      if ((prev && prev.value === '(') || opts.regex === false) {
        push({ type: 'plus', value, output: PLUS_LITERAL });
        continue;
      }

      if ((prev && (prev.type === 'bracket' || prev.type === 'paren' || prev.type === 'brace')) || state.parens > 0) {
        push({ type: 'plus', value });
        continue;
      }

      push({ type: 'plus', value: PLUS_LITERAL });
      continue;
    }

    /**
     * Plain text
     */

    if (value === '@') {
      if (opts.noextglob !== true && peek() === '(' && peek(2) !== '?') {
        push({ type: 'at', extglob: true, value, output: '' });
        continue;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Plain text
     */

    if (value !== '*') {
      if (value === '$' || value === '^') {
        value = `\\${value}`;
      }

      const match = REGEX_NON_SPECIAL_CHARS.exec(remaining());
      if (match) {
        value += match[0];
        state.index += match[0].length;
      }

      push({ type: 'text', value });
      continue;
    }

    /**
     * Stars
     */

    if (prev && (prev.type === 'globstar' || prev.star === true)) {
      prev.type = 'star';
      prev.star = true;
      prev.value += value;
      prev.output = star;
      state.backtrack = true;
      state.globstar = true;
      consume(value);
      continue;
    }

    let rest = remaining();
    if (opts.noextglob !== true && /^\([^?]/.test(rest)) {
      extglobOpen('star', value);
      continue;
    }

    if (prev.type === 'star') {
      if (opts.noglobstar === true) {
        consume(value);
        continue;
      }

      const prior = prev.prev;
      const before = prior.prev;
      const isStart = prior.type === 'slash' || prior.type === 'bos';
      const afterStar = before && (before.type === 'star' || before.type === 'globstar');

      if (opts.bash === true && (!isStart || (rest[0] && rest[0] !== '/'))) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      const isBrace = state.braces > 0 && (prior.type === 'comma' || prior.type === 'brace');
      const isExtglob = extglobs.length && (prior.type === 'pipe' || prior.type === 'paren');
      if (!isStart && prior.type !== 'paren' && !isBrace && !isExtglob) {
        push({ type: 'star', value, output: '' });
        continue;
      }

      // strip consecutive `/**/`
      while (rest.slice(0, 3) === '/**') {
        const after = input[state.index + 4];
        if (after && after !== '/') {
          break;
        }
        rest = rest.slice(3);
        consume('/**', 3);
      }

      if (prior.type === 'bos' && eos()) {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = globstar(opts);
        state.output = prev.output;
        state.globstar = true;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && !afterStar && eos()) {
        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = globstar(opts) + (opts.strictSlashes ? ')' : '|$)');
        prev.value += value;
        state.globstar = true;
        state.output += prior.output + prev.output;
        consume(value);
        continue;
      }

      if (prior.type === 'slash' && prior.prev.type !== 'bos' && rest[0] === '/') {
        const end = rest[1] !== void 0 ? '|$' : '';

        state.output = state.output.slice(0, -(prior.output + prev.output).length);
        prior.output = `(?:${prior.output}`;

        prev.type = 'globstar';
        prev.output = `${globstar(opts)}${SLASH_LITERAL}|${SLASH_LITERAL}${end})`;
        prev.value += value;

        state.output += prior.output + prev.output;
        state.globstar = true;

        consume(value + advance());

        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      if (prior.type === 'bos' && rest[0] === '/') {
        prev.type = 'globstar';
        prev.value += value;
        prev.output = `(?:^|${SLASH_LITERAL}|${globstar(opts)}${SLASH_LITERAL})`;
        state.output = prev.output;
        state.globstar = true;
        consume(value + advance());
        push({ type: 'slash', value: '/', output: '' });
        continue;
      }

      // remove single star from output
      state.output = state.output.slice(0, -prev.output.length);

      // reset previous token to globstar
      prev.type = 'globstar';
      prev.output = globstar(opts);
      prev.value += value;

      // reset output with globstar
      state.output += prev.output;
      state.globstar = true;
      consume(value);
      continue;
    }

    const token = { type: 'star', value, output: star };

    if (opts.bash === true) {
      token.output = '.*?';
      if (prev.type === 'bos' || prev.type === 'slash') {
        token.output = nodot + token.output;
      }
      push(token);
      continue;
    }

    if (prev && (prev.type === 'bracket' || prev.type === 'paren') && opts.regex === true) {
      token.output = value;
      push(token);
      continue;
    }

    if (state.index === state.start || prev.type === 'slash' || prev.type === 'dot') {
      if (prev.type === 'dot') {
        state.output += NO_DOT_SLASH;
        prev.output += NO_DOT_SLASH;

      } else if (opts.dot === true) {
        state.output += NO_DOTS_SLASH;
        prev.output += NO_DOTS_SLASH;

      } else {
        state.output += nodot;
        prev.output += nodot;
      }

      if (peek() !== '*') {
        state.output += ONE_CHAR;
        prev.output += ONE_CHAR;
      }
    }

    push(token);
  }

  while (state.brackets > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ']'));
    state.output = utils.escapeLast(state.output, '[');
    decrement('brackets');
  }

  while (state.parens > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', ')'));
    state.output = utils.escapeLast(state.output, '(');
    decrement('parens');
  }

  while (state.braces > 0) {
    if (opts.strictBrackets === true) throw new SyntaxError(syntaxError('closing', '}'));
    state.output = utils.escapeLast(state.output, '{');
    decrement('braces');
  }

  if (opts.strictSlashes !== true && (prev.type === 'star' || prev.type === 'bracket')) {
    push({ type: 'maybe_slash', value: '', output: `${SLASH_LITERAL}?` });
  }

  // rebuild the output if we had to backtrack at any point
  if (state.backtrack === true) {
    state.output = '';

    for (const token of state.tokens) {
      state.output += token.output != null ? token.output : token.value;

      if (token.suffix) {
        state.output += token.suffix;
      }
    }
  }

  return state;
};

/**
 * Fast paths for creating regular expressions for common glob patterns.
 * This can significantly speed up processing and has very little downside
 * impact when none of the fast paths match.
 */

parse.fastpaths = (input, options) => {
  const opts = { ...options };
  const max = typeof opts.maxLength === 'number' ? Math.min(MAX_LENGTH, opts.maxLength) : MAX_LENGTH;
  const len = input.length;
  if (len > max) {
    throw new SyntaxError(`Input length: ${len}, exceeds maximum allowed length: ${max}`);
  }

  input = REPLACEMENTS[input] || input;
  const win32 = utils.isWindows(options);

  // create constants based on platform, for windows or posix
  const {
    DOT_LITERAL,
    SLASH_LITERAL,
    ONE_CHAR,
    DOTS_SLASH,
    NO_DOT,
    NO_DOTS,
    NO_DOTS_SLASH,
    STAR,
    START_ANCHOR
  } = constants.globChars(win32);

  const nodot = opts.dot ? NO_DOTS : NO_DOT;
  const slashDot = opts.dot ? NO_DOTS_SLASH : NO_DOT;
  const capture = opts.capture ? '' : '?:';
  const state = { negated: false, prefix: '' };
  let star = opts.bash === true ? '.*?' : STAR;

  if (opts.capture) {
    star = `(${star})`;
  }

  const globstar = opts => {
    if (opts.noglobstar === true) return star;
    return `(${capture}(?:(?!${START_ANCHOR}${opts.dot ? DOTS_SLASH : DOT_LITERAL}).)*?)`;
  };

  const create = str => {
    switch (str) {
      case '*':
        return `${nodot}${ONE_CHAR}${star}`;

      case '.*':
        return `${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*.*':
        return `${nodot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '*/*':
        return `${nodot}${star}${SLASH_LITERAL}${ONE_CHAR}${slashDot}${star}`;

      case '**':
        return nodot + globstar(opts);

      case '**/*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${ONE_CHAR}${star}`;

      case '**/*.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${slashDot}${star}${DOT_LITERAL}${ONE_CHAR}${star}`;

      case '**/.*':
        return `(?:${nodot}${globstar(opts)}${SLASH_LITERAL})?${DOT_LITERAL}${ONE_CHAR}${star}`;

      default: {
        const match = /^(.*?)\.(\w+)$/.exec(str);
        if (!match) return;

        const source = create(match[1]);
        if (!source) return;

        return source + DOT_LITERAL + match[2];
      }
    }
  };

  const output = utils.removePrefix(input, state);
  let source = create(output);

  if (source && opts.strictSlashes !== true) {
    source += `${SLASH_LITERAL}?`;
  }

  return source;
};

module.exports = parse;


/***/ }),

/***/ 3322:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const path = __webpack_require__(1017);
const scan = __webpack_require__(2429);
const parse = __webpack_require__(2139);
const utils = __webpack_require__(479);
const constants = __webpack_require__(6099);
const isObject = val => val && typeof val === 'object' && !Array.isArray(val);

/**
 * Creates a matcher function from one or more glob patterns. The
 * returned function takes a string to match as its first argument,
 * and returns true if the string is a match. The returned matcher
 * function also takes a boolean as the second argument that, when true,
 * returns an object with additional information.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch(glob[, options]);
 *
 * const isMatch = picomatch('*.!(*a)');
 * console.log(isMatch('a.a')); //=> false
 * console.log(isMatch('a.b')); //=> true
 * ```
 * @name picomatch
 * @param {String|Array} `globs` One or more glob patterns.
 * @param {Object=} `options`
 * @return {Function=} Returns a matcher function.
 * @api public
 */

const picomatch = (glob, options, returnState = false) => {
  if (Array.isArray(glob)) {
    const fns = glob.map(input => picomatch(input, options, returnState));
    const arrayMatcher = str => {
      for (const isMatch of fns) {
        const state = isMatch(str);
        if (state) return state;
      }
      return false;
    };
    return arrayMatcher;
  }

  const isState = isObject(glob) && glob.tokens && glob.input;

  if (glob === '' || (typeof glob !== 'string' && !isState)) {
    throw new TypeError('Expected pattern to be a non-empty string');
  }

  const opts = options || {};
  const posix = utils.isWindows(options);
  const regex = isState
    ? picomatch.compileRe(glob, options)
    : picomatch.makeRe(glob, options, false, true);

  const state = regex.state;
  delete regex.state;

  let isIgnored = () => false;
  if (opts.ignore) {
    const ignoreOpts = { ...options, ignore: null, onMatch: null, onResult: null };
    isIgnored = picomatch(opts.ignore, ignoreOpts, returnState);
  }

  const matcher = (input, returnObject = false) => {
    const { isMatch, match, output } = picomatch.test(input, regex, options, { glob, posix });
    const result = { glob, state, regex, posix, input, output, match, isMatch };

    if (typeof opts.onResult === 'function') {
      opts.onResult(result);
    }

    if (isMatch === false) {
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (isIgnored(input)) {
      if (typeof opts.onIgnore === 'function') {
        opts.onIgnore(result);
      }
      result.isMatch = false;
      return returnObject ? result : false;
    }

    if (typeof opts.onMatch === 'function') {
      opts.onMatch(result);
    }
    return returnObject ? result : true;
  };

  if (returnState) {
    matcher.state = state;
  }

  return matcher;
};

/**
 * Test `input` with the given `regex`. This is used by the main
 * `picomatch()` function to test the input string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.test(input, regex[, options]);
 *
 * console.log(picomatch.test('foo/bar', /^(?:([^/]*?)\/([^/]*?))$/));
 * // { isMatch: true, match: [ 'foo/', 'foo', 'bar' ], output: 'foo/bar' }
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp} `regex`
 * @return {Object} Returns an object with matching info.
 * @api public
 */

picomatch.test = (input, regex, options, { glob, posix } = {}) => {
  if (typeof input !== 'string') {
    throw new TypeError('Expected input to be a string');
  }

  if (input === '') {
    return { isMatch: false, output: '' };
  }

  const opts = options || {};
  const format = opts.format || (posix ? utils.toPosixSlashes : null);
  let match = input === glob;
  let output = (match && format) ? format(input) : input;

  if (match === false) {
    output = format ? format(input) : input;
    match = output === glob;
  }

  if (match === false || opts.capture === true) {
    if (opts.matchBase === true || opts.basename === true) {
      match = picomatch.matchBase(input, regex, options, posix);
    } else {
      match = regex.exec(output);
    }
  }

  return { isMatch: Boolean(match), match, output };
};

/**
 * Match the basename of a filepath.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.matchBase(input, glob[, options]);
 * console.log(picomatch.matchBase('foo/bar.js', '*.js'); // true
 * ```
 * @param {String} `input` String to test.
 * @param {RegExp|String} `glob` Glob pattern or regex created by [.makeRe](#makeRe).
 * @return {Boolean}
 * @api public
 */

picomatch.matchBase = (input, glob, options, posix = utils.isWindows(options)) => {
  const regex = glob instanceof RegExp ? glob : picomatch.makeRe(glob, options);
  return regex.test(path.basename(input));
};

/**
 * Returns true if **any** of the given glob `patterns` match the specified `string`.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.isMatch(string, patterns[, options]);
 *
 * console.log(picomatch.isMatch('a.a', ['b.*', '*.a'])); //=> true
 * console.log(picomatch.isMatch('a.a', 'b.*')); //=> false
 * ```
 * @param {String|Array} str The string to test.
 * @param {String|Array} patterns One or more glob patterns to use for matching.
 * @param {Object} [options] See available [options](#options).
 * @return {Boolean} Returns true if any patterns match `str`
 * @api public
 */

picomatch.isMatch = (str, patterns, options) => picomatch(patterns, options)(str);

/**
 * Parse a glob pattern to create the source string for a regular
 * expression.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const result = picomatch.parse(pattern[, options]);
 * ```
 * @param {String} `pattern`
 * @param {Object} `options`
 * @return {Object} Returns an object with useful properties and output to be used as a regex source string.
 * @api public
 */

picomatch.parse = (pattern, options) => {
  if (Array.isArray(pattern)) return pattern.map(p => picomatch.parse(p, options));
  return parse(pattern, { ...options, fastpaths: false });
};

/**
 * Scan a glob pattern to separate the pattern into segments.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.scan(input[, options]);
 *
 * const result = picomatch.scan('!./foo/*.js');
 * console.log(result);
 * { prefix: '!./',
 *   input: '!./foo/*.js',
 *   start: 3,
 *   base: 'foo',
 *   glob: '*.js',
 *   isBrace: false,
 *   isBracket: false,
 *   isGlob: true,
 *   isExtglob: false,
 *   isGlobstar: false,
 *   negated: true }
 * ```
 * @param {String} `input` Glob pattern to scan.
 * @param {Object} `options`
 * @return {Object} Returns an object with
 * @api public
 */

picomatch.scan = (input, options) => scan(input, options);

/**
 * Compile a regular expression from the `state` object returned by the
 * [parse()](#parse) method.
 *
 * @param {Object} `state`
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Intended for implementors, this argument allows you to return the raw output from the parser.
 * @param {Boolean} `returnState` Adds the state to a `state` property on the returned regex. Useful for implementors and debugging.
 * @return {RegExp}
 * @api public
 */

picomatch.compileRe = (state, options, returnOutput = false, returnState = false) => {
  if (returnOutput === true) {
    return state.output;
  }

  const opts = options || {};
  const prepend = opts.contains ? '' : '^';
  const append = opts.contains ? '' : '$';

  let source = `${prepend}(?:${state.output})${append}`;
  if (state && state.negated === true) {
    source = `^(?!${source}).*$`;
  }

  const regex = picomatch.toRegex(source, options);
  if (returnState === true) {
    regex.state = state;
  }

  return regex;
};

/**
 * Create a regular expression from a parsed glob pattern.
 *
 * ```js
 * const picomatch = require('picomatch');
 * const state = picomatch.parse('*.js');
 * // picomatch.compileRe(state[, options]);
 *
 * console.log(picomatch.compileRe(state));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `state` The object returned from the `.parse` method.
 * @param {Object} `options`
 * @param {Boolean} `returnOutput` Implementors may use this argument to return the compiled output, instead of a regular expression. This is not exposed on the options to prevent end-users from mutating the result.
 * @param {Boolean} `returnState` Implementors may use this argument to return the state from the parsed glob with the returned regular expression.
 * @return {RegExp} Returns a regex created from the given pattern.
 * @api public
 */

picomatch.makeRe = (input, options = {}, returnOutput = false, returnState = false) => {
  if (!input || typeof input !== 'string') {
    throw new TypeError('Expected a non-empty string');
  }

  let parsed = { negated: false, fastpaths: true };

  if (options.fastpaths !== false && (input[0] === '.' || input[0] === '*')) {
    parsed.output = parse.fastpaths(input, options);
  }

  if (!parsed.output) {
    parsed = parse(input, options);
  }

  return picomatch.compileRe(parsed, options, returnOutput, returnState);
};

/**
 * Create a regular expression from the given regex source string.
 *
 * ```js
 * const picomatch = require('picomatch');
 * // picomatch.toRegex(source[, options]);
 *
 * const { output } = picomatch.parse('*.js');
 * console.log(picomatch.toRegex(output));
 * //=> /^(?:(?!\.)(?=.)[^/]*?\.js)$/
 * ```
 * @param {String} `source` Regular expression source string.
 * @param {Object} `options`
 * @return {RegExp}
 * @api public
 */

picomatch.toRegex = (source, options) => {
  try {
    const opts = options || {};
    return new RegExp(source, opts.flags || (opts.nocase ? 'i' : ''));
  } catch (err) {
    if (options && options.debug === true) throw err;
    return /$^/;
  }
};

/**
 * Picomatch constants.
 * @return {Object}
 */

picomatch.constants = constants;

/**
 * Expose "picomatch"
 */

module.exports = picomatch;


/***/ }),

/***/ 2429:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



const utils = __webpack_require__(479);
const {
  CHAR_ASTERISK,             /* * */
  CHAR_AT,                   /* @ */
  CHAR_BACKWARD_SLASH,       /* \ */
  CHAR_COMMA,                /* , */
  CHAR_DOT,                  /* . */
  CHAR_EXCLAMATION_MARK,     /* ! */
  CHAR_FORWARD_SLASH,        /* / */
  CHAR_LEFT_CURLY_BRACE,     /* { */
  CHAR_LEFT_PARENTHESES,     /* ( */
  CHAR_LEFT_SQUARE_BRACKET,  /* [ */
  CHAR_PLUS,                 /* + */
  CHAR_QUESTION_MARK,        /* ? */
  CHAR_RIGHT_CURLY_BRACE,    /* } */
  CHAR_RIGHT_PARENTHESES,    /* ) */
  CHAR_RIGHT_SQUARE_BRACKET  /* ] */
} = __webpack_require__(6099);

const isPathSeparator = code => {
  return code === CHAR_FORWARD_SLASH || code === CHAR_BACKWARD_SLASH;
};

const depth = token => {
  if (token.isPrefix !== true) {
    token.depth = token.isGlobstar ? Infinity : 1;
  }
};

/**
 * Quickly scans a glob pattern and returns an object with a handful of
 * useful properties, like `isGlob`, `path` (the leading non-glob, if it exists),
 * `glob` (the actual pattern), `negated` (true if the path starts with `!` but not
 * with `!(`) and `negatedExtglob` (true if the path starts with `!(`).
 *
 * ```js
 * const pm = require('picomatch');
 * console.log(pm.scan('foo/bar/*.js'));
 * { isGlob: true, input: 'foo/bar/*.js', base: 'foo/bar', glob: '*.js' }
 * ```
 * @param {String} `str`
 * @param {Object} `options`
 * @return {Object} Returns an object with tokens and regex source string.
 * @api public
 */

const scan = (input, options) => {
  const opts = options || {};

  const length = input.length - 1;
  const scanToEnd = opts.parts === true || opts.scanToEnd === true;
  const slashes = [];
  const tokens = [];
  const parts = [];

  let str = input;
  let index = -1;
  let start = 0;
  let lastIndex = 0;
  let isBrace = false;
  let isBracket = false;
  let isGlob = false;
  let isExtglob = false;
  let isGlobstar = false;
  let braceEscaped = false;
  let backslashes = false;
  let negated = false;
  let negatedExtglob = false;
  let finished = false;
  let braces = 0;
  let prev;
  let code;
  let token = { value: '', depth: 0, isGlob: false };

  const eos = () => index >= length;
  const peek = () => str.charCodeAt(index + 1);
  const advance = () => {
    prev = code;
    return str.charCodeAt(++index);
  };

  while (index < length) {
    code = advance();
    let next;

    if (code === CHAR_BACKWARD_SLASH) {
      backslashes = token.backslashes = true;
      code = advance();

      if (code === CHAR_LEFT_CURLY_BRACE) {
        braceEscaped = true;
      }
      continue;
    }

    if (braceEscaped === true || code === CHAR_LEFT_CURLY_BRACE) {
      braces++;

      while (eos() !== true && (code = advance())) {
        if (code === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (code === CHAR_LEFT_CURLY_BRACE) {
          braces++;
          continue;
        }

        if (braceEscaped !== true && code === CHAR_DOT && (code = advance()) === CHAR_DOT) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (braceEscaped !== true && code === CHAR_COMMA) {
          isBrace = token.isBrace = true;
          isGlob = token.isGlob = true;
          finished = true;

          if (scanToEnd === true) {
            continue;
          }

          break;
        }

        if (code === CHAR_RIGHT_CURLY_BRACE) {
          braces--;

          if (braces === 0) {
            braceEscaped = false;
            isBrace = token.isBrace = true;
            finished = true;
            break;
          }
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (code === CHAR_FORWARD_SLASH) {
      slashes.push(index);
      tokens.push(token);
      token = { value: '', depth: 0, isGlob: false };

      if (finished === true) continue;
      if (prev === CHAR_DOT && index === (start + 1)) {
        start += 2;
        continue;
      }

      lastIndex = index + 1;
      continue;
    }

    if (opts.noext !== true) {
      const isExtglobChar = code === CHAR_PLUS
        || code === CHAR_AT
        || code === CHAR_ASTERISK
        || code === CHAR_QUESTION_MARK
        || code === CHAR_EXCLAMATION_MARK;

      if (isExtglobChar === true && peek() === CHAR_LEFT_PARENTHESES) {
        isGlob = token.isGlob = true;
        isExtglob = token.isExtglob = true;
        finished = true;
        if (code === CHAR_EXCLAMATION_MARK && index === start) {
          negatedExtglob = true;
        }

        if (scanToEnd === true) {
          while (eos() !== true && (code = advance())) {
            if (code === CHAR_BACKWARD_SLASH) {
              backslashes = token.backslashes = true;
              code = advance();
              continue;
            }

            if (code === CHAR_RIGHT_PARENTHESES) {
              isGlob = token.isGlob = true;
              finished = true;
              break;
            }
          }
          continue;
        }
        break;
      }
    }

    if (code === CHAR_ASTERISK) {
      if (prev === CHAR_ASTERISK) isGlobstar = token.isGlobstar = true;
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_QUESTION_MARK) {
      isGlob = token.isGlob = true;
      finished = true;

      if (scanToEnd === true) {
        continue;
      }
      break;
    }

    if (code === CHAR_LEFT_SQUARE_BRACKET) {
      while (eos() !== true && (next = advance())) {
        if (next === CHAR_BACKWARD_SLASH) {
          backslashes = token.backslashes = true;
          advance();
          continue;
        }

        if (next === CHAR_RIGHT_SQUARE_BRACKET) {
          isBracket = token.isBracket = true;
          isGlob = token.isGlob = true;
          finished = true;
          break;
        }
      }

      if (scanToEnd === true) {
        continue;
      }

      break;
    }

    if (opts.nonegate !== true && code === CHAR_EXCLAMATION_MARK && index === start) {
      negated = token.negated = true;
      start++;
      continue;
    }

    if (opts.noparen !== true && code === CHAR_LEFT_PARENTHESES) {
      isGlob = token.isGlob = true;

      if (scanToEnd === true) {
        while (eos() !== true && (code = advance())) {
          if (code === CHAR_LEFT_PARENTHESES) {
            backslashes = token.backslashes = true;
            code = advance();
            continue;
          }

          if (code === CHAR_RIGHT_PARENTHESES) {
            finished = true;
            break;
          }
        }
        continue;
      }
      break;
    }

    if (isGlob === true) {
      finished = true;

      if (scanToEnd === true) {
        continue;
      }

      break;
    }
  }

  if (opts.noext === true) {
    isExtglob = false;
    isGlob = false;
  }

  let base = str;
  let prefix = '';
  let glob = '';

  if (start > 0) {
    prefix = str.slice(0, start);
    str = str.slice(start);
    lastIndex -= start;
  }

  if (base && isGlob === true && lastIndex > 0) {
    base = str.slice(0, lastIndex);
    glob = str.slice(lastIndex);
  } else if (isGlob === true) {
    base = '';
    glob = str;
  } else {
    base = str;
  }

  if (base && base !== '' && base !== '/' && base !== str) {
    if (isPathSeparator(base.charCodeAt(base.length - 1))) {
      base = base.slice(0, -1);
    }
  }

  if (opts.unescape === true) {
    if (glob) glob = utils.removeBackslashes(glob);

    if (base && backslashes === true) {
      base = utils.removeBackslashes(base);
    }
  }

  const state = {
    prefix,
    input,
    start,
    base,
    glob,
    isBrace,
    isBracket,
    isGlob,
    isExtglob,
    isGlobstar,
    negated,
    negatedExtglob
  };

  if (opts.tokens === true) {
    state.maxDepth = 0;
    if (!isPathSeparator(code)) {
      tokens.push(token);
    }
    state.tokens = tokens;
  }

  if (opts.parts === true || opts.tokens === true) {
    let prevIndex;

    for (let idx = 0; idx < slashes.length; idx++) {
      const n = prevIndex ? prevIndex + 1 : start;
      const i = slashes[idx];
      const value = input.slice(n, i);
      if (opts.tokens) {
        if (idx === 0 && start !== 0) {
          tokens[idx].isPrefix = true;
          tokens[idx].value = prefix;
        } else {
          tokens[idx].value = value;
        }
        depth(tokens[idx]);
        state.maxDepth += tokens[idx].depth;
      }
      if (idx !== 0 || value !== '') {
        parts.push(value);
      }
      prevIndex = i;
    }

    if (prevIndex && prevIndex + 1 < input.length) {
      const value = input.slice(prevIndex + 1);
      parts.push(value);

      if (opts.tokens) {
        tokens[tokens.length - 1].value = value;
        depth(tokens[tokens.length - 1]);
        state.maxDepth += tokens[tokens.length - 1].depth;
      }
    }

    state.slashes = slashes;
    state.parts = parts;
  }

  return state;
};

module.exports = scan;


/***/ }),

/***/ 479:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



const path = __webpack_require__(1017);
const win32 = process.platform === 'win32';
const {
  REGEX_BACKSLASH,
  REGEX_REMOVE_BACKSLASH,
  REGEX_SPECIAL_CHARS,
  REGEX_SPECIAL_CHARS_GLOBAL
} = __webpack_require__(6099);

exports.isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);
exports.hasRegexChars = str => REGEX_SPECIAL_CHARS.test(str);
exports.isRegexChar = str => str.length === 1 && exports.hasRegexChars(str);
exports.escapeRegex = str => str.replace(REGEX_SPECIAL_CHARS_GLOBAL, '\\$1');
exports.toPosixSlashes = str => str.replace(REGEX_BACKSLASH, '/');

exports.removeBackslashes = str => {
  return str.replace(REGEX_REMOVE_BACKSLASH, match => {
    return match === '\\' ? '' : match;
  });
};

exports.supportsLookbehinds = () => {
  const segs = process.version.slice(1).split('.').map(Number);
  if (segs.length === 3 && segs[0] >= 9 || (segs[0] === 8 && segs[1] >= 10)) {
    return true;
  }
  return false;
};

exports.isWindows = options => {
  if (options && typeof options.windows === 'boolean') {
    return options.windows;
  }
  return win32 === true || path.sep === '\\';
};

exports.escapeLast = (input, char, lastIdx) => {
  const idx = input.lastIndexOf(char, lastIdx);
  if (idx === -1) return input;
  if (input[idx - 1] === '\\') return exports.escapeLast(input, char, idx - 1);
  return `${input.slice(0, idx)}\\${input.slice(idx)}`;
};

exports.removePrefix = (input, state = {}) => {
  let output = input;
  if (output.startsWith('./')) {
    output = output.slice(2);
    state.prefix = './';
  }
  return output;
};

exports.wrapOutput = (input, state = {}, options = {}) => {
  const prepend = options.contains ? '' : '^';
  const append = options.contains ? '' : '$';

  let output = `${prepend}(?:${input})${append}`;
  if (state.negated === true) {
    output = `(?:^(?!${output}).*$)`;
  }
  return output;
};


/***/ }),

/***/ 1861:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*!
 * to-regex-range <https://github.com/micromatch/to-regex-range>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Released under the MIT License.
 */



const isNumber = __webpack_require__(5680);

const toRegexRange = (min, max, options) => {
  if (isNumber(min) === false) {
    throw new TypeError('toRegexRange: expected the first argument to be a number');
  }

  if (max === void 0 || min === max) {
    return String(min);
  }

  if (isNumber(max) === false) {
    throw new TypeError('toRegexRange: expected the second argument to be a number.');
  }

  let opts = { relaxZeros: true, ...options };
  if (typeof opts.strictZeros === 'boolean') {
    opts.relaxZeros = opts.strictZeros === false;
  }

  let relax = String(opts.relaxZeros);
  let shorthand = String(opts.shorthand);
  let capture = String(opts.capture);
  let wrap = String(opts.wrap);
  let cacheKey = min + ':' + max + '=' + relax + shorthand + capture + wrap;

  if (toRegexRange.cache.hasOwnProperty(cacheKey)) {
    return toRegexRange.cache[cacheKey].result;
  }

  let a = Math.min(min, max);
  let b = Math.max(min, max);

  if (Math.abs(a - b) === 1) {
    let result = min + '|' + max;
    if (opts.capture) {
      return `(${result})`;
    }
    if (opts.wrap === false) {
      return result;
    }
    return `(?:${result})`;
  }

  let isPadded = hasPadding(min) || hasPadding(max);
  let state = { min, max, a, b };
  let positives = [];
  let negatives = [];

  if (isPadded) {
    state.isPadded = isPadded;
    state.maxLen = String(state.max).length;
  }

  if (a < 0) {
    let newMin = b < 0 ? Math.abs(b) : 1;
    negatives = splitToPatterns(newMin, Math.abs(a), state, opts);
    a = state.a = 0;
  }

  if (b >= 0) {
    positives = splitToPatterns(a, b, state, opts);
  }

  state.negatives = negatives;
  state.positives = positives;
  state.result = collatePatterns(negatives, positives, opts);

  if (opts.capture === true) {
    state.result = `(${state.result})`;
  } else if (opts.wrap !== false && (positives.length + negatives.length) > 1) {
    state.result = `(?:${state.result})`;
  }

  toRegexRange.cache[cacheKey] = state;
  return state.result;
};

function collatePatterns(neg, pos, options) {
  let onlyNegative = filterPatterns(neg, pos, '-', false, options) || [];
  let onlyPositive = filterPatterns(pos, neg, '', false, options) || [];
  let intersected = filterPatterns(neg, pos, '-?', true, options) || [];
  let subpatterns = onlyNegative.concat(intersected).concat(onlyPositive);
  return subpatterns.join('|');
}

function splitToRanges(min, max) {
  let nines = 1;
  let zeros = 1;

  let stop = countNines(min, nines);
  let stops = new Set([max]);

  while (min <= stop && stop <= max) {
    stops.add(stop);
    nines += 1;
    stop = countNines(min, nines);
  }

  stop = countZeros(max + 1, zeros) - 1;

  while (min < stop && stop <= max) {
    stops.add(stop);
    zeros += 1;
    stop = countZeros(max + 1, zeros) - 1;
  }

  stops = [...stops];
  stops.sort(compare);
  return stops;
}

/**
 * Convert a range to a regex pattern
 * @param {Number} `start`
 * @param {Number} `stop`
 * @return {String}
 */

function rangeToPattern(start, stop, options) {
  if (start === stop) {
    return { pattern: start, count: [], digits: 0 };
  }

  let zipped = zip(start, stop);
  let digits = zipped.length;
  let pattern = '';
  let count = 0;

  for (let i = 0; i < digits; i++) {
    let [startDigit, stopDigit] = zipped[i];

    if (startDigit === stopDigit) {
      pattern += startDigit;

    } else if (startDigit !== '0' || stopDigit !== '9') {
      pattern += toCharacterClass(startDigit, stopDigit, options);

    } else {
      count++;
    }
  }

  if (count) {
    pattern += options.shorthand === true ? '\\d' : '[0-9]';
  }

  return { pattern, count: [count], digits };
}

function splitToPatterns(min, max, tok, options) {
  let ranges = splitToRanges(min, max);
  let tokens = [];
  let start = min;
  let prev;

  for (let i = 0; i < ranges.length; i++) {
    let max = ranges[i];
    let obj = rangeToPattern(String(start), String(max), options);
    let zeros = '';

    if (!tok.isPadded && prev && prev.pattern === obj.pattern) {
      if (prev.count.length > 1) {
        prev.count.pop();
      }

      prev.count.push(obj.count[0]);
      prev.string = prev.pattern + toQuantifier(prev.count);
      start = max + 1;
      continue;
    }

    if (tok.isPadded) {
      zeros = padZeros(max, tok, options);
    }

    obj.string = zeros + obj.pattern + toQuantifier(obj.count);
    tokens.push(obj);
    start = max + 1;
    prev = obj;
  }

  return tokens;
}

function filterPatterns(arr, comparison, prefix, intersection, options) {
  let result = [];

  for (let ele of arr) {
    let { string } = ele;

    // only push if _both_ are negative...
    if (!intersection && !contains(comparison, 'string', string)) {
      result.push(prefix + string);
    }

    // or _both_ are positive
    if (intersection && contains(comparison, 'string', string)) {
      result.push(prefix + string);
    }
  }
  return result;
}

/**
 * Zip strings
 */

function zip(a, b) {
  let arr = [];
  for (let i = 0; i < a.length; i++) arr.push([a[i], b[i]]);
  return arr;
}

function compare(a, b) {
  return a > b ? 1 : b > a ? -1 : 0;
}

function contains(arr, key, val) {
  return arr.some(ele => ele[key] === val);
}

function countNines(min, len) {
  return Number(String(min).slice(0, -len) + '9'.repeat(len));
}

function countZeros(integer, zeros) {
  return integer - (integer % Math.pow(10, zeros));
}

function toQuantifier(digits) {
  let [start = 0, stop = ''] = digits;
  if (stop || start > 1) {
    return `{${start + (stop ? ',' + stop : '')}}`;
  }
  return '';
}

function toCharacterClass(a, b, options) {
  return `[${a}${(b - a === 1) ? '' : '-'}${b}]`;
}

function hasPadding(str) {
  return /^-?(0+)\d/.test(str);
}

function padZeros(value, tok, options) {
  if (!tok.isPadded) {
    return value;
  }

  let diff = Math.abs(tok.maxLen - String(value).length);
  let relax = options.relaxZeros !== false;

  switch (diff) {
    case 0:
      return '';
    case 1:
      return relax ? '0?' : '0';
    case 2:
      return relax ? '0{0,2}' : '00';
    default: {
      return relax ? `0{0,${diff}}` : `0{${diff}}`;
    }
  }
}

/**
 * Cache
 */

toRegexRange.cache = {};
toRegexRange.clearCache = () => (toRegexRange.cache = {});

/**
 * Expose `toRegexRange`
 */

module.exports = toRegexRange;


/***/ }),

/***/ 3451:
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ init),
  "getEventsSince": () => (/* binding */ getEventsSince),
  "subscribe": () => (/* binding */ subscribe),
  "unsubscribe": () => (/* binding */ unsubscribe),
  "writeSnapshot": () => (/* binding */ writeSnapshot)
});

;// CONCATENATED MODULE: ./node_modules/napi-wasm/index.mjs
const NAPI_OK = 0;
const NAPI_GENERIC_FAILURE = 9;
const NAPI_PENDING_EXCEPTION = 10;
const NAPI_CANCELED = 11;
const NAPI_HANDLE_SCOPE_MISMATCH = 13;
const NAPI_NO_EXTERNAL_BUFFERS_ALLOWED = 22;

// https://nodejs.org/api/n-api.html#napi_property_attributes
const NAPI_WRITABLE = 1 << 0;
const NAPI_ENUMERABLE = 1 << 1;
const NAPI_CONFIGURABLE = 1 << 2;
const NAPI_STATIC = 1 << 10;

// https://nodejs.org/api/n-api.html#napi_typedarray_type
const typedArrays = [
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array
];

const environments = [];

class Environment {
  scopes = [];
  referenceId = 1;
  references = new Map();
  deferred = [null];
  wrappedObjects = new WeakMap();
  externalObjects = new WeakMap();
  buffers = new Map();
  instanceData = 0;
  pendingException = null;

  constructor(instance) {
    this.id = environments.length;
    environments.push(this);

    this.instance = instance;
    this.table = instance.exports.__indirect_function_table;
    this.exports = {};

    this.pushScope();
    let values = this.scopes[this.scopes.length - 1];
    let exports = values.length;
    values.push(this.exports);

    try {
      if (this.instance.exports.napi_register_module_v1) {
        this.instance.exports.napi_register_module_v1(this.id, exports);
      }

      if (this.instance.exports.napi_register_wasm_v1) {
        this.instance.exports.napi_register_wasm_v1(this.id, exports);
      }
    } finally {
      this.popScope();
      if (this.pendingException) {
        let e = this.pendingException;
        this.pendingException = null;
        throw e;
      }
    }
  }

  destroy() {
    environments[this.id] = undefined;
  }

  getString(ptr, len = strlen(this.memory, ptr)) {
    return decoder.decode(this.memory.subarray(ptr, Math.max(0, ptr + len)));
  }

  pushScope() {
    let id = this.scopes.length;
    this.scopes.push(id ? [...this.scopes[id - 1]] : [undefined, null, globalThis, true, false]);
    return id;
  }

  popScope() {
    this.scopes.pop();

    // Update any buffers with values which might have been modified in WASM copy.
    for (let [buffer, slice] of this.buffers) {
      // Ignore if buffer or slice has been detached.
      if (buffer.byteLength && slice.byteLength) {
        buffer.set(slice);
      }
    }

    this.buffers.clear();
  }

  get(idx) {
    return this.scopes[this.scopes.length - 1][idx];
  }

  set(idx, value) {
    this.scopes[this.scopes.length - 1][idx] = value;
  }

  pushValue(value, scope = this.scopes.length - 1) {
    let values = this.scopes[scope];
    let id = values.length;
    values.push(value);
    return id;
  }

  createValue(value, result, scope) {
    if (typeof value === 'boolean') {
      this.setPointer(result, value ? 3 : 4);
      return NAPI_OK;
    } else if (typeof value === 'undefined') {
      this.setPointer(result, 0);
      return NAPI_OK;
    } else if (value === null) {
      this.setPointer(result, 1);
      return NAPI_OK;
    } else if (value === globalThis) {
      this.setPointer(result, 2);
      return NAPI_OK;
    }

    let id = this.pushValue(value, scope);
    this.setPointer(result, id);
    return NAPI_OK;
  }

  setPointer(ptr, value) {
    this.u32[ptr >> 2] = value;
    return NAPI_OK;
  }

  _u32 = new Uint32Array();
  get u32() {
    if (this._u32.byteLength === 0) {
      this._u32 = new Uint32Array(this.instance.exports.memory.buffer);
    }

    return this._u32;
  }

  _i32 = new Int32Array();
  get i32() {
    if (this._i32.byteLength === 0) {
      this._i32 = new Int32Array(this.instance.exports.memory.buffer);
    }

    return this._i32;
  }

  _u16 = new Uint16Array();
  get u16() {
    if (this._u16.byteLength === 0) {
      this._u16 = new Uint16Array(this.instance.exports.memory.buffer);
    }

    return this._u16;
  }

  _u64 = new BigUint64Array();
  get u64() {
    if (this._u64.byteLength === 0) {
      this._u64 = new BigUint64Array(this.instance.exports.memory.buffer);
    }

    return this._u64;
  }

  _i64 = new BigInt64Array();
  get i64() {
    if (this._i64.byteLength === 0) {
      this._i64 = new BigInt64Array(this.instance.exports.memory.buffer);
    }

    return this._i64;
  }

  _f64 = new Float64Array();
  get f64() {
    if (this._f64.byteLength === 0) {
      this._f64 = new Float64Array(this.instance.exports.memory.buffer);
    }

    return this._f64;
  }

  _buf = new Uint8Array();
  get memory() {
    if (this._buf.byteLength === 0) {
      this._buf = new Uint8Array(this.instance.exports.memory.buffer);
    }

    return this._buf;
  }

  getBufferInfo(buf, ptr) {
    if (this.buffers.has(buf)) {
      let b = this.buffers.get(buf);
      this.setPointer(ptr, b.byteOffset);
      return b.byteLength;
    }

    if (buf instanceof ArrayBuffer) {
      let b = this.copyBuffer(new Uint8Array(buf));
      this.setPointer(ptr, b.byteOffset);
      return b.byteLength;
    }

    // If this is a view into WASM memory, no copies needed.
    if (buf.buffer === this.instance.exports.memory.buffer) {
      this.setPointer(ptr, buf.byteOffset);
      return buf.byteLength;
    }

    let b = this.copyBuffer(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
    this.setPointer(ptr, b.byteOffset);
    return b.byteLength;
  }

  copyBuffer(data) {
    let ptr = this.instance.exports.napi_wasm_malloc(data.byteLength);
    let mem = this.memory;
    mem.set(data, ptr);
    let buf = mem.subarray(ptr, ptr + data.byteLength);
    this.buffers.set(data, buf);
    return buf;
  }

  createFunction(cb, data) {
    let env = this;
    let fn = env.table.get(cb);
    let func = function (...args) {
      let scope = env.pushScope();

      try {
        let values = env.scopes[scope];
        let info = values.length;
        values.push({
          thisArg: this,
          args,
          data,
          newTarget: new.target
        });

        let res = fn(env.id, info);
        return env.get(res);
      } finally {
        env.popScope();
        if (env.pendingException) {
          let e = env.pendingException;
          env.pendingException = null;
          throw e;
        }
      }
    };

    return func;
  }

  readPropertyDescriptor(ptr) {
    // https://nodejs.org/api/n-api.html#napi_property_descriptor
    let buf = this.u32;
    let utf8name = buf[ptr++];
    let nameValue = buf[ptr++];
    let method = buf[ptr++];
    let getter = buf[ptr++];
    let setter = buf[ptr++];
    let val = buf[ptr++];
    let attrs = buf[ptr++];
    let data = buf[ptr++];

    let name = utf8name ? this.getString(utf8name) : this.get(nameValue);
    let writable = Boolean(attrs & NAPI_WRITABLE);
    let enumerable = Boolean(attrs & NAPI_ENUMERABLE);
    let configurable = Boolean(attrs & NAPI_CONFIGURABLE);
    let isStatic = Boolean(attrs & NAPI_STATIC);
    let get = getter ? this.createFunction(getter, data) : undefined;
    let set = setter ? this.createFunction(setter, data) : undefined;
    let value = method ? this.createFunction(method, data) : val ? this.get(val) : undefined;

    let descriptor = {
      name,
      static: isStatic,
      configurable,
      enumerable
    };
    if (get || set) {
      descriptor.get = get;
      descriptor.set = set;
    } else if (value) {
      descriptor.writable = writable;
      descriptor.value = value;
    }

    return descriptor;
  }
}

const decoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
const latin1Decoder = new TextDecoder('latin1');
const utf16Decoder = new TextDecoder('utf-16');
const encoder = new TextEncoder();

class FinalizeRecord {
  constructor(env, finalize, hint, data) {
    this.env = env;
    this.finalize = finalize;
    this.hint = hint;
    this.data = data;
  }
}

const finalizationRegistry = new FinalizationRegistry(buffer => {
  if (buffer.finalize) {
    buffer.finalize(buffer.env, buffer.data, buffer.hint);
  }
});

class ExternalValue {}

const threadsafeFunctions = [];

class ThreadSafeFunction {
  constructor(env, fn, nativeFn, context) {
    this.env = env;
    this.fn = fn;
    this.nativeFn = nativeFn;
    this.context = context;
    this.id = threadsafeFunctions.length;
    threadsafeFunctions.push(this);
  }
}

const asyncWork = [null];

class AsyncWork {
  constructor(env, execute, complete, data) {
    this.env = env;
    this.execute = execute;
    this.complete = complete;
    this.data = data;
    this.id = asyncWork.length;
    asyncWork.push(this);
  }
}

const napi = {
  napi_open_handle_scope(env_id, result) {
    let env = environments[env_id];
    let id = env.pushScope();
    return env.setPointer(result, id);
  },
  napi_close_handle_scope(env_id, scope) {
    let env = environments[env_id];
    if (scope !== env.scopes.length - 1) {
      return NAPI_HANDLE_SCOPE_MISMATCH;
    }
    env.popScope();
    return NAPI_OK;
  },
  napi_open_escapable_handle_scope(env_id, result) {
    let env = environments[env_id];
    let id = env.pushScope();
    return env.setPointer(result, id);
  },
  napi_close_escapable_handle_scope(env_id, scope) {
    let env = environments[env_id];
    if (scope !== env.scopes.length - 1) {
      return NAPI_HANDLE_SCOPE_MISMATCH;
    }
    env.popScope();
    return NAPI_OK;
  },
  napi_escape_handle(env_id, scope_id, escapee, result) {
    let env = environments[env_id];
    let value = env.get(escapee);
    // Create a value in the outer scope.
    return env.createValue(value, result, scope_id - 1);
  },
  napi_create_object(env_id, result) {
    let env = environments[env_id];
    return env.createValue({}, result);
  },
  napi_set_property(env_id, object, key, value) {
    let env = environments[env_id];
    let obj = env.get(object);
    let name = env.get(key);
    let val = env.get(value);
    obj[name] = val;
    return NAPI_OK;
  },
  napi_get_property(env_id, object, key, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let name = env.get(key);
    return env.createValue(obj[name], result);
  },
  napi_delete_property(env_id, object, key, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let name = env.get(key);
    let res = false;
    try {
      res = delete obj[name];
    } catch (err) {}
    if (result) {
      env.memory[result] = res ? 1 : 0;
    }
    return NAPI_OK;
  },
  napi_has_property(env_id, object, key, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let name = env.get(key);
    // return env.setPointer(result, name in obj ? 1 : 0);
    env.memory[result] = name in obj ? 1 : 0;
    return NAPI_OK;
  },
  napi_has_own_property(env_id, object, key, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let name = env.get(key);
    env.memory[result] = obj.hasOwnProperty(name) ? 1 : 0;
    return NAPI_OK;
  },
  napi_set_named_property(env_id, object, utf8Name, value) {
    let env = environments[env_id];
    let obj = env.get(object);
    let val = env.get(value);
    let name = env.getString(utf8Name);
    obj[name] = val;
    return NAPI_OK;
  },
  napi_get_named_property(env_id, object, utf8Name, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let name = env.getString(utf8Name);
    return env.createValue(obj[name], result);
  },
  napi_has_named_property(env_id, object, utf8Name, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let name = env.getString(utf8Name);
    env.memory[result] = name in obj ? 1 : 0;
    return NAPI_OK;
  },
  napi_get_property_names(env_id, object, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let properties = Object.keys(obj);
    return env.createValue(properties, result);
  },
  napi_get_all_property_names(env_id, object, key_mode, key_filter, key_conversion, result) {
    throw new Error('not implemented');
  },
  napi_define_properties(env_id, object, property_count, properties) {
    let env = environments[env_id];
    let obj = env.get(object);
    let ptr = properties >> 2;
    for (let i = 0; i < property_count; i++) {
      let descriptor = env.readPropertyDescriptor(ptr);
      Object.defineProperty(obj, descriptor.name, descriptor);
      ptr += 8;
    }
    return NAPI_OK;
  },
  napi_object_freeze(env_id, object) {
    let env = environments[env_id];
    let obj = env.get(object);
    Object.freeze(obj);
    return NAPI_OK;
  },
  napi_object_seal(env_id, object) {
    let env = environments[env_id];
    let obj = env.get(object);
    Object.seal(obj);
    return NAPI_OK;
  },
  napi_get_prototype(env_id, object, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    return env.createValue(Object.getPrototypeOf(obj), result);
  },
  napi_define_class(env_id, utf8name, length, constructor, data, property_count, properties, result) {
    let env = environments[env_id];
    let func = env.createFunction(constructor, data);

    Object.defineProperty(func, 'name', {
      value: env.getString(utf8name, length),
      configurable: true
    });

    let ptr = properties >> 2;
    for (let i = 0; i < property_count; i++) {
      let descriptor = env.readPropertyDescriptor(ptr);
      if (descriptor.static) {
        Object.defineProperty(func, descriptor.name, descriptor);
      } else {
        Object.defineProperty(func.prototype, descriptor.name, descriptor);
      }
      ptr += 8;
    }

    return env.createValue(func, result);
  },
  napi_create_reference(env_id, value, refcount, result) {
    let env = environments[env_id];
    let id = env.referenceId++;
    env.references.set(id, {
      value: env.get(value),
      refcount
    });
    return env.setPointer(result, id);
  },
  napi_delete_reference(env_id, ref) {
    let env = environments[env_id];
    env.references.delete(ref);
    return NAPI_OK;
  },
  napi_get_reference_value(env_id, ref, result) {
    let env = environments[env_id];
    let reference = env.references.get(ref);
    return env.createValue(reference.value, result);
  },
  napi_reference_ref(env_id, ref, result) {
    let env = environments[env_id];
    let reference = env.references.get(ref);
    reference.refcount++;
    return env.setPointer(result, reference.refcount);
  },
  napi_reference_unref(env_id, ref, result) {
    let env = environments[env_id];
    let reference = env.references.get(ref);
    if (reference.refcount === 0) {
      return NAPI_GENERIC_FAILURE;
    }
    reference.refcount--;
    return env.setPointer(result, reference.refcount);
  },
  napi_add_env_cleanup_hook() {
    return NAPI_OK;
  },
  napi_remove_env_cleanup_hook() {
    return NAPI_OK;
  },
  napi_add_async_cleanup_hook() {
    return NAPI_OK;
  },
  napi_remove_async_cleanup_hook() {
    return NAPI_OK;
  },
  napi_set_instance_data(env_id, data, finalize_cb, finalize_hint) {
    let env = environments[env_id];
    env.instanceData = data;
    return NAPI_OK;
  },
  napi_get_instance_data(env_id, data) {
    let env = environments[env_id];
    return env.setPointer(data, env.instanceData);
  },
  napi_get_boolean(env_id, value, result) {
    let env = environments[env_id];
    return env.setPointer(result, value ? 3 : 4);
  },
  napi_get_value_bool(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.memory[result] = val ? 1 : 0;
    return NAPI_OK;
  },
  napi_create_int32(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(value, result);
  },
  napi_get_value_int32(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.i32[result >> 2] = val;
    return NAPI_OK;
  },
  napi_create_uint32(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(value, result);
  },
  napi_get_value_uint32(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    return env.setPointer(result, val);
  },
  napi_create_int64(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(Number(value), result);
  },
  napi_get_value_int64(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.i64[result >> 3] = val;
    return NAPI_OK;
  },
  napi_create_double(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(value, result);
  },
  napi_get_value_double(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.f64[result >> 3] = val;
    return NAPI_OK;
  },
  napi_create_bigint_int64(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(BigInt.asIntN(64, value), result);
  },
  napi_get_value_bigint_int64(env_id, value, result, lossless) {
    let env = environments[env_id];
    let val = env.get(value);
    env.i64[result >> 3] = val;
    if (lossless) {
      env.memory[lossless] = BigInt.asIntN(64, val) === val ? 1 : 0;
    }
    return NAPI_OK;
  },
  napi_create_bigint_uint64(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(BigInt.asUintN(64, value), result);
  },
  napi_get_value_bigint_uint64(env_id, value, result, lossless) {
    let env = environments[env_id];
    let val = env.get(value);
    env.u64[result >> 3] = val;
    if (lossless) {
      env.memory[lossless] = BigInt.asUintN(64, val) === val ? 1 : 0;
    }
    return NAPI_OK;
  },
  napi_create_bigint_words(env_id, sign_bit, word_count, words, result) {
    let env = environments[env_id];
    let buf = env.u64;
    let ptr = words >> 3;
    let res = 0n;
    let shift = 0n;

    for (let i = 0; i < word_count; i++) {
      let word = buf[ptr++];
      res += word << shift;
      shift += 64n;
    }

    res *= BigInt((-1) ** sign_bit);
    return env.createValue(res, result);
  },
  napi_get_value_bigint_words(env_id, value, sign_bit, word_count, words) {
    let env = environments[env_id];
    let val = env.get(value);
    let count = env.u32[word_count >> 2];

    if (sign_bit) {
      env.i32[sign_bit] = val < 0n ? 1 : 0;
    }

    let i = 0;
    if (words) {
      let mask = (1n << 64n) - 1n;
      let buf = env.u64;
      let ptr = words >> 3;
      if (val < 0n) {
        val = -val;
      }

      for (; i < count && val !== 0n; i++) {
        buf[ptr++] = val & mask;
        val >>= 64n;
      }
    }

    while (val > 0n) {
      i++;
      val >>= 64n;
    }

    return env.setPointer(word_count, i);
  },
  napi_get_null(env_id, result) {
    let env = environments[env_id];
    return env.setPointer(result, 1);
  },
  napi_create_array(env_id, result) {
    let env = environments[env_id];
    return env.createValue([], result);
  },
  napi_create_array_with_length(env_id, length, result) {
    let env = environments[env_id];
    return env.createValue(new Array(length), result);
  },
  napi_set_element(env_id, object, index, value) {
    let env = environments[env_id];
    let obj = env.get(object);
    let val = env.get(value);
    obj[index] = val;
    return NAPI_OK;
  },
  napi_get_element(env_id, object, index, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let val = obj[index];
    return env.createValue(val, result);
  },
  napi_has_element(env_id, object, index, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    env.memory[result] = obj.hasOwnProperty(index) ? 1 : 0;
    return NAPI_OK;
  },
  napi_delete_element(env_id, object, index, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let res = false;
    try {
      res = delete obj[index];
    } catch (err) {}
    if (result) {
      env.memory[result] = res ? 1 : 0;
    }
    return NAPI_OK;
  },
  napi_get_array_length(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    return env.setPointer(result, val.length);
  },
  napi_get_undefined(env_id, result) {
    let env = environments[env_id];
    return env.setPointer(result, 0);
  },
  napi_create_function(env_id, utf8name, length, cb, data, result) {
    let env = environments[env_id];
    let func = env.createFunction(cb, data);

    Object.defineProperty(func, 'name', {
      value: env.getString(utf8name, length),
      configurable: true
    });

    return env.createValue(func, result);
  },
  napi_call_function(env_id, recv, func, argc, argv, result) {
    let env = environments[env_id];
    let thisArg = env.get(recv);
    let fn = env.get(func);
    let args = new Array(argc);
    let mem = env.u32;
    for (let i = 0; i < argc; i++) {
      args[i] = env.get(mem[argv >> 2]);
      argv += 4;
    }

    try {
      let res = fn.apply(thisArg, args);
      return env.createValue(res, result);
    } catch (err) {
      env.pendingException = err;
      return NAPI_PENDING_EXCEPTION;
    }
  },
  napi_new_instance(env_id, cons, argc, argv, result) {
    let env = environments[env_id];
    let Class = env.get(cons);
    let args = new Array(argc);
    let mem = env.u32;
    for (let i = 0; i < argc; i++) {
      args[i] = env.get(mem[argv >> 2]);
      argv += 4;
    }

    try {
      let value = new Class(...args);
      return env.createValue(value, result);
    } catch (err) {
      env.pendingException = err;
      return NAPI_PENDING_EXCEPTION;
    }
  },
  napi_get_cb_info(env_id, cbinfo, argc, argv, thisArg, data) {
    let env = environments[env_id];
    let info = env.get(cbinfo);
    env.setPointer(argc, info.args.length);
    for (let i = 0; i < info.args.length; i++) {
      env.createValue(info.args[i], argv);
      argv += 4;
    }
    env.createValue(info.thisArg, thisArg);
    env.setPointer(data, info.data);
    return NAPI_OK;
  },
  napi_get_new_target(env_id, cbinfo, result) {
    let env = environments[env_id];
    let info = env.get(cbinfo);
    return env.createValue(info.newTarget, result);
  },
  napi_create_threadsafe_function(
    env_id,
    func,
    async_resource,
    async_resource_name,
    max_queue_size,
    initial_thread_count,
    thread_finalize_data,
    thread_finalize_cb,
    context,
    call_js_cb,
    result
  ) {
    let env = environments[env_id];
    let fn = func ? env.get(func) : undefined;
    let cb = call_js_cb ? env.table.get(call_js_cb) : undefined;
    let f = new ThreadSafeFunction(env, fn, cb, context);

    if (thread_finalize_cb) {
      let cb = env.table.get(thread_finalize_cb);
      finalizationRegistry.register(f, new FinalizeRecord(env_id, cb, 0, f.id));
    }

    env.setPointer(result, f.id);
    return NAPI_OK;
  },
  napi_ref_threadsafe_function() {
    return NAPI_OK;
  },
  napi_unref_threadsafe_function() {
    return NAPI_OK;
  },
  napi_acquire_threadsafe_function() {
    return NAPI_OK;
  },
  napi_release_threadsafe_function(func, mode) {
    threadsafeFunctions[func] = undefined;
    return NAPI_OK;
  },
  napi_call_threadsafe_function(func, data, is_blocking) {
    let f = threadsafeFunctions[func];
    f.env.pushScope();
    try {
      if (f.nativeFn) {
        let id = f.fn ? f.env.pushValue(f.fn) : 0;
        f.nativeFn(f.env.id, id, f.context, data);
      } else if (f.fn) {
        f.fn();
      }
    } finally {
      f.env.popScope();
    }
  },
  napi_get_threadsafe_function_context(func, result) {
    let f = threadsafeFunctions[func];
    f.env.setPointer(result, f.context);
    return NAPI_OK;
  },
  napi_create_async_work(env_id, async_resource, async_resource_name, execute, complete, data, result) {
    let env = environments[env_id];
    let executeFn = execute ? env.table.get(execute) : undefined;
    let completeFn = complete ? env.table.get(complete) : undefined;
    let w = new AsyncWork(env, executeFn, completeFn, data);
    env.setPointer(result, w.id);
    return NAPI_OK;
  },
  napi_delete_async_work(env, work) {
    asyncWork[work] = undefined;
    return NAPI_OK;
  },
  napi_queue_async_work(env, work) {
    queueMicrotask(() => {
      let w = asyncWork[work];
      if (w) {
        w.execute(env, w.data);
        w.complete(env, NAPI_OK, w.data);
      }
    });
    return NAPI_OK;
  },
  napi_cancel_async_work() {
    let w = asyncWork[work];
    w.complete(env, NAPI_CANCELED, w.data);
    asyncWork[work] = undefined;
    return NAPI_OK;
  },
  napi_throw(env_id, error) {
    let env = environments[env_id];
    env.pendingException = env.get(error);
    return NAPI_OK;
  },
  napi_throw_error(env_id, code, msg) {
    let env = environments[env_id];
    let err = new Error(env.getString(msg));
    err.code = code;
    env.pendingException = err;
    return NAPI_OK;
  },
  napi_throw_type_error(env_id, code, msg) {
    let env = environments[env_id];
    let err = new TypeError(env.getString(msg));
    err.code = code;
    env.pendingException = err;
    return NAPI_OK;
  },
  napi_throw_range_error(env_id, code, msg) {
    let env = environments[env_id];
    let err = new RangeError(env.getString(msg));
    err.code = code;
    env.pendingException = err;
    return NAPI_OK;
  },
  napi_create_error(env_id, code, msg, result) {
    let env = environments[env_id];
    let err = new Error(env.get(msg));
    err.code = env.get(code);
    return env.createValue(err, result);
  },
  napi_create_type_error(env_id, code, msg, result) {
    let env = environments[env_id];
    let err = new TypeError(env.get(msg));
    err.code = env.get(code);
    return env.createValue(err, result);
  },
  napi_create_range_error(env_id, code, msg, result) {
    let env = environments[env_id];
    let err = new RangeError(env.get(msg));
    err.code = env.get(code);
    return env.createValue(err, result);
  },
  napi_get_and_clear_last_exception(env_id, result) {
    let env = environments[env_id];
    let e = env.pendingException;
    env.pendingException = null;
    return env.createValue(e, result);
  },
  napi_is_exception_pending(env_id, result) {
    let env = environments[env_id];
    env.memory[result] = env.pendingException ? 1 : 0;
    return NAPI_OK;
  },
  napi_fatal_exception(env_id, err) {
    throw new Error('not implemented');
  },
  napi_fatal_error(location, location_len, message, message_len) {
    throw new Error('not implemented');
  },
  napi_get_global(env_id, result) {
    let env = environments[env_id];
    return env.setPointer(result, 2);
  },
  napi_create_buffer(env_id, length, data, result) {
    let env = environments[env_id];
    let ptr = env.instance.exports.napi_wasm_malloc(length);
    if (data) {
      env.setPointer(data, ptr);
    }

    // Return a view into WASM memory.
    let buf = typeof globalThis.Buffer !== 'undefined'
      ? globalThis.Buffer.from(env.memory.buffer, ptr, length)
      : env.memory.subarray(ptr, ptr + length);
    return env.createValue(buf, result);
  },
  napi_create_buffer_copy(env_id, length, data, result_data, result) {
    let env = environments[env_id];
    let ptr = env.instance.exports.napi_wasm_malloc(length);
    env.memory.set(env.memory.subarray(data, data + length), ptr);
    if (result_data) {
      env.setPointer(result_data, ptr);
    }

    // Return a view into WASM memory.
    let res = typeof globalThis.Buffer !== 'undefined'
      ? globalThis.Buffer.from(env.memory.buffer, ptr, length)
      : env.memory.subarray(ptr, ptr + length);
    return env.createValue(res, result);
  },
  napi_create_external_buffer(env_id, length, data, finalize_cb, finalize_hint, result) {
    let env = environments[env_id];
    let buf = typeof globalThis.Buffer !== 'undefined'
      ? globalThis.Buffer.from(env.memory.buffer, data, length)
      : env.memory.subarray(data, data + length);
    if (finalize_cb) {
      let cb = env.table.get(finalize_cb);
      finalizationRegistry.register(buf, new FinalizeRecord(env_id, cb, finalize_hint, data));
    }

    return env.createValue(buf, result);
  },
  napi_get_buffer_info(env_id, value, data, length) {
    let env = environments[env_id];
    let buf = env.get(value);
    let len = env.getBufferInfo(buf, data);
    return env.setPointer(length, len);
  },
  napi_create_arraybuffer(env_id, length, data, result) {
    let env = environments[env_id];
    let buf = new ArrayBuffer(length);
    if (data) {
      // This copies the ArrayBuffer into the WASM memory.
      env.getBufferInfo(buf, data);
    }
    return env.createValue(buf, result);
  },
  napi_create_external_arraybuffer(env_id, data, length, finalize_cb, finalize_hint, result) {
    // There is no way to actually create an external ArrayBuffer without copying.
    // You can only create typed arrays as subarrays, not ArrayBuffer.
    return NAPI_NO_EXTERNAL_BUFFERS_ALLOWED;
  },
  napi_get_arraybuffer_info(env_id, value, data, length) {
    let env = environments[env_id];
    let len = env.getBufferInfo(env.get(value), data);
    return env.setPointer(length, len);
  },
  napi_detach_arraybuffer(env_id, arraybuffer) {
    let env = environments[env_id];
    let buffer = env.get(arraybuffer);
    if (typeof structuredClone === 'function') {
      structuredClone(buffer, {transfer: [buffer]});
    }
    return NAPI_OK;
  },
  napi_is_detached_arraybuffer(env_id, arraybuffer, result) {
    let env = environments[env_id];
    let buffer = env.get(arraybuffer);
    env.memory[result] = buffer.byteLength === 0 ? 1 : 0; // ??
    return NAPI_OK;
  },
  napi_create_typedarray(env_id, type, length, arraybuffer, offset, result) {
    let env = environments[env_id];
    let Class = typedArrays[type];
    let buffer = env.get(arraybuffer);
    let buf = new Class(buffer, offset, length);
    return env.createValue(buf, result);
  },
  napi_create_dataview(env_id, byte_length, arraybuffer, byte_offset, result) {
    let env = environments[env_id];
    let buffer = env.get(arraybuffer);
    let view = new DataView(buffer, byte_offset, byte_length);
    return env.createValue(view, result);
  },
  napi_get_typedarray_info(env_id, typedarray, type, length, data, arraybuffer, byte_offset) {
    let env = environments[env_id];
    let val = env.get(typedarray);
    env.setPointer(type, typedArrays.indexOf(val.constructor));
    env.setPointer(length, val.length);
    env.getBufferInfo(val, data);
    env.createValue(val.buffer, arraybuffer);
    return env.setPointer(byte_offset, val.byteOffset);
  },
  napi_get_dataview_info(env_id, dataview, byte_length, data, arraybuffer, byte_offset) {
    let env = environments[env_id];
    let val = env.get(dataview);
    env.setPointer(byte_length, val.byteLength);
    env.getBufferInfo(val, data);
    env.createValue(val.buffer, arraybuffer);
    return env.setPointer(byte_offset, val.byteOffset);
  },
  napi_create_string_utf8(env_id, str, length, result) {
    let env = environments[env_id];
    let s = decoder.decode(env.memory.subarray(str, str + length));
    return env.createValue(s, result);
  },
  napi_get_value_string_utf8(env_id, value, buf, bufsize, result) {
    let env = environments[env_id];
    let val = env.get(value);
    if (buf == 0) {
      return env.setPointer(result, utf8Length(val));
    }
    let res = encoder.encodeInto(val, env.memory.subarray(buf, buf + bufsize - 1));
    env.memory[buf + res.written] = 0; // null terminate
    return env.setPointer(result, res.written);
  },
  napi_create_string_latin1(env_id, str, length, result) {
    let env = environments[env_id];
    let s = latin1Decoder.decode(env.memory.subarray(str, str + length));
    return env.createValue(s, result);
  },
  napi_get_value_string_latin1(env_id, value, buf, bufsize, result) {
    let env = environments[env_id];
    let val = env.get(value);
    if (buf == 0) {
      return env.setPointer(result, val.length);
    }
    let mem = env.memory;
    let len = Math.min(val.length, bufsize - 1);
    for (let i = 0; i < len; i++) {
      let code = val.charCodeAt(i);
      mem[buf++] = code;
    }
    mem[buf] = 0; // null terminate
    return env.setPointer(result, len);
  },
  napi_create_string_utf16(env_id, str, length, result) {
    let env = environments[env_id];
    let s = utf16Decoder.decode(env.memory.subarray(str, str + length * 2));
    return env.createValue(s, result);
  },
  napi_get_value_string_utf16(env_id, value, buf, bufsize, result) {
    let env = environments[env_id];
    let val = env.get(value);
    if (buf == 0) {
      return env.setPointer(result, val.length);
    }
    let mem = env.u16;
    let ptr = buf >> 1;
    let len = Math.min(val.length, bufsize - 1);
    for (let i = 0; i < len; i++) {
      let code = val.charCodeAt(i);
      mem[ptr++] = code;
    }
    mem[ptr] = 0; // null terminate
    return env.setPointer(result, len);
  },
  napi_create_date(env_id, time, result) {
    let env = environments[env_id];
    return env.createValue(new Date(time), result);
  },
  napi_get_date_value(env_id, value, result) {
    let env = environments[env_id];
    let date = env.get(value);
    env.f64[result >> 3] = date.valueOf();
  },
  napi_create_symbol(env_id, description, result) {
    let env = environments[env_id];
    let desc = env.get(description);
    return env.createValue(Symbol(desc), result);
  },
  napi_coerce_to_bool(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(Boolean(env.get(value)), result);
  },
  napi_coerce_to_number(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(Number(env.get(value)), result);
  },
  napi_coerce_to_object(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(Object(env.get(value)), result);
  },
  napi_coerce_to_string(env_id, value, result) {
    let env = environments[env_id];
    return env.createValue(String(env.get(value)), result);
  },
  napi_typeof(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    return env.setPointer(result, (() => {
      switch (typeof val) {
        case 'undefined':
          return 0;
        case 'boolean':
          return 2;
        case 'number':
          return 3;
        case 'string':
          return 4;
        case 'symbol':
          return 5;
        case 'object':
          if (val === null) {
            return 1;
          } else if (val instanceof ExternalValue) {
            return 8;
          }
          return 6;
        case 'function':
          return 7;
        case 'bigint':
          return 9;
      }
    })());
  },
  napi_instanceof(env_id, object, constructor, result) {
    let env = environments[env_id];
    let obj = env.get(object);
    let cons = env.get(constructor);
    env.memory[result] = obj instanceof cons ? 1 : 0;
    return NAPI_OK;
  },
  napi_is_array(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.memory[result] = Array.isArray(val) ? 1 : 0;
    return NAPI_OK;
  },
  napi_is_buffer(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.memory[result] = (typeof globalThis.Buffer !== 'undefined' ? globalThis.Buffer.isBuffer(val) : val instanceof Uint8Array) ? 1 : 0;
    return NAPI_OK;
  },
  napi_is_date(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.memory[result] = val instanceof Date ? 1 : 0;
    return NAPI_OK;
  },
  napi_is_error(env_id, value, result) {
    let env = environments[env_id];
    let err = env.get(value);
    env.memory[result] = err instanceof Error ? 1 : 0;
    return NAPI_OK;
  },
  napi_is_typedarray(env_id, value, result) {
    let env = environments[env_id];
    let buf = env.get(value);
    env.memory[result] = ArrayBuffer.isView(buf) && !(buf instanceof DataView) ? 1 : 0;
    return NAPI_OK;
  },
  napi_is_dataview(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.memory[result] = val instanceof DataView ? 1 : 0;
    return NAPI_OK;
  },
  napi_strict_equals(env_id, lhs, rhs, result) {
    let env = environments[env_id];
    env.memory[result] = env.get(lhs) === env.get(rhs) ? 1 : 0;
    return NAPI_OK;
  },
  napi_wrap(env_id, js_object, native_object, finalize_cb, finalize_hint, result) {
    let env = environments[env_id];
    let obj = env.get(js_object);
    env.wrappedObjects.set(obj, native_object);
    if (finalize_cb) {
      let cb = env.table.get(finalize_cb);
      finalizationRegistry.register(obj, new FinalizeRecord(env_id, cb, finalize_hint, native_object));
    }

    if (result) {
      return napi.napi_create_reference(env_id, js_object, 1, result);
    }

    return NAPI_OK;
  },
  napi_unwrap(env_id, js_object, result) {
    let env = environments[env_id];
    let obj = env.get(js_object);
    let native_object = env.wrappedObjects.get(obj);
    env.setPointer(result, native_object);
    return NAPI_OK;
  },
  napi_remove_wrap(env_id, js_object, result) {
    let env = environments[env_id];
    let obj = env.get(js_object);
    let native_object = env.wrappedObjects.get(obj);
    finalizationRegistry.unregister(obj);
    env.wrappedObjects.delete(obj);
    return env.setPointer(result, native_object);
  },
  napi_type_tag_object(env_id, js_object, type_tag) {
    throw new Error('not implemented');
  },
  napi_check_object_type_tag(env_id, js_object, type_tag) {
    throw new Error('not implemented');
  },
  napi_add_finalizer(env_id, js_object, native_object, finalize_cb, finalize_hint, result) {
    let env = environments[env_id];
    let obj = env.get(js_object);
    let cb = env.table.get(finalize_cb);
    finalizationRegistry.register(obj, new FinalizeRecord(env_id, cb, finalize_hint, native_object));
    if (result) {
      return napi.napi_create_reference(env_id, js_object, 1, result);
    }

    return NAPI_OK;
  },
  napi_create_promise(env_id, deferred, promise) {
    let env = environments[env_id];
    let p = new Promise((resolve, reject) => {
      let id = env.deferred.length;
      env.deferred.push({resolve, reject});
      env.setPointer(deferred, id);
    });
    return env.createValue(p, promise);
  },
  napi_resolve_deferred(env_id, deferred, resolution) {
    let env = environments[env_id];
    let { resolve } = env.deferred[deferred];
    let value = env.get(resolution);
    resolve(value);
    env.deferred[deferred] = undefined;
    return NAPI_OK;
  },
  napi_reject_deferred(env_id, deferred, rejection) {
    let env = environments[env_id];
    let { reject } = env.deferred[deferred];
    let value = env.get(rejection);
    reject(value);
    env.deferred[deferred] = undefined;
    return NAPI_OK;
  },
  napi_is_promise(env_id, value, result) {
    let env = environments[env_id];
    let val = env.get(value);
    env.memory[result] = val instanceof Promise ? 1 : 0;
    return NAPI_OK;
  },
  napi_run_script(env_id, script, result) {
    let env = environments[env_id];
    let source = env.get(script);
    let res = (0, eval)(source);
    return env.createValue(res, result);
  },
  napi_create_external(env_id, data, finalize_cb, finalize_hint, result) {
    let env = environments[env_id];
    let external = new ExternalValue;
    env.externalObjects.set(external, data);
    if (finalize_cb) {
      let cb = env.table.get(finalize_cb);
      finalizationRegistry.register(external, new FinalizeRecord(env_id, cb, finalize_hint, data));
    }
    return env.createValue(external, result);
  },
  napi_get_value_external(env_id, value, result) {
    let env = environments[env_id];
    let external = env.get(value);
    let val = env.externalObjects.get(external);
    return env.setPointer(result, val);
  },
  napi_adjust_external_memory() {
    return NAPI_OK;
  }
};

function strlen(buf, ptr) {
  let len = 0;
  while (buf[ptr] !== 0) {
    len++;
    ptr++;
  }

  return len;
}

function utf8Length(string) {
  let len = 0;
  for (let i = 0; i < string.length; i++) {
    let c = string.charCodeAt(i);

    if (c >= 0xd800 && c <= 0xdbff && i < string.length - 1) {
      let c2 = string.charCodeAt(++i);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = ((c & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
      } else {
        // unmatched surrogate.
        i--;
      }
    }

    if ((c & 0xffffff80) === 0) {
      len++;
    } else if ((c & 0xfffff800) === 0) {
      len += 2;
    } else if ((c & 0xffff0000) === 0) {
      len += 3;
    } else if ((c & 0xffe00000) === 0) {
      len += 4;
    }
  }
  return len;
}

// EXTERNAL MODULE: external "fs"
var external_fs_ = __webpack_require__(7147);
// EXTERNAL MODULE: external "path"
var external_path_ = __webpack_require__(1017);
// EXTERNAL MODULE: ./node_modules/micromatch/index.js
var micromatch = __webpack_require__(6228);
// EXTERNAL MODULE: ./node_modules/is-glob/index.js
var is_glob = __webpack_require__(4466);
// EXTERNAL MODULE: ./node_modules/@parcel/watcher-wasm/wrapper.js
var wrapper = __webpack_require__(3233);
;// CONCATENATED MODULE: ./node_modules/@parcel/watcher-wasm/index.mjs







let watcher_wasm_wrapper, watcher_wasm_env;
let watcher_wasm_encoder = new TextEncoder;

let constants = {
  O_ACCMODE: 0o00000003,
  O_RDONLY: 0,
  O_WRONLY: 0o00000001,
  O_RDWR: 0o00000002,
  O_CREAT: 0o00000100,
  O_EXCL: 0o00000200,
  O_NOCTTY: 0o00000400,
  O_TRUNC: 0o00001000,
  O_APPEND: 0o00002000,
  O_NONBLOCK: 0o00004000,
  O_SYNC: 0o00010000,
  FASYNC: 0o00020000,
  O_DIRECT: 0o00040000,
  O_LARGEFILE: 0o00100000,
  O_DIRECTORY: 0o00200000,
  O_NOFOLLOW: 0o00400000,
  O_NOATIME: 0o01000000,
  O_CLOEXEC: 0o02000000
};

napi.napi_get_last_error_info = () => {};

const fds = new Map();
const dirs = new Map();
const regexCache = new Map();
const watches = [null];

const wasm_env = {
  __syscall_newfstatat(dirfd, path, buf, flags) {
    let dir = dirfd === -100 ? process.cwd() : fds.get(dirfd).path;
    let p = external_path_.resolve(dir, watcher_wasm_env.getString(path));
    let nofollow = flags & 256;
    try {
      let stat = nofollow ? external_fs_.lstatSync(p, {bigint: true}) : external_fs_.statSync(p, {bigint: true});
      return writeStat(stat, buf);
    } catch (err) {
      watcher_wasm_env.i32[watcher_wasm_env.instance.exports.__errno_location >> 2] = err.errno;
      return -1;
    }
  },
  __syscall_lstat64(path, buf) {
    let p = watcher_wasm_env.getString(path);
    try {
      let stat = external_fs_.lstatSync(p, {bigint: true});
      return writeStat(stat, buf);
    } catch (err) {
      watcher_wasm_env.i32[watcher_wasm_env.instance.exports.__errno_location >> 2] = err.errno;
      return -1;
    }
  },
  __syscall_fstat64(fd, buf) {
    try {
      let stat = external_fs_.fstatSync(fd, {bigint: true});
      return writeStat(stat, buf);
    } catch (err) {
      watcher_wasm_env.i32[watcher_wasm_env.instance.exports.__errno_location >> 2] = err.errno;
      return -1;
    }
  },
  __syscall_stat64(path, buf) {
    let p = watcher_wasm_env.getString(path);
    try {
      let stat = external_fs_.statSync(p, {bigint: true});
      return writeStat(stat, buf);
    } catch (err) {
      watcher_wasm_env.i32[watcher_wasm_env.instance.exports.__errno_location >> 2] = err.errno;
      return -1;
    }
  },
  __syscall_getdents64(fd, dirp, count) {
    let p = fds.get(fd).path;
    let dir = dirs.get(fd);
    let entries = dir?.entries;
    if (!entries) {
      try {
        entries = external_fs_.readdirSync(p, {withFileTypes: true});
      } catch (err) {
        watcher_wasm_env.i32[watcher_wasm_env.instance.exports.__errno_location >> 2] = err.errno;
        return -1;
      }
    }

    let start = dirp;
    let i = dir?.index || 0;
    for (; i < entries.length; i++) {
      let entry = entries[i];
      let type = entry.isFIFO() ? 1
        : entry.isCharacterDevice() ? 2
        : entry.isDirectory() ? 4
        : entry.isBlockDevice() ? 6
        : entry.isFile() ? 8
        : entry.isSymbolicLink() ? 10
        : entry.isSocket() ? 12
        : 0;
      let len = align(watcher_wasm_utf8Length(entry.name) + 20, 8);
      if ((dirp - start + len) > count) {
        break;
      }

      // Write a linux_dirent64 struct into wasm memory.
      watcher_wasm_env.u64[dirp >> 3] = 1n; // ino
      watcher_wasm_env.u64[(dirp + 8) >> 3] = BigInt((dirp - start) + len); // offset
      watcher_wasm_env.u16[(dirp + 16) >> 1] = len;
      watcher_wasm_env.memory[dirp + 18] = type;
      let {written} = watcher_wasm_encoder.encodeInto(entry.name, watcher_wasm_env.memory.subarray(dirp + 19));
      watcher_wasm_env.memory[dirp + 19 + written] = 0; // null terminate
      dirp += len;
    }

    dirs.set(fd, {index: i, entries});
    return dirp - start;
  },
  __syscall_openat(dirfd, path, flags, mode) {
    // Convert flags to Node values.
    let f = 0;
    for (let c in constants) {
      if (flags & constants[c]) {
        f |= external_fs_.constants[c] || 0;
      }
    }
    let dir = dirfd === -100 ? process.cwd() : fds.get(dirfd)?.path;
    if (!dir) {
      watcher_wasm_env.i32[watcher_wasm_env.instance.exports.__errno_location >> 2] = 9970; // ENOTDIR
      return -1;
    }
    let p = external_path_.resolve(dir, watcher_wasm_env.getString(path));
    try {
      let fd = external_fs_.openSync(p, f);
      fds.set(fd, {path: p, flags});
      return fd;
    } catch (err) {
      watcher_wasm_env.i32[watcher_wasm_env.instance.exports.__errno_location >> 2] = err.errno;
      return -1;
    }
  },
  __syscall_fcntl64(fd, cmd) {
    switch (cmd) {
      case 3:
        return fds.get(fd).flags;
      case 2:
        return 0;
      default:
        throw new Error('Unknown fcntl64 call: ' + cmd);
    }
  },
  __syscall_ioctl() {},
  emscripten_resize_heap() {
    return 0;
  },
  abort() {},
  wasm_backend_add_watch(filename, backend) {
    let path = watcher_wasm_env.getString(filename);
    let watch = external_fs_.watch(path, {encoding: 'buffer'}, (eventType, filename) => {
      if (filename) {
        let type = eventType === 'change' ? 1 : 2;
        let fptr = watcher_wasm_env.instance.exports.malloc(filename.byteLength + 1);
        watcher_wasm_env.memory.set(filename, fptr);
        watcher_wasm_env.memory[fptr + filename.byteLength] = 0;
        watcher_wasm_env.instance.exports.wasm_backend_event_handler(backend, wd, type, fptr);
        watcher_wasm_env.instance.exports.free(fptr);
      }
    });

    let wd = watches.length;
    watches.push(watch);
    return wd;
  },
  wasm_backend_remove_watch(wd) {
    watches[wd].close();
    watches[wd] = undefined;
  },
  set_timeout(ms, ctx) {
    return setTimeout(() => {
      watcher_wasm_env.instance.exports.on_timeout(ctx);
    }, ms);
  },
  clear_timeout(t) {
    clearTimeout(t);
  },
  emscripten_date_now() {
    return Date.now();
  },
  _emscripten_get_now_is_monotonic() {
    return true;
  },
  emscripten_get_now() {
    return performance.now();
  },
  wasm_regex_match(string, regex) {
    let re = regexCache.get(regex);
    if (!re) {
      re = new RegExp(watcher_wasm_env.getString(regex));
      regexCache.set(regex, re);
    }
    return re.test(watcher_wasm_env.getString(string)) ? 1 : 0;
  }
};

const wasi = {
  fd_close(fd) {
    external_fs_.closeSync(fd);
    fds.delete(fd);
    dirs.delete(fd);
    return 0;
  },
  fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    return 0;
  },
  fd_write(fd, iov, iovcnt, pnum) {
    let buffers = [];
    for (let i = 0; i < iovcnt; i++) {
      let ptr = watcher_wasm_env.u32[iov >> 2];
      let len = watcher_wasm_env.u32[(iov + 4) >> 2];
      iov += 8;
      if (len > 0) {
        buffers.push(watcher_wasm_env.memory.subarray(ptr, ptr + len));
      }
    }
    let wrote = external_fs_.writevSync(fd, buffers);
    watcher_wasm_env.u32[pnum >> 2] = wrote;
    return 0;
  },
  fd_read(fd, iov, iovcnt, pnum) {
    let buffers = [];
    for (let i = 0; i < iovcnt; i++) {
      let ptr = watcher_wasm_env.u32[iov >> 2];
      let len = watcher_wasm_env.u32[(iov + 4) >> 2];
      iov += 8;
      if (len > 0) {
        buffers.push(watcher_wasm_env.memory.subarray(ptr, ptr + len));
      }
    }

    let read = external_fs_.readvSync(fd, buffers);
    watcher_wasm_env.u32[pnum >> 2] = read;
    return 0;
  }
};

function writeStat(stat, buf) {
  watcher_wasm_env.i32[buf >> 2] = Number(stat.dev);
  watcher_wasm_env.i32[(buf + 4) >> 2] = Number(stat.mode);
  watcher_wasm_env.u32[(buf + 8) >> 2] = Number(stat.nlink);
  watcher_wasm_env.i32[(buf + 12) >> 2] = Number(stat.uid);
  watcher_wasm_env.i32[(buf + 16) >> 2] = Number(stat.gid);
  watcher_wasm_env.i32[(buf + 20) >> 2] = Number(stat.rdev);
  watcher_wasm_env.u64[(buf + 24) >> 3] = stat.size;
  watcher_wasm_env.i32[(buf + 32) >> 2] = Number(stat.blksize);
  watcher_wasm_env.i32[(buf + 36) >> 2] = Number(stat.blocks);
  watcher_wasm_env.u64[(buf + 40) >> 3] = stat.atimeMs;
  watcher_wasm_env.u32[(buf + 48) >> 2] = Number(stat.atimeNs);
  watcher_wasm_env.u64[(buf + 56) >> 3] = stat.mtimeMs;
  watcher_wasm_env.u32[(buf + 64) >> 2] = Number(stat.mtimeNs);
  watcher_wasm_env.u64[(buf + 72) >> 3] = stat.ctimeMs;
  watcher_wasm_env.u32[(buf + 80) >> 2] = Number(stat.ctimeNs);
  watcher_wasm_env.u64[(buf + 88) >> 3] = stat.ino;
  return 0;
}

function watcher_wasm_utf8Length(string) {
  let len = 0;
  for (let i = 0; i < string.length; i++) {
    let c = string.charCodeAt(i);

    if (c >= 0xd800 && c <= 0xdbff && i < string.length - 1) {
      let c2 = string.charCodeAt(++i);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = ((c & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
      } else {
        // unmatched surrogate.
        i--;
      }
    }

    if ((c & 0xffffff80) === 0) {
      len++;
    } else if ((c & 0xfffff800) === 0) {
      len += 2;
    } else if ((c & 0xffff0000) === 0) {
      len += 3;
    } else if ((c & 0xffe00000) === 0) {
      len += 4;
    }
  }
  return len;
}

function align(len, p) {
  return Math.ceil(len / p) * p;
}

async function init(input) {
  input = input ?? __webpack_require__.ab + "watcher.wasm";
  if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
    input = fetchOrReadFromFs(input);
  }

  const { instance } = await load(await input, {
    napi: napi,
    env: wasm_env,
    wasi_snapshot_preview1: wasi
  });

  watcher_wasm_env = new Environment(instance);
  watcher_wasm_wrapper = (0,wrapper/* createWrapper */.K)(watcher_wasm_env.exports);
}

async function load(module, imports) {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        return await WebAssembly.instantiateStreaming(module, imports);
      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    return await WebAssembly.instantiate(bytes, imports);
  } else {
    const instance = await WebAssembly.instantiate(module, imports);
    if (instance instanceof WebAssembly.Instance) {
      return { instance, module };
    } else {
      return instance;
    }
  }
}

async function fetchOrReadFromFs(inputPath) {
  try {
    const fs = await Promise.resolve(/* import() */).then(__webpack_require__.t.bind(__webpack_require__, 7147, 19));
    return fs.readFileSync(inputPath);
  } catch {
    return fetch(inputPath);
  }
}

function writeSnapshot(dir, snapshot, opts) {
  return watcher_wasm_wrapper.writeSnapshot(dir, snapshot, opts);
}

function getEventsSince(dir, snapshot, opts) {
  return watcher_wasm_wrapper.getEventsSince(dir, snapshot, opts);
}

function subscribe(dir, fn, opts) {
  return watcher_wasm_wrapper.subscribe(dir, fn, opts);
}

function unsubscribe(dir, fn, opts) {
  return watcher_wasm_wrapper.unsubscribe(dir, fn, opts);
}


/***/ })

};

//# sourceMappingURL=451.index.js.map