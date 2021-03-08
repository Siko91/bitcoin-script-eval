# Bitcoin Script Evaluator

Evaluates Bitcoin Scripts, according to the specification of Bitcoin SV.

# Usage

```javascript
const bitcoinScriptEval = require("bitcoinScriptEval");

bitcoinScriptEval("ff f1 OP_CAT", "asm").then((context) => {
  console.log(context.stack.map((i) => i.toString("hex")).toString()); // Prints fff1
});
```
