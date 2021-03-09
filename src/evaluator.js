const opCodeFunctions = require("./opCodeFunctions");

async function eval(context) {
  context.stack = context.stack || [];
  context.altStack = context.altStack || [];

  context.done = false;
  context.ended = false;
  for (let i = 0; i < context.script.chunks.length; i++) {
    context.step = i;
    const step = context.script.chunks[i];

    if (context.ended) break;

    if (context.skipUntil && context.skipUntil.length)
      if (!context.skipUntil.includes(step.opCodeNum)) continue;

    await evaluateStep(step, context);
  }
  const error = checkForErrors(context);
  context.ended = true;
  context.endMessage = context.endMessage || error;
  context.done = !context.endMessage;

  return context;
}

function checkForErrors(context) {
  if (context.blocks && context.blocks.length)
    return "Didn't exit blocks. " + context.blocks.length;
}

async function evaluateStep(step, context) {
  if (step.buf) return await evaluateBuf(step, context);
  else return await evaluateOpCode(step, context);
}

async function evaluateBuf(step, context) {
  context.stack.push(step.buf);
}

async function evaluateOpCode(step, context) {
  try {
    const opcode = opCodeFunctions[step.opCodeNum];
    opcode.eval(context);
  } catch (error) {
    if (context.endedWithOpReturn) {
      context.opReturn = getOpReturn(context, context.step);
    }
    context.ended = true;
    context.endMessage = error.message;
  }
}

function getOpReturn(context, fromStep) {
  const restOfScript = context.script.chunks.slice(fromStep + 1);
  const results = [];
  for (let i = 0; i < restOfScript.length; i++) {
    const step = restOfScript[i];
    if (step.buf) results.push(step.buf);
    else results.push(Buffer.from(step.opCodeNum.toString(16), "hex"));
  }
  return results;
}

module.exports = { eval };
