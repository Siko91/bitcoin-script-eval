async function eval(script, context) {
  context.stack = context.stack || [];
  context.altStack = context.altStack || [];
  for (let i = 0; i < script.length; i++) {
    const step = script[i];
    await evaluateStep(step, context);
  }
  return context;
}

async function evaluateStep(step, context) {
  //
}

module.exports = { eval };
