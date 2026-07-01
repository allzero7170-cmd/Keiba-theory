const STORAGE_KEY = "keibaTheoryAnalysisMemo";
const COMPI_RANK_COUNT = 10;

const compiInputs = document.querySelector("#compiInputs");
const form = document.querySelector("#raceForm");
const statusMessage = document.querySelector("#statusMessage");
const savedSummary = document.querySelector("#savedSummary");
const runnersCountInput = document.querySelector("#runnersCount");
const classIndexInput = document.querySelector("#classIndex");

const CLASS_BASE_VALUES = {
  5: [86, 70, 65, 53, 45],
  6: [84, 72, 63, 56, 51, 43],
  7: [83, 72, 64, 57, 52, 48, 43],
  8: [83, 71, 64, 58, 54, 50, 47, 42],
  9: [82, 71, 64, 58, 55, 52, 49, 46, 42],
  10: [82, 71, 64, 58, 55, 53, 50, 48, 45, 41],
  11: [82, 71, 64, 59, 56, 54, 51, 49, 47, 44, 41],
  12: [81, 70, 64, 59, 56, 54, 52, 50, 48, 46, 43, 40],
  13: [81, 70, 63, 59, 56, 54, 52, 50, 48, 47, 44, 42, 40],
  14: [81, 70, 63, 59, 56, 54, 52, 50, 49, 47, 45, 43, 42, 40],
  15: [80, 70, 63, 59, 56, 54, 52, 51, 49, 48, 46, 45, 43, 41, 40],
  16: [80, 70, 63, 59, 56, 54, 52, 51, 49, 48, 47, 45, 44, 42, 41, 40],
  17: [80, 70, 63, 59, 56, 54, 53, 51, 50, 48, 47, 46, 45, 44, 42, 41, 40],
  18: [79, 70, 63, 59, 56, 55, 53, 51, 50, 49, 48, 47, 46, 44, 43, 42, 41, 40],
};

const fieldIds = [
  "raceDate",
  "venue",
  "raceNumber",
  "runnersCount",
  "raceName",
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

function createCompiFields() {
  for (let rank = 1; rank <= COMPI_RANK_COUNT; rank += 1) {
    const card = document.createElement("div");
    card.className = "compi-rank-card";
    card.innerHTML = `
      <div class="rank-title">コンピ${rank}位</div>
      <label>
        馬番・馬名
        <input type="text" id="compiRank${rank}" name="compiRank${rank}" placeholder="例：7 サンプルホース" />
      </label>
      <label>
        コンピ指数
        <input type="number" id="compiScore${rank}" name="compiScore${rank}" min="0" max="100" placeholder="例：60" />
      </label>
      <div class="class-result" aria-live="polite">
        <span>基準値：<output id="baseValue${rank}">-</output></span>
        <span>階級指数：<output id="classScore${rank}" class="class-score">-</output></span>
        <span id="classJudge${rank}" class="class-judge">出走頭数と指数を入力</span>
      </div>
    `;

    compiInputs.append(card);
    fieldIds.push(`compiRank${rank}`, `compiScore${rank}`);
  }
}

function getRunnersCount() {
  const value = Number.parseInt(runnersCountInput.value, 10);
  return Number.isInteger(value) ? value : null;
}

function getBaseValue(rank) {
  const runnersCount = getRunnersCount();
  const baseValues = runnersCount ? CLASS_BASE_VALUES[runnersCount] : null;
  return baseValues?.[rank - 1] ?? null;
}

function getCompiScore(rank) {
  const rawValue = document.querySelector(`#compiScore${rank}`).value.trim();
  if (!rawValue) return null;

  const score = Number(rawValue);
  return Number.isFinite(score) ? score : null;
}

function formatSigned(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function getClassJudge(classIndex) {
  if (classIndex >= 5) return "特注＋";
  if (classIndex >= 3) return "強め＋";
  if (classIndex >= 1) return "プラス";
  if (classIndex === 0) return "基準";
  if (classIndex <= -3) return "弱め";
  return "マイナス";
}

function setClassScoreStyle(output, classIndex) {
  output.className = "class-score";
  if (classIndex >= 3) {
    output.classList.add("strong-plus");
  } else if (classIndex > 0) {
    output.classList.add("plus");
  } else if (classIndex < 0) {
    output.classList.add("minus");
  }
}

function updateClassIndexes() {
  const summaries = [];

  for (let rank = 1; rank <= COMPI_RANK_COUNT; rank += 1) {
    const horse = document.querySelector(`#compiRank${rank}`).value.trim();
    const compiScore = getCompiScore(rank);
    const baseValue = getBaseValue(rank);
    const baseOutput = document.querySelector(`#baseValue${rank}`);
    const scoreOutput = document.querySelector(`#classScore${rank}`);
    const judgeOutput = document.querySelector(`#classJudge${rank}`);

    baseOutput.textContent = baseValue ?? "-";

    if (compiScore === null || baseValue === null) {
      scoreOutput.textContent = "-";
      scoreOutput.className = "class-score";
      judgeOutput.textContent = baseValue === null ? "出走頭数を入力" : "指数を入力";
      judgeOutput.className = "class-judge";

      if (horse || compiScore !== null) {
        summaries.push(`${rank}位 ${horse || "馬名未入力"}: 未計算`);
      }
      continue;
    }

    const classIndex = compiScore - baseValue;
    const signedClassIndex = formatSigned(classIndex);
    const judge = getClassJudge(classIndex);

    scoreOutput.textContent = signedClassIndex;
    setClassScoreStyle(scoreOutput, classIndex);
    judgeOutput.textContent = judge;
    judgeOutput.className = "class-judge filled";

    if (horse || compiScore !== null) {
      summaries.push(`${rank}位 ${horse || "馬名未入力"}: ${signedClassIndex}（指数${compiScore}/基準${baseValue}）`);
    }
  }

  classIndexInput.value = summaries.join(", ");
}

function collectFormData() {
  updateClassIndexes();
  return fieldIds.reduce((data, id) => {
    data[id] = document.querySelector(`#${id}`).value.trim();
    return data;
  }, {});
}

function fillForm(data) {
  fieldIds.forEach((id) => {
    const field = document.querySelector(`#${id}`);
    field.value = data?.[id] ?? "";
  });
  updateClassIndexes();
}

function renderSummary(data) {
  savedSummary.innerHTML = "";

  if (!data || Object.values(data).every((value) => !value)) {
    savedSummary.innerHTML = "<div><dt>状態</dt><dd>保存済みのメモはありません。</dd></div>";
    return;
  }

  const rows = [
    ["レース", `${data.raceDate || "日付未入力"} ${data.venue || "競馬場未入力"} ${data.raceNumber ? `${data.raceNumber}R` : ""} ${data.raceName || ""}`],
    ["出走頭数", data.runnersCount ? `${data.runnersCount}頭` : "-"],
    ["コンピ上位", [1, 2, 3, 4, 5].map((rank) => `${rank}位: ${data[`compiRank${rank}`] || "-"}${data[`compiScore${rank}`] ? ` / 指数${data[`compiScore${rank}`]}` : ""}`).join("\n")],
    ["階級指数", data.classIndex || "-"],
    ["テクニカル6", [data.technicalPattern, data.technicalMemo].filter(Boolean).join(" / ") || "-"],
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

compiInputs.addEventListener("input", updateClassIndexes);
compiInputs.addEventListener("change", updateClassIndexes);
runnersCountInput.addEventListener("input", updateClassIndexes);
runnersCountInput.addEventListener("change", updateClassIndexes);

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
