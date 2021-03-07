const opCodeFunctions = require("./opCodeFunctions");

async function eval(script, context) {
  context.stack = context.stack || [];
  context.altStack = context.altStack || [];
  for (let i = 0; i < script.chunks.length; i++) {
    const step = script.chunks[i];
    await evaluateStep(step, context);
  }
  return context;
}

async function evaluateStep(step, context) {
  if (step.opCodeNum) return await evaluateOpCode(step, context);
  else return await evaluateBuf(step, context);
}

async function evaluateBuf(step, context) {
  context.stack.push(step.buf);
}

async function evaluateOpCode(step, context) {
  if (context.skipUntil && context.skipUntil.length)
    if (!context.skipUntil.includes(step.opCodeNum)) return;

  const opcode = opCodeFunctions[step.opCodeNum];
  opcode.eval(context);
}

module.exports = { eval };
