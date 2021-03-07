const evaluator = require("./evaluator");
const bsv = require("./bsv");

async function parse(script, format) {
  if (format === "hex") return bsv.Script.fromHexString(script.toString());
  else if (format === "asm") return bsv.Script.fromAsmString(script.toString());
  else throw new Error("Unknown format: " + format);
}

async function eval(script, format, context = {}) {
  let parsedScript = null;
  parsedScript = parse(script, format, context);
  return await evaluator.eval(parsedScript, context);
}

module.exports = { eval };
