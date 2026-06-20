const canvas = document.querySelector("#boardCanvas");
const ctx = canvas.getContext("2d");

const els = {
  cols: document.querySelector("#colsInput"),
  rows: document.querySelector("#rowsInput"),
  zoom: document.querySelector("#zoomInput"),
  labelToggle: document.querySelector("#labelToggle"),
  projectMeta: document.querySelector("#projectMeta"),
  toolGrid: document.querySelector("#toolGrid"),
  swatches: document.querySelector("#wireSwatches"),
  layerSwitch: document.querySelector("#layerSwitch"),
  inspector: document.querySelector("#inspector"),
  cursorStatus: document.querySelector("#cursorStatus"),
  layoutStatus: document.querySelector("#layoutStatus"),
  selectionStatus: document.querySelector("#selectionStatus"),
  undo: document.querySelector("#undoBtn"),
  redo: document.querySelector("#redoBtn"),
  clear: document.querySelector("#clearBtn"),
  exportPng: document.querySelector("#exportPngBtn"),
  exportJson: document.querySelector("#exportJsonBtn"),
  cloudLayoutsButton: document.querySelector("#cloudLayoutsBtn"),
  exportConnections: document.querySelector("#exportConnectionsBtn"),
  exportParts: document.querySelector("#exportPartsBtn"),
  exportPartsCsv: document.querySelector("#exportPartsCsvBtn"),
  importJson: document.querySelector("#importJsonBtn"),
  importFile: document.querySelector("#importFile"),
  wirePanel: document.querySelector("#wirePanel"),
  finishWire: document.querySelector("#finishWireBtn"),
  cancelWire: document.querySelector("#cancelWireBtn"),
  mobilePanelTabs: document.querySelector(".mobile-panel-tabs"),
  displayControls: document.querySelector("#displayControls"),
  grabModeSwitch: document.querySelector("#grabModeSwitch"),
  boardThemeSwatches: document.querySelector("#boardThemeSwatches"),
  openHoleSettings: document.querySelector("#openHoleSettingsBtn"),
  holeSettings: document.querySelector("#holeSettings"),
  closeHoleSettings: document.querySelector("#closeHoleSettingsBtn"),
  enableAllHoles: document.querySelector("#enableAllHolesBtn"),
  invertHoles: document.querySelector("#invertHolesBtn"),
  holeMaskCanvas: document.querySelector("#holeMaskCanvas"),
  holeMaskStatus: document.querySelector("#holeMaskStatus"),
  cloudLayouts: document.querySelector("#cloudLayouts"),
  closeCloudLayouts: document.querySelector("#closeCloudLayoutsBtn"),
  cloudLayoutName: document.querySelector("#cloudLayoutName"),
  saveCloudLayout: document.querySelector("#saveCloudLayoutBtn"),
  refreshCloudLayouts: document.querySelector("#refreshCloudLayoutsBtn"),
  cloudLayoutStatus: document.querySelector("#cloudLayoutStatus"),
  cloudLayoutList: document.querySelector("#cloudLayoutList"),
};

const storageKey = "universal-board-layout-v1";
const cloudLayoutKey = "universal-board-layout-cloud-id";
const wireColors = ["#e43d30", "#276ef1", "#24a148", "#f59e0b", "#8b5cf6", "#1f2937"];
const boardThemes = {
  green: {
    label: "緑",
    board: "#2f8767",
    edge: "rgba(255, 255, 255, 0.22)",
    copper: "#d2a044",
    core: "#174634",
    disabled: "#276b55",
    disabledStroke: "rgba(12, 43, 32, 0.62)",
  },
  brown: {
    label: "茶",
    board: "#9a6232",
    edge: "rgba(255, 241, 210, 0.22)",
    copper: "#d9ae54",
    core: "#56351f",
    disabled: "#744621",
    disabledStroke: "rgba(62, 35, 17, 0.7)",
  },
  blue: {
    label: "青",
    board: "#2e6f9f",
    edge: "rgba(255, 255, 255, 0.22)",
    copper: "#d8ad4d",
    core: "#164767",
    disabled: "#255879",
    disabledStroke: "rgba(13, 43, 66, 0.7)",
  },
  black: {
    label: "黒",
    board: "#30343a",
    edge: "rgba(255, 255, 255, 0.18)",
    copper: "#c99b45",
    core: "#111827",
    disabled: "#23272d",
    disabledStroke: "rgba(8, 11, 15, 0.75)",
  },
};
const boardThemeOrder = ["green", "brown", "blue", "black"];
const componentColors = {
  resistor: "#d7aa55",
  capacitor: "#2f74c0",
  led: "#ef4444",
  ic: "#222831",
  header: "#3b4754",
  label: "#17202a",
};
const resistorStyles = {
  carbon: {
    label: "カーボン 茶",
    body: "#d8ad63",
    stroke: "#6f5632",
    lead: "#c8c6bc",
    highlight: "rgba(255, 244, 207, 0.36)",
    bands: ["#6b341d", "#111827", "#d6a83f", "#8a6a2f"],
  },
  metalBlue: {
    label: "金属皮膜 青",
    body: "#75a9c9",
    stroke: "#27506b",
    lead: "#c8cdd2",
    highlight: "rgba(230, 247, 255, 0.42)",
    bands: ["#6b341d", "#111827", "#d6a83f", "#9ca3af"],
  },
  metalGreen: {
    label: "金属皮膜 緑",
    body: "#78a974",
    stroke: "#325c34",
    lead: "#c8cdd2",
    highlight: "rgba(238, 255, 225, 0.38)",
    bands: ["#6b341d", "#111827", "#d6a83f", "#9ca3af"],
  },
};
const capacitorStyles = {
  ceramic: {
    label: "積層セラミック",
    body: "#d6b36f",
    stroke: "#7a5a2e",
    lead: "#d8d4c8",
    highlight: "rgba(255, 244, 211, 0.45)",
  },
  electrolytic: {
    label: "電解",
    body: "#273445",
    stroke: "#111827",
    lead: "#c8cdd2",
    stripe: "#dbe5ef",
    highlight: "rgba(255, 255, 255, 0.18)",
  },
  film: {
    label: "フィルム",
    body: "#3f86c7",
    stroke: "#1d4f7c",
    lead: "#d8d4c8",
    highlight: "rgba(237, 247, 255, 0.38)",
  },
};
const spanPlacedTypes = new Set(["resistor", "capacitor", "led", "header"]);
const displayModes = new Set(["on", "dim", "off"]);
const displayTargets = new Set(["wires", "parts", "labels"]);
const grabModes = new Set(["auto", "parts", "wires"]);
const electricalComponentTypes = new Set(["resistor", "capacitor", "led", "ic", "header"]);

let view = {
  width: 0,
  height: 0,
  dpr: 1,
  cell: 24,
  originX: 80,
  originY: 80,
};

let state = {
  board: { cols: 30, rows: 20, pitch: 2.54, showLabels: true, theme: "green", disabledHoles: [] },
  items: [],
  zoom: 1,
};
state = loadInitialState();
let currentTool = "select";
let currentLayer = "top";
let currentWireColor = wireColors[1];
let displayOptions = { wires: "on", parts: "dim", labels: "on" };
let grabMode = "auto";
let selectedId = null;
let selectedIds = new Set();
let hoveredHole = null;
let wireDraft = null;
let componentDraft = null;
let selectionDraft = null;
let drag = null;
let activeCanvasPointers = new Map();
let pinchGesture = null;
let holeMaskDrag = null;
let holeMaskView = null;
let history = [];
let future = [];
let dirtyDuringDrag = false;

function loadInitialState() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const loaded = JSON.parse(raw);
      if (loaded?.board && Array.isArray(loaded?.items)) {
        return normalizeState(loaded);
      }
    }
  } catch {
    localStorage.removeItem(storageKey);
  }

  return normalizeState({
    board: { cols: 30, rows: 20, pitch: 2.54, showLabels: true, theme: "green", disabledHoles: [] },
    items: [
      makeComponent("ic", 9, 6, { name: "U1", value: "NE555", pins: 8 }),
      makeComponent("resistor", 7, 3, { name: "R1", value: "10k" }),
      makeComponent("led", 19, 7, { name: "D1", value: "LED", color: "#ef4444" }),
      makeComponent("capacitor", 13, 12, { name: "C1", value: "100n" }),
      makeComponent("header", 3, 14, { name: "J1", value: "PWR", count: 3 }),
      makeComponent("label", 3, 13, { name: "L1", text: "+  G  OUT" }),
      {
        id: uid("wire"),
        type: "wire",
        layer: "top",
        color: "#e43d30",
        width: 2,
        points: [
          { x: 5, y: 14 },
          { x: 8, y: 14 },
          { x: 8, y: 6 },
          { x: 9, y: 6 },
        ],
      },
      {
        id: uid("wire"),
        type: "wire",
        layer: "top",
        color: "#276ef1",
        width: 2,
        points: [
          { x: 12, y: 9 },
          { x: 17, y: 9 },
          { x: 19, y: 7 },
        ],
      },
      { id: uid("cut"), type: "cut", x: 16, y: 9 },
    ],
  });
}

function normalizeState(input) {
  const board = {
    cols: clamp(Number(input.board?.cols) || 30, 8, 80),
    rows: clamp(Number(input.board?.rows) || 20, 8, 60),
    pitch: Number(input.board?.pitch) || 2.54,
    showLabels: input.board?.showLabels !== false,
    theme: boardThemes[input.board?.theme] ? input.board.theme : "green",
  };
  board.disabledHoles = normalizeDisabledHoles(input.board?.disabledHoles, board);
  const items = (input.items || [])
    .map((item) => normalizeItem(item, board))
    .filter(Boolean);
  return { board, items, zoom: clamp(Number(input.zoom) || 1, 0.7, 24) };
}

function normalizeDisabledHoles(value, board) {
  const holes = Array.isArray(value) ? value : [];
  const keys = new Set();
  for (const hole of holes) {
    const point = typeof hole === "string" ? parsePointKey(hole) : hole;
    if (!point) continue;
    const x = Math.round(Number(point.x));
    const y = Math.round(Number(point.y));
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (x < 0 || y < 0 || x >= board.cols || y >= board.rows) continue;
    keys.add(pointKey({ x, y }));
  }
  return sortPointKeys([...keys]);
}

function parsePointKey(key) {
  const [x, y] = String(key).split(",").map(Number);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y };
}

function normalizeItem(item, board = state?.board) {
  if (!item || typeof item !== "object" || !item.type) return null;
  if (item.type === "wire") {
    const points = (item.points || [])
      .map((point) => ({
        x: clamp(Math.round(Number(point.x) || 0), 0, board.cols - 1),
        y: clamp(Math.round(Number(point.y) || 0), 0, board.rows - 1),
      }))
      .filter((point, index, list) => index === 0 || point.x !== list[index - 1].x || point.y !== list[index - 1].y);
    if (points.length < 2) return null;
    return {
      id: item.id || uid("wire"),
      type: "wire",
      layer: item.layer === "bottom" ? "bottom" : "top",
      color: item.color || wireColors[1],
      width: clamp(Number(item.width) || 2, 1, 5),
      points,
    };
  }
  if (item.type === "cut") {
    return {
      id: item.id || uid("cut"),
      type: "cut",
      x: clamp(Math.round(Number(item.x) || 0), 0, board.cols - 1),
      y: clamp(Math.round(Number(item.y) || 0), 0, board.rows - 1),
    };
  }
  const base = {
    id: item.id || uid(item.type),
    type: item.type,
    x: clamp(Math.round(Number(item.x) || 0), 0, board.cols - 1),
    y: clamp(Math.round(Number(item.y) || 0), 0, board.rows - 1),
    rotation: normalizeRotation(item.rotation),
    name: item.name || defaultName(item.type),
    value: item.value || defaultValue(item.type),
    color: item.color || componentColors[item.type] || "#17202a",
  };
  if (item.type === "resistor") {
    return {
      ...base,
      style: resistorStyles[item.style] ? item.style : "carbon",
      length: clamp(Number(item.length) || 3, 1, 16),
    };
  }
  if (item.type === "capacitor") {
    return {
      ...base,
      style: capacitorStyles[item.style] ? item.style : "ceramic",
      spacing: clamp(Number(item.spacing) || 2, 1, 8),
    };
  }
  if (item.type === "led") return { ...base, spacing: clamp(Number(item.spacing) || 2, 1, 8) };
  if (item.type === "ic") return { ...base, pins: clampEven(Number(item.pins) || 8, 6, 40), width: clamp(Number(item.width) || 3, 2, 8) };
  if (item.type === "header") return { ...base, count: clamp(Number(item.count) || 4, 1, 40) };
  if (item.type === "label") return { ...base, text: String(item.text || "TP") };
  return null;
}

function makeComponent(type, x, y, overrides = {}) {
  const item = normalizeItem({ id: uid(type), type, x, y, ...overrides }, { cols: 80, rows: 60 });
  return item;
}

function makeComponentFromSpan(type, start, end, options = {}) {
  const span = componentSpan(type, start, end);
  const raw = {
    id: options.draft ? "draft-component" : uid(type),
    type,
    x: start.x,
    y: start.y,
    rotation: span.rotation,
    name: options.draft ? typeName(type) : defaultName(type),
    value: defaultValue(type),
    color: componentColors[type] || "#17202a",
  };

  if (type === "resistor") raw.length = span.distance;
  if (type === "capacitor" || type === "led") raw.spacing = span.distance;
  if (type === "header") {
    raw.count = span.distance + 1;
    raw.value = `1x${raw.count}`;
  }

  return normalizeItem(raw, state.board);
}

function componentSpan(type, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const rawDistance = horizontal ? Math.abs(dx) : Math.abs(dy);
  const distance = rawDistance || defaultSpanDistance(type);
  let rotation = 0;

  if (horizontal) {
    rotation = dx < 0 ? 180 : 0;
  } else {
    rotation = dy < 0 ? 270 : 90;
  }

  const clampedDistance = clamp(distance, minSpanDistance(type), maxSpanDistance(type));
  if (rawDistance === 0 && start.x + clampedDistance > state.board.cols - 1 && start.x - clampedDistance >= 0) {
    rotation = 180;
  }

  return {
    distance: clampedDistance,
    rotation,
  };
}

function defaultSpanDistance(type) {
  if (type === "resistor") return 3;
  if (type === "header") return 3;
  return 2;
}

function minSpanDistance(type) {
  return type === "header" ? 1 : 1;
}

function maxSpanDistance(type) {
  return type === "header" ? 39 : type === "resistor" ? 16 : 8;
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36).slice(-4)}`;
}

function defaultName(type) {
  const prefixes = { resistor: "R", capacitor: "C", led: "D", ic: "U", header: "J", label: "TXT" };
  const prefix = prefixes[type] || "X";
  const count = state?.items?.filter((item) => item.type === type).length || 0;
  return `${prefix}${count + 1}`;
}

function defaultValue(type) {
  return {
    resistor: "10k",
    capacitor: "100n",
    led: "LED",
    ic: "DIP",
    header: "1x4",
    label: "",
  }[type] || "";
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clampEven(value, min, max) {
  const rounded = Math.round(clamp(value, min, max) / 2) * 2;
  return clamp(rounded, min, max);
}

function normalizeRotation(value) {
  const rotation = Math.round((Number(value) || 0) / 90) * 90;
  return ((rotation % 360) + 360) % 360;
}

function snapshot() {
  return JSON.stringify({
    board: state.board,
    items: state.items,
  });
}

function restore(serialized) {
  state = normalizeState(JSON.parse(serialized));
  syncSelectionToItems();
  wireDraft = null;
  componentDraft = null;
  selectionDraft = null;
  clampAllItems();
  syncControls();
  save();
  render();
}

function commitHistory() {
  history.push(snapshot());
  if (history.length > 80) history.shift();
  future = [];
  updateTopButtons();
}

function undo() {
  if (!history.length) return;
  future.push(snapshot());
  const previous = history.pop();
  restore(previous);
}

function redo() {
  if (!future.length) return;
  history.push(snapshot());
  const next = future.pop();
  restore(next);
}

function save() {
  localStorage.setItem(storageKey, snapshot());
  updateTopButtons();
  updateInspector();
  updateStatus();
}

function mutate(fn, options = {}) {
  commitHistory();
  fn();
  clampAllItems();
  if (options.mergeWires) {
    const seedIds = typeof options.mergeWireIds === "function" ? options.mergeWireIds() : options.mergeWireIds;
    finalizeWireTopology(seedIds || selectedIds);
  }
  save();
  render();
}

function getSelectedItems() {
  return state.items.filter((item) => selectedIds.has(item.id));
}

function getSelected() {
  const items = getSelectedItems();
  return items.length === 1 ? items[0] : null;
}

function isSelected(id) {
  return selectedIds.has(id);
}

function setSelection(ids) {
  const validIds = ids.filter((id) => state.items.some((item) => item.id === id));
  selectedIds = new Set(validIds);
  selectedId = validIds.length ? validIds[validIds.length - 1] : null;
}

function syncSelectionToItems() {
  setSelection([...selectedIds]);
}

function selectItem(id) {
  setSelection(id ? [id] : []);
  save();
  render();
}

function selectItems(ids) {
  setSelection(ids);
  save();
  render();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  view.width = rect.width;
  view.height = rect.height;
  view.dpr = dpr;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function setZoom(value, options = {}) {
  const min = Number(els.zoom.min) || 0.7;
  const max = Number(els.zoom.max) || 24;
  state.zoom = clamp(Number(value) || 1, min, max);
  els.zoom.value = state.zoom;
  if (options.save !== false) save();
  render();
}

function updateView() {
  const cols = state.board.cols - 1;
  const rows = state.board.rows - 1;
  const edgePadding = view.width < 520 ? 132 : view.width < 820 ? 112 : 96;
  const minCell = view.width < 520 ? 5 : 10;
  const maxCell = Number.POSITIVE_INFINITY;
  const baseCell = Math.min((view.width - edgePadding) / Math.max(cols, 1), (view.height - 96) / Math.max(rows, 1), 34);
  view.cell = clamp(baseCell * state.zoom, minCell, maxCell);
  view.originX = Math.round((view.width - cols * view.cell) / 2);
  view.originY = Math.round((view.height - rows * view.cell) / 2);
  if (view.width < 520) {
    view.originX = Math.min(view.originX, 32);
  }
}

function gridToScreen(x, y) {
  return {
    x: view.originX + x * view.cell,
    y: view.originY + y * view.cell,
  };
}

function screenToGrid(x, y) {
  return {
    x: (x - view.originX) / view.cell,
    y: (y - view.originY) / view.cell,
  };
}

function eventPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function capturePointer(pointerId) {
  try {
    canvas.setPointerCapture(pointerId);
  } catch {
    // Some synthetic or interrupted touch sequences do not have capturable pointers.
  }
}

function releasePointer(pointerId) {
  try {
    if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId);
  } catch {
    // Ignore release errors from canceled or browser-owned touch gestures.
  }
}

function rememberCanvasPointer(event) {
  activeCanvasPointers.set(event.pointerId, eventPoint(event));
}

function forgetCanvasPointer(event) {
  activeCanvasPointers.delete(event.pointerId);
  if (pinchGesture && activeCanvasPointers.size < 2) {
    finishPinchGesture();
  }
}

function currentPinchPoints() {
  return [...activeCanvasPointers.values()].slice(0, 2);
}

function pinchDistance(points = currentPinchPoints()) {
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function beginPinchGesture() {
  const distance = pinchDistance();
  if (!distance) return;
  selectionDraft = null;
  componentDraft = null;
  drag = null;
  dirtyDuringDrag = false;
  pinchGesture = {
    startDistance: distance,
    startZoom: state.zoom,
  };
}

function updatePinchGesture() {
  if (!pinchGesture || activeCanvasPointers.size < 2) return false;
  const distance = pinchDistance();
  if (!distance) return false;
  const nextZoom = pinchGesture.startZoom * (distance / pinchGesture.startDistance);
  setZoom(nextZoom, { save: false });
  return true;
}

function finishPinchGesture() {
  pinchGesture = null;
  save();
  render();
}

function nearestHole(screenPoint) {
  const raw = screenToGrid(screenPoint.x, screenPoint.y);
  const x = clamp(Math.round(raw.x), 0, state.board.cols - 1);
  const y = clamp(Math.round(raw.y), 0, state.board.rows - 1);
  const screen = gridToScreen(x, y);
  const distance = Math.hypot(screen.x - screenPoint.x, screen.y - screenPoint.y);
  const enabled = isHoleEnabled(x, y);
  return { x, y, screen, distance, enabled, inside: enabled && distance < view.cell * 0.65 };
}

function render() {
  if (!view.width || !view.height) return;
  updateView();
  ctx.clearRect(0, 0, view.width, view.height);
  drawStage();
  drawBoard();
  drawLayoutLayers();
  drawComponentLabels();
  drawDraftComponent();
  drawDraftWire();
  drawSelectionDraft();
  drawHover();
  updateStatus();
}

function drawLayoutLayers() {
  const wireAlpha = displayAlpha("wires");
  const partAlpha = displayAlpha("parts");
  if (wireAlpha) {
    drawWires("bottom", wireAlpha);
    drawWires("top", wireAlpha);
  }
  if (partAlpha) {
    drawComponents(partAlpha);
    drawCuts(partAlpha);
  }
}

function displayAlpha(target) {
  const mode = displayOptions[target] || "on";
  if (mode === "off") return 0;
  if (mode === "dim") return target === "labels" ? 0.42 : 0.38;
  return 1;
}

function isItemDisplayEnabled(item) {
  if (item.type === "wire") return displayOptions.wires !== "off";
  return displayOptions.parts !== "off";
}

function drawStage() {
  const gradient = ctx.createLinearGradient(0, 0, view.width, view.height);
  gradient.addColorStop(0, "#f3f7fa");
  gradient.addColorStop(1, "#dfe8ee");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.width, view.height);

  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = "#c7d2dc";
  ctx.lineWidth = 1;
  const spacing = 32;
  for (let x = (view.originX % spacing) - spacing; x < view.width + spacing; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, view.height);
    ctx.stroke();
  }
  for (let y = (view.originY % spacing) - spacing; y < view.height + spacing; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(view.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBoard() {
  const theme = currentBoardTheme();
  const disabledSet = boardDisabledSet();
  const pad = view.cell * 0.62;
  const first = gridToScreen(0, 0);
  const last = gridToScreen(state.board.cols - 1, state.board.rows - 1);
  const x = first.x - pad;
  const y = first.y - pad;
  const width = last.x - first.x + pad * 2;
  const height = last.y - first.y + pad * 2;

  ctx.save();
  ctx.shadowColor = "rgba(22, 33, 45, 0.22)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 14;
  roundedRect(ctx, x, y, width, height, 10);
  ctx.fillStyle = theme.board;
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.strokeStyle = theme.edge;
  ctx.lineWidth = 1;
  roundedRect(ctx, x + 0.5, y + 0.5, width - 1, height - 1, 10);
  ctx.stroke();

  for (let row = 0; row < state.board.rows; row += 1) {
    for (let col = 0; col < state.board.cols; col += 1) {
      const p = gridToScreen(col, row);
      const ring = Math.max(3.4, view.cell * 0.18);
      const core = Math.max(1.5, view.cell * 0.07);
      const disabled = disabledSet.has(pointKey({ x: col, y: row }));

      if (disabled) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, ring * 0.92, 0, Math.PI * 2);
        ctx.fillStyle = theme.disabled;
        ctx.fill();
        ctx.strokeStyle = theme.disabledStroke;
        ctx.lineWidth = Math.max(1, view.cell * 0.05);
        ctx.beginPath();
        ctx.moveTo(p.x - ring * 0.55, p.y - ring * 0.55);
        ctx.lineTo(p.x + ring * 0.55, p.y + ring * 0.55);
        ctx.moveTo(p.x + ring * 0.55, p.y - ring * 0.55);
        ctx.lineTo(p.x - ring * 0.55, p.y + ring * 0.55);
        ctx.stroke();
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, ring, 0, Math.PI * 2);
      ctx.fillStyle = theme.copper;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, core, 0, Math.PI * 2);
      ctx.fillStyle = theme.core;
      ctx.fill();
    }
  }

  if (state.board.showLabels && view.cell > 14) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.font = "10px ui-sans-serif, system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let col = 0; col < state.board.cols; col += 5) {
      const p = gridToScreen(col, 0);
      ctx.fillText(String(col), p.x, y + 12);
    }
    ctx.textAlign = "right";
    for (let row = 0; row < state.board.rows; row += 5) {
      const p = gridToScreen(0, row);
      ctx.fillText(String(row), x + 20, p.y);
    }
  }

  ctx.restore();
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function drawWires(layer, alpha = 1) {
  if (!alpha) return;
  const wires = state.items.filter((item) => item.type === "wire" && item.layer === layer);
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const wire of wires) drawWire(wire, isSelected(wire.id));
  ctx.restore();
}

function drawWire(wire, selected = false) {
  if (wire.points.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const lineWidth = Math.max(3, view.cell * (wire.width / 12));
  if (wire.layer === "bottom") {
    ctx.setLineDash([view.cell * 0.35, view.cell * 0.22]);
  }

  traceWirePath(wire.points);
  ctx.strokeStyle = selected ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.78)";
  ctx.lineWidth = lineWidth + (selected ? 7 : 5);
  ctx.stroke();

  if (wire.layer === "bottom") {
    ctx.globalAlpha = selected ? 0.92 : 0.66;
  }

  traceWirePath(wire.points);
  ctx.strokeStyle = wire.color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.setLineDash([]);

  for (const point of wire.points) {
    const p = gridToScreen(point.x, point.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(3.5, view.cell * 0.13), 0, Math.PI * 2);
    ctx.fillStyle = wire.color;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
  ctx.restore();
}

function traceWirePath(points) {
  const first = gridToScreen(points[0].x, points[0].y);
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (let index = 1; index < points.length; index += 1) {
    const p = gridToScreen(points[index].x, points[index].y);
    ctx.lineTo(p.x, p.y);
  }
}

function drawComponents(alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const item of state.items) {
    if (item.type === "wire" || item.type === "cut") continue;
    drawComponent(item, false);
  }
  ctx.restore();

  for (const item of state.items) {
    if (item.type === "wire" || item.type === "cut") continue;
    if (isSelected(item.id)) drawComponentSelection(item);
  }
}

function drawComponentLabels() {
  const labelAlpha = displayAlpha("labels");
  if (!labelAlpha) return;
  ctx.save();
  ctx.globalAlpha = labelAlpha;
  for (const item of state.items) {
    if (item.type === "wire" || item.type === "cut" || item.type === "label") continue;
    if (!item.name) continue;
    const bounds = itemBounds(item);
    const anchor = gridToScreen((bounds.minX + bounds.maxX) / 2, bounds.minY - 0.34);
    drawComponentNameLabel(item.name, anchor.x, anchor.y);
  }
  ctx.restore();
}

function drawComponentNameLabel(text, x, y) {
  const fontSize = clamp(Math.round(view.cell * 0.5), 11, 13);
  const horizontalPadding = 5;
  const height = fontSize + 7;
  const maxWidth = clamp(view.cell * 3.9, 50, 96);

  ctx.save();
  ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const label = fittedCanvasLabel(String(text), maxWidth - horizontalPadding * 2);
  const width = Math.min(maxWidth, Math.ceil(ctx.measureText(label).width) + horizontalPadding * 2);
  const labelX = clamp(x, width / 2 + 4, view.width - width / 2 - 4);
  const labelY = clamp(y, height / 2 + 4, view.height - height / 2 - 4);

  roundedRect(ctx, labelX - width / 2, labelY - height / 2, width, height, 5);
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.fill();
  ctx.strokeStyle = "rgba(23, 32, 42, 0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = "#14202b";
  ctx.fillText(label, labelX, labelY + 0.3);
  ctx.restore();
}

function fittedCanvasLabel(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let next = text;
  while (next.length > 1 && ctx.measureText(`${next}...`).width > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next}...`;
}

function drawComponent(item, showSelection = true) {
  ctx.save();
  const anchor = gridToScreen(item.x, item.y);
  ctx.translate(anchor.x, anchor.y);
  ctx.rotate((item.rotation * Math.PI) / 180);
  ctx.scale(view.cell, view.cell);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 0.1;

  if (item.type === "resistor") drawResistor(item);
  if (item.type === "capacitor") drawCapacitor(item);
  if (item.type === "led") drawLed(item);
  if (item.type === "ic") drawIc(item);
  if (item.type === "header") drawHeader(item);
  if (item.type === "label") drawLabel(item);
  ctx.restore();

  if (showSelection && isSelected(item.id)) drawComponentSelection(item);
}

function drawResistor(item) {
  const length = item.length;
  const style = resistorStyles[item.style] || resistorStyles.carbon;
  const maxBodyWidth = Math.max(0.64, length - 0.32);
  const bodyWidth = Math.min(maxBodyWidth, clamp(length * 0.7, 0.9, 2.45));
  const bodyX = length / 2 - bodyWidth / 2;
  const bodyY = -0.24;
  const bodyHeight = 0.48;

  ctx.strokeStyle = style.lead;
  ctx.lineWidth = 0.075;
  line(0, 0, bodyX + 0.04, 0);
  line(bodyX + bodyWidth - 0.04, 0, length, 0);

  roundedRect(ctx, bodyX, bodyY, bodyWidth, bodyHeight, bodyHeight / 2);
  ctx.fillStyle = style.body;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 0.04;
  ctx.stroke();

  ctx.save();
  roundedRect(ctx, bodyX, bodyY, bodyWidth, bodyHeight, bodyHeight / 2);
  ctx.clip();
  ctx.fillStyle = style.highlight;
  ctx.fillRect(bodyX + 0.08, bodyY + 0.06, bodyWidth - 0.16, bodyHeight * 0.26);

  const stripeWidth = Math.max(0.06, Math.min(0.09, bodyWidth * 0.055));
  const firstStripe = bodyX + bodyWidth * 0.3;
  const stripeStep = Math.min(0.34, bodyWidth * 0.17);
  style.bands.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(firstStripe + index * stripeStep, bodyY, stripeWidth, bodyHeight);
  });
  ctx.restore();

  drawPin(0, 0);
  drawPin(length, 0);
}

function drawCapacitor(item) {
  const style = capacitorStyles[item.style] || capacitorStyles.ceramic;
  if (item.style === "electrolytic") {
    drawElectrolyticCapacitor(item, style);
    return;
  }
  if (item.style === "film") {
    drawFilmCapacitor(item, style);
    return;
  }
  drawCeramicCapacitor(item, style);
}

function drawCeramicCapacitor(item, style) {
  const spacing = item.spacing;
  const center = spacing / 2;
  const bodyWidth = Math.min(Math.max(0.78, spacing * 0.46), 1.16);
  const bodyX = center - bodyWidth / 2;
  ctx.strokeStyle = style.lead;
  ctx.lineWidth = 0.095;
  line(0, 0, bodyX + 0.03, 0);
  line(bodyX + bodyWidth - 0.03, 0, spacing, 0);
  roundedRect(ctx, bodyX, -0.33, bodyWidth, 0.66, 0.12);
  ctx.fillStyle = style.body;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 0.045;
  ctx.stroke();
  ctx.fillStyle = style.highlight;
  roundedRect(ctx, bodyX + 0.08, -0.26, bodyWidth - 0.16, 0.15, 0.06);
  ctx.fill();
  drawPin(0, 0);
  drawPin(spacing, 0);
}

function drawFilmCapacitor(item, style) {
  const spacing = item.spacing;
  const center = spacing / 2;
  const bodyWidth = Math.min(Math.max(0.96, spacing * 0.58), 1.45);
  const bodyX = center - bodyWidth / 2;
  ctx.strokeStyle = style.lead;
  ctx.lineWidth = 0.095;
  line(0, 0, bodyX, 0);
  line(bodyX + bodyWidth, 0, spacing, 0);
  roundedRect(ctx, bodyX, -0.42, bodyWidth, 0.84, 0.08);
  ctx.fillStyle = style.body;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 0.045;
  ctx.stroke();
  ctx.fillStyle = style.highlight;
  ctx.fillRect(bodyX + 0.09, -0.32, bodyWidth - 0.18, 0.16);
  drawPin(0, 0);
  drawPin(spacing, 0);
}

function drawElectrolyticCapacitor(item, style) {
  const spacing = item.spacing;
  const center = spacing / 2;
  const radius = Math.min(0.58, Math.max(0.42, spacing * 0.24));
  ctx.strokeStyle = style.lead;
  ctx.lineWidth = 0.095;
  line(0, 0, center - radius * 0.82, 0);
  line(center + radius * 0.82, 0, spacing, 0);

  ctx.beginPath();
  ctx.arc(center, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = style.body;
  ctx.fill();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = 0.05;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.arc(center, 0, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = style.stripe;
  ctx.fillRect(center + radius * 0.18, -radius, radius * 0.26, radius * 2);
  ctx.fillStyle = style.highlight;
  ctx.beginPath();
  ctx.arc(center - radius * 0.24, -radius * 0.25, radius * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.46)";
  ctx.lineWidth = 0.035;
  ctx.beginPath();
  ctx.arc(center, 0, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  componentText("+", 0.2, -0.38, "#17202a", 0.22);
  drawPin(0, 0);
  drawPin(spacing, 0);
}

function drawLed(item) {
  const spacing = item.spacing;
  ctx.strokeStyle = "#d9d6cc";
  ctx.lineWidth = 0.13;
  line(0, 0, spacing, 0);
  ctx.beginPath();
  ctx.arc(spacing / 2, 0, 0.43, 0, Math.PI * 2);
  ctx.fillStyle = item.color || "#ef4444";
  ctx.globalAlpha = 0.78;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#70202a";
  ctx.lineWidth = 0.055;
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.beginPath();
  ctx.arc(spacing / 2 - 0.14, -0.15, 0.1, 0, Math.PI * 2);
  ctx.fill();
  drawPin(0, 0);
  drawPin(spacing, 0);
}

function drawIc(item) {
  const pinRows = item.pins / 2;
  const length = pinRows - 1;
  const width = item.width;
  const bodyInset = clamp(width * 0.18, 0.42, 0.62);
  const bodyX = bodyInset;
  const bodyRight = width - bodyInset;
  const bodyY = -0.5;
  const bodyHeight = length + 1;
  const bodyWidth = Math.max(0.9, bodyRight - bodyX);

  for (let i = 0; i < pinRows; i += 1) {
    drawIcPin(0, i, bodyX, -1);
    drawIcPin(width, i, bodyRight, 1);
  }

  roundedRect(ctx, bodyX, bodyY, bodyWidth, bodyHeight, 0.08);
  ctx.fillStyle = "#242a32";
  ctx.fill();
  ctx.strokeStyle = "#05070a";
  ctx.lineWidth = 0.055;
  ctx.stroke();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
  ctx.lineWidth = 0.035;
  line(bodyX + 0.14, bodyY + 0.16, bodyRight - 0.14, bodyY + 0.16);

  ctx.beginPath();
  ctx.arc(width / 2, bodyY + 0.02, 0.22, 0, Math.PI);
  ctx.strokeStyle = "#8f9aaa";
  ctx.lineWidth = 0.06;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(bodyX + 0.28, bodyY + 0.28, 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "#7f8a98";
  ctx.fill();

  if (item.value) componentText(item.value, width / 2, length / 2 + 0.3, "#aeb8c4", 0.24);
}

function drawHeader(item) {
  ctx.strokeStyle = "#d9d6cc";
  ctx.lineWidth = 0.11;
  line(0, 0, item.count - 1, 0);
  for (let i = 0; i < item.count; i += 1) {
    roundedRect(ctx, i - 0.28, -0.28, 0.56, 0.56, 0.06);
    ctx.fillStyle = "#3b4754";
    ctx.fill();
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 0.04;
    ctx.stroke();
    drawPin(i, 0, "#f4c96b");
  }
}

function drawLabel(item) {
  ctx.save();
  ctx.scale(1 / view.cell, 1 / view.cell);
  ctx.fillStyle = item.color || "#17202a";
  ctx.font = "700 13px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(item.text || item.name || "TXT", 0, 0);
  ctx.restore();
}

function drawIcPin(x, y, bodyEdgeX, direction) {
  ctx.strokeStyle = "#9ca7b3";
  ctx.lineWidth = 0.12;
  line(x, y, bodyEdgeX, y);

  const footX = direction < 0 ? x - 0.34 : x - 0.12;
  roundedRect(ctx, footX, y - 0.13, 0.46, 0.26, 0.04);
  ctx.fillStyle = "#c9d1da";
  ctx.fill();
  ctx.strokeStyle = "#68727f";
  ctx.lineWidth = 0.035;
  ctx.stroke();
  drawPin(x, y, "#e6c15a");
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function drawPin(x, y, fill = "#d5a13b") {
  ctx.beginPath();
  ctx.arc(x, y, 0.16, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, 0.065, 0, Math.PI * 2);
  ctx.fillStyle = "#1d4938";
  ctx.fill();
}

function componentText(text, x, y, color, size = 0.3) {
  if (!text) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px ui-sans-serif, system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(text), x, y);
  ctx.restore();
}

function drawComponentSelection(item) {
  const bounds = itemBounds(item);
  const points = [
    gridToScreen(bounds.minX, bounds.minY),
    gridToScreen(bounds.maxX, bounds.minY),
    gridToScreen(bounds.maxX, bounds.maxY),
    gridToScreen(bounds.minX, bounds.maxY),
  ];
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.setLineDash([8, 6]);
  polygon(points);
  ctx.stroke();
  ctx.strokeStyle = "#276ef1";
  ctx.lineWidth = 2;
  polygon(points);
  ctx.stroke();
  ctx.setLineDash([]);
  for (const pin of itemPins(item)) {
    const p = gridToScreen(pin.x, pin.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(4, view.cell * 0.13), 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#276ef1";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function polygon(points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

function drawCuts(alpha = 1) {
  if (!alpha) return;
  const cuts = state.items.filter((item) => item.type === "cut");
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  for (const cut of cuts) {
    const p = gridToScreen(cut.x, cut.y);
    const size = Math.max(6, view.cell * 0.24);
    ctx.strokeStyle = isSelected(cut.id) ? "#ffffff" : "#fff5f6";
    ctx.lineWidth = isSelected(cut.id) ? 7 : 5;
    ctx.beginPath();
    ctx.moveTo(p.x - size, p.y - size);
    ctx.lineTo(p.x + size, p.y + size);
    ctx.moveTo(p.x + size, p.y - size);
    ctx.lineTo(p.x - size, p.y + size);
    ctx.stroke();
    ctx.strokeStyle = "#bb2f3a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p.x - size, p.y - size);
    ctx.lineTo(p.x + size, p.y + size);
    ctx.moveTo(p.x + size, p.y - size);
    ctx.lineTo(p.x - size, p.y + size);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDraftWire() {
  if (!wireDraft?.points?.length) return;
  const points = [...wireDraft.points];
  if (hoveredHole?.inside) points.push({ x: hoveredHole.x, y: hoveredHole.y });
  if (points.length < 2) return;
  ctx.save();
  ctx.setLineDash([7, 6]);
  ctx.lineCap = "round";
  traceWirePath(points);
  ctx.strokeStyle = currentWireColor;
  ctx.lineWidth = Math.max(3, view.cell * 0.16);
  ctx.stroke();
  ctx.restore();
}

function drawDraftComponent() {
  if (!componentDraft) return;
  const item = makeComponentFromSpan(componentDraft.type, componentDraft.start, componentDraft.end, { draft: true });
  if (!item) return;
  const span = componentSpan(componentDraft.type, componentDraft.start, componentDraft.end);
  const pins = itemPins(item);

  ctx.save();
  ctx.globalAlpha = 0.82;
  drawComponent(item);
  ctx.restore();

  ctx.save();
  ctx.setLineDash([7, 5]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.98)";
  traceDraftPins(pins);
  ctx.stroke();
  ctx.strokeStyle = "#276ef1";
  traceDraftPins(pins);
  ctx.stroke();
  ctx.setLineDash([]);

  [pins[0], pins[pins.length - 1]].forEach((pin, index) => {
    const p = gridToScreen(pin.x, pin.y);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(7, view.cell * 0.24), 0, Math.PI * 2);
    ctx.fillStyle = index === 0 ? "#ffffff" : "#dce8ff";
    ctx.fill();
    ctx.strokeStyle = "#276ef1";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  const labelPoint = gridToScreen(componentDraft.start.x, componentDraft.start.y);
  ctx.fillStyle = "#17202a";
  ctx.font = "700 12px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(`${typeName(componentDraft.type)} ${span.distance}穴`, labelPoint.x + 10, labelPoint.y - 10);
  ctx.restore();
}

function drawSelectionDraft() {
  if (!selectionDraft) return;
  const rect = normalizeScreenRect(selectionDraft.start, selectionDraft.current);
  if (rect.width < 2 && rect.height < 2) return;
  ctx.save();
  ctx.fillStyle = "rgba(39, 110, 241, 0.12)";
  ctx.strokeStyle = "rgba(39, 110, 241, 0.9)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width, rect.height);
  ctx.restore();
}

function traceDraftPins(pins) {
  if (pins.length < 2) return;
  const first = gridToScreen(pins[0].x, pins[0].y);
  const second = gridToScreen(pins[pins.length - 1].x, pins[pins.length - 1].y);
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  ctx.lineTo(second.x, second.y);
}

function drawHover() {
  if (!hoveredHole?.inside) return;
  const p = gridToScreen(hoveredHole.x, hoveredHole.y);
  ctx.save();
  ctx.beginPath();
  ctx.arc(p.x, p.y, Math.max(7, view.cell * 0.27), 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(39, 110, 241, 0.9)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function transformedPoint(item, point) {
  const angle = (normalizeRotation(item.rotation) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: item.x + point.x * cos - point.y * sin,
    y: item.y + point.x * sin + point.y * cos,
  };
}

function itemLocalBounds(item) {
  if (item.type === "resistor") return { minX: -0.26, minY: -0.68, maxX: item.length + 0.26, maxY: 0.48 };
  if (item.type === "capacitor" || item.type === "led") return { minX: -0.28, minY: -0.85, maxX: item.spacing + 0.28, maxY: 0.85 };
  if (item.type === "ic") {
    const length = item.pins / 2 - 1;
    return { minX: -0.6, minY: -0.7, maxX: item.width + 0.6, maxY: length + 0.7 };
  }
  if (item.type === "header") return { minX: -0.46, minY: -0.82, maxX: item.count - 0.54, maxY: 0.82 };
  if (item.type === "label") {
    const textLength = Math.max(2, String(item.text || item.name || "TXT").length);
    return { minX: -0.1, minY: -0.55, maxX: textLength * 0.45, maxY: 0.55 };
  }
  return { minX: -0.5, minY: -0.5, maxX: 0.5, maxY: 0.5 };
}

function itemBounds(item) {
  const local = itemLocalBounds(item);
  const corners = [
    { x: local.minX, y: local.minY },
    { x: local.maxX, y: local.minY },
    { x: local.maxX, y: local.maxY },
    { x: local.minX, y: local.maxY },
  ].map((point) => transformedPoint(item, point));
  return {
    minX: Math.min(...corners.map((point) => point.x)),
    minY: Math.min(...corners.map((point) => point.y)),
    maxX: Math.max(...corners.map((point) => point.x)),
    maxY: Math.max(...corners.map((point) => point.y)),
  };
}

function itemPins(item) {
  if (item.type === "resistor") return [{ x: 0, y: 0 }, { x: item.length, y: 0 }].map((pin) => transformedPoint(item, pin));
  if (item.type === "capacitor" || item.type === "led") return [{ x: 0, y: 0 }, { x: item.spacing, y: 0 }].map((pin) => transformedPoint(item, pin));
  if (item.type === "ic") {
    const pins = [];
    for (let i = 0; i < item.pins / 2; i += 1) {
      pins.push(transformedPoint(item, { x: 0, y: i }));
      pins.push(transformedPoint(item, { x: item.width, y: i }));
    }
    return pins;
  }
  if (item.type === "header") {
    return Array.from({ length: item.count }, (_, index) => transformedPoint(item, { x: index, y: 0 }));
  }
  return [{ x: item.x, y: item.y }];
}

function buildConnectivity() {
  const parent = new Map();
  const wireNodeKeys = new Set();

  const addNode = (key) => {
    if (!parent.has(key)) parent.set(key, key);
  };
  const find = (key) => {
    addNode(key);
    const current = parent.get(key);
    if (current === key) return key;
    const root = find(current);
    parent.set(key, root);
    return root;
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };

  for (const wire of state.items.filter((item) => item.type === "wire")) {
    let previousKey = null;
    for (let index = 1; index < wire.points.length; index += 1) {
      const holes = wireSegmentHoles(wire.points[index - 1], wire.points[index]);
      for (const hole of holes) {
        if (!isHoleEnabled(hole.x, hole.y)) {
          previousKey = null;
          continue;
        }
        const key = pointKey(hole);
        addNode(key);
        wireNodeKeys.add(key);
        if (previousKey) union(previousKey, key);
        previousKey = key;
      }
    }
  }

  const pins = state.items.filter(isElectricalComponent).flatMap(componentPinEntries);
  for (const pin of pins) addNode(pin.key);

  const pinsByRoot = new Map();
  for (const pin of pins) {
    pin.root = find(pin.key);
    if (!pinsByRoot.has(pin.root)) pinsByRoot.set(pin.root, []);
    pinsByRoot.get(pin.root).push(pin);
  }

  const wireRoots = new Set([...wireNodeKeys].map((key) => find(key)));
  const roots = [...new Set([...pinsByRoot.keys(), ...wireRoots])].sort();
  const netNameByRoot = new Map(roots.map((root, index) => [root, `N${index + 1}`]));
  for (const pin of pins) pin.net = netNameByRoot.get(pin.root);

  const pinsByPartId = new Map();
  for (const pin of pins) {
    if (!pinsByPartId.has(pin.item.id)) pinsByPartId.set(pin.item.id, []);
    pinsByPartId.get(pin.item.id).push(pin);
  }

  return { pins, pinsByPartId, pinsByRoot, wireRoots, netNameByRoot };
}

function componentPinEntries(item) {
  return componentLocalPins(item).map((pin, index) => {
    const point = normalizeGridPoint(transformedPoint(item, pin.local));
    return {
      item,
      itemId: item.id,
      pinIndex: index,
      pinLabel: pin.label,
      point,
      key: pointKey(point),
    };
  });
}

function componentLocalPins(item) {
  if (item.type === "resistor") return numberedPins([{ x: 0, y: 0 }, { x: item.length, y: 0 }]);
  if (item.type === "capacitor" || item.type === "led") return numberedPins([{ x: 0, y: 0 }, { x: item.spacing, y: 0 }]);
  if (item.type === "header") {
    return Array.from({ length: item.count }, (_, index) => ({ label: String(index + 1), local: { x: index, y: 0 } }));
  }
  if (item.type === "ic") {
    const pinRows = item.pins / 2;
    const pins = [];
    for (let row = 0; row < pinRows; row += 1) {
      pins.push({ label: String(row + 1), local: { x: 0, y: row } });
    }
    for (let row = 0; row < pinRows; row += 1) {
      pins.push({ label: String(item.pins - row), local: { x: item.width, y: row } });
    }
    return pins;
  }
  return [];
}

function numberedPins(points) {
  return points.map((point, index) => ({ label: String(index + 1), local: point }));
}

function isElectricalComponent(item) {
  return electricalComponentTypes.has(item.type);
}

function wireSegmentHoles(a, b) {
  const start = normalizeGridPoint(a);
  const end = normalizeGridPoint(b);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const steps = gcd(Math.abs(dx), Math.abs(dy));
  if (steps === 0) return [start];
  const stepX = dx / steps;
  const stepY = dy / steps;
  return Array.from({ length: steps + 1 }, (_, index) => ({
    x: start.x + stepX * index,
    y: start.y + stepY * index,
  }));
}

function gcd(a, b) {
  let x = Math.round(Math.abs(a));
  let y = Math.round(Math.abs(b));
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 0;
}

function normalizeGridPoint(point) {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
}

function pointKey(point) {
  return `${Math.round(point.x)},${Math.round(point.y)}`;
}

function sortPointKeys(keys) {
  return keys.sort((a, b) => {
    const pointA = parsePointKey(a);
    const pointB = parsePointKey(b);
    if (!pointA || !pointB) return String(a).localeCompare(String(b));
    return pointA.y - pointB.y || pointA.x - pointB.x;
  });
}

function currentBoardTheme() {
  return boardThemes[state.board.theme] || boardThemes.green;
}

function boardDisabledSet() {
  return new Set(state.board.disabledHoles || []);
}

function isHoleEnabled(x, y) {
  if (x < 0 || y < 0 || x >= state.board.cols || y >= state.board.rows) return false;
  return !boardDisabledSet().has(pointKey({ x, y }));
}

function isHoleDisabled(x, y) {
  return boardDisabledSet().has(pointKey({ x, y }));
}

function itemUsesEnabledHoles(item) {
  if (!item) return false;
  if (item.type === "wire") return item.points.every((point) => isHoleEnabled(point.x, point.y));
  if (item.type === "cut" || item.type === "label") return isHoleEnabled(item.x, item.y);
  if (isElectricalComponent(item)) return itemPins(item).every((pin) => isHoleEnabled(pin.x, pin.y));
  return true;
}

function setHoleDisabled(x, y, disabled) {
  if (x < 0 || y < 0 || x >= state.board.cols || y >= state.board.rows) return false;
  const key = pointKey({ x, y });
  const disabledSet = boardDisabledSet();
  const alreadyDisabled = disabledSet.has(key);
  if (disabled === alreadyDisabled) return false;
  if (disabled) {
    disabledSet.add(key);
  } else {
    disabledSet.delete(key);
  }
  state.board.disabledHoles = sortPointKeys([...disabledSet]);
  return true;
}

function hitTest(screenPoint) {
  const candidates = [...state.items].reverse();
  const itemCandidates = [];
  const wirePointCandidates = [];
  const wireSegmentCandidates = [];
  const gridPoint = screenToGrid(screenPoint.x, screenPoint.y);

  candidates.forEach((item, zIndex) => {
    if (!isItemDisplayEnabled(item)) return;
    if (item.type === "wire") {
      for (let index = 0; index < item.points.length; index += 1) {
        const point = item.points[index];
        const p = gridToScreen(point.x, point.y);
        const distance = Math.hypot(screenPoint.x - p.x, screenPoint.y - p.y);
        if (distance <= Math.max(8, view.cell * 0.25)) {
          wirePointCandidates.push({ kind: "wirePoint", item, pointIndex: index, distance, zIndex });
        }
      }

      for (let index = 1; index < item.points.length; index += 1) {
        const a = gridToScreen(item.points[index - 1].x, item.points[index - 1].y);
        const b = gridToScreen(item.points[index].x, item.points[index].y);
        const distance = distanceToSegment(screenPoint, a, b);
        if (distance <= Math.max(7, view.cell * 0.18)) {
          wireSegmentCandidates.push({ kind: "wire", item, distance, zIndex });
        }
      }
      return;
    }

    if (item.type === "cut") {
      const p = gridToScreen(item.x, item.y);
      const distance = Math.hypot(screenPoint.x - p.x, screenPoint.y - p.y);
      if (distance < Math.max(11, view.cell * 0.35)) {
        itemCandidates.push({ kind: "item", item, distance, zIndex });
      }
      return;
    }
    const bounds = itemBounds(item);
    if (
      gridPoint.x >= bounds.minX - 0.25 &&
      gridPoint.x <= bounds.maxX + 0.25 &&
      gridPoint.y >= bounds.minY - 0.25 &&
      gridPoint.y <= bounds.maxY + 0.25
    ) {
      itemCandidates.push({ kind: "item", item, distance: 0, zIndex });
    }
  });

  const bySelectionThenDistance = (a, b) => {
    const selectedDiff = Number(isSelected(b.item.id)) - Number(isSelected(a.item.id));
    if (selectedDiff) return selectedDiff;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.zIndex - b.zIndex;
  };
  const bySelectionThenLayer = (a, b) => {
    const selectedDiff = Number(isSelected(b.item.id)) - Number(isSelected(a.item.id));
    if (selectedDiff) return selectedDiff;
    return a.zIndex - b.zIndex;
  };
  const byDistance = (a, b) => (a.distance === b.distance ? a.zIndex - b.zIndex : a.distance - b.distance);

  const wirePoint = [...wirePointCandidates].sort(bySelectionThenDistance)[0] || null;
  const wireSegment = [...wireSegmentCandidates].sort(byDistance)[0] || null;
  const item = [...itemCandidates].sort(bySelectionThenLayer)[0] || null;

  if (grabMode === "parts") return item;
  if (grabMode === "wires") return wirePoint || wireSegment;

  const selectedWirePoint = wirePointCandidates
    .filter((candidate) => isSelected(candidate.item.id))
    .sort(bySelectionThenDistance)[0];
  if (selectedWirePoint) return selectedWirePoint;
  return item || wirePoint || wireSegment;
}

function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 0 && dy === 0) return Math.hypot(point.x - a.x, point.y - a.y);
  const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
  const x = a.x + t * dx;
  const y = a.y + t * dy;
  return Math.hypot(point.x - x, point.y - y);
}

function normalizeScreenRect(a, b) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
    right: Math.max(a.x, b.x),
    bottom: Math.max(a.y, b.y),
  };
}

function rectsIntersect(a, b) {
  return a.x <= b.right && a.right >= b.x && a.y <= b.bottom && a.bottom >= b.y;
}

function itemScreenBounds(item) {
  if (item.type === "wire") {
    const points = item.points.map((point) => gridToScreen(point.x, point.y));
    const padding = Math.max(8, view.cell * 0.18);
    const minX = Math.min(...points.map((point) => point.x)) - padding;
    const minY = Math.min(...points.map((point) => point.y)) - padding;
    const maxX = Math.max(...points.map((point) => point.x)) + padding;
    const maxY = Math.max(...points.map((point) => point.y)) + padding;
    return { x: minX, y: minY, right: maxX, bottom: maxY, width: maxX - minX, height: maxY - minY };
  }

  if (item.type === "cut") {
    const point = gridToScreen(item.x, item.y);
    const padding = Math.max(10, view.cell * 0.3);
    return {
      x: point.x - padding,
      y: point.y - padding,
      right: point.x + padding,
      bottom: point.y + padding,
      width: padding * 2,
      height: padding * 2,
    };
  }

  const bounds = itemBounds(item);
  const corners = [
    gridToScreen(bounds.minX, bounds.minY),
    gridToScreen(bounds.maxX, bounds.minY),
    gridToScreen(bounds.maxX, bounds.maxY),
    gridToScreen(bounds.minX, bounds.maxY),
  ];
  const minX = Math.min(...corners.map((point) => point.x));
  const minY = Math.min(...corners.map((point) => point.y));
  const maxX = Math.max(...corners.map((point) => point.x));
  const maxY = Math.max(...corners.map((point) => point.y));
  return { x: minX, y: minY, right: maxX, bottom: maxY, width: maxX - minX, height: maxY - minY };
}

function itemIdsInSelectionRect(rect) {
  return state.items.filter((item) => isItemDisplayEnabled(item) && rectsIntersect(rect, itemScreenBounds(item))).map((item) => item.id);
}

function pointerDown(event) {
  rememberCanvasPointer(event);
  if (event.pointerType === "touch" && activeCanvasPointers.size >= 2) {
    event.preventDefault();
    beginPinchGesture();
    render();
    return;
  }

  const point = eventPoint(event);
  const hole = nearestHole(point);
  hoveredHole = hole;
  capturePointer(event.pointerId);

  if (currentTool === "select") {
    const hit = hitTest(point);
    if (!hit) {
      selectionDraft = { start: point, current: point };
      drag = null;
      return;
    }

    if (!isSelected(hit.item.id)) {
      selectItem(hit.item.id);
    } else {
      save();
      render();
    }

    const selectedItems = getSelectedItems();
    if (hit.kind === "wirePoint" && selectedItems.length === 1) {
      drag = {
        kind: "wirePoint",
        itemId: hit.item.id,
        pointIndex: hit.pointIndex,
        startHole: { x: hole.x, y: hole.y },
      };
    } else {
      drag = {
        kind: "moveGroup",
        itemIds: selectedItems.map((item) => item.id),
        startHole: { x: hole.x, y: hole.y },
        startItems: selectedItems.map(cloneItem),
        linkedWirePoints: linkedWirePointsForItems(selectedItems),
      };
    }
    dirtyDuringDrag = false;
    return;
  }

  if (!hole.inside) return;
  if (currentTool === "wire") {
    addWirePoint(hole);
    return;
  }
  if (currentTool === "cut") {
    mutate(() => toggleCut(hole.x, hole.y));
    return;
  }
  if (spanPlacedTypes.has(currentTool)) {
    componentDraft = {
      type: currentTool,
      start: { x: hole.x, y: hole.y },
      end: { x: hole.x, y: hole.y },
    };
    selectItem(null);
    render();
    return;
  }

  mutate(() => {
    const item = makeComponent(currentTool, hole.x, hole.y);
    if (!item || !itemUsesEnabledHoles(item)) return;
    item.layer = currentLayer;
    state.items.push(item);
    setSelection([item.id]);
  });
}

function pointerMove(event) {
  if (activeCanvasPointers.has(event.pointerId)) {
    rememberCanvasPointer(event);
  }
  if (pinchGesture) {
    event.preventDefault();
    updatePinchGesture();
    return;
  }

  const point = eventPoint(event);
  hoveredHole = nearestHole(point);
  els.cursorStatus.textContent = `x: ${hoveredHole.x}, y: ${hoveredHole.y}`;

  if (selectionDraft) {
    selectionDraft.current = point;
    render();
    return;
  }

  if (componentDraft) {
    if (hoveredHole.inside) {
      componentDraft.end = { x: hoveredHole.x, y: hoveredHole.y };
    }
    render();
    return;
  }

  if (!drag) {
    render();
    return;
  }

  if (!dirtyDuringDrag) {
    commitHistory();
    dirtyDuringDrag = true;
  }

  if (!hoveredHole.inside) {
    render();
    return;
  }

  const dx = hoveredHole.x - drag.startHole.x;
  const dy = hoveredHole.y - drag.startHole.y;

  if (drag.kind === "moveGroup") {
    moveDraggedItems(dx, dy);
    save();
    render();
    return;
  }

  const item = state.items.find((candidate) => candidate.id === drag.itemId);
  if (!item) return;

  if (drag.kind === "wirePoint") {
    item.points[drag.pointIndex] = { x: hoveredHole.x, y: hoveredHole.y };
    save();
    render();
    return;
  }
}

function pointerUp(event) {
  const wasPinching = Boolean(pinchGesture);
  forgetCanvasPointer(event);
  releasePointer(event.pointerId);
  if (wasPinching) {
    event.preventDefault();
    return;
  }

  if (selectionDraft) {
    finishSelectionDraft(eventPoint(event));
    return;
  }

  if (componentDraft) {
    finishComponentDraft(hoveredHole || componentDraft.end);
    return;
  }

  if (drag) {
    const shouldMergeWires = dirtyDuringDrag;
    const linkedWireIds = (drag.linkedWirePoints || []).map((link) => link.itemId);
    const mergeWireIds = drag.kind === "wirePoint" ? [drag.itemId] : [...drag.itemIds, ...linkedWireIds];
    drag = null;
    dirtyDuringDrag = false;
    if (shouldMergeWires) {
      finalizeWireTopology(mergeWireIds);
    } else {
      dedupeWires();
    }
    save();
    render();
  }
}

function pointerCancel(event) {
  forgetCanvasPointer(event);
  selectionDraft = null;
  componentDraft = null;
  drag = null;
  dirtyDuringDrag = false;
  releasePointer(event.pointerId);
  render();
}

function canvasWheel(event) {
  if (!(event.ctrlKey || event.metaKey || event.altKey)) return;
  event.preventDefault();
  const delta = clamp(event.deltaY, -240, 240);
  const zoomFactor = Math.exp(-delta * 0.0025);
  setZoom(state.zoom * zoomFactor);
}

function cloneItem(item) {
  return JSON.parse(JSON.stringify(item));
}

function moveDraggedItems(dx, dy) {
  const delta = constrainedDragDelta(dx, dy);
  const nextItems = drag.startItems.map((item) => movedItem(item, delta.dx, delta.dy));
  if (!nextItems.every(itemUsesEnabledHoles)) return;
  for (const startItem of drag.startItems) {
    const item = state.items.find((candidate) => candidate.id === startItem.id);
    if (!item) continue;

    if (item.type === "wire") {
      item.points = startItem.points.map((point) => ({
        x: point.x + delta.dx,
        y: point.y + delta.dy,
      }));
    } else {
      item.x = startItem.x + delta.dx;
      item.y = startItem.y + delta.dy;
    }
  }
  moveLinkedWirePoints(delta.dx, delta.dy);
  clampAllItems();
}

function linkedWirePointsForItems(items) {
  const movingIds = new Set(items.map((item) => item.id));
  const pinKeys = new Set(
    items
      .filter(isElectricalComponent)
      .flatMap((item) => itemPins(item))
      .map(pointKey),
  );
  if (!pinKeys.size) return [];

  const links = [];
  const seen = new Set();
  for (const wire of state.items.filter((item) => item.type === "wire" && !movingIds.has(item.id))) {
    wire.points.forEach((point, pointIndex) => {
      if (!pinKeys.has(pointKey(point))) return;
      const key = `${wire.id}:${pointIndex}`;
      if (seen.has(key)) return;
      seen.add(key);
      links.push({
        itemId: wire.id,
        pointIndex,
        startPoint: { x: point.x, y: point.y },
      });
    });
  }
  return links;
}

function moveLinkedWirePoints(dx, dy) {
  if (!drag?.linkedWirePoints?.length) return;
  for (const link of drag.linkedWirePoints) {
    const wire = state.items.find((item) => item.id === link.itemId && item.type === "wire");
    if (!wire?.points?.[link.pointIndex]) continue;
    wire.points[link.pointIndex] = {
      x: link.startPoint.x + dx,
      y: link.startPoint.y + dy,
    };
  }
}

function movedItem(item, dx, dy) {
  const clone = cloneItem(item);
  if (clone.type === "wire") {
    clone.points = clone.points.map((point) => ({ x: point.x + dx, y: point.y + dy }));
  } else {
    clone.x += dx;
    clone.y += dy;
  }
  return clone;
}

function constrainedDragDelta(dx, dy) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of drag.startItems) {
    const points = item.type === "wire" ? item.points : [{ x: item.x, y: item.y }];
    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  return {
    dx: clamp(dx, -minX, state.board.cols - 1 - maxX),
    dy: clamp(dy, -minY, state.board.rows - 1 - maxY),
  };
}

function finishSelectionDraft(endPoint) {
  const draft = selectionDraft;
  selectionDraft = null;
  if (!draft) return;

  const rect = normalizeScreenRect(draft.start, endPoint);
  if (rect.width < 4 && rect.height < 4) {
    selectItem(null);
    return;
  }

  selectItems(itemIdsInSelectionRect(rect));
}

function finishComponentDraft(endHole) {
  const draft = componentDraft;
  if (!draft) return;
  const end = { x: endHole.x, y: endHole.y };
  const item = makeComponentFromSpan(draft.type, draft.start, end);
  componentDraft = null;
  if (!item) {
    render();
    return;
  }
  if (!itemUsesEnabledHoles(item)) {
    render();
    return;
  }
  mutate(() => {
    state.items.push(item);
    setSelection([item.id]);
  });
}

function cancelComponentDraft() {
  componentDraft = null;
  render();
}

function addWirePoint(hole) {
  if (!wireDraft) {
    wireDraft = {
      layer: currentLayer,
      color: currentWireColor,
      points: [{ x: hole.x, y: hole.y }],
    };
    els.wirePanel.hidden = false;
    render();
    return;
  }

  const last = wireDraft.points[wireDraft.points.length - 1];
  if (last.x === hole.x && last.y === hole.y) return;
  wireDraft.points.push({ x: hole.x, y: hole.y });
  render();
}

function finishWire() {
  if (!wireDraft || wireDraft.points.length < 2) {
    cancelWire();
    return;
  }
  let wireId = null;
  mutate(() => {
    const wire = normalizeItem({
      id: uid("wire"),
      type: "wire",
      layer: wireDraft.layer,
      color: wireDraft.color,
      width: 2,
      points: wireDraft.points,
    });
    if (wire) {
      wireId = wire.id;
      state.items.push(wire);
      setSelection([wire.id]);
    }
    wireDraft = null;
    els.wirePanel.hidden = true;
  }, { mergeWires: true, mergeWireIds: () => (wireId ? [wireId] : []) });
}

function cancelWire() {
  wireDraft = null;
  els.wirePanel.hidden = true;
  render();
}

function toggleCut(x, y) {
  const existing = state.items.find((item) => item.type === "cut" && item.x === x && item.y === y);
  if (existing) {
    state.items = state.items.filter((item) => item.id !== existing.id);
    setSelection([...selectedIds].filter((id) => id !== existing.id));
  } else {
    const item = { id: uid("cut"), type: "cut", x, y };
    state.items.push(item);
    setSelection([item.id]);
  }
}

function dedupeWires() {
  let changed = false;
  for (const wire of state.items.filter((item) => item.type === "wire")) {
    const points = compactWirePoints(wire.points);
    if (points.length !== wire.points.length) changed = true;
    wire.points = points;
  }
  const before = state.items.length;
  state.items = state.items.filter((item) => item.type !== "wire" || item.points.length >= 2);
  return changed || before !== state.items.length;
}

function finalizeWireTopology(seedIds = null) {
  const dedupedBefore = dedupeWires();
  const merged = mergeTouchingWires(seedIds);
  const dedupedAfter = dedupeWires();
  syncSelectionToItems();
  return dedupedBefore || merged || dedupedAfter;
}

function mergeTouchingWires(seedIds = null) {
  const activeIds = seedIds ? new Set([...seedIds].filter(Boolean)) : null;
  let changed = false;

  let foundMerge = true;
  while (foundMerge) {
    foundMerge = false;
    const wires = state.items.filter((item) => item.type === "wire");

    search: for (let first = 0; first < wires.length; first += 1) {
      for (let second = first + 1; second < wires.length; second += 1) {
        const a = wires[first];
        const b = wires[second];
        if (activeIds && !activeIds.has(a.id) && !activeIds.has(b.id)) continue;
        if (!sameWireStyle(a, b) || isClosedWire(a) || isClosedWire(b)) continue;

        const points = mergedWirePoints(a, b);
        if (!points) continue;

        const survivor = chooseWireSurvivor(a, b, activeIds);
        const removed = survivor.id === a.id ? b : a;
        survivor.points = compactWirePoints(points);
        state.items = state.items.filter((item) => item.id !== removed.id);
        replaceSelectionId(removed.id, survivor.id);
        if (activeIds) {
          activeIds.delete(removed.id);
          activeIds.add(survivor.id);
        }
        changed = true;
        foundMerge = true;
        break search;
      }
    }
  }

  return changed;
}

function compactWirePoints(points) {
  return points.filter((point, index, list) => index === 0 || !samePoint(point, list[index - 1]));
}

function sameWireStyle(a, b) {
  return a.layer === b.layer && a.color === b.color && Number(a.width) === Number(b.width);
}

function chooseWireSurvivor(a, b, activeIds) {
  const score = (wire) => (selectedIds.has(wire.id) ? 2 : 0) + (activeIds?.has(wire.id) ? 1 : 0);
  return score(b) > score(a) ? b : a;
}

function replaceSelectionId(fromId, toId) {
  if (!selectedIds.has(fromId)) return;
  const ids = [...selectedIds].map((id) => (id === fromId ? toId : id));
  setSelection([...new Set(ids)]);
}

function mergedWirePoints(a, b) {
  const aStart = a.points[0];
  const aEnd = a.points[a.points.length - 1];
  const bStart = b.points[0];
  const bEnd = b.points[b.points.length - 1];

  if (samePoint(aEnd, bStart)) return [...a.points, ...b.points.slice(1)];
  if (samePoint(aStart, bEnd)) return [...b.points, ...a.points.slice(1)];
  if (samePoint(aStart, bStart)) return [...a.points].reverse().concat(b.points.slice(1));
  if (samePoint(aEnd, bEnd)) return a.points.concat([...b.points].reverse().slice(1));
  return null;
}

function isClosedWire(wire) {
  return wire.points.length > 2 && samePoint(wire.points[0], wire.points[wire.points.length - 1]);
}

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

function clampAllItems() {
  for (const item of state.items) clampItem(item);
  dedupeWires();
}

function clampItem(item) {
  if (item.type === "wire") {
    for (const point of item.points) {
      point.x = clamp(Math.round(point.x), 0, state.board.cols - 1);
      point.y = clamp(Math.round(point.y), 0, state.board.rows - 1);
    }
    return;
  }
  item.x = clamp(Math.round(item.x), 0, state.board.cols - 1);
  item.y = clamp(Math.round(item.y), 0, state.board.rows - 1);
}

function updateStatus() {
  const wires = state.items.filter((item) => item.type === "wire").length;
  const parts = state.items.filter((item) => item.type !== "wire" && item.type !== "cut").length;
  const cuts = state.items.filter((item) => item.type === "cut").length;
  els.layoutStatus.textContent = `${parts} parts / ${wires} wires / ${cuts} cuts`;
  const selected = getSelected();
  if (componentDraft) {
    const span = componentSpan(componentDraft.type, componentDraft.start, componentDraft.end);
    els.selectionStatus.textContent = `配置中: ${typeName(componentDraft.type)} ${span.distance}穴`;
  } else {
    const selectedItems = getSelectedItems();
    els.selectionStatus.textContent = selectedItems.length > 1 ? `${selectedItems.length} items selected` : selected ? selectionLabel(selected) : "未選択";
  }
  els.projectMeta.textContent = `${state.board.cols} x ${state.board.rows} holes / ${state.board.pitch} mm`;
}

function selectionLabel(item) {
  if (item.type === "wire") return `${item.layer === "top" ? "部品面" : "はんだ面"} wire`;
  if (item.type === "cut") return `cut (${item.x}, ${item.y})`;
  if (item.type === "label") return item.text || item.name;
  return `${item.name || item.type} ${item.value || ""}`.trim();
}

function updateTopButtons() {
  els.undo.disabled = !history.length;
  els.redo.disabled = !future.length;
}

function syncControls() {
  els.cols.value = state.board.cols;
  els.rows.value = state.board.rows;
  els.zoom.value = state.zoom;
  els.labelToggle.checked = state.board.showLabels;
  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === currentTool);
  });
  document.querySelectorAll("[data-layer]").forEach((button) => {
    button.classList.toggle("active", button.dataset.layer === currentLayer);
  });
  document.querySelectorAll("[data-display-target][data-display-mode]").forEach((button) => {
    const active = displayOptions[button.dataset.displayTarget] === button.dataset.displayMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll("[data-grab-mode]").forEach((button) => {
    const active = button.dataset.grabMode === grabMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".swatch").forEach((button) => {
    button.classList.toggle("active", button.dataset.color === currentWireColor);
  });
  document.querySelectorAll("[data-board-theme]").forEach((button) => {
    const active = button.dataset.boardTheme === state.board.theme;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  updateHoleMaskStatus();
}

function updateInspector() {
  const selectedItems = getSelectedItems();
  const selected = getSelected();
  els.inspector.replaceChildren();
  if (selectedItems.length > 1) {
    els.inspector.append(multiSelectionInspector(selectedItems));
    return;
  }
  if (!selected) {
    els.inspector.append(emptyInspector());
    return;
  }

  if (selected.type === "wire") {
    els.inspector.append(wireInspector(selected));
    return;
  }
  if (selected.type === "cut") {
    els.inspector.append(cutInspector(selected));
    return;
  }
  els.inspector.append(componentInspector(selected));
}

function emptyInspector() {
  const root = div("inspector-empty");
  const metrics = div("metric-grid");
  const partCount = state.items.filter((item) => item.type !== "wire" && item.type !== "cut").length;
  const wireLength = state.items
    .filter((item) => item.type === "wire")
    .reduce((sum, wire) => sum + wireLengthInHoles(wire), 0);
  metrics.append(metric(String(partCount), "部品"));
  metrics.append(metric(wireLength.toFixed(1), "配線穴ピッチ"));
  metrics.append(metric(String(state.items.filter((item) => item.type === "wire").length), "配線"));
  metrics.append(metric(String(state.items.filter((item) => item.type === "cut").length), "カット"));
  root.append(metrics, connectionPanel());
  return root;
}

function multiSelectionInspector(items) {
  const root = div("inspector-empty");
  const metrics = div("metric-grid");
  const wires = items.filter((item) => item.type === "wire").length;
  const cuts = items.filter((item) => item.type === "cut").length;
  const parts = items.length - wires - cuts;
  metrics.append(metric(String(items.length), "選択中"));
  metrics.append(metric(String(parts), "部品"));
  metrics.append(metric(String(wires), "配線"));
  metrics.append(metric(String(cuts), "カット"));
  const row = div("inspector-actions");
  const remove = document.createElement("button");
  remove.className = "action-button danger";
  remove.type = "button";
  remove.textContent = "削除";
  remove.addEventListener("click", () => deleteSelected());
  row.append(remove);
  const selectedPartIds = items.filter(isElectricalComponent).map((item) => item.id);
  root.append(metrics);
  if (selectedPartIds.length) root.append(connectionPanel(selectedPartIds, { title: "選択中の接続" }));
  root.append(row);
  return root;
}

function connectionPanel(itemIds = null, options = {}) {
  const connectivity = buildConnectivity();
  const itemIdSet = itemIds ? new Set(itemIds) : null;
  const parts = state.items.filter(isElectricalComponent).filter((item) => !itemIdSet || itemIdSet.has(item.id));
  const root = div("connection-panel");
  const header = div("connection-header");
  const title = div("connection-title");
  title.textContent = options.title || (itemIdSet ? "接続" : "接続リスト");
  const count = div("connection-count");
  count.textContent = `${connectivity.netNameByRoot.size} ネット`;
  header.append(title, count);
  root.append(header);

  if (!parts.length) {
    const empty = div("connection-empty");
    empty.textContent = "素子なし";
    root.append(empty);
    return root;
  }

  const list = div("connection-list");
  for (const part of parts) {
    list.append(connectionCard(part, connectivity));
  }
  root.append(list);
  return root;
}

function connectionCard(item, connectivity) {
  const card = div("connection-card");
  const title = div("connection-part-title");
  const name = document.createElement("span");
  name.textContent = componentDisplayName(item);
  const value = document.createElement("small");
  value.textContent = componentSummaryText(item);
  title.append(name, value);
  card.append(title);

  const rows = div("connection-pin-list");
  for (const pin of connectivity.pinsByPartId.get(item.id) || []) {
    rows.append(connectionRow(pin, connectivity));
  }
  card.append(rows);
  return card;
}

function connectionRow(pin, connectivity) {
  const row = div("connection-row");
  const pinNode = div("connection-pin");
  const pinLabel = document.createElement("span");
  pinLabel.textContent = pin.pinLabel;
  const netLabel = document.createElement("small");
  netLabel.textContent = pin.net || "-";
  pinNode.title = `(${pin.point.x}, ${pin.point.y})`;
  pinNode.append(pinLabel, netLabel);

  const targets = div("connection-targets");
  const targetInfo = connectionTargetInfo(pin, connectivity);
  targets.textContent = targetInfo.text;
  if (!targetInfo.hasTargets) {
    targets.classList.add("empty");
  }
  row.append(pinNode, targets);
  return row;
}

function connectionTargetInfo(pin, connectivity) {
  const targetPins = connectedPins(pin, connectivity);
  if (targetPins.length) {
    return { text: targetPins.map(formatPinReference).sort().join(", "), hasTargets: true };
  }
  return {
    text: connectivity.wireRoots.has(pin.root) ? "配線のみ" : "未接続",
    hasTargets: false,
  };
}

function connectedPins(pin, connectivity) {
  return (connectivity.pinsByRoot.get(pin.root) || []).filter((target) => target.itemId !== pin.itemId || target.pinIndex !== pin.pinIndex);
}

function formatPinReference(pin) {
  return `${componentDisplayName(pin.item)}-${pin.pinLabel}`;
}

function componentDisplayName(item) {
  return item.name || typeName(item.type);
}

function componentSummaryText(item) {
  const kindName = componentKindName(item);
  return item.value ? `${kindName} ・ ${item.value}` : kindName;
}

function metric(value, label) {
  const node = div("metric");
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  node.append(strong, span);
  return node;
}

function wireLengthInHoles(wire) {
  let length = 0;
  for (let index = 1; index < wire.points.length; index += 1) {
    const a = wire.points[index - 1];
    const b = wire.points[index];
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return length;
}

function componentInspector(item) {
  const root = div("field-stack");
  root.append(readonlyField("種類", typeName(item.type)));
  if (item.type !== "label") {
    root.append(textField("名前", item.name || "", (value) => (item.name = value)));
    root.append(textField("値", item.value || "", (value) => (item.value = value)));
  }
  if (item.type === "label") {
    root.append(textAreaField("文字", item.text || "", (value) => (item.text = value)));
  }
  root.append(coordFields(item));
  if (item.type !== "label") {
    root.append(selectField("回転", String(item.rotation), ["0", "90", "180", "270"], (value) => (item.rotation = normalizeRotation(value))));
  }
  if (item.type === "resistor") {
    root.append(numberField("穴間隔", item.length, 1, 16, (value) => (item.length = clamp(value, 1, 16))));
    root.append(selectField("外観", item.style, Object.keys(resistorStyles), (value) => (item.style = value), styleLabels(resistorStyles)));
  }
  if (item.type === "capacitor") {
    root.append(numberField("穴間隔", item.spacing, 1, 8, (value) => (item.spacing = clamp(value, 1, 8))));
    root.append(selectField("外観", item.style, Object.keys(capacitorStyles), (value) => (item.style = value), styleLabels(capacitorStyles)));
  }
  if (item.type === "led") root.append(numberField("穴間隔", item.spacing, 1, 8, (value) => (item.spacing = clamp(value, 1, 8))));
  if (item.type === "ic") {
    root.append(numberField("ピン", item.pins, 6, 40, (value) => (item.pins = clampEven(value, 6, 40))));
    root.append(numberField("幅", item.width, 2, 8, (value) => (item.width = clamp(value, 2, 8))));
  }
  if (item.type === "header") root.append(numberField("ピン", item.count, 1, 40, (value) => (item.count = clamp(value, 1, 40))));
  if (item.type === "led" || item.type === "label") {
    root.append(colorSwatches(item.color || componentColors[item.type], (value) => (item.color = value)));
  }
  if (isElectricalComponent(item)) {
    root.append(connectionPanel([item.id]));
  }
  root.append(actionRow(item));
  return root;
}

function wireInspector(item) {
  const root = div("field-stack");
  root.append(readonlyField("種類", "配線"));
  root.append(selectField("面", item.layer, ["top", "bottom"], (value) => (item.layer = value), { top: "部品面", bottom: "はんだ面" }));
  root.append(numberField("太さ", item.width, 1, 5, (value) => (item.width = clamp(value, 1, 5))));
  root.append(colorSwatches(item.color, (value) => (item.color = value)));
  root.append(actionRow(item));
  return root;
}

function cutInspector(item) {
  const root = div("field-stack");
  root.append(readonlyField("種類", "カット"));
  root.append(coordFields(item));
  root.append(actionRow(item));
  return root;
}

function coordFields(item) {
  const pair = div("pair");
  pair.append(numberField("x", item.x, 0, state.board.cols - 1, (value) => (item.x = clamp(value, 0, state.board.cols - 1))));
  pair.append(numberField("y", item.y, 0, state.board.rows - 1, (value) => (item.y = clamp(value, 0, state.board.rows - 1))));
  return pair;
}

function readonlyField(labelText, value) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = labelText;
  const input = document.createElement("input");
  input.value = value;
  input.disabled = true;
  label.append(span, input);
  return label;
}

function textField(labelText, value, onChange) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = labelText;
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.addEventListener("change", () => inspectorMutate(() => onChange(input.value)));
  label.append(span, input);
  return label;
}

function textAreaField(labelText, value, onChange) {
  const label = document.createElement("label");
  label.className = "wide-label";
  const span = document.createElement("span");
  span.textContent = labelText;
  const input = document.createElement("textarea");
  input.value = value;
  input.addEventListener("change", () => inspectorMutate(() => onChange(input.value)));
  label.append(span, input);
  return label;
}

function numberField(labelText, value, min, max, onChange) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = labelText;
  const input = document.createElement("input");
  input.type = "number";
  input.min = min;
  input.max = max;
  input.step = 1;
  input.value = value;
  input.addEventListener("change", () => inspectorMutate(() => onChange(Math.round(Number(input.value) || 0))));
  label.append(span, input);
  return label;
}

function selectField(labelText, value, values, onChange, labels = {}) {
  const label = document.createElement("label");
  const span = document.createElement("span");
  span.textContent = labelText;
  const select = document.createElement("select");
  for (const optionValue of values) {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = labels[optionValue] || optionValue;
    option.selected = optionValue === value;
    select.append(option);
  }
  select.addEventListener("change", () => inspectorMutate(() => onChange(select.value)));
  label.append(span, select);
  return label;
}

function colorSwatches(value, onChange) {
  const wrapper = div("mini-swatches");
  for (const color of wireColors) {
    const button = document.createElement("button");
    button.className = `swatch${color === value ? " active" : ""}`;
    button.style.setProperty("--swatch", color);
    button.type = "button";
    button.title = color;
    button.ariaLabel = color;
    button.addEventListener("click", () => inspectorMutate(() => onChange(color)));
    wrapper.append(button);
  }
  return wrapper;
}

function actionRow(item) {
  const row = div("inspector-actions");
  if (item.type !== "wire" && item.type !== "cut" && item.type !== "label") {
    const rotate = document.createElement("button");
    rotate.className = "action-button";
    rotate.type = "button";
    rotate.textContent = "回転";
    rotate.addEventListener("click", () => inspectorMutate(() => (item.rotation = normalizeRotation(item.rotation + 90))));
    row.append(rotate);
  }
  const duplicate = document.createElement("button");
  duplicate.className = "action-button";
  duplicate.type = "button";
  duplicate.textContent = "複製";
  duplicate.addEventListener("click", () => duplicateItem(item));
  const remove = document.createElement("button");
  remove.className = "action-button danger";
  remove.type = "button";
  remove.textContent = "削除";
  remove.addEventListener("click", () => deleteSelected());
  if (item.type !== "cut") row.append(duplicate);
  row.append(remove);
  return row;
}

function inspectorMutate(fn) {
  mutate(fn, { mergeWires: getSelectedItems().some((item) => item.type === "wire") });
}

function duplicateItem(item) {
  mutate(() => {
    const clone = cloneItem(item);
    clone.id = uid(item.type);
    if (clone.type === "wire") {
      clone.points = clone.points.map((point) => ({
        x: clamp(point.x + 1, 0, state.board.cols - 1),
        y: clamp(point.y + 1, 0, state.board.rows - 1),
      }));
    } else {
      clone.x = clamp(clone.x + 1, 0, state.board.cols - 1);
      clone.y = clamp(clone.y + 1, 0, state.board.rows - 1);
    }
    state.items.push(clone);
    setSelection([clone.id]);
  });
}

function deleteSelected() {
  if (!selectedIds.size) return;
  mutate(() => {
    state.items = state.items.filter((item) => !selectedIds.has(item.id));
    setSelection([]);
  });
}

function typeName(type) {
  return {
    resistor: "抵抗",
    capacitor: "コンデンサ",
    led: "LED",
    ic: "DIP IC",
    header: "ピンヘッダ",
    label: "ラベル",
  }[type] || type;
}

function styleLabels(styles) {
  return Object.fromEntries(Object.entries(styles).map(([key, style]) => [key, style.label]));
}

function div(className) {
  const element = document.createElement("div");
  if (className) element.className = className;
  return element;
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ board: state.board, items: state.items }, null, 2)], {
    type: "application/json",
  });
  downloadBlob(blob, "universal-board-layout.json");
}

function currentLayoutPayload(name) {
  return {
    name,
    board: state.board,
    items: state.items,
  };
}

function defaultCloudLayoutName() {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(
    now.getHours(),
  ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return `レイアウト ${stamp}`;
}

function openCloudLayouts() {
  els.cloudLayouts.hidden = false;
  if (!els.cloudLayoutName.value.trim()) els.cloudLayoutName.value = defaultCloudLayoutName();
  refreshCloudLayouts();
}

function closeCloudLayouts() {
  els.cloudLayouts.hidden = true;
}

function cloudLayoutUrl(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("layout", id);
  return url.toString();
}

function setActiveCloudLayout(id, name) {
  localStorage.setItem(cloudLayoutKey, id);
  window.history.replaceState(null, "", cloudLayoutUrl(id));
  if (name) els.cloudLayoutName.value = name;
}

function setCloudStatus(message, isError = false) {
  els.cloudLayoutStatus.textContent = message;
  els.cloudLayoutStatus.style.color = isError ? "#bb2f3a" : "";
}

async function saveCloudLayout() {
  const name = els.cloudLayoutName.value.trim();
  if (!name) {
    setCloudStatus("名前を入力してください。", true);
    els.cloudLayoutName.focus();
    return;
  }

  setCloudStatus("保存中...");
  try {
    const saved = await apiJson("/api/layouts", {
      method: "POST",
      body: JSON.stringify(currentLayoutPayload(name)),
    });
    setActiveCloudLayout(saved.id, saved.name);
    setCloudStatus("保存しました。このURLで別端末から開けます。");
    await refreshCloudLayouts();
  } catch (error) {
    setCloudStatus(error.message || "保存できませんでした。", true);
  }
}

async function refreshCloudLayouts() {
  setCloudStatus("読み込み中...");
  els.cloudLayoutList.replaceChildren();
  try {
    const data = await apiJson("/api/layouts");
    renderCloudLayoutList(data.layouts || []);
    setCloudStatus(data.layouts?.length ? `${data.layouts.length}件あります。` : "保存済みレイアウトはありません。");
  } catch (error) {
    setCloudStatus(error.message || "一覧を読み込めませんでした。", true);
  }
}

function renderCloudLayoutList(layouts) {
  els.cloudLayoutList.replaceChildren();
  for (const layout of layouts) {
    const card = div("cloud-layout-card");
    const summary = div("cloud-layout-summary");
    const title = document.createElement("strong");
    title.textContent = layout.name || "無題";
    const meta = document.createElement("span");
    meta.textContent = `${layout.itemCount || 0} items / ${formatDateTime(layout.updatedAt)}`;
    summary.append(title, meta);

    const open = document.createElement("button");
    open.className = "action-button";
    open.type = "button";
    open.textContent = "開く";
    open.addEventListener("click", () => loadCloudLayout(layout.id));

    const link = document.createElement("button");
    link.className = "action-button";
    link.type = "button";
    link.textContent = "リンク";
    link.addEventListener("click", () => copyCloudLayoutLink(layout.id));

    const remove = document.createElement("button");
    remove.className = "action-button danger";
    remove.type = "button";
    remove.textContent = "削除";
    remove.addEventListener("click", () => deleteCloudLayout(layout));

    card.append(summary, open, link, remove);
    els.cloudLayoutList.append(card);
  }
}

async function loadCloudLayout(id, options = {}) {
  if (!options.skipConfirm && !window.confirm("現在のレイアウトを保存済みデータで置き換えます。")) return;
  setCloudStatus("開いています...");
  try {
    const loaded = await apiJson(`/api/layouts/${encodeURIComponent(id)}`);
    const imported = normalizeState(loaded);
    mutate(() => {
      state = imported;
      setSelection([]);
      componentDraft = null;
      selectionDraft = null;
      wireDraft = null;
      els.wirePanel.hidden = true;
    });
    setActiveCloudLayout(loaded.id, loaded.name || defaultCloudLayoutName());
    setCloudStatus("開きました。");
    closeCloudLayouts();
  } catch (error) {
    setCloudStatus(error.message || "開けませんでした。", true);
  }
}

async function copyCloudLayoutLink(id) {
  const url = cloudLayoutUrl(id);
  try {
    await navigator.clipboard.writeText(url);
    setCloudStatus("リンクをコピーしました。");
  } catch {
    window.prompt("このURLを別端末で開いてください。", url);
  }
}

function loadCloudLayoutFromUrl() {
  const id = new URLSearchParams(window.location.search).get("layout");
  if (id) loadCloudLayout(id, { skipConfirm: true });
}

async function deleteCloudLayout(layout) {
  if (!window.confirm(`「${layout.name || "無題"}」を削除します。`)) return;
  setCloudStatus("削除中...");
  try {
    await apiJson(`/api/layouts/${encodeURIComponent(layout.id)}`, { method: "DELETE" });
    if (localStorage.getItem(cloudLayoutKey) === layout.id) localStorage.removeItem(cloudLayoutKey);
    setCloudStatus("削除しました。");
    await refreshCloudLayouts();
  } catch (error) {
    setCloudStatus(error.message || "削除できませんでした。", true);
  }
}

async function apiJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "通信に失敗しました。");
  return data;
}

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

function exportConnectionsMarkdown() {
  const blob = new Blob([connectionListMarkdown()], {
    type: "text/markdown;charset=utf-8",
  });
  downloadBlob(blob, "connection-list.md");
}

function exportPartsMarkdown() {
  const blob = new Blob([partsListMarkdown()], {
    type: "text/markdown;charset=utf-8",
  });
  downloadBlob(blob, "parts-list.md");
}

function exportPartsCsv() {
  const blob = new Blob([`\uFEFF${partsListCsv()}`], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(blob, "parts-list.csv");
}

function partsListMarkdown() {
  const rows = partsListRows();
  const totalCount = rows.reduce((sum, row) => sum + row.quantity, 0);
  const lines = ["# 部品リスト", "", `- 合計点数: ${totalCount}`, `- 品目数: ${rows.length}`, ""];

  if (!rows.length) {
    lines.push("_対象の部品はありません。_", "");
    return lines.join("\n");
  }

  lines.push("| 数量 | 種類 | 値 | ピン数 | 使用部品 |");
  lines.push("| ---: | --- | --- | ---: | --- |");
  for (const row of rows) {
    lines.push(
      `| ${row.quantity} | ${markdownTableCell(row.kind)} | ${markdownTableCell(row.value)} | ${row.pinCount} | ${markdownTableCell(
        row.refs.join(", "),
      )} |`,
    );
  }
  lines.push("");

  return lines.join("\n");
}

function partsListCsv() {
  const headers = ["数量", "種類", "値", "ピン数", "使用部品"];
  const rows = partsListRows().map((row) => [row.quantity, row.kind, row.value, row.pinCount, row.refs.join(", ")]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function partsListRows() {
  const groups = new Map();
  for (const part of state.items.filter(isElectricalComponent)) {
    const pins = componentPinEntries(part);
    const row = {
      kind: componentKindName(part),
      value: part.value || "-",
      pinCount: pins.length,
    };
    const key = [row.kind, row.value, row.pinCount].join("\u001f");
    if (!groups.has(key)) groups.set(key, { ...row, quantity: 0, refs: [] });
    const group = groups.get(key);
    group.quantity += 1;
    group.refs.push(componentDisplayName(part));
  }
  return [...groups.values()].sort((a, b) => {
    const kindOrder = a.kind.localeCompare(b.kind, "ja");
    if (kindOrder) return kindOrder;
    return a.value.localeCompare(b.value, "ja", { numeric: true });
  });
}

function connectionListMarkdown() {
  const connectivity = buildConnectivity();
  const parts = state.items.filter(isElectricalComponent);
  const lines = [
    "# 接続リスト",
    "",
    `- ネット数: ${connectivity.netNameByRoot.size}`,
    `- 素子数: ${parts.length}`,
    "",
  ];

  if (!parts.length) {
    lines.push("_対象の素子はありません。_", "");
    return lines.join("\n");
  }

  for (const part of parts) {
    lines.push(`## ${componentDisplayName(part)}`, "");
    lines.push(`- 種類: ${componentKindName(part)}`);
    lines.push(`- 値: ${part.value || "-"}`, "");
    lines.push("| ピン | ネット | 座標 | 接続先 |");
    lines.push("| --- | --- | --- | --- |");
    for (const pin of connectivity.pinsByPartId.get(part.id) || []) {
      const targetInfo = connectionTargetInfo(pin, connectivity);
      lines.push(
        `| ${markdownTableCell(pin.pinLabel)} | ${markdownTableCell(pin.net || "-")} | ${markdownTableCell(
          `(${pin.point.x}, ${pin.point.y})`,
        )} | ${markdownTableCell(targetInfo.text)} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function componentKindName(item) {
  const baseName = typeName(item.type);
  const styleName = componentStyleName(item);
  return styleName ? `${baseName} / ${styleName}` : baseName;
}

function componentStyleName(item) {
  if (item.type === "resistor") return (resistorStyles[item.style] || resistorStyles.carbon).label;
  if (item.type === "capacitor") return (capacitorStyles[item.style] || capacitorStyles.ceramic).label;
  return "";
}

function markdownTableCell(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function csvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function exportPng() {
  render();
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, "universal-board-layout.png");
  }, "image/png");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = normalizeState(JSON.parse(reader.result));
      mutate(() => {
        state = imported;
        setSelection([]);
        componentDraft = null;
        selectionDraft = null;
      });
    } catch (error) {
      window.alert("JSONを読み込めませんでした。");
    }
  });
  reader.readAsText(file);
}

function clearBoard() {
  if (!window.confirm("現在のレイアウトを全削除します。")) return;
  mutate(() => {
    state.items = [];
    setSelection([]);
    wireDraft = null;
    componentDraft = null;
    selectionDraft = null;
    els.wirePanel.hidden = true;
  });
}

function setTool(tool) {
  currentTool = tool;
  componentDraft = null;
  selectionDraft = null;
  if (tool !== "wire") cancelWire();
  showMobilePanel("tools");
  syncControls();
  render();
}

function setDisplayMode(target, mode) {
  if (!displayTargets.has(target) || !displayModes.has(mode)) return;
  displayOptions = { ...displayOptions, [target]: mode };
  syncControls();
  render();
}

function setGrabMode(mode) {
  if (!grabModes.has(mode)) return;
  grabMode = mode;
  syncControls();
}

function setBoardDimensions(cols, rows) {
  state.board.cols = cols;
  state.board.rows = rows;
  state.board.disabledHoles = normalizeDisabledHoles(state.board.disabledHoles, state.board);
}

function setBoardTheme(theme) {
  if (!boardThemes[theme] || state.board.theme === theme) return;
  mutate(() => (state.board.theme = theme));
  syncControls();
  drawHoleMaskEditor();
}

function openHoleSettings() {
  els.holeSettings.hidden = false;
  requestAnimationFrame(drawHoleMaskEditor);
}

function closeHoleSettings() {
  els.holeSettings.hidden = true;
  holeMaskDrag = null;
}

function updateHoleMaskStatus() {
  if (!els.holeMaskStatus) return;
  const disabled = state.board.disabledHoles?.length || 0;
  const total = state.board.cols * state.board.rows;
  els.holeMaskStatus.textContent = `${total - disabled} / ${total} 有効`;
}

function drawHoleMaskEditor() {
  if (els.holeSettings.hidden) return;
  const editorCanvas = els.holeMaskCanvas;
  const editorCtx = editorCanvas.getContext("2d");
  const rect = editorCanvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const dpr = window.devicePixelRatio || 1;
  editorCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
  editorCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
  editorCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cols = state.board.cols - 1;
  const rows = state.board.rows - 1;
  const pad = rect.width < 520 ? 22 : 30;
  const cell = Math.max(4, Math.min((rect.width - pad * 2) / Math.max(cols, 1), (rect.height - pad * 2) / Math.max(rows, 1)));
  holeMaskView = {
    width: rect.width,
    height: rect.height,
    cell,
    originX: Math.round((rect.width - cols * cell) / 2),
    originY: Math.round((rect.height - rows * cell) / 2),
  };

  const theme = currentBoardTheme();
  const disabledSet = boardDisabledSet();
  editorCtx.clearRect(0, 0, rect.width, rect.height);
  editorCtx.fillStyle = "#eef3f7";
  editorCtx.fillRect(0, 0, rect.width, rect.height);

  const boardPad = cell * 0.62;
  const first = holeMaskGridToScreen(0, 0);
  const last = holeMaskGridToScreen(state.board.cols - 1, state.board.rows - 1);
  const boardX = first.x - boardPad;
  const boardY = first.y - boardPad;
  const boardWidth = last.x - first.x + boardPad * 2;
  const boardHeight = last.y - first.y + boardPad * 2;

  roundedRect(editorCtx, boardX, boardY, boardWidth, boardHeight, 10);
  editorCtx.fillStyle = theme.board;
  editorCtx.fill();
  editorCtx.strokeStyle = theme.edge;
  editorCtx.lineWidth = 1;
  editorCtx.stroke();

  for (let row = 0; row < state.board.rows; row += 1) {
    for (let col = 0; col < state.board.cols; col += 1) {
      const p = holeMaskGridToScreen(col, row);
      const ring = Math.max(2.5, cell * 0.18);
      const core = Math.max(1, cell * 0.07);
      const disabled = disabledSet.has(pointKey({ x: col, y: row }));

      if (disabled) {
        editorCtx.beginPath();
        editorCtx.arc(p.x, p.y, ring * 0.94, 0, Math.PI * 2);
        editorCtx.fillStyle = theme.disabled;
        editorCtx.fill();
        editorCtx.strokeStyle = theme.disabledStroke;
        editorCtx.lineWidth = Math.max(1, cell * 0.06);
        editorCtx.beginPath();
        editorCtx.moveTo(p.x - ring * 0.55, p.y - ring * 0.55);
        editorCtx.lineTo(p.x + ring * 0.55, p.y + ring * 0.55);
        editorCtx.moveTo(p.x + ring * 0.55, p.y - ring * 0.55);
        editorCtx.lineTo(p.x - ring * 0.55, p.y + ring * 0.55);
        editorCtx.stroke();
        continue;
      }

      editorCtx.beginPath();
      editorCtx.arc(p.x, p.y, ring, 0, Math.PI * 2);
      editorCtx.fillStyle = theme.copper;
      editorCtx.fill();
      editorCtx.beginPath();
      editorCtx.arc(p.x, p.y, core, 0, Math.PI * 2);
      editorCtx.fillStyle = theme.core;
      editorCtx.fill();
    }
  }

  updateHoleMaskStatus();
}

function holeMaskGridToScreen(x, y) {
  return {
    x: holeMaskView.originX + x * holeMaskView.cell,
    y: holeMaskView.originY + y * holeMaskView.cell,
  };
}

function holeMaskEventHole(event) {
  if (!holeMaskView) drawHoleMaskEditor();
  if (!holeMaskView) return null;
  const rect = els.holeMaskCanvas.getBoundingClientRect();
  const point = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
  const x = clamp(Math.round((point.x - holeMaskView.originX) / holeMaskView.cell), 0, state.board.cols - 1);
  const y = clamp(Math.round((point.y - holeMaskView.originY) / holeMaskView.cell), 0, state.board.rows - 1);
  const screen = holeMaskGridToScreen(x, y);
  const distance = Math.hypot(screen.x - point.x, screen.y - point.y);
  return { x, y, inside: distance < Math.max(5, holeMaskView.cell * 0.58) };
}

function beginHoleMaskEdit(event) {
  const hole = holeMaskEventHole(event);
  if (!hole?.inside) return;
  event.preventDefault();
  commitHistory();
  holeMaskDrag = {
    disabled: !isHoleDisabled(hole.x, hole.y),
    lastKey: null,
  };
  els.holeMaskCanvas.setPointerCapture?.(event.pointerId);
  applyHoleMaskEdit(event);
}

function applyHoleMaskEdit(event) {
  if (!holeMaskDrag) return;
  const hole = holeMaskEventHole(event);
  if (!hole?.inside) return;
  const key = pointKey(hole);
  if (key === holeMaskDrag.lastKey) return;
  holeMaskDrag.lastKey = key;
  if (!setHoleDisabled(hole.x, hole.y, holeMaskDrag.disabled)) return;
  save();
  render();
  drawHoleMaskEditor();
}

function finishHoleMaskEdit(event) {
  if (!holeMaskDrag) return;
  holeMaskDrag = null;
  els.holeMaskCanvas.releasePointerCapture?.(event.pointerId);
  save();
  render();
  drawHoleMaskEditor();
}

function enableAllHoles() {
  if (!state.board.disabledHoles?.length) return;
  mutate(() => (state.board.disabledHoles = []));
  syncControls();
  drawHoleMaskEditor();
}

function invertHoles() {
  mutate(() => {
    const disabledSet = boardDisabledSet();
    const next = [];
    for (let row = 0; row < state.board.rows; row += 1) {
      for (let col = 0; col < state.board.cols; col += 1) {
        const key = pointKey({ x: col, y: row });
        if (!disabledSet.has(key)) next.push(key);
      }
    }
    state.board.disabledHoles = sortPointKeys(next);
  });
  syncControls();
  drawHoleMaskEditor();
}

function isMobileLayout() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function showMobilePanel(panel) {
  if (!document.body) return;
  const normalized = panel === "inspector" ? "inspector" : "tools";
  document.body.classList.toggle("mobile-tools-open", normalized === "tools");
  document.body.classList.toggle("mobile-inspector-open", normalized === "inspector");
  els.mobilePanelTabs?.querySelectorAll("[data-mobile-panel]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mobilePanel === normalized);
  });
  requestAnimationFrame(resizeCanvas);
}

function bindEvents() {
  window.addEventListener("resize", () => {
    resizeCanvas();
    drawHoleMaskEditor();
  });
  window.addEventListener("orientationchange", () => {
    requestAnimationFrame(resizeCanvas);
    requestAnimationFrame(drawHoleMaskEditor);
  });
  new ResizeObserver(resizeCanvas).observe(canvas);

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerCancel);
  canvas.addEventListener("wheel", canvasWheel, { passive: false });
  canvas.addEventListener("pointerleave", () => {
    hoveredHole = null;
    els.cursorStatus.textContent = "x: -, y: -";
    render();
  });
  canvas.addEventListener("dblclick", () => {
    if (currentTool === "wire") finishWire();
  });
  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (currentTool === "wire") finishWire();
  });

  document.addEventListener("keydown", (event) => {
    if (!els.cloudLayouts.hidden) {
      if (event.key === "Escape") closeCloudLayouts();
      return;
    }
    if (!els.holeSettings.hidden) {
      if (event.key === "Escape") closeHoleSettings();
      return;
    }
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
      event.preventDefault();
      if (event.repeat) return;
      undo();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"))) {
      event.preventDefault();
      if (event.repeat) return;
      redo();
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") deleteSelected();
    if (event.key === "Escape") {
      selectionDraft = null;
      cancelComponentDraft();
      cancelWire();
      setTool("select");
    }
    if (event.key === "Enter" && currentTool === "wire") finishWire();
    if (event.key.toLowerCase() === "r") {
      const item = getSelected();
      if (item && item.type !== "wire" && item.type !== "cut" && item.type !== "label") {
        inspectorMutate(() => (item.rotation = normalizeRotation(item.rotation + 90)));
      }
    }
  });

  els.toolGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tool]");
    if (button) setTool(button.dataset.tool);
  });

  els.mobilePanelTabs?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mobile-panel]");
    if (button) showMobilePanel(button.dataset.mobilePanel);
  });

  els.layerSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-layer]");
    if (!button) return;
    currentLayer = button.dataset.layer;
    if (wireDraft) wireDraft.layer = currentLayer;
    syncControls();
    render();
  });

  els.displayControls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-display-target][data-display-mode]");
    if (button) setDisplayMode(button.dataset.displayTarget, button.dataset.displayMode);
  });

  els.grabModeSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-grab-mode]");
    if (button) setGrabMode(button.dataset.grabMode);
  });

  els.openHoleSettings.addEventListener("click", openHoleSettings);
  els.closeHoleSettings.addEventListener("click", closeHoleSettings);
  els.holeSettings.addEventListener("click", (event) => {
    if (event.target === els.holeSettings) closeHoleSettings();
  });
  els.cloudLayoutsButton.addEventListener("click", openCloudLayouts);
  els.closeCloudLayouts.addEventListener("click", closeCloudLayouts);
  els.cloudLayouts.addEventListener("click", (event) => {
    if (event.target === els.cloudLayouts) closeCloudLayouts();
  });
  els.saveCloudLayout.addEventListener("click", saveCloudLayout);
  els.refreshCloudLayouts.addEventListener("click", refreshCloudLayouts);
  els.enableAllHoles.addEventListener("click", enableAllHoles);
  els.invertHoles.addEventListener("click", invertHoles);
  els.holeMaskCanvas.addEventListener("pointerdown", beginHoleMaskEdit);
  els.holeMaskCanvas.addEventListener("pointermove", applyHoleMaskEdit);
  els.holeMaskCanvas.addEventListener("pointerup", finishHoleMaskEdit);
  els.holeMaskCanvas.addEventListener("pointercancel", finishHoleMaskEdit);

  els.cols.addEventListener("change", () =>
    mutate(() => setBoardDimensions(clamp(Math.round(Number(els.cols.value) || 30), 8, 80), state.board.rows)),
  );
  els.rows.addEventListener("change", () =>
    mutate(() => setBoardDimensions(state.board.cols, clamp(Math.round(Number(els.rows.value) || 20), 8, 60))),
  );
  els.zoom.addEventListener("input", () => {
    setZoom(els.zoom.value);
  });
  els.labelToggle.addEventListener("change", () => mutate(() => (state.board.showLabels = els.labelToggle.checked)));

  els.undo.addEventListener("click", undo);
  els.redo.addEventListener("click", redo);
  els.clear.addEventListener("click", clearBoard);
  els.exportJson.addEventListener("click", exportJson);
  els.exportConnections.addEventListener("click", exportConnectionsMarkdown);
  els.exportParts.addEventListener("click", exportPartsMarkdown);
  els.exportPartsCsv.addEventListener("click", exportPartsCsv);
  els.exportPng.addEventListener("click", exportPng);
  els.importJson.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", () => {
    const [file] = els.importFile.files;
    if (file) importJsonFile(file);
    els.importFile.value = "";
  });
  els.finishWire.addEventListener("click", finishWire);
  els.cancelWire.addEventListener("click", cancelWire);
}

function initSwatches() {
  for (const color of wireColors) {
    const button = document.createElement("button");
    button.className = `swatch${color === currentWireColor ? " active" : ""}`;
    button.style.setProperty("--swatch", color);
    button.dataset.color = color;
    button.type = "button";
    button.title = color;
    button.ariaLabel = color;
    button.addEventListener("click", () => {
      currentWireColor = color;
      if (wireDraft) wireDraft.color = color;
      syncControls();
      render();
    });
    els.swatches.append(button);
  }
}

function initBoardThemes() {
  for (const key of boardThemeOrder) {
    const theme = boardThemes[key];
    const button = document.createElement("button");
    button.className = `board-theme-button${key === state.board.theme ? " active" : ""}`;
    button.style.setProperty("--board-theme-color", theme.board);
    button.dataset.boardTheme = key;
    button.type = "button";
    button.title = theme.label;
    button.ariaLabel = theme.label;
    button.addEventListener("click", () => setBoardTheme(key));
    els.boardThemeSwatches.append(button);
  }
}

state.zoom = Number(state.zoom) || 1;
initSwatches();
initBoardThemes();
bindEvents();
showMobilePanel("tools");
syncControls();
resizeCanvas();
save();
loadCloudLayoutFromUrl();
