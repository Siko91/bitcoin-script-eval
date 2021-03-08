const evaluator = require("./evaluator");
const bsv = require("bsv");

function parse(script, format) {
  if (format === "hex") return bsv.Script.fromHexString(script.toString());
  else if (format === "asm") return bsv.Script.fromAsmString(script.toString());
  else throw new Error("Unknown format: " + format);
}

async function bitcoinScriptEval(script, format, context = {}) {
  context = cloneContext(context);
  context.script = parse(script, format, context);
  return await evaluator.eval(context);
}

function cloneContext(context) {
  context = JSON.parse(JSON.stringify(context));
  context.stack = context.stack?.map((obj) => Buffer.from(obj));
  context.altStack = context.altStack?.map((obj) => Buffer.from(obj));
  return context;
}

module.exports = bitcoinScriptEval;
