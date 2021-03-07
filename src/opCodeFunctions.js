const PROTOCOL_VERSION = hex("FFFFFFFF");

const opCodeFunctions = {
  // Constants
  0: { name: "OP_0", eval: (ctx) => ctx.stack.push(hex("00")) },
  79: { name: "OP_1NEGATE", eval: (ctx) => ctx.stack.push(hex("81")) }, // TODO: Figure out how to write hex -1
  81: { name: "OP_1", eval: (ctx) => ctx.stack.push(hex("01")) },
  82: { name: "OP_2", eval: (ctx) => ctx.stack.push(hex("02")) },
  83: { name: "OP_3", eval: (ctx) => ctx.stack.push(hex("03")) },
  84: { name: "OP_4", eval: (ctx) => ctx.stack.push(hex("04")) },
  85: { name: "OP_5", eval: (ctx) => ctx.stack.push(hex("05")) },
  86: { name: "OP_6", eval: (ctx) => ctx.stack.push(hex("06")) },
  87: { name: "OP_7", eval: (ctx) => ctx.stack.push(hex("07")) },
  88: { name: "OP_8", eval: (ctx) => ctx.stack.push(hex("08")) },
  89: { name: "OP_9", eval: (ctx) => ctx.stack.push(hex("09")) },
  90: { name: "OP_10", eval: (ctx) => ctx.stack.push(hex("0A")) },
  91: { name: "OP_11", eval: (ctx) => ctx.stack.push(hex("0B")) },
  92: { name: "OP_12", eval: (ctx) => ctx.stack.push(hex("0C")) },
  93: { name: "OP_13", eval: (ctx) => ctx.stack.push(hex("0D")) },
  94: { name: "OP_14", eval: (ctx) => ctx.stack.push(hex("0E")) },
  95: { name: "OP_15", eval: (ctx) => ctx.stack.push(hex("0F")) },
  96: { name: "OP_16", eval: (ctx) => ctx.stack.push(hex("10")) },

  // Flow control
  97: { name: "OP_NOP", eval: (ctx) => {} },
  98: {
    name: "OP_VER",
    eval: (ctx) => disabled(ctx, 98),
    forceEval: (ctx) => ctx.stack.push(PROTOCOL_VERSION),
  },
  99: {
    name: "OP_IF",
    eval: (ctx) => {
      if (!eq(hex("00"), pop(ctx.stack))) {
        enterBlock(ctx, 99, undefined, 104);
      } else enterBlock(ctx, 99, 103, 104);
    },
  },
  100: {
    name: "OP_NOTIF",
    eval: (ctx) => {
      if (eq(hex("00"), pop(ctx.stack))) {
        enterBlock(ctx, 100, undefined, 104);
      } else enterBlock(ctx, 100, 103, 104);
    },
  },
  101: {
    name: "OP_VERIF",
    eval: (ctx) => disabled(ctx, 101),
    forceEval: (ctx) => {
      if (eq(PROTOCOL_VERSION, pop(ctx.stack)))
        enterBlock(ctx, 101, undefined, 104);
      else enterBlock(ctx, 101, 103, 104);
    },
  },
  102: {
    name: "OP_VERNOTIF",
    eval: (ctx) => disabled(ctx, 102),
    forceEval: (ctx) => {
      if (!eq(PROTOCOL_VERSION, pop(ctx.stack)))
        enterBlock(ctx, 102, undefined, 104);
      else enterBlock(ctx, 102, 103, 104);
    },
  },
  103: {
    name: "OP_ELSE ",
    eval: (ctx) => {
      if (checkReachedSkipUntil(ctx, 103)) stopSkippingInThisBlock(ctx);
      else skipThisBlockUntil(ctx, 104);
    },
  },
  104: { name: "OP_ENDIF", eval: (ctx) => exitBlock(ctx) },
  105: {
    name: "OP_VERIFY",
    eval: (ctx) => {
      if (eq(hex("00"), pop(ctx.stack))) endScript(ctx, "invalid");
    },
  },
  106: { name: "OP_RETURN", eval: (ctx) => endScript(ctx, "return") },

  // Stack
  107: {
    name: "OP_TOALTSTACK",
    eval: (ctx) => ctx.altStack.push(pop(ctx.stack)),
  },
  108: {
    name: "OP_FROMALTSTACK",
    eval: (ctx) => ctx.stack.push(pop(ctx.altStack)),
  },
  109: {
    name: "OP_2DROP",
    eval: (ctx) => {
      pop(ctx.stack);
      pop(ctx.stack);
    },
  },
  110: {
    name: "OP_2DUP",
    eval: (ctx) =>
      ctx.stack.push(reverseIndex(ctx.stack, 1), reverseIndex(ctx.stack, 0)),
  },
  111: {
    name: "OP_3DUP",
    eval: (ctx) =>
      ctx.stack.push(
        reverseIndex(ctx.stack, 2),
        reverseIndex(ctx.stack, 1),
        reverseIndex(ctx.stack, 0)
      ),
  },
  112: {
    name: "OP_2OVER",
    eval: (ctx) =>
      ctx.stack.push(reverseIndex(ctx.stack, 3), reverseIndex(ctx.stack, 2)),
  },
  113: {
    name: "OP_2ROT",
    eval: (ctx) => {
      ctx.stack.push(pullOutReverseIndex(ctx.stack, 5)); // 6th on top
      ctx.stack.push(pullOutReverseIndex(ctx.stack, 5)); // 5th on top of 6th
    },
  },
  114: {
    name: "OP_2SWAP",
    eval: (ctx) => {
      ctx.stack.push(pullOutReverseIndex(ctx.stack, 3)); // 4th on top
      ctx.stack.push(pullOutReverseIndex(ctx.stack, 3)); // 3th on top of 4th
    },
  },
  115: {
    name: "OP_IFDUP",
    eval: (ctx) => {
      const val = last(ctx.stack);
      if (!eq(hex("00"), val)) ctx.stack.push(val);
    },
  },
  116: {
    name: "OP_DEPTH",
    eval: (ctx) => ctx.stack.push(hex(ctx.stack.length.toString(16))),
  },
  117: { name: "OP_DROP", eval: (ctx) => pop(ctx.stack) },
  118: { name: "OP_DUP", eval: (ctx) => ctx.stack.push(last(ctx.stack)) },
  119: { name: "OP_NIP", eval: (ctx) => pullOutReverseIndex(ctx.stack, 1) },
  120: {
    name: "OP_OVER",
    eval: (ctx) => ctx.stack.push(reverseIndex(ctx.stack, 1)),
  },
  121: {
    name: "OP_PICK",
    eval: (ctx) => ctx.stack.push(reverseIndex(ctx.stack, num(pop(ctx.stack)))),
  },
  122: {
    name: "OP_ROLL",
    eval: (ctx) =>
      ctx.stack.push(pullOutReverseIndex(ctx.stack, num(pop(ctx.stack)))),
  },
  123: {
    name: "OP_ROT",
    eval: (ctx) => ctx.stack.push(pullOutReverseIndex(ctx.stack, 2)),
  },
  124: {
    name: "OP_SWAP",
    eval: (ctx) => ctx.stack.push(pullOutReverseIndex(ctx.stack, 1)),
  },
  125: {
    name: "OP_TUCK",
    eval: (ctx) => {
      const top = pop(ctx.stack);
      const top2 = pop(ctx.stack);
      ctx.stack.push(top, top2, top);
    },
  },

  // Data Manipulation
  126: {
    name: "OP_CAT",
    eval: (ctx) => {
      const top = pop(ctx.stack);
      const top2 = pop(ctx.stack);
      ctx.stack.push(Buffer.concat([top2, top]));
    },
  },
  127: {
    name: "OP_SPLIT",
    eval: (ctx) => {
      const splitAt = num(pop(ctx.stack));
      const valToSplit = pop(ctx.stack);
      ctx.stack.push(valToSplit.slice(0, splitAt), valToSplit(splitAt));
    },
  },
  128: {
    name: "OP_NUM2BIN",
    eval: (ctx) => {
      const length = num(pop(ctx.stack));
      const val = cloneBuf(pop(ctx.stack));
      // TODO: convert to Byte sequence
      throw new Error("NOT IMPLEMENTED!");
    },
  },
  129: {
    name: "OP_BIN2NUM",
    eval: (ctx) => {
      const val = cloneBuf(pop(ctx.stack));
      // TODO: convert to numeric value
      throw new Error("NOT IMPLEMENTED!");
    },
  },
  130: {
    name: "OP_SIZE",
    eval: (ctx) => ctx.stack.push(hex(last(ctx.stack).length.toString(16))),
  },

  // Bitwise logic
  131: {
    name: "OP_INVERT",
    eval: (ctx) => {
      const toInvert = pop(ctx.stack);
      const invertedCopy = cloneBuf(toInvert);
      for (let i = 0; i < invertedCopy.length; i++) {
        invertedCopy[i] = 254 - invertedCopy[i];
      }
      ctx.stack.push(invertedCopy);
    },
  },
  132: {
    name: "OP_AND",
    eval: (ctx) => {
      // TODO: Implement
      throw new Error("NOT IMPLEMENTED!");
    },
  },
  133: {
    name: "OP_OR",
    eval: (ctx) => {
      // TODO: Implement
      throw new Error("NOT IMPLEMENTED!");
    },
  },
  134: {
    name: "OP_XOR",
    eval: (ctx) => {
      // TODO: Implement
      throw new Error("NOT IMPLEMENTED!");
    },
  },
  135: {
    name: "OP_EQUAL",
    eval: (ctx) => {
      if (!eq(pop(ctx.stack), pop(ctx.stack))) {
        ctx.stack.push(hex("00"));
      } else {
        ctx.stack.push(hex("01"));
      }
    },
  },
  136: {
    name: "OP_EQUALVERIFY",
    eval: (ctx) => {
      if (!eq(pop(ctx.stack), pop(ctx.stack))) {
        endScript(ctx, "invalid");
      }
    },
  },

  // Arithmetic
  139: {
    name: "OP_1ADD",
    eval: (ctx) => {
      const n = bufToBn(pop(ctx.stack)).add(1);
      ctx.stack.push(bnToBuf(n));
    },
  },
  140: {
    name: "OP_1SUB",
    eval: (ctx) => {
      const n = bufToBn(pop(ctx.stack)).add(-1);
      ctx.stack.push(bnToBuf(n));
    },
  },
  141: {
    name: "OP_2MUL",
    eval: (ctx) => disabled(ctx, 141),
    forceEval: (ctx) => {
      const n = bufToBn(pop(ctx.stack)).mul(2);
      ctx.stack.push(bnToBuf(n));
    },
  },
  142: {
    name: "OP_2DIV",
    eval: (ctx) => disabled(ctx, 142),
    forceEval: (ctx) => {
      const n = bufToBn(pop(ctx.stack)).div(2);
      ctx.stack.push(bnToBuf(n));
    },
  },
  143: {
    name: "OP_NEGATE",
    eval: (ctx) => {
      const n = bufToBn(pop(ctx.stack));
      n.negative = n.negative === 0 ? 1 : 0;
      ctx.stack.push(bnToBuf(n));
    },
  },
  144: {
    name: "OP_ABS",
    eval: (ctx) => {
      const n = bufToBn(pop(ctx.stack));
      n.negative = 0;
      ctx.stack.push(bnToBuf(n));
    },
  },
  145: {
    name: "OP_NOT",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      let res = null;
      if (val.length > 1) res = hex("00");
      else if (val[0] === 0) res = hex("01");
      else res = hex("00");
      ctx.stack.push(res);
    },
  },
  146: {
    name: "OP_0NOTEQUAL",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      let res = null;
      if (val.length > 1) res = hex("01");
      else if (val[0] === 0) res = hex("00");
      else res = hex("01");
      ctx.stack.push(res);
    },
  },
  147: {
    name: "OP_",
    eval: (ctx) => {
      const nTop = bufToBn(pop(ctx.stack));
      const nTop2 = bufToBn(pop(ctx.stack));
      const n = nTop2.add(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  148: {
    name: "OP_SUB",
    eval: (ctx) => {
      const nTop = bufToBn(pop(ctx.stack));
      const nTop2 = bufToBn(pop(ctx.stack));
      const n = nTop2.sub(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  149: {
    name: "OP_MUL",
    eval: (ctx) => {
      const nTop = bufToBn(pop(ctx.stack));
      const nTop2 = bufToBn(pop(ctx.stack));
      const n = nTop2.mul(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  150: {
    name: "OP_DIV",
    eval: (ctx) => {
      const nTop = bufToBn(pop(ctx.stack));
      const nTop2 = bufToBn(pop(ctx.stack));
      const n = nTop2.div(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  151: {
    name: "OP_MOD",
    eval: (ctx) => {
      const nTop = bufToBn(pop(ctx.stack));
      const nTop2 = bufToBn(pop(ctx.stack));
      const n = nTop2.div(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  152: {
    name: "OP_LSHIFT",
    eval: (ctx) => {
      // TODO: Implement shifting
      throw new Error("NOT IMPLEMENTED!");
    },
  },
  153: {
    name: "OP_RSHIFT",
    eval: (ctx) => {
      // TODO: Implement shifting
      throw new Error("NOT IMPLEMENTED!");
    },
  },
  154: { name: "OP_", eval: (ctx) => {} },
  155: { name: "OP_", eval: (ctx) => {} },
  156: { name: "OP_", eval: (ctx) => {} },
  157: { name: "OP_", eval: (ctx) => {} },
  158: { name: "OP_", eval: (ctx) => {} },
  159: { name: "OP_", eval: (ctx) => {} },
  160: { name: "OP_", eval: (ctx) => {} },
  161: { name: "OP_", eval: (ctx) => {} },
  162: { name: "OP_", eval: (ctx) => {} },
  163: { name: "OP_", eval: (ctx) => {} },
  164: { name: "OP_", eval: (ctx) => {} },
  165: { name: "OP_", eval: (ctx) => {} },
  166: { name: "OP_", eval: (ctx) => {} },
  167: { name: "OP_", eval: (ctx) => {} },
  168: { name: "OP_", eval: (ctx) => {} },
  169: { name: "OP_", eval: (ctx) => {} },
  170: { name: "OP_", eval: (ctx) => {} },
  171: { name: "OP_", eval: (ctx) => {} },
  172: { name: "OP_", eval: (ctx) => {} },
  173: { name: "OP_", eval: (ctx) => {} },
  174: { name: "OP_", eval: (ctx) => {} },
  175: { name: "OP_", eval: (ctx) => {} },
  176: { name: "OP_", eval: (ctx) => {} },
  177: { name: "OP_", eval: (ctx) => {} },
  178: { name: "OP_", eval: (ctx) => {} },
};

function hex(str) {
  return Buffer.from(str, "hex");
}

function bufToBn(buf) {
  const buf = cloneBuf(hexBuf).reverse();
  const isNegative = buf[0] > 128 || (buf[0] === 128 && buf.length > 1);
  if (isNegative) buf[0] -= 128;
  const int = new bsv.Bn((isNegative ? "-" : "") + buf.toString("hex"), 16);
  return int;
}

function bnToBuf(n) {
  const arr = n.toArray();
  const buf = Buffer.from(arr);

  if (n.negative) {
    // if first bit is 1
    if (buf[0] >= 128) {
      buf = Buffer.concat([128], buf); // then add another byte with a first bit
    } else {
      buf[0] += 128; // else set first bit to 1
    }
  } else {
    // if first bit is 1
    if (buf[0] >= 128) {
      buf = Buffer.concat([0], buf); // then add a 0 byte
    }
  }

  return buf.reverse(); // to Little Endian
}

function num(buf) {
  const n = bufToBn(buf);
  if (n.words.length > 1)
    throw new Error("Value too big - cannot parse to Int");
  return n.negative ? -n.words[0] : n.words[0];
}

function last(arr) {
  if (!arr.length) throw new Error("Can't get last item of empty array");
  return arr[arr.length - 1];
}

function pop(arr) {
  if (!arr.length) throw new Error("Can't get last item of empty array");
  return arr.pop();
}

function reverseIndex(arr, i) {
  if (!arr.length) throw new Error("Can't get reverse index in empty array");
  if (i > arr.length - 1) throw new RangeError("Index out of bounds : " + i);
  return arr[arr.length - i - 1];
}

function pullOutReverseIndex(arr, i) {
  if (!arr.length) throw new Error("Can't get reverse index in empty array");
  if (i > arr.length - 1) throw new RangeError("Index out of bounds : " + i);
  return arr.splice(arr.length - i - 1, 1);
}

function eq(buf1, buf2) {
  if (buf1.length !== buf2.length) return false;
  for (let i = 0; i < buf1.length; i++) {
    if (buf1[i] !== buf2[i]) return false;
  }
  return true;
}

function cloneBuf(buf) {
  const clone = Buffer.alloc(buf.length);
  buf.copy(clone);
  return clone;
}

function disabled(ctx, code) {
  if (ctx.failOnDisabled === true)
    throw new Error(
      "A disabled opcode was used: " + opCodeFunctions[code].name
    );
  else return opCodeFunctions[code].forceEval(ctx);
}

function enterBlock(ctx, code, skipUntilCode, endsWith) {
  ctx.blocks = ctx.blocks || [];

  if (skipUntilCode)
    if (skipUntilCode !== endsWith) ctx.skipUntil = [skipUntilCode, endsWith];
    else ctx.skipUntil = [skipUntilCode];

  ctx.blocks.push({
    name: opCodeFunctions[code].name,
    skipUntil: ctx.skipUntil,
    code: code,
  });
}

function exitBlock(ctx) {
  const block = ctx.blocks.pop();
  if (!ctx.blocks.length) ctx.skipUntil = undefined;
  else {
    const block = last(ctx.blocks);
    ctx.skipUntil = block.skipUntil;
  }
}

function checkReachedSkipUntil(ctx, skipUntilCode) {
  if (!ctx.blocks.length) throw new Error("No active block");
  const block = last(ctx.blocks);
  if (!block.skipUntil || !block.skipUntil.length) return false;
  return block.skipUntil.includes(skipUntilCode);
}

function stopSkippingInThisBlock(ctx) {
  if (!ctx.blocks.length) throw new Error("No active block");
  const block = last(ctx.blocks);
  block.skipUntil = undefined;
  ctx.skipUntil = block.skipUntil;
}
function skipThisBlockUntil(ctx, skipUntilCode) {
  if (!ctx.blocks.length) throw new Error("No active block");
  const block = last(ctx.blocks);
  block.skipUntil = [skipUntilCode];
  ctx.skipUntil = block.skipUntil;
}

function endScript(ctx, reason) {
  ctx.ended = true;
  ctx.endReason = reason;
}

module.exports = opCodeFunctions;