const STORAGE_KEY = "keibaTheoryAnalysisMemo";
const COMPI_RANK_COUNT = 10;

const compiInputs = document.querySelector("#compiInputs");
const form = document.querySelector("#raceForm");
const statusMessage = document.querySelector("#statusMessage");
const savedSummary = document.querySelector("#savedSummary");
const runnersCountInput = document.querySelector("#runnersCount");
const classIndexInput = document.querySelector("#classIndex");
const scoreSummaryInput = document.querySelector("#scoreSummary");
const autoAxisCandidatesInput = document.querySelector("#autoAxisCandidates");
const autoOpponentCandidatesInput = document.querySelector("#autoOpponentCandidates");

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

const COMPI_RANK_POINTS = [22, 19, 16, 13, 10, 7, 5, 3, 2, 1];

const TRAINING_POINTS = {
  "SS": 15,
  "S": 13,
  "A+": 12,
  "A": 10,
  "B+": 7,
  "B": 4,
  "C": 0,
  "D": -4,
  "◎": 10,
  "○": 6,
  "△": 3,
  "×": -4,
};

const fieldIds = [
  "raceDate",
  "venue",
  "raceNumber",
  "runnersCount",
  "raceName",
  "classIndex",
  "scoreSummary",
  "autoAxisCandidates",
  "autoOpponentCandidates",
  "irregularMemo",
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
      <div class="grid mini-grid">
        <label>
          朝イチ単勝順位
          <input type="number" id="morningWinRank${rank}" name="morningWinRank${rank}" min="1" max="18" placeholder="例：3" />
        </label>
        <label>
          朝イチ複勝順位
          <input type="number" id="morningPlaceRank${rank}" name="morningPlaceRank${rank}" min="1" max="18" placeholder="例：2" />
        </label>
      </div>
      <label>
        調教評価
        <input type="text" id="trainingRating${rank}" name="trainingRating${rank}" placeholder="例：A / B+ / ◎" />
      </label>
      <div class="class-result" aria-live="polite">
        <span>基準値：<output id="baseValue${rank}">-</output></span>
        <span>階級指数：<output id="classScore${rank}" class="class-score">-</output></span>
        <span>合計点：<output id="totalScore${rank}" class="total-score">-</output></span>
        <span id="classJudge${rank}" class="class-judge">出走頭数と指数を入力</span>
      </div>
    `;

    compiInputs.append(card);
    fieldIds.push(
      `compiRank${rank}`,
      `compiScore${rank}`,
      `morningWinRank${rank}`,
      `morningPlaceRank${rank}`,
      `trainingRating${rank}`,
    );
  }
}

function getRunnersCount() {
  const value = Number.parseInt(runnersCountInput.value, 10);
  return Number.isInteger(value) ? value : null;
}

function getNumberValue(id) {
  const rawValue = document.querySelector(`#${id}`).value.trim();
  if (!rawValue) return null;

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function getBaseValue(rank) {
  const runnersCount = getRunnersCount();
  const baseValues = runnersCount ? CLASS_BASE_VALUES[runnersCount] : null;
  return baseValues?.[rank - 1] ?? null;
}

function formatSigned(value) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function normalizeTrainingRating(value) {
  return value.trim().toUpperCase().replace("Ａ", "A").replace("Ｂ", "B").replace("Ｃ", "C").replace("Ｄ", "D");
}

function getTrainingScore(rating) {
  if (!rating) return 0;
  const normalizedRating = normalizeTrainingRating(rating);
  return TRAINING_POINTS[normalizedRating] ?? 0;
}

function getClassIndexPoint(classIndex) {
  if (classIndex === null) return 0;
  if (classIndex >= 7) return 12;
  if (classIndex >= 5) return 9;
  if (classIndex >= 3) return 6;
  if (classIndex >= 1) return 3;
  if (classIndex === 0) return 1;
  if (classIndex <= -5) return -8;
  if (classIndex <= -3) return -5;
  return -2;
}

function getMorningRankPoint(compiRank, morningRank) {
  if (morningRank === null) return 0;

  const gap = compiRank - morningRank;
  let point = 0;

  if (morningRank === 1) point += 8;
  else if (morningRank <= 3) point += 6;
  else if (morningRank <= 5) point += 3;
  else if (morningRank <= 10) point += 1;

  if (gap >= 5) point += 10;
  else if (gap >= 3) point += 7;
  else if (gap >= 1) point += 4;
  else if (gap === 0) point += 1;
  else if (gap <= -5) point -= 6;
  else if (gap <= -3) point -= 4;
  else point -= 2;

  return point;
}

function getRoleLabel(totalScore) {
  if (totalScore >= 50) return "軸最有力";
  if (totalScore >= 42) return "軸候補";
  if (totalScore >= 32) return "相手本線";
  if (totalScore >= 24) return "相手候補";
  if (totalScore >= 16) return "押さえ";
  return "見送り";
}

function getClassJudge(classIndex) {
  if (classIndex === null) return "出走頭数と指数を入力";
  if (classIndex >= 5) return "階級：特注＋";
  if (classIndex >= 3) return "階級：強め＋";
  if (classIndex >= 1) return "階級：プラス";
  if (classIndex === 0) return "階級：基準";
  if (classIndex <= -3) return "階級：弱め";
  return "階級：マイナス";
}

function setScoreStyle(output, score, baseClassName) {
  output.className = baseClassName;
  if (score >= 50) output.classList.add("best");
  else if (score >= 42) output.classList.add("axis");
  else if (score >= 32) output.classList.add("main-opponent");
  else if (score >= 24) output.classList.add("opponent");
  else if (score < 16) output.classList.add("weak");
}

function getComboBonus({ compiRank, classIndex, morningPoint, trainingScore, winRank, placeRank }) {
  let comboBonus = 0;
  const hasMorningBoost = morningPoint >= 10;
  const hasStrongTraining = trainingScore >= 7;
  const hasClassBoost = classIndex !== null && classIndex >= 3;

  if (winRank !== null && placeRank !== null && winRank < compiRank && placeRank < compiRank) {
    comboBonus += 6;
  }

  if (winRank !== null && placeRank !== null && winRank <= 5 && placeRank <= 5) {
    comboBonus += 3;
  }

  if (compiRank >= 6 && ((winRank !== null && winRank <= 3) || (placeRank !== null && placeRank <= 3))) {
    comboBonus += 8;
  }

  if (compiRank <= 5 && hasMorningBoost && hasStrongTraining && hasClassBoost) {
    comboBonus += 10;
  }

  if (compiRank >= 6 && hasMorningBoost && hasStrongTraining && hasClassBoost) {
    comboBonus += 10;
  }

  if (compiRank <= 3 && hasMorningBoost && hasStrongTraining) {
    comboBonus += 6;
  }

  if (compiRank <= 3 && morningPoint <= 0 && trainingScore <= 0) {
    comboBonus -= 4;
  }

  if (compiRank <= 3 && winRank !== null && placeRank !== null && winRank >= 8 && placeRank >= 8) {
    comboBonus -= 8;
  }

  return comboBonus;
}

function evaluateHorse(rank) {
  const horse = document.querySelector(`#compiRank${rank}`).value.trim();
  const compiScore = getNumberValue(`compiScore${rank}`);
  const winRank = getNumberValue(`morningWinRank${rank}`);
  const placeRank = getNumberValue(`morningPlaceRank${rank}`);
  const trainingRating = document.querySelector(`#trainingRating${rank}`).value.trim();
  const hasAnyInput = horse || compiScore !== null || winRank !== null || placeRank !== null || trainingRating;

  if (!hasAnyInput) return null;

  const baseValue = getBaseValue(rank);
  const classIndex = compiScore !== null && baseValue !== null ? compiScore - baseValue : null;
  const rankPoint = COMPI_RANK_POINTS[rank - 1] ?? 0;
  const classPoint = getClassIndexPoint(classIndex);
  const winPoint = getMorningRankPoint(rank, winRank);
  const placePoint = getMorningRankPoint(rank, placeRank);
  const morningPoint = winPoint + placePoint;
  const trainingScore = getTrainingScore(trainingRating);
  const comboBonus = getComboBonus({ compiRank: rank, classIndex, morningPoint, trainingScore, winRank, placeRank });
  const totalScore = rankPoint + classPoint + morningPoint + trainingScore + comboBonus;
  const role = getRoleLabel(totalScore);

  return {
    rank,
    horse: horse || "馬名未入力",
    compiScore,
    baseValue,
    classIndex,
    rankPoint,
    classPoint,
    winRank,
    placeRank,
    morningPoint,
    trainingRating,
    trainingScore,
    comboBonus,
    totalScore,
    role,
  };
}

function formatHorseLabel(evaluation) {
  return `${evaluation.rank}位 ${evaluation.horse}`;
}

function formatBreakdown(evaluation) {
  const classText = evaluation.classIndex === null ? "階級未計算" : `階級${formatSigned(evaluation.classIndex)}`;
  return `${formatHorseLabel(evaluation)}：${evaluation.totalScore}点（${evaluation.role} / ${classText} / 朝${evaluation.morningPoint} / 調教${evaluation.trainingScore} / 複合${evaluation.comboBonus}）`;
}

function updateRecommendations() {
  const evaluations = [];
  const classSummaries = [];

  for (let rank = 1; rank <= COMPI_RANK_COUNT; rank += 1) {
    const evaluation = evaluateHorse(rank);
    const baseOutput = document.querySelector(`#baseValue${rank}`);
    const classOutput = document.querySelector(`#classScore${rank}`);
    const totalOutput = document.querySelector(`#totalScore${rank}`);
    const judgeOutput = document.querySelector(`#classJudge${rank}`);
    const baseValue = getBaseValue(rank);

    baseOutput.textContent = baseValue ?? "-";

    if (!evaluation) {
      classOutput.textContent = "-";
      totalOutput.textContent = "-";
      classOutput.className = "class-score";
      totalOutput.className = "total-score";
      judgeOutput.textContent = baseValue === null ? "出走頭数を入力" : "指数を入力";
      judgeOutput.className = "class-judge";
      continue;
    }

    evaluations.push(evaluation);

    if (evaluation.classIndex === null) {
      classOutput.textContent = "-";
      classOutput.className = "class-score";
    } else {
      classOutput.textContent = formatSigned(evaluation.classIndex);
      setScoreStyle(classOutput, evaluation.classIndex + 30, "class-score");
      classSummaries.push(`${formatHorseLabel(evaluation)}: ${formatSigned(evaluation.classIndex)}（指数${evaluation.compiScore}/基準${evaluation.baseValue}）`);
    }

    totalOutput.textContent = evaluation.totalScore;
    setScoreStyle(totalOutput, evaluation.totalScore, "total-score");
    judgeOutput.textContent = `${getClassJudge(evaluation.classIndex)} / ${evaluation.role}`;
    judgeOutput.className = "class-judge filled";
  }

  const sortedEvaluations = [...evaluations].sort((a, b) => b.totalScore - a.totalScore || a.rank - b.rank);
  const axisCandidates = sortedEvaluations.filter((item) => item.totalScore >= 42).slice(0, 2);
  const fallbackAxisCandidates = axisCandidates.length ? axisCandidates : sortedEvaluations.filter((item) => item.totalScore >= 35).slice(0, 1);
  const axisSet = new Set(fallbackAxisCandidates.map((item) => item.rank));
  const opponentCandidates = sortedEvaluations
    .filter((item) => !axisSet.has(item.rank) && item.totalScore >= 24)
    .slice(0, 6);

  classIndexInput.value = classSummaries.join("\n");
  scoreSummaryInput.value = sortedEvaluations.map(formatBreakdown).join("\n");
  autoAxisCandidatesInput.value = fallbackAxisCandidates.map(formatBreakdown).join("\n");
  autoOpponentCandidatesInput.value = opponentCandidates.map(formatBreakdown).join("\n");
}

function collectFormData() {
  updateRecommendations();
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
  updateRecommendations();
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
    ["自動軸候補", data.autoAxisCandidates || "-"],
    ["自動相手候補", data.autoOpponentCandidates || "-"],
    ["11位以下イレギュラー", data.irregularMemo || "-"],
    ["合計点上位", data.scoreSummary || "-"],
    ["最終軸メモ", data.keyCandidates || "-"],
    ["相手メモ", data.opponentCandidates || "-"],
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

compiInputs.addEventListener("input", updateRecommendations);
compiInputs.addEventListener("change", updateRecommendations);
runnersCountInput.addEventListener("input", updateRecommendations);
runnersCountInput.addEventListener("change", updateRecommendations);

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
