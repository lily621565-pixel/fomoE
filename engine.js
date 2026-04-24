(function (global) {
  const KNOWLEDGE = {
    scenarios: {
      counter: {
        label: "現場談件",
        opening: "你直接把現在卡住的點丟過來，我不跟你繞。",
        systemGoal: "快速看穿表面抗拒，往成交或真正卡點推進。"
      },
      reservation: {
        label: "預約諮詢",
        opening: "你先講你現在最想確認的是什麼，我先抓核心。",
        systemGoal: "建立資格感與稀缺感，讓對方理解現在不行動的代價。"
      },
      upgrade: {
        label: "高單成交",
        opening: "你直接講你現在最猶豫哪一塊，我不先賣你。",
        systemGoal: "放大不升級的損失，讓方案比較變得清楚。"
      }
    },
    personas: {
      office: {
        label: "理性上班族",
        praise: "你不是沒腦的人，你其實很會算，也很怕自己做了笨決定。",
        selfImage: "精打細算、重視判斷品質"
      },
      owner: {
        label: "老闆",
        praise: "你不是沒資源的人，你只是很討厭把時間浪費在低效的人事物上。",
        selfImage: "講效率、講槓桿、講擴張"
      },
      young_hustler: {
        label: "年輕企圖型",
        praise: "你不是沒野心的人，你其實很想做大，只是現在還在替自己找安全感。",
        selfImage: "有企圖心、重面子、重成長"
      }
    },
    objections: {
      ask_friends: { label: "問朋友", seed: "我想先問一下朋友。" },
      too_expensive: { label: "太貴", seed: "我覺得有點貴。" },
      no_confidence: { label: "沒信心", seed: "我怕我做不起來。" },
      no_time: { label: "沒時間", seed: "我最近真的很忙。" }
    },
    levers: {
      identity: { label: "身份鎖定", summary: "先抬高對方，再讓退縮顯得不一致。" },
      loss: { label: "損失放大", summary: "把拖延與保守翻成未來後悔。" },
      scarcity: { label: "資格稀缺", summary: "讓資源看起來不是隨時都有。" },
      anchor: { label: "方案錨定", summary: "把選項收窄，讓中間方案變合理。" }
    }
  };

  const SECOND_BRAIN = {
    worldview: {
      thesis: "幾乎所有表面問題，底層都不是資訊不夠，而是信心不夠。",
      masterPrinciple: "你很棒，但你不做這個決定就是在糟蹋自己。"
    },
    executionModel: {
      loop: ["覺察問題", "給結果", "反向抓如何達成", "提供具體下一步"],
      rule: "提問不是為了陪聊，是為了蒐集最關鍵的資訊，把對話推到想要的方向。"
    },
    voiceSurface: {
      traits: ["短句", "快判斷", "高密度反問", "先抬高再施壓", "表面鬆實際兇"],
      instruction: "像熟人直接點破，不像客服朗讀腳本。"
    }
  };

  function hashString(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function pick(list, seed) {
    return list[Math.abs(seed) % list.length];
  }

  function hasAny(text, patterns) {
    return patterns.some((pattern) => pattern.test(text));
  }

  function detectObjection(text, fallback) {
    const input = normalizeText(text);

    if (hasAny(input, [/朋友/, /問一下/, /參考一下/, /家人/, /別人怎麼看/])) return "ask_friends";
    if (hasAny(input, [/太貴/, /有點貴/, /預算/, /花錯/, /c\s*p\s*值/i, /CP 值/, /不划算/])) return "too_expensive";
    if (hasAny(input, [/沒信心/, /怕做不起來/, /怕自己不行/, /我不確定/, /沒把握/, /怕判斷錯/])) return "no_confidence";
    if (hasAny(input, [/很忙/, /沒時間/, /最近忙/, /之後再說/, /現在不方便/, /排不進去/])) return "no_time";
    return fallback || "no_confidence";
  }

  function detectMove(text) {
    const input = normalizeText(text);

    if (hasAny(input, [/朋友/, /家人/, /再問一下/, /別人怎麼看/])) return "borrow_judgment";
    if (hasAny(input, [/先看看/, /再想想/, /之後再說/, /改天/, /等等看/])) return "stalling";
    if (hasAny(input, [/太貴/, /有點貴/, /預算/, /花錯/, /不划算/, /c\s*p\s*值/i, /CP 值/])) return "price_guard";
    if (hasAny(input, [/沒信心/, /怕自己不行/, /怕判斷錯/, /沒把握/, /我不確定/])) return "self_doubt";
    if (hasAny(input, [/很忙/, /沒時間/, /最近忙/, /排不進去/])) return "time_shield";
    if (hasAny(input, [/憑什麼/, /你先講清楚/, /你為什麼這樣說/, /你的邏輯是什麼/])) return "testing";
    if (hasAny(input, [/先不要/, /算了/, /沒興趣/, /我再看看/, /先這樣/])) return "withdraw";
    return "open_loop";
  }

  function extractFacts(text) {
    const input = normalizeText(text);
    const facts = {};

    if (hasAny(input, [/朋友/, /家人/, /別人怎麼看/, /問一下/])) facts.authority = "external";
    if (hasAny(input, [/我自己決定/, /我自己來/, /我自己扛/, /我自己選/, /我自己判斷就好/])) facts.authority = "self";

    if (hasAny(input, [/太貴/, /有點貴/, /預算/, /花錯/, /不划算/, /c\s*p\s*值/i, /CP 值/])) facts.priceConcern = "high";
    if (hasAny(input, [/不是沒錢/, /錢不是問題/, /價格還好/])) facts.priceConcern = "manageable";

    if (hasAny(input, [/沒信心/, /怕自己不行/, /怕判斷錯/, /沒把握/, /我不確定/])) facts.confidence = "low";
    if (hasAny(input, [/其實我也知道可以/, /我知道我其實做得到/, /我應該可以/])) facts.confidence = "recovering";

    if (hasAny(input, [/沒時間/, /很忙/, /最近忙/, /排不進去/, /之後再說/])) facts.timeConstraint = "high";
    if (hasAny(input, [/可以排時間/, /擠得出來/, /時間可以喬/])) facts.timeConstraint = "workable";

    if (hasAny(input, [/想賺/, /做大/, /翻轉/, /變好/, /往上/, /不想.*小打小鬧/, /不要一直這樣/, /想做出成績/])) {
      facts.desire = "strong";
    }
    if (hasAny(input, [/試試看/, /先了解/, /看看而已/])) facts.desire = "soft";

    if (hasAny(input, [/怕花錯/, /怕判斷錯/, /選錯/, /看走眼/, /做錯決定/])) facts.coreFear = "wrong_decision";
    if (hasAny(input, [/怕自己不行/, /怕做不起來/, /怕撐不住/, /怕沒有結果/])) facts.coreFear = "not_enough";

    return facts;
  }

  function mergeFacts(memory, facts) {
    Object.entries(facts).forEach(([key, value]) => {
      if (key === "priceConcern" && memory.facts.priceConcern === "high" && value === "manageable") {
        return;
      }
      memory.facts[key] = value;
    });
  }

  function updateObjectionWeights(memory, objection) {
    memory.objectionWeights[objection] = (memory.objectionWeights[objection] || 0) + 1;
  }

  function dominantObjection(memory) {
    return Object.entries(memory.objectionWeights)
      .sort((left, right) => right[1] - left[1])[0]?.[0] || "no_confidence";
  }

  function inferHiddenFear(facts, objection) {
    if (facts.coreFear === "wrong_decision") return "你怕選錯，最後證明自己判斷不行。";
    if (facts.coreFear === "not_enough") return "你怕自己撐不起來，最後證明自己沒有你想像中那麼強。";
    if (objection === "ask_friends") return "你怕自己扛錯，所以想借別人的嘴巴替你背書。";
    if (objection === "too_expensive") return "你怕錢出去之後，換來的是後悔。";
    if (objection === "no_time") return "你不是沒空，你是怕一排進去就得真的面對。";
    return "你不是不想，只是還沒敢把自己推到真正會改變的位置。";
  }

  function inferReadiness(state, move) {
    const facts = state.memory.facts;

    if (move === "withdraw") return "retreating";
    if (move === "testing") return "testing";
    if (facts.desire === "strong" && (facts.confidence === "recovering" || state.turn >= 4)) return "closeable";
    if (state.turn >= 4) return "challengeable";
    return "warm";
  }

  function inferPsychology(state, userText) {
    const objection = detectObjection(userText, state.objection);
    const move = detectMove(userText);
    const facts = extractFacts(userText);

    mergeFacts(state.memory, facts);
    updateObjectionWeights(state.memory, objection);
    const rootObjection = dominantObjection(state.memory);

    return {
      objection: rootObjection,
      surfaceObjection: objection,
      move,
      hiddenFear: inferHiddenFear(state.memory.facts, rootObjection),
      readiness: inferReadiness(state, move),
      decisionStyle: state.memory.facts.authority === "external" ? "容易借外部判斷壓低自己的責任感。" : "比較想自己扛，但怕扛錯。",
      selfImage: KNOWLEDGE.personas[state.persona].selfImage
    };
  }

  function choosePhase(state, psychology) {
    if (state.turn <= 1) return "opening";
    if (psychology.readiness === "testing") return "probe";
    if (state.turn <= 2) return "probe";
    if (psychology.readiness === "closeable" || state.turn >= 5) return "close";
    return "pressure";
  }

  function chooseLever(state, psychology) {
    if (state.scenario === "reservation" && state.turn <= 2) return "scarcity";
    if (psychology.readiness === "closeable") return "anchor";
    if (psychology.objection === "ask_friends") return state.turn >= 3 ? "loss" : "identity";
    if (psychology.objection === "too_expensive") return state.turn >= 3 ? "anchor" : "loss";
    if (psychology.objection === "no_time") return state.turn >= 3 ? "loss" : "identity";
    if (psychology.move === "testing") return "identity";
    return state.turn >= 3 ? "anchor" : "identity";
  }

  function computeGoals(state, psychology) {
    return [
      `表面抗拒：${KNOWLEDGE.objections[psychology.objection].label}`,
      `最新訊號：${KNOWLEDGE.objections[psychology.surfaceObjection || psychology.objection].label}`,
      `主槓桿：${KNOWLEDGE.levers[state.currentLever].label}`,
      `隱藏恐懼：${psychology.hiddenFear}`
    ];
  }

  function updateAgenda(state, psychology) {
    const facts = state.memory.facts;

    if (psychology.move === "testing") return "establish-authority";
    if (!facts.coreFear && state.turn <= 2) return "name-the-real-fear";
    if (!facts.authority && psychology.objection === "ask_friends") return "find-authority";
    if (!facts.priceConcern && psychology.objection === "too_expensive") return "find-cost-fear";
    if (!facts.timeConstraint && psychology.objection === "no_time") return "find-priority-gap";
    if (state.currentLever === "anchor") return "narrow-choice";
    if (state.currentLever === "loss") return "amplify-regret";
    return "lock-identity";
  }

  function maybeQuestion(state, psychology) {
    const facts = state.memory.facts;
    const agenda = state.agenda;
    const move = psychology.move;

    if (agenda === "find-authority") {
      return "你問朋友，是因為他們真的比較懂，還是因為你想讓自己不用扛錯？";
    }
    if (agenda === "find-cost-fear") {
      return "你現在怕的是錢出去，還是怕花完之後證明自己看走眼？";
    }
    if (agenda === "find-priority-gap") {
      return "你是真的排不進去，還是這件事在你心裡還沒重要到值得你動？";
    }
    if (agenda === "name-the-real-fear" && state.turn <= 2) {
      return "你現在比較怕哪個：做錯決定，還是證明自己其實沒有你想像中那麼行？";
    }
    if (move === "testing") {
      return "你要我講更白，我就會更白。你現在要的是邏輯，還是要結果？";
    }
    if (state.turn <= 2 && !facts.desire) {
      return "你先講白，你是真的不想要，還是其實很想，只是怕自己接不住？";
    }
    return "";
  }

  function openingLine(state, psychology, userText) {
    const persona = KNOWLEDGE.personas[state.persona];
    const seed = hashString(userText + state.turn);

    if (psychology.move === "testing") {
      return pick([
        "可以，我不跟你裝玄。",
        "好，那我就直接講邏輯。",
        "行，那我不用安慰版，直接進核心。"
      ], seed);
    }

    return pick([
      "我先直接抓你現在這句背後的東西。",
      "你這句表面很合理，但核心不是這個。",
      `${persona.praise} 所以我不會把你現在這句當成最後答案。`
    ], seed);
  }

  function mirrorLine(state, psychology) {
    const seed = hashString(`${state.turn}-${psychology.move}-${state.currentLever}`);
    const lines = {
      borrow_judgment: [
        "你會先問朋友，不是因為朋友比較會，而是你想把責任分出去。",
        "你這句不是在找答案，你是在找一個可以讓你安心退後的人。",
        "你不是缺意見，你是想借別人的嘴巴，讓你之後不用怪自己。"
      ],
      price_guard: [
        "你現在不是單純嫌貴，你是在防自己買完之後後悔。",
        "你嘴巴說價格，心裡其實在守判斷權。",
        "你現在守的不是錢，是你不想承認自己可能會看走眼。"
      ],
      self_doubt: [
        "你不是沒有想做，你是怕一做就要面對自己到底行不行。",
        "你現在這句不是客觀評估，是信心在往後縮。",
        "你其實不是想退出，你是怕一進去就要拿結果交代。"
      ],
      time_shield: [
        "你現在拿時間當理由，通常不是因為真的沒空，是因為這樣最安全。",
        "忙只是外殼，真正讓你沒動的是你還不想承擔後果。",
        "你把這件事往後放，不是因為不能做，是因為還沒逼自己做。"
      ],
      testing: [
        "你現在不是在拒絕，你是在測我到底有沒有看穿你。",
        "你這句不是反對，是試探。",
        "你在看我會不會被你一句話就帶走。"
      ],
      stalling: [
        "你每說一次再看看，都是在幫自己延長舒服期。",
        "你不是沒想法，你是在替拖延找比較好聽的名字。",
        "你現在這句很像理性，實際上是在保留退路。"
      ],
      withdraw: [
        "你現在是在縮，不是在解決。",
        "你這句如果收掉，等於又回到原本那個不敢碰核心的位置。",
        "你現在不是不懂，你是在往後退。"
      ],
      open_loop: [
        "你講的點我有收到，但真正要拆的不是字面。",
        "我先不順著你表面這句走，因為真正卡住的通常不在這裡。",
        "這句我聽到了，但我更在意的是你為什麼會用這個角度講。"
      ]
    };

    return pick(lines[psychology.move] || lines.open_loop, seed);
  }

  function memoryLine(state) {
    const facts = state.memory.facts;
    const fragments = [];

    if (facts.authority === "external") fragments.push("你很容易把最後一票交給外部");
    if (facts.priceConcern === "high") fragments.push("你很怕花錯");
    if (facts.confidence === "low") fragments.push("你現在信心偏低");
    if (facts.timeConstraint === "high") fragments.push("你會用忙來保護自己");
    if (facts.desire === "strong") fragments.push("但你其實不甘心一直小打小鬧");

    if (!fragments.length) return "";
    return `我現在看到的輪廓是：${fragments.join("、")}。`;
  }

  function leverLine(state, psychology) {
    const persona = KNOWLEDGE.personas[state.persona];
    const seed = hashString(`${state.currentLever}-${state.turn}-${psychology.objection}`);
    const lines = {
      identity: [
        `${persona.praise} 你不是那種完全沒料的人，所以你現在這種退法才會特別可惜。`,
        `你本來就不是差的人，所以你現在如果繼續縮，反而跟你想成為的樣子對不上。`,
        `我先把你放回高一點的位置看，你其實沒有爛到要一直借口保護自己。`
      ],
      loss: [
        "你現在保住的是當下舒服，但你正在丟掉後面本來能拿的槓桿。",
        "拖延看起來沒損失，可真正貴的是你之後想到自己當時縮掉會很嘔。",
        "你現在不是在省，你是在把未來可能翻上去的空間先砍掉。"
      ],
      scarcity: [
        "這種資源不是你想好再來永遠都在，所以你現在的慢，不是中立，是在放掉資格。",
        "你以為只是先等等，可市場不會因為你還在想，就幫你把位置留著。",
        "有些東西之所以有價值，就是因為不是隨時想拿都有。"
      ],
      anchor: [
        "所以現在重點不是要不要，而是你要用哪個版本進。",
        "我不跟你談空話，現在差別只剩你要保守進，還是直接用有槓桿的版本進。",
        "你現在不是資訊不足，你只是還沒決定要不要選對自己比較有利的那個版本。"
      ]
    };

    return pick(lines[state.currentLever], seed);
  }

  function fearLine(state, psychology) {
    const seed = hashString(`${psychology.hiddenFear}-${state.turn}`);
    return pick([
      `你真正卡住的不是表面這句，而是「${psychology.hiddenFear.replace(/。$/, "")}」`,
      `所以我不會跟你繞字面，因為核心其實是「${psychology.hiddenFear.replace(/。$/, "")}」`,
      `你現在一直換說法，其實都在繞同一件事：「${psychology.hiddenFear.replace(/。$/, "")}」`
    ], seed);
  }

  function closeLine(state, psychology) {
    const move = psychology.move;
    const seed = hashString(`${move}-${state.turn}-${state.currentLever}`);
    const lines = {
      borrow_judgment: [
        "所以你現在要繼續把人生交給朋友評分，還是自己扛一次？",
        "那你現在要的是別人的允許，還是你自己的答案？",
        "你要不要先別演成在蒐集意見，直接承認你是在怕？"
      ],
      price_guard: [
        "那你現在要繼續保護錢，還是保護你之後不要後悔？",
        "你要省眼前這一下，還是省未來那種想到就不爽的感覺？",
        "所以你現在想當的是精明的人，還是只想先不痛的人？"
      ],
      self_doubt: [
        "那你現在是要繼續留在安全區，還是證明一次你沒有嘴巴那麼小？",
        "你要我陪你繞，還是直接把你推進去？",
        "那你現在到底是要保住面子，還是拿結果？"
      ],
      time_shield: [
        "所以你要繼續拿忙當盾，還是真的排一個位置給改變？",
        "你現在是沒時間，還是還沒把自己逼到願意挪時間？",
        "那你是打算再忙三個月，還是現在就讓這件事進表？"
      ],
      testing: [
        "邏輯我已經擺在這了，現在你是要繼續測，還是進下一步？",
        "你要的是被我說服，還是你自己終於肯承認我講的是對的？",
        "我可以繼續拆，但最後還是要回到你敢不敢動。"
      ],
      withdraw: [
        "你現在收掉，我就當你不是想清楚，是又退回去了。",
        "可以退，但你要知道你退的不是這件事，你退的是你想要的那個版本自己。",
        "你如果現在收，我不會說你沒機會，我只會說你又一次放過自己。"
      ],
      stalling: [
        "那你現在要拖，還是直接把這件事定下來？",
        "你要舒服幾天，還是乾脆讓自己往前一次？",
        "所以你現在是要再延，還是要結束這種一直想卻不動的狀態？"
      ],
      open_loop: [
        "講到這裡其實已經夠白了，所以你現在要繼續分析，還是直接定版本？",
        "我現在可以繼續拆，但最後還是要回到你到底動不動。你選哪個？",
        "所以你現在要我陪你繞，還是陪你把這件事定下來？"
      ]
    };

    return pick(lines[move] || lines.open_loop, seed);
  }

  function buildMentorReply(state, userText) {
    const psychology = state.psychology;
    const lines = [];
    const question = maybeQuestion(state, psychology);
    const seed = hashString(`${userText}-${state.turn}`);

    lines.push(openingLine(state, psychology, userText));
    lines.push(mirrorLine(state, psychology));

    const memory = memoryLine(state);
    if (memory && (state.turn >= 2 || psychology.move !== "testing")) {
      lines.push(memory);
    }

    lines.push(leverLine(state, psychology));

    if (state.turn >= 2 || psychology.move === "testing") {
      lines.push(fearLine(state, psychology));
    }

    if (question && (state.turn <= 2 || psychology.move === "testing")) {
      lines.push(question);
      state.memory.lastQuestion = question;
    } else {
      if (state.currentLever === "anchor") {
        lines.push(pick([
          "我現在不跟你談要不要，我只跟你談你要選保守版本，還是會贏的版本。",
          "方案這件事不用再神化，真正差別只在你要不要替自己選更有利的那個。",
          "你現在其實已經不是缺資訊，你只是還沒把選項收窄。"
        ], seed));
      }
      lines.push(closeLine(state, psychology));
    }

    return lines.join("\n\n");
  }

  function markAnswered(memory, facts) {
    if (facts.authority) memory.answered.authority = true;
    if (facts.priceConcern) memory.answered.price = true;
    if (facts.confidence) memory.answered.confidence = true;
    if (facts.timeConstraint) memory.answered.time = true;
    if (facts.desire) memory.answered.desire = true;
  }

  function addMessage(state, role, text, meta) {
    state.conversation.push({ role, text, meta: meta || "" });
  }

  function createState(config) {
    const state = {
      scenario: config.scenario || "counter",
      persona: config.persona || "young_hustler",
      objection: config.objection || "ask_friends",
      context: config.context || "",
      turn: 0,
      phase: "opening",
      currentLever: "identity",
      currentGoals: [],
      agenda: "name-the-real-fear",
      psychology: null,
      conversation: [],
      memory: {
        facts: {},
        answered: {
          authority: false,
          price: false,
          confidence: false,
          time: false,
          desire: false
        },
        objectionWeights: {
          [config.objection || "ask_friends"]: 2
        },
        lastQuestion: ""
      }
    };

    if (state.context) {
      const contextFacts = extractFacts(state.context);
      mergeFacts(state.memory, contextFacts);
      markAnswered(state.memory, contextFacts);
    }

    return state;
  }

  function evaluateState(state, text) {
    const freshFacts = extractFacts(text);
    markAnswered(state.memory, freshFacts);
    state.psychology = inferPsychology(state, text);
    state.objection = state.psychology.objection;
    state.phase = choosePhase(state, state.psychology);
    state.currentLever = chooseLever(state, state.psychology);
    state.agenda = updateAgenda(state, state.psychology);
    state.currentGoals = computeGoals(state, state.psychology);
  }

  function createEmptyConversation(config) {
    return createState(config || {});
  }

  function startConversation(config) {
    return createState(config || {});
  }

  function advanceConversation(state, userText) {
    const trimmed = normalizeText(userText);
    if (!trimmed) return state;

    addMessage(state, "user", trimmed);
    state.turn += 1;
    evaluateState(state, trimmed);
    addMessage(state, "mentor", buildMentorReply(state, trimmed), KNOWLEDGE.levers[state.currentLever].label);

    return state;
  }

  function exportTranscript(state) {
    return state.conversation
      .map((message) => `${message.role === "mentor" ? "fomoE" : "你"}：${message.text}`)
      .join("\n\n");
  }

  const api = {
    KNOWLEDGE,
    SECOND_BRAIN,
    createState,
    createEmptyConversation,
    startConversation,
    advanceConversation,
    exportTranscript,
    inferPsychology,
    chooseLever,
    computeGoals
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.FomoMentorEngine = api;
}(typeof window !== "undefined" ? window : globalThis));
