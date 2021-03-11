# Bitcoin Script Evaluator

Evaluates Bitcoin Scripts, according to the specification of Bitcoin SV.

## Install

`npm i --save bitcoin-script-eval`

## Usage

The standard usage is to evaluate a script and examine its result.

```javascript
const bitcoinScriptEval = require("bitcoin-script-eval");

bitcoinScriptEval("ff f1 OP_CAT 01 OP_SPLIT", "asm").then((context) => {
  context.stack; // a Buffer array with values [ ff, f1 ]
  context.altStack; // a Buffer array with all values in the altStack at the end of the script
  context.opReturn; // a Buffer array with all values following an OP_RETURN that got executed
  context.ended; // boolean that gets set to TRUE once the evaluation ends
  context.interrupted; // boolean that gets set to TRUE if the evaluation ended with an interruption.
  context.endedWithOpReturn; // boolean that gets set to TRUE if the evaluation ended with an OP_RETURN.
  context.endMessage; // string explaining what interrupted the script (Error message or "OP_RETURN").
  context.done; // boolean that gets set to TRUE once the evaluation ends without interruption
  context.blocks; // details about unfinished OP_IF blocks
});
```

## Execute Step by Step

An alternative usage is to split the execution into chunks. This makes it possible to evaluate the state of the script after each chunk.

To continue the evaluation from where the previous script ended, simply pass on the exact same context object to the evaluation.

```javascript
const bitcoinScriptEval = require("bitcoinScriptEval");
const context1 = await bitcoinScriptEval("ff f1", "asm"); // stack is [ff, f1]
const context2 = await bitcoinScriptEval("OP_CAT", "asm", context1); // stack is [fff1]
const context3 = await bitcoinScriptEval("01 OP_SPLIT", "asm", context2); // stack is [ff, f1]
```

Here are some rules about splitting scripts into chunks:

- If a previous chunk put data in the Stack or AltStack, then this data will still be present for the next chunk of code
- If a previous chunk had unfinished OP_IF blocks, then the current chunk will keep looking for these blocks to close
- If a previous chunk did an OP_RETURN, then the next chunk will simply be considered data in the OP_RETURN
- If a previous chunk had an interruption error, then the next chunk won't actually get executed

## Signatures don't work yet

Some parts of the library are not complete, like signature validation.

As a workaround, set:

```javascript
context.sigsAlwaysPass = true;
```

This will make all Sig opcodes consume the same stack variables, but without checking if the sigs are valid.

> `sigsAlwaysPass` is `FALSE` by default.

## Disabled OpCodes

By default, this tool supports disabled opcodes.
If you want it to fail on disabled opcodes instead, set:

```javascript
context.failOnDisabled = true;
```

## Disclaimer

This code is provided AS-IS, without any warranty. See the license.
