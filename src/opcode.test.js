const bitcoinScriptEval = require("./bitcoinScriptEval");

describe("OpCode Tests", () => {
  it("OP_0 & OP_1", async () =>
    await check("OP_0 OP_FALSE OP_1 OP_TRUE", "00 00 01 01"));
  it("OP_1NEGATE", async () => await check("OP_1NEGATE", "81"));
  it("OP_2 to 8", async () =>
    await check("OP_2 OP_3 OP_4 OP_5 OP_6 OP_7 OP_8", "02 03 04 05 06 07 08"));
  it("OP_9 to 15", async () =>
    await check(
      "OP_9 OP_10 OP_11 OP_12 OP_13 OP_14 OP_15 OP_16",
      "09 0a 0b 0c 0d 0e 0f 10"
    ));
});

async function check(scr1, scr2, format = "asm") {
  console.log(`Scripts should evaluate the same: \n"${scr1}"\n"${scr2}"`);
  const ctx1 = await bitcoinScriptEval(scr1, format);
  const ctx2 = await bitcoinScriptEval(scr2, format);
  const vals1 = ctx1.stack.map((i) => i.toString("hex")).join(" ");
  const vals2 = ctx2.stack.map((i) => i.toString("hex")).join(" ");
  if (vals1 !== vals2)
    throw new Error(
      `Assertion failed: Expected [${vals1}] to equal [${vals2}]`
    );
}
