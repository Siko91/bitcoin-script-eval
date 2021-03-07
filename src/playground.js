var bsv = require("bsv");

const bits = 4;

const ints = new Array(Math.pow(2, bits)).fill(0).map((v, i) => i);

const asHex = ints.map((i) => i.toString(16).toUpperCase());

const asBits = ints.map((i) =>
  substrLast(bits, "0".repeat(bits - 1) + i.toString(2))
);

const asFlippedNums = ints.map((i) => Math.pow(2, bits) - 1 - i);

// for (let i = 0; i < asHex.length; i++) {
//   showHex("22" + asHex[i] + "1");
// }

showHex("FFCA");
showHex("FF80");
showHex("FF7F");
showHex("FF31");

showHex("FFFFFFFFFFFFFFFFCA");
showHex("FFFFFFFFFFFFFFFF80");
showHex("FFFFFFFFFFFFFFFF7F");
showHex("FFFFFFFFFFFFFFFF31");

function substrLast(num, str) {
  return str.substr(str.length - num);
}

async function showHex(hexStr) {
  const parsed = await parse(Buffer.from(hexStr, "hex"));
  hexStrBE = Buffer.from(hexStr, "hex").reverse().toString("hex").toUpperCase();

  let bits = hexStrBE.split("").map((i) => asBits[asHex.indexOf(i)]);

  bits = bits.join("");

  let bitcoinNum = parseInt(bits.substr(1), 2);
  if (bits[0] === "1") bitcoinNum = -bitcoinNum;

  console.log(
    `----> ${hexStr} (${parseInt(hexStrBE, 16)
      .toString()
      .padStart(4, "0")}):  \t ${bits}\t  [${bitcoinNum}] \t [${parsed}]`
  );
}

function cloneBuf(buf) {
  const clone = Buffer.alloc(buf.length);
  buf.copy(clone);
  return clone;
}

function parse(hexBuf) {
  const buf = cloneBuf(hexBuf).reverse();
  const isNegative = buf[0] > 128 || (buf[0] === 128 && buf.length > 1);
  if (isNegative) buf[0] -= 128;
  const int = new bsv.Bn((isNegative ? "-" : "") + buf.toString("hex"), 16);
  return int;
}
