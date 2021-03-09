const bitcoinScriptEval = require("./bitcoinScriptEval");

describe("OpCode Constants", () => {
  it("OP_0 & OP_1", async () =>
    await check("OP_0 OP_FALSE OP_1 OP_TRUE", "00 00 01 01"));
  it("OP_1NEGATE", async () => await check("OP_1NEGATE", "81"));
  it("OP_2 to 15", async () =>
    await check(
      "OP_2 OP_3 OP_4 OP_5 OP_6 OP_7 OP_8 OP_9 OP_10 OP_11 OP_12 OP_13 OP_14 OP_15 OP_16",
      "02 03 04 05 06 07 08 09 0a 0b 0c 0d 0e 0f 10"
    ));
  it("OP_NOP", async () =>
    await check(
      "01 OP_NOP OP_NOP1 OP_NOP2 OP_NOP3 OP_NOP4 OP_NOP5 OP_NOP6 OP_NOP7 OP_NOP8 OP_NOP9 OP_NOP10 02",
      "01 02"
    ));
});

describe("OpCode Flow Control", () => {
  it("OP_VER", async () => await check("OP_VER", "7f1101"));

  it("01 OP_IF", async () =>
    await check("01 OP_IF 02 03 OP_ENDIF 04", "02 03 04"));
  it("00 OP_IF", async () => await check("00 OP_IF 02 03 OP_ENDIF 04", "04"));
  it("00 OP_NOTIF", async () =>
    await check("00 OP_NOTIF 02 03 OP_ENDIF 04", "02 03 04"));
  it("01 OP_NOTIF", async () =>
    await check("01 OP_NOTIF 02 03 OP_ENDIF 04", "04"));

  it("01 OP_IF OP_ELSE", async () =>
    await check("01 OP_IF 02 03 OP_ELSE 00 OP_ENDIF 04", "02 03 04"));
  it("00 OP_IF OP_ELSE", async () =>
    await check("00 OP_IF 02 03 OP_ELSE 00 OP_ENDIF 04", "00 04"));
  it("00 OP_NOTIF OP_ELSE", async () =>
    await check("00 OP_NOTIF 02 03 OP_ELSE 00 OP_ENDIF 04", "02 03 04"));
  it("01 OP_NOTIF OP_ELSE", async () =>
    await check("01 OP_NOTIF 02 03 OP_ELSE 00 OP_ENDIF 04", "00 04"));

  it("OP_IF OP_IF", async () =>
    await check("01 OP_IF 02 OP_IF 03 OP_ENDIF OP_ENDIF 04", "03 04"));
  it("OP_IF OP_ELSE OP_IF", async () =>
    await check(
      "00 OP_IF 02 OP_ELSE 03 OP_IF 04 OP_ENDIF OP_ENDIF 04",
      "04 04"
    ));
  it("OP_IF OP_IF OP_IF OP_ELSE", async () =>
    await check(
      "01 OP_IF 01 OP_IF 00 OP_IF 02 OP_ELSE 03 OP_ENDIF 04 OP_ENDIF 05 OP_ENDIF 06",
      "03 04 05 06"
    ));
  it("OP_IF OP_IF OP_ELSE OP_IF", async () =>
    await check(
      "01 OP_IF 00 OP_IF 02 OP_ELSE 01 OP_IF 03 OP_ENDIF 04 OP_ENDIF 05 OP_ENDIF 06",
      "03 04 05 06"
    ));

  it("OP_IF ...", async () =>
    await check("01 OP_IF 01 02 03", "01 02 03", "Didn't exit blocks. 1"));
  it("OP_IF OP_IF ...", async () =>
    await check(
      "01 OP_IF 02 OP_IF 01 02 03",
      "01 02 03",
      "Didn't exit blocks. 2"
    ));
  it("OP_IF OP_IF OP_ENDIF ...", async () =>
    await check(
      "01 OP_IF 02 OP_IF 01 02 OP_ENDIF 03",
      "01 02 03",
      "Didn't exit blocks. 1"
    ));
  it("OP_IF OP_IF OP_ELSE ...", async () =>
    await check(
      "01 OP_IF 00 OP_IF 01 02 03 OP_ELSE 04",
      "04",
      "Didn't exit blocks. 2"
    ));

  it("00 OP_VERIFY", async () =>
    await check("01 00 OP_VERIFY 02", "01", "Verification failed"));
  it("01 OP_VERIFY", async () => await check("01 01 OP_VERIFY 02", "01 02"));

  it("OP_RETURN", async () =>
    await check("04 OP_RETURN 01 02 03", "04", "OP_RETURN", "01 02 03"));
  it("00 OP_RETURN", async () =>
    await check("00 OP_RETURN 01 02 03", "00", "OP_RETURN", "01 02 03"));

  it("OP_IF OP_RETURN", async () =>
    await check(
      "01 OP_IF 04 OP_RETURN 01 02 03 OP_ELSE 05 OP_ENDIF 06",
      "04",
      "OP_RETURN",
      "01 02 03 67 05 68 06"
    ));
  it("OP_ELSE OP_RETURN", async () =>
    await check(
      "00 OP_IF ff OP_ELSE 04 OP_RETURN 01 02 03 OP_ELSE 05 OP_ENDIF 06",
      "04",
      "OP_RETURN",
      "01 02 03 67 05 68 06"
    ));
  it("OP_IF OP_RETURN OP_ELSE OP_RETURN", async () =>
    await check(
      "00 OP_IF f4 OP_RETURN f1 f2 f3 OP_ELSE 04 OP_RETURN 01 02 03 OP_ELSE 05 OP_ENDIF 06",
      "04",
      "OP_RETURN",
      "01 02 03 67 05 68 06"
    ));
  it("OP_IF OP_RETURN ... OP_ELSE OP_RETURN", async () =>
    await check(
      "01 OP_IF f4 OP_RETURN f1 f2 f3 OP_ELSE 04 OP_RETURN 01 02 03 OP_ELSE 05 OP_ENDIF 06",
      "f4",
      "OP_RETURN",
      "f1 f2 f3 67 04 6a 01 02 03 67 05 68 06"
    ));
});

describe("OpCode Stack", () => {
  it("OP_TOALTSTACK", async () =>
    await check(
      "01 OP_TOALTSTACK 02 03 04 OP_TOALTSTACK",
      "02 03",
      null,
      null,
      "01 04"
    ));

  it("OP_FROMALTSTACK", async () =>
    await check(
      "01 OP_TOALTSTACK 02 03 OP_FROMALTSTACK 04 OP_TOALTSTACK",
      "02 03 01",
      null,
      null,
      "04"
    ));

  it("01 02 OP_2DROP", async () => await check("01 02 OP_2DROP 03", "03"));

  it("OP_2DUP", async () => await check("01 02 OP_2DUP 03", "01 02 01 02 03"));
  it("OP_3DUP", async () =>
    await check("01 02 03 OP_3DUP 04", "01 02 03 01 02 03 04"));
  it("OP_2OVER", async () =>
    await check("01 02 03 04 OP_2OVER 05", "01 02 03 04 01 02 05"));
  it("OP_2ROT", async () =>
    await check("01 02 03 04 05 06 OP_2ROT 07", "03 04 05 06 01 02 07"));
  it("OP_2SWAP", async () =>
    await check("01 02 03 04 05 06 OP_2SWAP 07", "01 02 05 06 03 04 07"));
  it("OP_IFDUP", async () =>
    await check("01 OP_IFDUP 00 OP_IFDUP 01 OP_IFDUP", "01 01 00 01 01"));
  it("OP_DEPTH", async () => await check("01 02 OP_DEPTH", "01 02 02"));
  it("OP_DROP", async () => await check("01 02 OP_DROP 03", "01 03"));
  it("OP_DUP", async () => await check("01 02 OP_DUP 03", "01 02 02 03"));
  it("OP_NIP", async () => await check("01 02 OP_NIP 03", "02 03"));
  it("OP_OVER", async () => await check("01 02 OP_OVER 03", "01 02 01 03"));

  it("2 OP_PICK", async () =>
    await check("01 02 03 02 OP_PICK 04", "01 02 03 01 04"));
  it("F OP_PICK", async () =>
    await check("01 0f OP_PICK 04", "01 0f", "Index out of bounds : 16"));
  it("-1 OP_PICK", async () =>
    await check(
      "01 81 OP_PICK 04",
      "01 81",
      "Value is negative - cannot parse to UInt"
    ));

  it("2 OP_ROLL", async () =>
    await check("01 02 03 02 OP_ROLL 04", "02 03 01 04"));
  it("F OP_ROLL", async () =>
    await check("01 0f OP_ROLL 04", "01 0f", "Index out of bounds : 16"));
  it("-1 OP_ROLL", async () =>
    await check(
      "01 81 OP_ROLL 04",
      "01 81",
      "Value is negative - cannot parse to UInt"
    ));

  it("OP_ROT", async () => await check("01 02 03 OP_ROT 04", "02 03 01 04"));
  it("OP_SWAP", async () => await check("01 02 03 OP_SWAP 04", "01 03 02 04"));
  it("OP_TUCK", async () =>
    await check("01 02 03 OP_TUCK 04", "01 03 02 03 04"));
});

describe("OpCode Data Manipulation", () => {
  it("OP_CAT", async () =>
    await check("01 02 OP_CAT 03 04 OP_CAT OP_CAT", "01020304"));

  it("OP_SPLIT", async () =>
    await check("01020304 02 OP_SPLIT 01 OP_SPLIT", "0102 03 04"));

  it("OP_NUM2BIN", async () =>
    await check("01020304 0a OP_NUM2BIN", "01020304000000000000"));

  it("- OP_NUM2BIN", async () =>
    await check("01020384 0a OP_NUM2BIN", "01020304000000000080"));

  it("OP_BIN2NUM", async () =>
    await check("01020304000000000000 OP_BIN2NUM", "01020304"));

  it("- OP_BIN2NUM", async () =>
    await check("01020304000000000080 OP_BIN2NUM", "01020384"));

  it("OP_SIZE", async () =>
    await check("0102030400000000008000 OP_SIZE", "0102030400000000008000 0b"));
});

describe("OpCode Bitwise Logic", () => {
  it("OP_INVERT", async () => await check("0102 OP_INVERT", "fefd"));

  it("OP_AND", async () => await check("0101 0303 OP_AND", "0101"));
  it("OP_OR", async () => await check("0101 0202 OP_OR", "0303"));
  it("OP_XOR", async () => await check("0101 0303 OP_XOR", "0202"));

  it("OP_EQUAL", async () => await check("0101 0101 OP_EQUAL", "01"));
  it("!OP_EQUAL", async () => await check("0101 0303 OP_EQUAL", "00"));
  it("OP_EQUALVERIFY", async () => await check("0101 0101 OP_EQUALVERIFY", ""));
  it("!OP_EQUALVERIFY", async () =>
    await check("0101 0303 OP_EQUALVERIFY", "", "Stack values are not equal"));
});

async function check(
  scrToCheck,
  expectedStack,
  expectedError = null,
  expectedReturn = null,
  expectedAltStack = null
) {
  console.log(
    (expectedError
      ? `Script should fail with Error : ${expectedError}`
      : `Scripts should pass`) +
      `\n[${scrToCheck}]` +
      `\nand its stack should be: [${expectedStack}]`
  );
  const ctxActual = await bitcoinScriptEval(scrToCheck, "asm");

  if (expectedError) {
    if (ctxActual.done || !ctxActual.ended)
      throw new Error(`Expected script ${scrToCheck} to fail.`);
    if (ctxActual.endMessage !== expectedError)
      throw new Error(
        `Expected Error '${ctxActual.endMessage}' to equal '${expectedError}'`
      );
  } else {
    if (!ctxActual.done || ctxActual.endMessage)
      throw new Error(
        `Expected script to complete without error. Error was : ${ctxActual.endMessage}`
      );
  }

  const valsActual = ctxActual.stack.map((i) => i.toString("hex")).join(" ");
  if (valsActual !== expectedStack)
    throw new Error(
      `Expected stack [${valsActual}] to equal [${expectedStack}]`
    );

  if (expectedReturn) {
    const actualReturn = ctxActual.opReturn
      .map((i) => i.toString("hex"))
      .join(" ");
    if (actualReturn !== expectedReturn)
      throw new Error(
        `Expected OpReturn [${actualReturn}] to equal [${expectedReturn}]`
      );
  }

  if (expectedAltStack) {
    const actualAltStack = ctxActual.altStack
      .map((i) => i.toString("hex"))
      .join(" ");
    if (actualAltStack !== expectedAltStack)
      throw new Error(
        `Expected alt stack [${actualAltStack}] to equal [${expectedAltStack}]`
      );
  }
}
