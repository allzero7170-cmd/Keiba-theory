const STORAGE_KEY = "keibaTheoryAnalysisMemo";
const compiInputs = document.querySelector("#compiInputs");
const form = document.querySelector("#raceForm");
const statusMessage = document.querySelector("#statusMessage");
const savedSummary = document.querySelector("#savedSummary");
const technicalType = document.querySelector("#technicalType");
const autoRecommendation = document.querySelector("#autoRecommendation");

const baseFieldIds = [
  "raceDate",
  "venue",
  "raceNumber",
  "raceName",
  "technicalType",
  "technicalPattern",
  "technicalMemo",
  "classIndex",
  "trainingRating",
  "morningWinRank",
  "morningPlaceRank",
  "quinellaRank",
  "keyCandidates",
  "opponentCandidates",
  "bettingMemo",
];

const fieldIds = [...baseFieldIds];

const technicalRules = {
  1: {
    title: "テクニカル6-1：上位信頼型",
    keyRanks: [1],
    opponentRanks: [2, 3, 4, 5],
    betLabel: "馬連・ワイド",
  },
  2: {
    title: "テクニカル6-2：上位2頭軸型",
    keyRanks: [1, 2],
    opponentRanks: [3, 4, 5, 6],
    betLabel: "三連複2頭軸・馬連",
  },
  3: {
    title: "テクニカル6-3：中穴相手厚め型",
    keyRanks: [1, 3],
    opponentRanks: [2, 4, 5, 6, 7],
    betLabel: "三連複フォーメーション",
  },
  4: {
    title: "テクニカル6-4：波乱警戒型",
    keyRanks: [2, 3],
    opponentRanks: [1, 4, 5, 6, 7, 8],
    betLabel: "ワイド・三連複流し",
  },
  5: {
    title: "テクニカル6-5：穴軸検討型",
    keyRanks: [4, 5],
    opponentRanks: [1, 2, 3, 6, 7, 8],
    betLabel: "ワイド穴流し・複勝",
  },
  6: {
    title: "テクニカル6-6：混戦ボックス型",
    keyRanks: [1, 2, 3],
    opponentRanks: [4, 5, 6, 7, 8, 9, 10],
    betLabel: "馬連ボックス・三連複ボックス",
  },
};

function createCompiFields() {
  for (let rank = 1; rank <= 10; rank += 1) {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "compi-fieldset";

    const legend = document.createElement("legend");
    legend.textContent = `コンピ${rank}位`;

    const numberLabel = document.createElement("label");
    numberLabel.textContent = "馬番";
    const numberInput = document.createElement("input");
    numberInput.type = "number";
    numberInput.id = `compiRank${rank}Number`;
    numberInput.name = `compiRank${rank}Number`;
    numberInput.min = "1";
    numberInput.max = "18";
    numberInput.placeholder = "例：7";
    numberLabel.append(numberInput);

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "馬名";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.id = `compiRank${rank}Name`;
    nameInput.name = `compiRank${rank}Name`;
    nameInput.placeholder = "例：サンプルホース";
    nameLabel.append(nameInput);

    fieldset.append(legend, numberLabel, nameLabel);
    compiInputs.append(fieldset);
    fieldIds.push(numberInput.id, nameInput.id);
  }
}

function collectFormData() {
  return fieldIds.reduce((data, id) => {
    data[id] = document.querySelector(`#${id}`).value.trim();
    return data;
  }, {});
}

function migrateLegacyCompiData(data) {
  if (!data) return data;

  for (let rank = 1; rank <= 10; rank += 1) {
    const legacyValue = data[`compiRank${rank}`];
    const numberKey = `compiRank${rank}Number`;
    const nameKey = `compiRank${rank}Name`;

    if (legacyValue && !data[numberKey] && !data[nameKey]) {
      const numberMatch = legacyValue.match(/\d+/);
      data[numberKey] = numberMatch?.[0] ?? "";
      data[nameKey] = legacyValue.replace(/\d+|番|[-ー:：]/g, "").trim();
    }
  }

  return data;
}

function fillForm(data) {
  const migratedData = migrateLegacyCompiData(data);
  fieldIds.forEach((id) => {
    const field = document.querySelector(`#${id}`);
    field.value = migratedData?.[id] ?? "";
  });
  updateRecommendation();
}

function getHorse(rank) {
  const number = document.querySelector(`#compiRank${rank}Number`)?.value.trim();
  const name = document.querySelector(`#compiRank${rank}Name`)?.value.trim();
  if (!number && !name) return `${rank}位`;
  return [number ? `${number}番` : "馬番未入力", name].filter(Boolean).join(" ");
}

function formatHorses(ranks) {
  return ranks.map(getHorse).join("、");
}

function buildBetSuggestion(rule) {
  const keyNumbers = rule.keyRanks.map((rank) => document.querySelector(`#compiRank${rank}Number`)?.value.trim()).filter(Boolean);
  const opponentNumbers = rule.opponentRanks.map((rank) => document.querySelector(`#compiRank${rank}Number`)?.value.trim()).filter(Boolean);

  if (!keyNumbers.length || !opponentNumbers.length) {
    return `${rule.betLabel}：馬番を入力すると買い目候補を自動作成します。`;
  }

  return `${rule.betLabel}：${keyNumbers.join("・")} - ${opponentNumbers.join("・")}`;
}

function updateRecommendation() {
  const rule = technicalRules[technicalType.value];

  if (!rule) {
    autoRecommendation.innerHTML = `
      <div class="recommendation-row">
        <dt>状態</dt>
        <dd>テクニカル6の番号を選ぶと、コンピ順位から自動で候補を表示します。</dd>
      </div>
    `;
    return;
  }

  autoRecommendation.innerHTML = `
    <div class="recommendation-row">
      <dt>判定タイプ</dt>
      <dd>${rule.title}</dd>
    </div>
    <div class="recommendation-row">
      <dt>軸推奨</dt>
      <dd>${formatHorses(rule.keyRanks)}</dd>
    </div>
    <div class="recommendation-row">
      <dt>相手候補</dt>
      <dd>${formatHorses(rule.opponentRanks)}</dd>
    </div>
    <div class="recommendation-row">
      <dt>買い目候補</dt>
      <dd>${buildBetSuggestion(rule)}</dd>
    </div>
  `;
}

function renderSummary(data) {
  savedSummary.innerHTML = "";

  if (!data || Object.values(data).every((value) => !value)) {
    savedSummary.innerHTML = "<div><dt>状態</dt><dd>保存済みのメモはありません。</dd></div>";
    return;
  }

  const compiTop = [1, 2, 3, 4, 5]
    .map((rank) => `${rank}位: ${[data[`compiRank${rank}Number`] ? `${data[`compiRank${rank}Number`]}番` : "", data[`compiRank${rank}Name`]].filter(Boolean).join(" ") || "-"}`)
    .join("\n");

  const technicalLabel = technicalRules[data.technicalType]?.title ?? "未選択";
  const rows = [
    ["レース", `${data.raceDate || "日付未入力"} ${data.venue || "競馬場未入力"} ${data.raceNumber ? `${data.raceNumber}R` : ""} ${data.raceName || ""}`],
    ["コンピ上位", compiTop],
    ["テクニカル6", [technicalLabel, data.technicalPattern, data.technicalMemo].filter(Boolean).join(" / ") || "-"],
    ["軸候補", data.keyCandidates || "-"],
    ["相手候補", data.opponentCandidates || "-"],
    ["買い目メモ", data.bettingMemo || "-"],
  ];

  rows.forEach(([label, value]) => {
    const wrapper = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    wrapper.append(dt, dd);
    savedSummary.append(wrapper);
  });
}

function saveData() {
  const data = collectFormData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderSummary(data);
  statusMessage.textContent = "保存しました。";
}

function loadData() {
  const rawData = localStorage.getItem(STORAGE_KEY);
  const data = rawData ? JSON.parse(rawData) : null;
  fillForm(data);
  renderSummary(data);
}

createCompiFields();
loadData();

form.addEventListener("input", updateRecommendation);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  saveData();
});

document.querySelector("#clearButton").addEventListener("click", () => {
  fillForm({});
  statusMessage.textContent = "入力欄をクリアしました。保存データは残っています。";
});

document.querySelector("#deleteButton").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  fillForm({});
  renderSummary(null);
  statusMessage.textContent = "保存データを削除しました。";
});
