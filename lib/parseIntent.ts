// Public build: this module ships only the lightweight intent classifier.
// The full intent-parsing pipeline (slot extraction, LLM JSON parsing, prompt
// builders, decision analysis) is part of Skopos's private implementation and
// is not included in the open-source distribution.

export type IntentType =
  | "price"
  | "execution"
  | "analysis"
  | "informational"
  | "yield"
  | "prediction"
  | "fx"
  | "metal"
  | "equity"
  | "unknown";

export function classifyIntent(input: string): IntentType {
  const t = input.trim();

  const hasPriceKeyword      = /\b(price|worth|how\s+much|trading\s+at|usd\s+value|cost)\b/i.test(t);
  const hasKnownToken        = /\b(eth|weth|ethereum|bitcoin|btc|sol|solana|bnb|matic|pol|polygon|avax|avalanche|usdc|usdt|dai|doge|dogecoin|shib|pepe|link|chainlink|uni|uniswap|aave|wbtc|xrp|ada|cardano|dot|polkadot|op|optimism|arb|arbitrum|mkr|maker|crv|curve|snx|synthetix|ldo|lido|comp|frax|megeth|megaeth)\b/i.test(t);
  const hasExecVerb          = /\b(swap|bridge|send|transfer|move|convert)\b/i.test(t);
  const hasAmount            = /\b\d[\d.,]*\b/.test(t);
  const hasOpinionSignal     = /\b(should\s+i|is\s+(?:it|now|this)\s+(?:a\s+)?(?:good|worth|safe|wise)|worth\s+(?:buying|selling|holding)|would\s+you|do\s+you\s+(?:think|recommend)|good\s+(?:time\s+to|buy|investment)|undervalued|overvalued)\b/i.test(t);
  const hasYieldKeyword      = /\b(yields?|apy|apr|earn|returns|best\s+(?:yields?|rate|apy|apr)|interest\s+(?:on|rate)|earning\s+(?:on|from))\b/i.test(t);
  const hasPredictionKeyword = /\b(polymarket|prediction\s+markets?|odds|betting\s+odds|market\s+odds|chances?|what\s+(?:are\s+)?people\s+betting|polymarket\s+trends?|top\s+(?:prediction\s+)?markets?|market\s+predictions?|what\s+(?:can\s+i|do\s+i)\s+bet\s+on|bet|wager|buy\s+(?:yes|no)|place\s+(?:a\s+)?bet|take\s+(?:a\s+)?position\s+on)\b/i.test(t);

  const hasFiatCurrency = /\b(eur(?:o|os)?|gbp|pounds?|sterling|jpy|yen|chf|swiss\s+franc|aud|australian)\b/i.test(t);
  if (hasFiatCurrency) return "fx";

  if (/\b(gold|silver|xau|xag)\b/i.test(t)) return "metal";

  if (/\b(aapl|apple\s+stock|msft|microsoft\s+stock)\b/i.test(t)) return "equity";

  if (hasExecVerb && hasAmount) return "execution";
  if (hasOpinionSignal) return "informational";
  if (hasPriceKeyword && hasKnownToken) return "price";
  if (hasYieldKeyword) return "yield";
  if (hasPredictionKeyword) return "prediction";

  if (/\b(scan|rug|rugpull|is\s+\w+\s+(safe|legit|risky|a\s+rug)|analyze\s+token|check\s+token|risk\s+of)\b/i.test(t)) return "analysis";
  if (/\b(what\s+is|what\s+are|how\s+does|how\s+do|explain|tell\s+me\s+about|define|describe|difference\s+between|compare|why\s+(does|is|are|do)|who\s+(created|built|founded))\b/i.test(t)) return "informational";

  if (hasKnownToken && !hasExecVerb && !hasAmount && !hasOpinionSignal && !hasYieldKeyword) return "price";

  return "unknown";
}
