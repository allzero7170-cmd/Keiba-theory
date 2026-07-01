const STORAGE_KEY = "keibaTheoryAnalysisMemo";
const compiInputs = document.querySelector("#compiInputs");
const form = document.querySelector("#raceForm");
const statusMessage = document.querySelector("#statusMessage");
const savedSummary = document.querySelector("#savedSummary");
const classIndexRows = document.querySelector("#classIndexRows");
const addClassRowButton = document.querySelector("#addClassRowButton");

const CLASS_INDEX_ROW_COUNT = 6;
const CLASS_SCORES = {
  maiden: 40,
  oneWin: 50,
  twoWin: 60,
  threeWin: 70,
  open: 80,
  g3: 90,
  g2: 95,
  g1: 100,
};

const fieldIds = [
  "raceDate",
  "venue",
  "raceNumber",
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
  for (let rank = 1; rank <= 10; rank += 1) {
    const label = document.createElement("label");
    label.textContent = `コンピ${rank}位`;

    const input = document.createElement("input");
    input.type = "text";
    input.id = `compiRank${rank}`;
    input.name = `compiRank${rank}`;
    input.placeholder = "馬番・馬名";

    label.append(input);
    compiInputs.append(label);
    fieldIds.push(input.id);
  }
}

function createClassIndexRow(index) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="number" min="1" max="18" id="classHorseNumber${index}" aria-label="${index}行目の馬番" /></td>
    <td><input type="text" id="classHorseName${index}" aria-label="${index}行目の馬名" placeholder="馬名" /></td>
    <td>
      <select id="classGrade${index}" aria-label="${index}行目のクラス">
        <option value="">選択</option>
        <option value="maiden">新馬/未勝利</option>
        <option value="oneWin">1勝</option>
        <option value="twoWin">2勝</option>
        <option value="threeWin">3勝</option>
        <option value="open">OP/L</option>
        <option value="g3">G3</option>
        <option value="g2">G2</option>
        <option value="g1">G1</option>
      </select>
    </td>
    <td><input type="number" min="1" max="18" id="classFinish${index}" aria-label="${index}行目の着順" /></td>
    <td><input type="number" min="0" step="0.1" id="classMargin${index}" aria-label="${index}行目の着差" placeholder="秒" /></td>
    <td><output id="classScore${index}" aria-label="${index}行目の階級指数">-</output></td>
  `;
  classIndexRows.append(row);
  ["classHorseNumber", "classHorseName", "classGrade", "classFinish", "classMargin"].forEach((prefix) => {
    fieldIds.push(`${prefix}${index}`);
  });
}

function createClassIndexRows(count = CLASS_INDEX_ROW_COUNT) {
  for (let index = 1; index <= count; index += 1) {
    createClassIndexRow(index);
  }
}

function calculateClassIndex(rowNumber) {
  const grade = document.querySelector(`#classGrade${rowNumber}`).value;
  const finish = Number(document.querySelector(`#classFinish${rowNumber}`).value);
  const margin = Number(document.querySelector(`#classMargin${rowNumber}`).value || 0);

  if (!grade || !finish) return null;

  const finishBonus = Math.max(0, 10 - finish) / 2;
  const marginPenalty = margin * 2;
  return CLASS_SCORES[grade] + finishBonus - marginPenalty;
}

function getClassRowCount() {
  return classIndexRows.children.length;
}

function updateClassIndexes() {
  const summaries = [];

  Array.from(classIndexRows.children).forEach((_, index) => {
    const rowNumber = index + 1;
    const score = calculateClassIndex(rowNumber);
    const output = document.querySelector(`#classScore${rowNumber}`);
    output.value = score === null ? "-" : score.toFixed(1);
    output.textContent = output.value;

    const horseNumber = document.querySelector(`#classHorseNumber${rowNumber}`).value.trim();
    const horseName = document.querySelector(`#classHorseName${rowNumber}`).value.trim();
    if (score !== null && (horseNumber || horseName)) {
      summaries.push(`${horseNumber || horseName}: ${score.toFixed(1)}`);
    }
  });

  document.querySelector("#classIndex").value = summaries.join(", ");
}

function collectFormData() {
  updateClassIndexes();
  return fieldIds.reduce((data, id) => {
    data[id] = document.querySelector(`#${id}`).value.trim();
    return data;
  }, { classIndexRowCount: String(getClassRowCount()) });
}

function fillForm(data) {
  const savedRowCount = Number(data?.classIndexRowCount || CLASS_INDEX_ROW_COUNT);
  while (getClassRowCount() < savedRowCount) {
    createClassIndexRow(getClassRowCount() + 1);
  }

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
    ["コンピ上位", [1, 2, 3, 4, 5].map((rank) => `${rank}位: ${data[`compiRank${rank}`] || "-"}`).join("\n")],
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
createClassIndexRows();
loadData();

classIndexRows.addEventListener("input", updateClassIndexes);
classIndexRows.addEventListener("change", updateClassIndexes);

addClassRowButton.addEventListener("click", () => {
  createClassIndexRow(classIndexRows.children.length + 1);
});

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
