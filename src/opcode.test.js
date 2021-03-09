const bitcoinScriptEval = require("./bitcoinScriptEval");

describe("OpCode Tests", () => {
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
  it("OP_VER", async () => await check("OP_VER", "7f1101"));
});

async function check(scrToCheck, scrExpected, expectedError = undefined) {
  console.log(
    `Scripts should evaluate the same: \n"${scrToCheck}"\n"${scrExpected}"`
  );
  const ctxActual = await bitcoinScriptEval(scrToCheck, "asm");
  const ctxExpected = await bitcoinScriptEval(scrExpected, "asm");

  if (expectedError) {
    if (ctxActual.done || !ctxActual.ended)
      throw new Error(`Expected script ${scrToCheck} to fail.`);
    if (ctxActual.endMessage !== expectedError)
      throw new Error(
        `Expected Error '${endMessage}' to equal '${expectedError}'`
      );
  } else {
    if (!ctxActual.done || ctxActual.endMessage)
      throw new Error(
        `Expected script to complete without error. Error was : ${ctxActual.endMessage}`
      );
  }

  const valsActual = ctxActual.stack.map((i) => i.toString("hex")).join(" ");
  const valsExpected = ctxExpected.stack
    .map((i) => i.toString("hex"))
    .join(" ");
  if (valsActual !== valsExpected)
    throw new Error(
      `Assertion failed: Expected [${valsActual}] to equal [${valsExpected}]`
    );
}
