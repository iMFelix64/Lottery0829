const fakePrizes = [
  ["Hoto吸尘器", "CORDLESS CLEANING KIT"],
  ["网易云音乐会员", "12 MONTHS · VIP"],
  ["Zeekr 7x模型", "COLLECTOR'S SCALE MODEL"],
  ["Nothing Ear 3a", "TRUE WIRELESS AUDIO"],
  ["极空间NAS", "PERSONAL CLOUD STORAGE"]
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const settle = animation => animation.finished.catch(() => {});

const elements = {
  stage: $("#lottery"),
  table: $("#table"),
  envelopes: $("#envelopes"),
  template: $("#envelopeTemplate"),
  status: $("#status"),
  masthead: $(".masthead"),
  reveal: $("#prizeReveal"),
  replay: $("#replay")
};

let running = false;
let runId = 0;

function goldStatus(text) {
  elements.status.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, easing: "ease-out" });
  elements.status.textContent = text;
}

function fanPositions(compact = false) {
  const narrow = innerWidth <= 900;
  const center = (fakePrizes.length - 1) / 2;
  if (narrow) {
    const gap = Math.min(innerWidth * .115, 54);
    return fakePrizes.map((_, i) => {
      const n = i - center;
      return ({
      x: n * gap,
      y: Math.abs(n) * 12 + (compact ? 18 : 0),
      r: n * (compact ? 7 : 4.5),
      z: i
      });
    });
  }
  const gap = Math.min(innerWidth * .112, 174);
  return fakePrizes.map((_, i) => {
    const n = i - center;
    return ({
      x: n * gap,
      y: Math.abs(n) * (compact ? 12 : 7),
      r: n * (compact ? 5.8 : 2.5),
      z: i
    });
  });
}

function t({ x = 0, y = 0, z = 0, rx = 0, ry = 0, r = 0, s = 1 } = {}) {
  return `translate3d(${x}px, ${y}px, ${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${r}deg) scale(${s})`;
}

function buildEnvelopes() {
  elements.envelopes.replaceChildren();
  fakePrizes.forEach(([name, edition], index) => {
    const item = elements.template.content.firstElementChild.cloneNode(true);
    item.dataset.index = index;
    $(".prize-name", item).textContent = name;
    $(".edition", item).textContent = edition;
    $(".serial", item).textContent = `№ 06${String(index + 1).padStart(2, "0")}`;
    item.style.zIndex = String(index + 1);
    item.style.opacity = "0";
    $(".envelope-inner", item).style.transform = "rotateY(180deg)";
    elements.envelopes.append(item);
  });
}

function resetScene() {
  runId += 1;
  document.getAnimations().forEach(animation => animation.cancel());
  buildEnvelopes();
  elements.table.classList.remove("active");
  elements.masthead.classList.remove("muted");
  elements.replay.classList.remove("visible");
  elements.reveal.style.cssText = "";
  $(".prize-art-wrap").style.cssText = "";
  $(".prize-halo").style.cssText = "";
  $(".winner-copy").style.cssText = "";
  $(".prize-glint").style.cssText = "";
}

async function dealCards(id) {
  goldStatus("奖品信封正在入场");
  elements.table.classList.add("active");
  const cards = $$(".envelope");
  const positions = fanPositions(true);
  const deals = cards.map((card, index) => {
    const p = positions[index];
    const side = index < 3 ? -1 : 1;
    const from = t({ x: side * (innerWidth * .38 + 160), y: innerHeight * .66, r: side * (28 + index * 4), s: .82 });
    const anim = card.animate([
      { transform: from, opacity: 0, offset: 0 },
      { opacity: 1, offset: .17 },
      { transform: t({ x: p.x * 1.04, y: p.y - 17, r: p.r * 1.15, s: 1.025 }), opacity: 1, offset: .82 },
      { transform: t(p), opacity: 1, offset: 1 }
    ], {
      duration: 820,
      delay: index * 185,
      easing: "cubic-bezier(.18,.72,.18,1)",
      fill: "forwards"
    });
    return settle(anim);
  });
  await Promise.all(deals);
  if (id !== runId) throw new Error("cancelled");
  await sleep(700);
}

async function gatherAndShuffle(id) {
  goldStatus("信封集合 · 即将混合");
  const cards = $$(".envelope");
  const center = (cards.length - 1) / 2;
  await Promise.all(cards.map((card, index) => settle(card.animate([
    { transform: getComputedStyle(card).transform },
    { transform: t({ x: 0, y: 0, r: (index - center) * 1.2, s: 1 }) }
  ], { duration: 760, delay: Math.abs(index - center) * 35, easing: "cubic-bezier(.65,0,.25,1)", fill: "forwards" }))));
  if (id !== runId) throw new Error("cancelled");

  goldStatus("奖品顺序正在重新排列");
  const reach = Math.min(innerWidth * .105, 126);
  const orders = [
    [0, 4, 1, 3, 2],
    [4, 0, 3, 1, 2],
    [1, 3, 0, 4, 2]
  ];

  // Three quick overhand passes: cards split, travel toward/away from the
  // viewer, cross the opposing packet, then drop back into the stack.
  for (let round = 0; round < orders.length; round += 1) {
    const order = orders[round];
    const pass = cards.map((card, index) => {
      const rank = order.indexOf(index);
      const side = (index + round) % 2 === 0 ? -1 : 1;
      const comesForward = (rank + round) % 2 === 0;
      const depth = comesForward ? 155 : -125;
      const tilt = comesForward ? -7 : 6;
      card.style.zIndex = String(comesForward ? 30 + rank : 10 - rank);

      return settle(card.animate([
        {
          transform: getComputedStyle(card).transform,
          opacity: 1,
          offset: 0
        },
        {
          transform: t({
            x: side * reach * (.68 + rank * .035),
            y: -7 + rank * 4,
            z: depth * .28,
            rx: tilt * .35,
            ry: side * 5,
            r: side * (5 + rank * .8),
            s: comesForward ? 1.025 : .975
          }),
          opacity: comesForward ? 1 : .88,
          offset: .22
        },
        {
          transform: t({
            x: side * reach,
            y: -36 - rank * 2,
            z: depth,
            rx: tilt,
            ry: side * 10,
            r: side * (10 + rank),
            s: comesForward ? 1.075 : .925
          }),
          opacity: comesForward ? 1 : .72,
          offset: .48
        },
        {
          transform: t({
            x: -side * reach * .28,
            y: 14 + rank * 2,
            z: -depth * .72,
            rx: -tilt * .8,
            ry: -side * 6,
            r: -side * 4,
            s: comesForward ? .955 : 1.045
          }),
          opacity: comesForward ? .8 : 1,
          offset: .75
        },
        {
          transform: t({
            x: (rank - center) * 2.4,
            y: rank * 1.5,
            z: (rank - center) * 5,
            r: (rank - center) * .55,
            s: 1
          }),
          opacity: 1,
          offset: 1
        }
      ], {
        duration: 690,
        delay: rank * 58,
        easing: "cubic-bezier(.42,.02,.2,1)",
        fill: "forwards"
      }));
    });

    await Promise.all(pass);
    if (id !== runId) throw new Error("cancelled");
    await sleep(55);
  }

  cards.forEach((card, index) => { card.style.zIndex = String(index + 1); });
  await sleep(320);
}

async function spreadFaceUp(id) {
  goldStatus("所有信封已经就位");
  const cards = $$(".envelope");
  const positions = fanPositions(false);
  await Promise.all(cards.flatMap((card, index) => {
    card.style.zIndex = String(index + 1);
    const inner = $(".envelope-inner", card);
    return [
      settle(card.animate([
        { transform: getComputedStyle(card).transform },
        { transform: t({ ...positions[index], y: positions[index].y - 12 }), offset: .82 },
        { transform: t(positions[index]) }
      ], { duration: 980, delay: index * 42, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" })),
      settle(inner.animate([
        { transform: "rotateY(180deg)" },
        { transform: "rotateY(0deg)" }
      ], { duration: 740, delay: 120 + index * 42, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }))
    ];
  }));
  if (id !== runId) throw new Error("cancelled");
  await sleep(900);
}

async function chooseWinner(id) {
  const cards = $$(".envelope");
  const winnerIndex = Math.floor(cards.length / 2);
  const winner = cards[winnerIndex];
  const winnerInner = $(".envelope-inner", winner);
  const positions = fanPositions(false);
  winner.classList.add("winner");
  $(".prize-name", winner).textContent = "GTA6 Ultimate Edition";
  $(".edition", winner).textContent = "THE GRAND PRIZE · VICE CITY";
  $(".serial", winner).textContent = "№ WINNER · 0006";

  goldStatus("中心信封已被选中");
  elements.masthead.classList.add("muted");
  cards.filter(card => card !== winner).forEach((card, i) => {
    const loserPosition = positions[Number(card.dataset.index)];
    card.animate([
      { filter: getComputedStyle(card).filter, opacity: 1 },
      {
        filter: "grayscale(.25) brightness(.46) blur(.25px)",
        opacity: .42,
        transform: t({ ...loserPosition, y: loserPosition.y + 18, z: -120 - i * 12, s: .92 })
      }
    ], { duration: 760, delay: i * 40, easing: "ease", fill: "forwards" });
  });

  await settle(winner.animate([
    { transform: t(positions[winnerIndex]) },
    { transform: t({ y: -36, z: 260, r: 0, s: 1.16 }) }
  ], { duration: 720, easing: "cubic-bezier(.2,.85,.2,1)", fill: "forwards" }));
  if (id !== runId) throw new Error("cancelled");
  await sleep(360);

  goldStatus("正在揭晓最终奖项");
  await Promise.all([
    settle(winner.animate([
      { transform: t({ y: -36, z: 260, r: 0, s: 1.16 }) },
      { transform: t({ y: -36, z: 260, r: 1080, s: 1.16 }) }
    ], { duration: 2800, easing: "cubic-bezier(.35,.02,.15,1)", fill: "forwards" })),
    settle(winnerInner.animate([
      { transform: "rotateY(0deg) rotateX(0deg)" },
      { transform: "rotateY(1260deg) rotateX(0deg)" }
    ], { duration: 2800, easing: "cubic-bezier(.35,.02,.15,1)", fill: "forwards" }))
  ]);
  if (id !== runId) throw new Error("cancelled");
  await sleep(1150);
  return winner;
}

async function openPrize(winner, id) {
  goldStatus("特别奖品 · 为你开启");
  const flap = $(".flap", winner);
  const current = getComputedStyle(winner).transform;
  await Promise.all([
    settle(winner.animate([
      { transform: current },
      { transform: t({ y: innerWidth <= 900 ? 92 : 118, z: 260, r: 1080, s: innerWidth <= 900 ? 1.12 : 1.28 }) }
    ], { duration: 850, easing: "cubic-bezier(.22,.8,.22,1)", fill: "forwards" })),
    settle(flap.animate([
      { transform: "rotateX(0deg)", filter: "brightness(1)" },
      { transform: "rotateX(-175deg)", filter: "brightness(.66)" }
    ], { duration: 920, delay: 220, easing: "cubic-bezier(.5,0,.2,1)", fill: "forwards" }))
  ]);
  if (id !== runId) throw new Error("cancelled");

  elements.reveal.style.visibility = "visible";
  await Promise.all([
    settle(elements.reveal.animate([
      { opacity: 0, transform: "translate(-50%, 6%) scale(.36)" },
      { opacity: 1, transform: "translate(-50%, -75%) scale(1.04)", offset: .82 },
      { opacity: 1, transform: "translate(-50%, -72%) scale(1)" }
    ], { duration: 1450, easing: "cubic-bezier(.18,.78,.14,1)", fill: "forwards" })),
    settle($(".prize-art-wrap").animate([
      { transform: "rotate(-4deg)", filter: "saturate(.55) brightness(.7)" },
      { transform: "rotate(1.2deg)", filter: "saturate(1.05) brightness(1.04)" }
    ], { duration: 1450, easing: "cubic-bezier(.18,.78,.14,1)", fill: "forwards" })),
    settle($(".prize-halo").animate([
      { opacity: 0, transform: "translate(-50%, -50%) scale(.5)" },
      { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }
    ], { duration: 1500, fill: "forwards" }))
  ]);
  if (id !== runId) throw new Error("cancelled");

  $(".prize-glint").animate([
    { transform: "translateX(-100%)" },
    { transform: "translateX(100%)" }
  ], { duration: 1000, easing: "ease-in-out", fill: "forwards" });
  $(".winner-copy").animate([
    { opacity: 0, transform: innerWidth <= 900 ? "translate(-50%, 5px)" : "translateX(-20px)" },
    { opacity: 1, transform: innerWidth <= 900 ? "translate(-50%, 0)" : "translateX(0)" }
  ], { duration: 900, delay: 350, easing: "ease-out", fill: "forwards" });
  await sleep(950);
  goldStatus("恭喜 · 这份特别礼物属于你");
  elements.replay.classList.add("visible");
}

async function runLottery() {
  if (running) return;
  running = true;
  resetScene();
  const id = runId;
  try {
    await sleep(650);
    await dealCards(id);
    await gatherAndShuffle(id);
    await spreadFaceUp(id);
    const winner = await chooseWinner(id);
    await openPrize(winner, id);
  } catch (error) {
    if (error.message !== "cancelled") console.error(error);
  } finally {
    if (id === runId) running = false;
  }
}

elements.replay.addEventListener("click", () => {
  running = false;
  runLottery();
});

window.addEventListener("resize", () => {
  if (!running && !elements.replay.classList.contains("visible")) buildEnvelopes();
});

runLottery();
