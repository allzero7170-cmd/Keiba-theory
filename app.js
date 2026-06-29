const STORAGE_KEY = "keibaTheoryAnalysisMemo";
const compiInputs = document.querySelector("#compiInputs");
const form = document.querySelector("#raceForm");
const statusMessage = document.querySelector("#statusMessage");
const savedSummary = document.querySelector("#savedSummary");

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

function collectFormData() {
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
loadData();

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
