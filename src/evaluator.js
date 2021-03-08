const opCodeFunctions = require("./opCodeFunctions");

async function eval(context) {
  context.stack = context.stack || [];
  context.altStack = context.altStack || [];
  for (let i = 0; i < context.script.chunks.length; i++) {
    context.current = i;

    if (context.skipUntil && context.skipUntil.length)
      if (!context.skipUntil.includes(step.opCodeNum)) continue;

    const step = context.script.chunks[i];
    await evaluateStep(step, context);
  }
  return context;
}

async function evaluateStep(step, context) {
  if (step.buf) return await evaluateBuf(step, context);
  else return await evaluateOpCode(step, context);
}

async function evaluateBuf(step, context) {
  context.stack.push(step.buf);
}

async function evaluateOpCode(step, context) {
  const opcode = opCodeFunctions[step.opCodeNum];
  opcode.eval(context);
}

module.exports = { eval };
