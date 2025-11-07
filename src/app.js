const STORAGE_KEY = "memeory-gym-state-v1";

const elements = {
  themeSelect: document.getElementById("themeSelect"),
  addThemeBtn: document.getElementById("addThemeBtn"),
  themeCreator: document.getElementById("themeCreator"),
  newThemeInput: document.getElementById("newThemeInput"),
  themeCreatorMessage: document.getElementById("themeCreatorMessage"),
  confirmAddTheme: document.getElementById("confirmAddTheme"),
  cancelAddTheme: document.getElementById("cancelAddTheme"),
  saveNoteBtn: document.getElementById("saveNoteBtn"),
  noteInput: document.getElementById("noteInput"),
  notebookList: document.getElementById("notebookList"),
  noteList: document.getElementById("noteList"),
  noteBoardTitle: document.getElementById("noteBoardTitle"),
  noteBoardSubtitle: document.getElementById("noteBoardSubtitle"),
};

const ENGLISH_STOP_WORDS = new Set([
  "the",
  "and",
  "that",
  "with",
  "have",
  "this",
  "from",
  "were",
  "which",
  "would",
  "there",
  "their",
  "about",
  "could",
  "should",
  "because",
  "these",
  "into",
  "than",
  "after",
  "before",
  "while",
  "where",
  "your",
  "been",
  "such",
  "only",
  "between",
  "through",
  "also",
  "when",
  "what",
  "using",
  "used",
]);

const state = loadState();

initialize();

function initialize() {
  ensureSelectedTheme();
  bindEvents();
  renderAll();
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        themes: [],
        notes: [],
        selectedThemeId: null,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      themes: Array.isArray(parsed.themes) ? parsed.themes : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
      selectedThemeId: parsed.selectedThemeId || null,
    };
  } catch (error) {
    console.error("Failed to parse saved data", error);
    return {
      themes: [],
      notes: [],
      selectedThemeId: null,
    };
  }
}

function persistState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("无法保存到本地存储", error);
  }
}

function ensureSelectedTheme() {
  if (state.themes.length === 0) {
    state.selectedThemeId = null;
    return;
  }
  const existing = state.themes.some((theme) => theme.id === state.selectedThemeId);
  if (!existing) {
    state.selectedThemeId = state.themes[0].id;
  }
}

function bindEvents() {
  elements.addThemeBtn.addEventListener("click", () => toggleThemeCreator(true));
  elements.cancelAddTheme.addEventListener("click", () => {
    toggleThemeCreator(false);
  });
  elements.confirmAddTheme.addEventListener("click", handleAddTheme);
  elements.newThemeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTheme();
    }
  });
  elements.themeSelect.addEventListener("change", (event) => {
    state.selectedThemeId = event.target.value || null;
    persistState();
    renderAll();
  });
  elements.saveNoteBtn.addEventListener("click", handleSaveNote);
  elements.noteList.addEventListener("click", handleNoteListClick);
}

function toggleThemeCreator(show) {
  elements.themeCreator.classList.toggle("hidden", !show);
  elements.addThemeBtn.classList.toggle("hidden", show);
  if (show) {
    setThemeCreatorMessage("");
    elements.newThemeInput.value = "";
    elements.newThemeInput.focus();
  }
}

function setThemeCreatorMessage(message, type) {
  elements.themeCreatorMessage.textContent = message || "";
  elements.themeCreatorMessage.classList.remove("error", "success");
  if (type) {
    elements.themeCreatorMessage.classList.add(type);
  }
}

function handleAddTheme() {
  const value = elements.newThemeInput.value.trim();
  if (!value) {
    setThemeCreatorMessage("请输入主题名称", "error");
    return;
  }
  const existing = state.themes.find(
    (theme) => theme.name.toLowerCase() === value.toLowerCase()
  );
  if (existing) {
    state.selectedThemeId = existing.id;
    persistState();
    renderAll();
    toggleThemeCreator(false);
    setTimeout(() => {
      setThemeCreatorMessage("");
    }, 300);
    return;
  }
  const theme = {
    id: createId("theme"),
    name: value,
    createdAt: new Date().toISOString(),
  };
  state.themes.push(theme);
  state.selectedThemeId = theme.id;
  persistState();
  renderAll();
  toggleThemeCreator(false);
}

function handleSaveNote() {
  const content = elements.noteInput.value.trim();
  if (!state.selectedThemeId) {
    alert("请先创建并选择主题，再保存笔记。");
    return;
  }
  if (!content) {
    alert("请先输入或粘贴内容。");
    return;
  }
  const note = {
    id: createId("note"),
    themeId: state.selectedThemeId,
    content,
    createdAt: new Date().toISOString(),
    questions: [],
  };
  state.notes.push(note);
  elements.noteInput.value = "";
  persistState();
  renderAll();
}

function handleNoteListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const noteId = button.dataset.noteId;
  const action = button.dataset.action;
  if (!noteId || !action) return;
  const note = state.notes.find((item) => item.id === noteId);
  if (!note) return;

  if (action === "generate") {
    note.questions = generateQuestions(note);
    persistState();
    renderNotes();
  }
}

function renderAll() {
  ensureSelectedTheme();
  renderThemeSelect();
  renderNotebooks();
  renderNotes();
  updateBoardHeader();
}

function renderThemeSelect() {
  const select = elements.themeSelect;
  select.innerHTML = "";
  if (state.themes.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "请先创建主题";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  state.themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    select.appendChild(option);
  });
  select.value = state.selectedThemeId || state.themes[0].id;
}

function renderNotebooks() {
  const list = elements.notebookList;
  list.innerHTML = "";
  if (state.themes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "还没有主题，点击上方“新主题”按钮创建一个吧。";
    list.appendChild(empty);
    return;
  }

  state.themes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans"))
    .forEach((theme) => {
      const item = document.createElement("button");
      item.className = "notebook-item";
      if (theme.id === state.selectedThemeId) {
        item.classList.add("active");
      }
      item.dataset.themeId = theme.id;
      const title = document.createElement("span");
      title.className = "notebook-title";
      title.textContent = theme.name;
      const count = document.createElement("span");
      count.className = "notebook-count";
      count.textContent = String(getNoteCount(theme.id));
      item.append(title, count);
      item.addEventListener("click", () => {
        state.selectedThemeId = theme.id;
        persistState();
        renderAll();
      });
      list.appendChild(item);
    });
}

function renderNotes() {
  const container = elements.noteList;
  container.innerHTML = "";
  if (!state.selectedThemeId) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "请选择或创建一个主题开始记录。";
    container.appendChild(empty);
    return;
  }
  const notes = state.notes
    .filter((note) => note.themeId === state.selectedThemeId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (notes.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "这个主题下还没有笔记，写下第一条内容吧！";
    container.appendChild(empty);
    return;
  }

  const groups = groupNotesByDate(notes);
  groups.forEach(({ dateLabel, notes: groupedNotes }) => {
    const groupEl = document.createElement("section");
    groupEl.className = "date-group";
    const badge = document.createElement("span");
    badge.className = "date-badge";
    badge.textContent = dateLabel;
    groupEl.appendChild(badge);
    groupedNotes.forEach((note) => {
      groupEl.appendChild(createNoteCard(note));
    });
    container.appendChild(groupEl);
  });
}

function createNoteCard(note) {
  const card = document.createElement("article");
  card.className = "note-card";
  card.dataset.noteId = note.id;

  const header = document.createElement("div");
  header.className = "note-card-header";
  const time = document.createElement("span");
  time.className = "note-card-time";
  time.textContent = formatTime(note.createdAt);
  const actions = document.createElement("div");
  actions.className = "note-actions";
  const generateBtn = document.createElement("button");
  generateBtn.type = "button";
  generateBtn.className = "secondary-button";
  generateBtn.dataset.action = "generate";
  generateBtn.dataset.noteId = note.id;
  generateBtn.textContent = note.questions && note.questions.length > 0 ? "重新生成题目" : "生成记忆题目";
  actions.appendChild(generateBtn);
  header.append(time, actions);

  const content = document.createElement("div");
  content.className = "note-content";
  content.textContent = note.content;

  card.append(header, content);

  if (note.questions && note.questions.length > 0) {
    const questionSection = document.createElement("section");
    questionSection.className = "question-section";
    const sectionTitle = document.createElement("strong");
    sectionTitle.textContent = "记忆题目";
    questionSection.appendChild(sectionTitle);

    note.questions.forEach((question, index) => {
      const item = document.createElement("div");
      item.className = "question-item";
      const label = document.createElement("strong");
      label.textContent = `题目 ${index + 1}`;
      const prompt = document.createElement("p");
      prompt.className = "question-text";
      prompt.textContent = question.prompt;
      item.append(label, prompt);

      if (question.answer) {
        const details = document.createElement("details");
        const summary = document.createElement("summary");
        summary.textContent = question.hintLabel || "查看提示 / 答案";
        const answer = document.createElement("p");
        answer.className = "answer-text";
        answer.textContent = question.answer;
        details.append(summary, answer);
        item.appendChild(details);
      }
      questionSection.appendChild(item);
    });

    card.appendChild(questionSection);
  }

  return card;
}

function groupNotesByDate(notes) {
  const map = new Map();
  notes.forEach((note) => {
    const dateKey = getDateKey(note.createdAt);
    if (!map.has(dateKey)) {
      map.set(dateKey, []);
    }
    map.get(dateKey).push(note);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([dateKey, groupedNotes]) => ({
      dateKey,
      dateLabel: formatDateLabel(dateKey),
      notes: groupedNotes.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      ),
    }));
}

function updateBoardHeader() {
  if (!state.selectedThemeId) {
    elements.noteBoardTitle.textContent = "笔记列表";
    elements.noteBoardSubtitle.textContent =
      state.themes.length === 0
        ? "创建一个主题以开启你的记忆旅程。"
        : "请选择左侧的主题查看笔记";
    return;
  }
  const theme = state.themes.find((item) => item.id === state.selectedThemeId);
  const count = getNoteCount(state.selectedThemeId);
  elements.noteBoardTitle.textContent = `${theme ? theme.name : ""} 笔记本`;
  elements.noteBoardSubtitle.textContent = `共 ${count} 条笔记`;
}

function getNoteCount(themeId) {
  return state.notes.filter((note) => note.themeId === themeId).length;
}

function getDateKey(isoString) {
  if (!isoString) return "unknown";
  return isoString.slice(0, 10);
}

function formatDateLabel(dateKey) {
  const date = new Date(dateKey);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function formatTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function generateQuestions(note) {
  const content = note.content;
  const theme = state.themes.find((item) => item.id === note.themeId);
  const sentences = splitIntoSentences(content);
  const questions = [];
  const usedAnswers = new Set();

  for (const sentence of sentences) {
    if (questions.length >= 3) break;
    const cloze = createClozeQuestion(sentence, usedAnswers);
    if (cloze) {
      questions.push(cloze);
    }
  }

  const keywords = extractKeywords(content, 5);
  if (keywords.length > 0) {
    questions.push({
      id: createId("q"),
      prompt: "列出文中最重要的三个关键词。",
      answer: keywords.slice(0, 3).join("、"),
      hintLabel: "查看参考关键词",
    });
  }

  questions.push({
    id: createId("q"),
    prompt: "请用自己的话总结以上内容的核心观点。",
    answer:
      keywords.length > 0
        ? `提示：围绕 ${keywords.slice(0, 3).join("、")} 等关键词进行总结。`
        : "提示：关注段落中的核心概念、因果关系或结论。",
    hintLabel: "查看提示",
  });

  if (theme) {
    questions.push({
      id: createId("q"),
      prompt: `这段内容如何帮助你在“${theme.name}”主题下的实践或思考？`,
      answer: "提示：联系真实场景，思考可以采取的行动或记忆方法。",
      hintLabel: "查看提示",
    });
  }

  return questions;
}

function splitIntoSentences(text) {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const pattern = /[^。！？!?\.\n]+[。！？!?\.]?/g;
  const sentences = normalized.match(pattern) || [];
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  lines.forEach((line) => {
    if (!sentences.includes(line)) {
      sentences.push(line);
    }
  });
  return sentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 2);
}

function createClozeQuestion(sentence, usedAnswers) {
  const chineseCandidates = sentence.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
  const englishCandidates = sentence.match(/\b[A-Za-z][A-Za-z'-]{3,}\b/g) || [];
  const candidates = [...chineseCandidates, ...englishCandidates];
  for (const candidate of candidates.sort((a, b) => b.length - a.length)) {
    const key = candidate.toLowerCase();
    if (ENGLISH_STOP_WORDS.has(key)) continue;
    if (usedAnswers.has(key)) continue;
    if (!sentence.includes(candidate)) continue;
    const blanked = sentence.replace(candidate, "____");
    if (blanked === sentence) continue;
    usedAnswers.add(key);
    return {
      id: createId("q"),
      prompt: `填空：${blanked}`,
      answer: candidate,
      hintLabel: "查看答案",
    };
  }
  return null;
}

function extractKeywords(text, limit = 5) {
  const keywords = new Map();
  const store = (word, weight = 1) => {
    const key = word.toLowerCase();
    if (ENGLISH_STOP_WORDS.has(key)) return;
    const current = keywords.get(key);
    const score = (current ? current.score : 0) + weight + word.length * 0.15;
    keywords.set(key, {
      original: current ? current.original : word,
      score,
    });
  };

  (text.match(/[\u4e00-\u9fa5]{2,4}/g) || []).forEach((word) => store(word, 1.2));
  (text.match(/\b[A-Za-z][A-Za-z'-]{2,}\b/g) || []).forEach((word) => store(word));
  (text.match(/\b\d+[\w%]*\b/g) || []).forEach((word) => store(word, 0.8));

  return Array.from(keywords.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.original)
    .filter((value, index, array) => array.indexOf(value) === index);
}
