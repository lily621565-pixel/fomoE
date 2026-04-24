const engine = require("./engine.js");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function zh(unicodeLiteral) {
  return JSON.parse(`"${unicodeLiteral}"`);
}

function runConversation(config, inputs) {
  const state = engine.createEmptyConversation(config);
  inputs.forEach((input) => engine.advanceConversation(state, input));
  return state;
}

function scoreConversation(state) {
  const replies = state.conversation.filter((message) => message.role === "mentor");
  const lastReply = replies[replies.length - 1]?.text || "";
  let score = 0;

  if (Object.keys(state.memory.facts).length >= 3) score += 20;
  if (state.turn >= 3 && new Set(replies.map((message) => message.meta)).size >= 2) score += 20;
  if (/真正卡住|核心其實是|你現在一直換說法/.test(lastReply)) score += 15;
  if (/你要|還是/.test(lastReply)) score += 15;
  if (!/\?$/.test(lastReply.trim()) || /你要|還是/.test(lastReply)) score += 10;
  if (lastReply.split("\n\n").length >= 4) score += 10;
  if (state.currentGoals.length >= 4) score += 10;

  return score;
}

const friendState = runConversation(
  {
    scenario: "counter",
    persona: "young_hustler",
    objection: "ask_friends",
    context: zh("\\u0032\\u0031\\u6b72\\uff0c\\u6015\\u5224\\u65b7\\u932f\\uff0c\\u4f46\\u53c8\\u4e0d\\u60f3\\u4e00\\u76f4\\u5c0f\\u6253\\u5c0f\\u9b27\\u3002")
  },
  [
    zh("\\u6211\\u60f3\\u5148\\u554f\\u4e00\\u4e0b\\u670b\\u53cb"),
    zh("\\u56e0\\u70ba\\u6211\\u6015\\u6211\\u81ea\\u5df1\\u5224\\u65b7\\u932f"),
    zh("\\u4f46\\u6211\\u4e5f\\u77e5\\u9053\\u6211\\u4e0d\\u60f3\\u4e00\\u76f4\\u5c0f\\u6253\\u5c0f\\u9b27"),
    zh("\\u6240\\u4ee5\\u4f60\\u76f4\\u63a5\\u8b1b\\u91cd\\u9ede")
  ]
);

const priceState = runConversation(
  {
    scenario: "upgrade",
    persona: "office",
    objection: "too_expensive",
    context: zh("\\u0032\\u0037\\u6b72\\uff0c\\u5f88\\u5728\\u610f CP \\u503c\\uff0c\\u4e5f\\u6015\\u82b1\\u4e86\\u4e4b\\u5f8c\\u5f8c\\u6094\\u3002")
  },
  [
    zh("\\u6211\\u89ba\\u5f97\\u6709\\u9ede\\u8cb4"),
    zh("\\u6211\\u4e0d\\u662f\\u6c92\\u9322\\uff0c\\u6211\\u662f\\u6015\\u82b1\\u932f"),
    zh("\\u800c\\u4e14\\u6211\\u6700\\u8fd1\\u5de5\\u4f5c\\u771f\\u7684\\u5f88\\u5fd9"),
    zh("\\u4f46\\u6211\\u4e5f\\u77e5\\u9053\\u518d\\u62d6\\u4e0b\\u53bb\\u597d\\u50cf\\u6c92\\u6bd4\\u8f03\\u597d")
  ]
);

const testingState = runConversation(
  {
    scenario: "counter",
    persona: "young_hustler",
    objection: "ask_friends",
    context: ""
  },
  [
    zh("\\u4f60\\u6191\\u4ec0\\u9ebc\\u9019\\u6a23\\u8b1b"),
    zh("\\u4f60\\u5148\\u8b1b\\u6e05\\u695a\\u908f\\u8f2f"),
    zh("\\u597d\\uff0c\\u90a3\\u4f60\\u7e7c\\u7e8c")
  ]
);

const friendLast = friendState.conversation[friendState.conversation.length - 1].text;
const priceLast = priceState.conversation[priceState.conversation.length - 1].text;
const testingLast = testingState.conversation[testingState.conversation.length - 1].text;

console.log("FRIEND LAST:");
console.log(friendLast);
console.log("-".repeat(60));
console.log("PRICE LAST:");
console.log(priceLast);
console.log("-".repeat(60));
console.log("TESTING LAST:");
console.log(testingLast);
console.log("-".repeat(60));

assert(friendState.memory.facts.authority === "external", "friend: authority fact missing");
assert(friendState.memory.facts.coreFear === "wrong_decision", "friend: wrong_decision fact missing");
assert(friendState.memory.facts.desire === "strong", "friend: strong desire fact missing");
assert(priceState.memory.facts.priceConcern === "high", "price: price concern fact missing");
assert(priceState.memory.facts.timeConstraint === "high", "price: time fact missing");
assert(friendLast !== priceLast, "friend and price replies should not be identical");
assert(priceLast !== testingLast, "price and testing replies should not be identical");
assert(friendLast !== testingLast, "friend and testing replies should not be identical");

const friendScore = scoreConversation(friendState);
const priceScore = scoreConversation(priceState);
const testingScore = scoreConversation(testingState);
const projectScore = Math.round((friendScore + priceScore + testingScore) / 3);

console.log(`friend score=${friendScore}`);
console.log(`price score=${priceScore}`);
console.log(`testing score=${testingScore}`);
console.log(`project score=${projectScore}`);

assert(projectScore >= 80, `project score below threshold: ${projectScore}`);

console.log("SELF TEST PASSED");
