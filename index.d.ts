export type BsvJsScript = any;

export type Context = {
  sigsAlwaysPass?: boolean,
  failOnDisabled?: boolean,

  done?: boolean,
  ended?: boolean,
  interrupted?: boolean,
  endedWithOpReturn?: boolean,
  
  stack?: Buffer[],
  altStack?: Buffer[],
  opReturn?: Buffer[],

  script?: BsvJsScript,
  endMessage?: string,

  step?: number,
  skipUntil?: [number] | [number, number]
  blocks?: {
      name: string,
      skipUntil?: number,
      code: number,
    }[],
}

export default function bitcoinScriptEval(script: string, scriptType: "hex" | "asm", context?: Context): Promise<Context>
