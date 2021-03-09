const bsv = require("bsv");

const opCodeFunctions = {
  // Constants
  0: { name: "OP_0", eval: (ctx) => ctx.stack.push(hex("00")) },
  79: { name: "OP_1NEGATE", eval: (ctx) => ctx.stack.push(hex("81")) },
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
    forceEval: (ctx) => ctx.stack.push(getProtocolVersion(ctx)),
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
      if (eq(getProtocolVersion(ctx), pop(ctx.stack)))
        enterBlock(ctx, 101, undefined, 104);
      else enterBlock(ctx, 101, 103, 104);
    },
  },
  102: {
    name: "OP_VERNOTIF",
    eval: (ctx) => disabled(ctx, 102),
    forceEval: (ctx) => {
      if (!eq(getProtocolVersion(ctx), pop(ctx.stack)))
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
      if (eq(hex("00"), pop(ctx.stack))) throw new Error("Verification failed");
    },
  },
  106: {
    name: "OP_RETURN",
    eval: (ctx) => {
      ctx.endedWithOpReturn = true;
      throw new Error("OP_RETURN");
    },
  },

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
      pullOut(ctx.stack, 1);
      pullOut(ctx.stack, 0);
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
      ctx.stack.push(pullOut(ctx.stack, 5)); // 6th on top
      ctx.stack.push(pullOut(ctx.stack, 5)); // 5th on top of 6th
    },
  },
  114: {
    name: "OP_2SWAP",
    eval: (ctx) => {
      ctx.stack.push(pullOut(ctx.stack, 3)); // 4th on top
      ctx.stack.push(pullOut(ctx.stack, 3)); // 3th on top of 4th
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
  119: { name: "OP_NIP", eval: (ctx) => pullOut(ctx.stack, 1) },
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
    eval: (ctx) => ctx.stack.push(pullOut(ctx.stack, num(pop(ctx.stack)))),
  },
  123: {
    name: "OP_ROT",
    eval: (ctx) => ctx.stack.push(pullOut(ctx.stack, 2)),
  },
  124: {
    name: "OP_SWAP",
    eval: (ctx) => ctx.stack.push(pullOut(ctx.stack, 1)),
  },
  125: {
    name: "OP_TUCK",
    eval: (ctx) => {
      const top2 = pullOut(ctx.stack, 1);
      const top = pullOut(ctx.stack, 0);
      ctx.stack.push(top, top2, top);
    },
  },

  // Data Manipulation
  126: {
    name: "OP_CAT",
    eval: (ctx) => {
      const top2 = pullOut(ctx.stack, 1);
      const top = pullOut(ctx.stack, 0);
      ctx.stack.push(Buffer.concat([top2, top]));
    },
  },
  127: {
    name: "OP_SPLIT",
    eval: (ctx) => {
      const valToSplit = pullOut(ctx.stack, 1);
      const splitAt = num(pullOut(ctx.stack, 0));
      ctx.stack.push(valToSplit.slice(0, splitAt), valToSplit(splitAt));
    },
  },
  128: {
    name: "OP_NUM2BIN",
    eval: (ctx) => {
      const val = cloneBuf(pullOut(ctx.stack, 1));
      const length = num(pullOut(ctx.stack, 0));
      const bin = numBuf2Bin(val, length);
      ctx.stack.push(bin);
    },
  },
  129: {
    name: "OP_BIN2NUM",
    eval: (ctx) => {
      const val = cloneBuf(pop(ctx.stack));
      const num = bnToBuf(bufToBn(val));
      ctx.stack.push(num);
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
      const top2 = pullOut(ctx.stack, 1);
      const top = pullOut(ctx.stack, 0);
      const res = zipBuf(top2, top, (a, b) => a & b);
      ctx.stack.push(res);
    },
  },
  133: {
    name: "OP_OR",
    eval: (ctx) => {
      const top2 = pullOut(ctx.stack, 1);
      const top = pullOut(ctx.stack, 0);
      const res = zipBuf(top2, top, (a, b) => a | b);
      ctx.stack.push(res);
    },
  },
  134: {
    name: "OP_XOR",
    eval: (ctx) => {
      const top2 = pullOut(ctx.stack, 1);
      const top = pullOut(ctx.stack, 0);
      const res = zipBuf(top2, top, (a, b) => a ^ b);
      ctx.stack.push(res);
    },
  },
  135: {
    name: "OP_EQUAL",
    eval: (ctx) => {
      const top2 = pullOut(ctx.stack, 1);
      const top = pullOut(ctx.stack, 0);
      if (!eq(top2, top)) {
        ctx.stack.push(hex("00"));
      } else {
        ctx.stack.push(hex("01"));
      }
    },
  },
  136: {
    name: "OP_EQUALVERIFY",
    eval: (ctx) => {
      const top2 = pullOut(ctx.stack, 1);
      const top = pullOut(ctx.stack, 0);
      if (!eq(top2, top)) {
        throw new Error("Stack values are not equal");
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
      let res = is0(val) ? hex("01") : hex("00");
      ctx.stack.push(res);
    },
  },
  146: {
    name: "OP_0NOTEQUAL",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      let res = is0(val) ? hex("00") : hex("01");
      ctx.stack.push(res);
    },
  },
  147: {
    name: "OP_ADD",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      const n = nTop2.add(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  148: {
    name: "OP_SUB",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      const n = nTop2.sub(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  149: {
    name: "OP_MUL",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      const n = nTop2.mul(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  150: {
    name: "OP_DIV",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      const n = nTop2.div(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  151: {
    name: "OP_MOD",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      const n = nTop2.div(nTop);
      ctx.stack.push(bnToBuf(n));
    },
  },
  152: {
    name: "OP_LSHIFT",
    eval: (ctx) => {
      const val = pullOut(ctx.stack, 1);
      const shiftLen = num(pullOut(ctx.stack, 0));
      const res = lShift(val, shiftLen);
      ctx.stack.push(res);
    },
  },
  153: {
    name: "OP_RSHIFT",
    eval: (ctx) => {
      const val = pullOut(ctx.stack, 1);
      const shiftLen = num(pullOut(ctx.stack, 0));
      const res = rShift(val, shiftLen);
      ctx.stack.push(res);
    },
  },
  154: {
    name: "OP_BOOLAND",
    eval: (ctx) => {
      const top2 = !is0(pullOut(ctx.stack, 1));
      const top = !is0(pullOut(ctx.stack, 0));
      ctx.stack.push(top && top2 ? hex("01") : hex("00"));
    },
  },
  155: {
    name: "OP_BOOLOR",
    eval: (ctx) => {
      const top2 = !is0(pullOut(ctx.stack, 1));
      const top = !is0(pullOut(ctx.stack, 0));
      ctx.stack.push(top || top2 ? hex("01") : hex("00"));
    },
  },
  156: {
    name: "OP_NUMEQUAL",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.eq(nTop) ? hex("01") : hex("00"));
    },
  },
  157: {
    name: "OP_NUMEQUALVERIFY",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      if (!nTop2.eq(nTop)) throw new Error("Numbers are not equal");
    },
  },
  158: {
    name: "OP_NUMNOTEQUAL",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.eq(nTop) ? hex("00") : hex("01"));
    },
  },
  159: {
    name: "OP_LESSTHAN",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.lt(nTop) ? hex("01") : hex("00"));
    },
  },
  160: {
    name: "OP_GREATERTHAN",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.gt(nTop) ? hex("01") : hex("00"));
    },
  },
  161: {
    name: "OP_LESSTHANOREQUAL",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.leq(nTop) ? hex("01") : hex("00"));
    },
  },
  162: {
    name: "OP_GREATERTHANOREQUAL",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.geq(nTop) ? hex("01") : hex("00"));
    },
  },
  163: {
    name: "OP_MIN",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.leq(nTop) ? bnToBuf(nTop2) : bnToBuf(nTop));
    },
  },
  164: {
    name: "OP_MAX",
    eval: (ctx) => {
      const nTop2 = bufToBn(pullOut(ctx.stack, 1));
      const nTop = bufToBn(pullOut(ctx.stack, 0));
      ctx.stack.push(nTop2.geq(nTop) ? bnToBuf(nTop2) : bnToBuf(nTop));
    },
  },
  165: {
    name: "OP_WITHIN",
    eval: (ctx) => {
      const x = bufToBn(pullOut(ctx.stack, 2));
      const min = bufToBn(pullOut(ctx.stack, 1));
      const max = bufToBn(pullOut(ctx.stack, 0));
      const geq = x.geq(min);
      const lt = x.lt(max);
      ctx.stack.push(geq && lt ? hex("01") : hex("00"));
    },
  },

  // Cryptography
  166: {
    name: "OP_RIPEMD160",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      ctx.stack.push(bsv.Hash.ripemd160(val));
    },
  },
  167: {
    name: "OP_SHA1",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      ctx.stack.push(bsv.Hash.sha1(val));
    },
  },
  168: {
    name: "OP_SHA256",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      ctx.stack.push(bsv.Hash.sha256(val));
    },
  },
  169: {
    name: "OP_HASH160",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      ctx.stack.push(bsv.Hash.sha256Ripemd160(val));
    },
  },
  170: {
    name: "OP_HASH256",
    eval: (ctx) => {
      const val = pop(ctx.stack);
      ctx.stack.push(bsv.Hash.sha256Sha256(val));
    },
  },
  171: {
    name: "OP_CODESEPARATOR",
    eval: (ctx) => {
      // nothing
    },
  },
  172: {
    name: "OP_CHECKSIG",
    eval: (ctx) => {
      const sig = pullOut(ctx.stack, 1);
      const pub = pullOut(ctx.stack, 0);
      const sigPass = checkSig(ctx, sig, pub);
      ctx.stack.push(sigPass ? hex("01") : hex("00"));
    },
  },
  173: {
    name: "OP_CHECKSIGVERIFY",
    eval: (ctx) => {
      const sig = pullOut(ctx.stack, 1);
      const pub = pullOut(ctx.stack, 0);
      const sigPass = checkSig(ctx, sig, pub);
      if (!sigPass) throw new Error("Signature didn't pass");
    },
  },
  174: {
    name: "OP_CHECKMULTISIG",
    eval: (ctx) => {
      const pubCount = num(last(ctx.stack));
      const sigCount = num(reverseIndex(ctx.stack, pubCount + 1));
      pullOut(ctx.stack, pubCount + 1 + sigCount + 1); // ignored value

      pop(ctx.stack);
      const pubs = popN(ctx.stack, pubCount);
      pop(ctx.stack);
      const sigs = popN(ctx.stack, sigCount);

      const sigsPass = checkMultiSig(ctx, sigs, sigCount, pubs, pubCount);
      ctx.stack.push(sigsPass ? hex("01") : hex("00"));
    },
  },
  175: {
    name: "OP_CHECKMULTISIGVERIFY",
    eval: (ctx) => {
      const pubCount = num(last(ctx.stack));
      const sigCount = num(reverseIndex(ctx.stack, pubCount + 1));
      pullOut(ctx.stack, pubCount + 1 + sigCount + 1); // ignored value

      pop(ctx.stack);
      const pubs = popN(ctx.stack, pubCount);
      pop(ctx.stack);
      const sigs = popN(ctx.stack, sigCount);

      const sigsPass = checkMultiSig(ctx, sigs, sigCount, pubs, pubCount);
      if (!sigsPass) throw new Error("Signatures didn't pass");
    },
  },

  // NOP
  176: { name: "OP_NOP1", eval: (ctx) => {} },
  177: { name: "OP_NOP2", eval: (ctx) => {} },
  178: { name: "OP_NOP3", eval: (ctx) => {} },
  179: { name: "OP_NOP4", eval: (ctx) => {} },
  180: { name: "OP_NOP5", eval: (ctx) => {} },
  181: { name: "OP_NOP6", eval: (ctx) => {} },
  182: { name: "OP_NOP7", eval: (ctx) => {} },
  183: { name: "OP_NOP8", eval: (ctx) => {} },
  184: { name: "OP_NOP9", eval: (ctx) => {} },
  185: { name: "OP_NOP10", eval: (ctx) => {} },
};

function calculatePreimageHash(ctx) {
  // TODO: Implement calculatePreimageHash
  throw new Error("NOT IMPLEMENTED");
}

function isSignatureValid(sig, pub, hash) {
  // TODO: Implement isSignatureValid
  throw new Error("NOT IMPLEMENTED");
}

function checkSig(ctx, sig, pub) {
  if (ctx.sigsAlwaysPass === true) return true;
  let hash = null;
  if (ctx.txPreimageHash) hash = Buffer.from(ctx.txPreimageHash, "hex");
  else if (ctx.rawTx && ctx.vin) hash = calculatePreimageHash(ctx);
  else
    throw new Error(
      "Unable to execute Signature check: Unknown txPreimage hash"
    );

  return isSignatureValid(sig, pub, hash);
}

function checkMultiSig(ctx, sigs, sigCount, pubs, pubCount) {
  if (sigCount > pubCount)
    throw new Error("Signature Count Cannot exceed PubKey count");
  if (ctx.sigsAlwaysPass === true) return true;
  let hash = null;
  if (ctx.txPreimageHash) hash = Buffer.from(ctx.txPreimageHash, "hex");
  else if (ctx.rawTx && ctx.vin) hash = calculatePreimageHash(ctx);
  else
    throw new Error(
      "Unable to execute Signature check: Unknown txPreimage hash"
    );

  const sig = 0;
  for (let i = 0; i < pubs.length; i++) {
    const sigPass = isSignatureValid(sigs[sig], pubs[i], hash);
    if (sigPass) {
      sig++;
      if (sig > sigs.length - 1) return true;
    }
  }
  return false;
}

function getProtocolVersion(ctx) {
  return bnToBuf(bsv.Bn(ctx.protocolVersion || 70015));
}

function hex(str) {
  return Buffer.from(str, "hex");
}

function bufToBn(hexBuf) {
  // TODO: Optimize to not use .toString("hex") !
  const buf = cloneBuf(hexBuf).reverse();
  const isNegative = buf[0] > 128 || (buf[0] === 128 && buf.length > 1);
  if (isNegative) buf[0] -= 128;
  const int = new bsv.Bn((isNegative ? "-" : "") + buf.toString("hex"), 16);
  return int;
}

function bnToBuf(n) {
  const arr = n.toArray();
  let buf = Buffer.from(arr);

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

function is0(buf) {
  if (buf.length > 1) return false;
  else if (bud[0] === 0) return true;
  else return false;
}

function num(buf) {
  const n = bufToBn(buf);
  if (n.words.length > 1)
    throw new Error("Value too big - cannot parse to Int");
  return n.negative ? -n.words[0] : n.words[0];
}

function numBuf2Bin(numBuf, binLength) {
  if (binLength < 0) throw new RangeError("Length cannot be negative");
  if (binLength < numBuf.length)
    throw new RangeError("Value cannot fit in this byte sequence length");

  const res = Buffer.alloc(binLength);
  for (let i = 0; i < numBuf.length - 1; i++) res[i] = numBuf[i];
  res[numBuf.length - 1] = numBuf[numBuf.length - 1] ^ 128;
  res[res.length - 1] = numBuf[numBuf.length - 1] & 128;

  return res;
}

function shiftByteLeft(a = 255, numLeftOfA = 254, shiftLength = 3) {
  a = a << shiftLength; // 11111000
  const mask = 255 << (8 - shiftLength); // 11100000
  const moveOver = (numLeftOfA & mask) >> (8 - shiftLength); // 00000110
  a = a | moveOver;
  return a & 255;
}

function shiftByteRight(a = 255, numRightOfA = 3, shiftLength = 3) {
  a = a >> shiftLength; // 00011111
  const mask = 255 >> (8 - shiftLength); // 00000111
  const moveOver = (numRightOfA & mask) << (8 - shiftLength); // 01100000
  a = a | moveOver;
  return a & 255;
}

function lShift(buf, shiftLength) {
  if (shiftLength < 0) throw new Error("Shift length cannot be negative");
  if (shiftLength >= buf.length * 8) return Buffer.alloc(buf.length);
  if (shiftLength === 0) return cloneBuf(buf);

  const res = cloneBuf(buf);

  // TODO: Optimize by moving values the first [shiftLength / 8] times, instead of moving bits
  while (shiftLength > 0) {
    const shiftStep = Math.min(shiftLength, 8);
    shiftLength -= 8;

    let prevNum = 0;
    for (let i = res.length - 1; i >= 0; i--) {
      const current = res[i];
      res[i] = shiftByteLeft(current, prevNum, shiftStep);
      prevNum = current;
    }
  }

  return res;
}

function rShift(buf, shiftLength) {
  if (shiftLength < 0) throw new Error("Shift length cannot be negative");
  if (shiftLength >= buf.length * 8) return Buffer.alloc(buf.length);
  if (shiftLength === 0) return cloneBuf(buf);

  const res = cloneBuf(buf);

  // TODO: Optimize by moving values the first [shiftLength / 8] times, instead of moving bits
  while (shiftLength > 0) {
    const shiftStep = Math.min(shiftLength, 8);
    shiftLength -= 8;

    let prevNum = 0;
    for (let i = 0; i < res.length; i++) {
      const current = res[i];
      res[i] = shiftByteRight(current, prevNum, shiftStep);
      prevNum = current;
    }
  }

  return res;
}

function last(arr) {
  if (!arr.length) throw new RangeError("Can't get last item of empty array");
  return arr[arr.length - 1];
}

function pop(arr) {
  if (!arr.length) throw new RangeError("Can't get last item of empty array");
  return arr.pop();
}

function popN(arr, n) {
  if (n > arr.length)
    throw new RangeError(`Can't pop ${n} items - Array too small`);
  const results = [];
  for (let i = 0; i < n; i++) [].push(pop(arr));
  return results.reverse(); // ordered the same way as they were in the stack
}

function reverseIndex(arr, i) {
  if (!arr.length) throw new Error("Can't get reverse index in empty array");
  if (i > arr.length - 1) throw new RangeError("Index out of bounds : " + i);
  return arr[arr.length - i - 1];
}

function pullOut(arr, i) {
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

function zipBuf(buf1, buf2, byteMergeFunc) {
  if (buf1.length !== buf2.length)
    throw new Error(
      `Lengths of buffers don't match. (${buf1.length} != ${buf2.length})`
    );
  const res = Buffer.alloc(buf1.length);
  for (let i = 0; i < buf1.length; i++) {
    res[i] = byteMergeFunc(buf1[i], buf2[i]);
  }
  return res;
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

module.exports = opCodeFunctions;
