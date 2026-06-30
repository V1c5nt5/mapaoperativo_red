/* v3.0.0 public — lógica principal del Mapa Operativo RED
   Nuevos filtros y panel de resumen para buses en tiempo real */

var VEHICLE_REGISTRY = {};
async function loadVehicleRegistry() {
  try {
    VEHICLE_REGISTRY = await (await fetch('https://raw.githubusercontent.com/V1c5nt5/stpm_gtfs/main/data/vehicle_registry.json', { cache: 'no-store' })).json();
  } catch (e) {
    VEHICLE_REGISTRY = {};
  }
}
loadVehicleRegistry();

function vehicleInfoByPlate(plate) {
  var k = String(plate || '').replace(/-/g, '').toUpperCase();
  return VEHICLE_REGISTRY[k] || null;
}

/* v2.2.3 public — lógica principal del Mapa Operativo RED
   Separado desde el HTML para facilitar mantenimiento en GitHub Pages. */

var SVC = { L: 'Lunes a Viernes', S: 'Sábado', D: 'Domingo', F: 'Festivo', LJ: 'Lun a Jue', V: 'Viernes' };
var DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
var DATA = freshData();
var GITHUB_OWNER = 'V1c5nt5';
var GITHUB_REPO = 'stpm_gtfs';
var GITHUB_BRANCH = 'main';
var GITHUB_DATA_API = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/contents/data?ref=' + GITHUB_BRANCH;
var GITHUB_GTFS_FILES = [];
var GITHUB_DECO_FILES = [];
var GITHUB_PARAM_FILES = [];
var START_DATASET = null;
var REALTIME_DATASET = null;
var APP_MODE = 'static';
var GITHUB_CATALOG_LIVE = false;
var DATASET_MAX_GAP_DAYS = 6;

function freshData() {
  return {
    agency: {}, routes: {}, trips: {}, frequencies: [], frequenciesByTrip: {}, stopTimes: {}, stops: {}, stopIndex: {}, stopTrips: {}, shapes: {},
    calendar: {}, calendarDates: [], feedInfo: null, levels: {}, pathways: [], pathwaysByStop: {}, serviceIds: [], tripsByRoute: {}, tripsByService: {}, tripsByStop: {},
    decoRows: [], decoByRoute: {}, operators: [], sourceNames: { gtfs: '', deco: '', param: '' }, sourceDates: { gtfs: null, deco: null, param: null },
    availableSources: { gtfs: false, deco: false, param: false }, decoCompatible: false, decoDateGapDays: null, analytics: null
  };
}

var freqChart = null, stopChart = null, overviewChart = null;
var leafMap = null, layerIda = null, layerReg = null, layerStops = null, routeMapBounds = null;
var BUS_ENDPOINTS = [
  'https://velocidades.seguimos.cl/?all-buses-data=1',
  'https://velocidades.seguimos.cl/?all-buses-data=2'
];

var BUS_OPERATOR_NAMES = {
  '2': 'U2 - Su Bus',
  '4': 'U4 - VOY Santiago SpA',
  '5': 'U5 - Metropolitana',
  '16': 'U3 - Vule',
  '32': 'U8 - Alfa US1',
  '33': 'U9 - Omega US2',
  '34': 'U10 - STU US3',
  '35': 'U11 - RBU US4',
  '36': 'U12 - STU US5',
  '37': 'U13 - RBU US6',
  '38': 'U14 - VOY Santiago US14',
  '39': 'U15 - VOY Santiago US15',
  '40': 'U16 - Gran Americas US16',
  '41': 'U18 - Conecta US18',
  '42': 'U19 - Conecta US17'
};

var BUS_STATE = {
  features: [],
  direction: 'all',
  loading: false,
  lastLoadedAt: null,
  sourceCount: 0,
  sourceErrors: [],
  decoReady: false,
  decoIndex: null,
  visibleCount: 0,
  catalogRoutes: 0
};

var busLayer = null, busRefreshTimer = null, busRequestToken = 0;
var simMap = null, simShapeLayer = null, simVehicleLayer = null, simShapeKey = '';
var simSelectedMinute = 480;
var simAutoTimer = null;
var stopLeafMap = null, stopMarker = null;
var activeStop = null, selectedHour = 8;
var curMapDir = 0, curStopsDir = 0;
var _cachedArrivals = [];

var PARAMS = {
  file: null, zip: null, sheets: [], sharedStrings: null, cache: {}, activeSheet: null, rows: [], intervals: [], metric: '', sourceDate: null, loading: false
};

// ===== NUEVO: filtros avanzados =====
var BUS_FILTERS = {
  type: '__all',
  tech: '__all',
  year: '__all',
  speedMin: 0,
  speedMax: 999
};
// ===== FIN NUEVO =====

async function initGitHubGTFSList() {
  var fallbackGtfs = [
    { name: 'GTFS_20260425_v3.zip', download_url: 'https://raw.githubusercontent.com/V1c5nt5/stpm_gtfs/main/data/GTFS_20260425_v3.zip' },
    { name: 'GTFS_20260530.zip', download_url: 'https://raw.githubusercontent.com/V1c5nt5/stpm_gtfs/main/data/GTFS_20260530.zip' }
  ];
  var fallbackDeco = [
    { name: 'DECO_VIGENTES_20260529.zip', download_url: 'https://raw.githubusercontent.com/V1c5nt5/stpm_gtfs/main/data/DECO_VIGENTES_20260529.zip' }
  ];
  var fallbackParams = [
    { name: '15-Consolidado-Parametros-2026-05-30.xlsx', download_url: 'https://raw.githubusercontent.com/V1c5nt5/stpm_gtfs/main/data/15-Consolidado-Parametros-2026-05-30.xlsx' }
  ];
  try {
    var res = await fetch(GITHUB_DATA_API, { cache: 'no-store' });
    if (!res.ok) throw new Error('GitHub API ' + res.status);
    var files = await res.json();
    var dataFiles = files.filter(function (f) { return f.type === 'file' && /\.(zip|csv|xlsx)$/i.test(f.name); })
      .map(function (f) { return { name: f.name, download_url: f.download_url || ('https://raw.githubusercontent.com/' + GITHUB_OWNER + '/' + GITHUB_REPO + '/' + GITHUB_BRANCH + '/data/' + encodeURIComponent(f.name)), verified: true }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, undefined, { numeric: true }); });
    var zips = dataFiles.filter(function (f) { return /\.(zip|csv)$/i.test(f.name); });
    GITHUB_GTFS_FILES = zips.filter(function (f) { return /gtfs/i.test(f.name); });
    GITHUB_DECO_FILES = zips.filter(function (f) { return /deco/i.test(f.name); });
    GITHUB_PARAM_FILES = dataFiles.filter(function (f) { return /consolidado.*param/i.test(f.name) && /\.xlsx$/i.test(f.name); });
    if (!GITHUB_GTFS_FILES.length) GITHUB_GTFS_FILES = fallbackGtfs;
    if (!GITHUB_DECO_FILES.length) GITHUB_DECO_FILES = fallbackDeco;
    if (!GITHUB_PARAM_FILES.length) GITHUB_PARAM_FILES = fallbackParams;
    GITHUB_CATALOG_LIVE = true;
  } catch (err) {
    console.warn('No se pudo leer /data desde GitHub. Se usará lista base.', err);
    GITHUB_CATALOG_LIVE = false;
    GITHUB_GTFS_FILES = fallbackGtfs;
    GITHUB_DECO_FILES = fallbackDeco;
    GITHUB_PARAM_FILES = fallbackParams;
  }
  fillGitHubSelects();
}

function fillOneSelect(id, files, placeholder, selectedIndex) {
  var sel = document.getElementById(id); if (!sel) return;
  sel.innerHTML = '';
  if (!files.length) {
    var empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder;
    sel.appendChild(empty);
    return;
  }
  files.forEach(function (f, i) {
    var o = document.createElement('option');
    o.value = f.download_url;
    var itemDate = extractDateFromName(f.name);
    o.textContent = itemDate ? formatDatasetDate(itemDate) : 'Fecha disponible';
    o.dataset.name = f.name;
    sel.appendChild(o);
    if (i === selectedIndex) o.selected = true;
  });
}

function dateKey(dt) {
  if (!dt) return '';
  return String(dt.getFullYear()) + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

function dateFromKey(key) {
  var m = String(key || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  var dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(dt.getTime()) ? null : dt;
}

function formatDatasetDate(dt) {
  if (!dt) return 'Fecha no detectada';
  try {
    return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(dt);
  } catch (e) {
    return String(dt.getDate()).padStart(2, '0') + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + dt.getFullYear();
  }
}

function fileWithDate(file) {
  if (!file) return null;
  var dt = extractDateFromName(file.name);
  return dt ? { file: file, date: dt, key: dateKey(dt) } : null;
}

function datedFiles(files) {
  return (files || []).map(fileWithDate).filter(Boolean);
}

function newestNamedFile(items) {
  return items.slice().sort(function (a, b) {
    return String(a.file.name).localeCompare(String(b.file.name), undefined, { numeric: true });
  }).pop() || null;
}

function newestDatedFile(files) {
  return datedFiles(files).sort(function (a, b) {
    return a.date - b.date ||
      String(a.file.name).localeCompare(String(b.file.name), undefined, { numeric: true });
  }).pop() || null;
}

function launchAvailabilityCard(label, item) {
  if (!item) {
    return '<div class="availability-item missing"><span class="availability-label">' + esc(label) + '</span><strong>No disponible</strong><small>No se encontró información reciente.</small></div>';
  }
  return '<div class="availability-item available"><span class="availability-label">' + esc(label) + '</span><strong>Disponible</strong><small>' + esc(formatDatasetDate(item.date)) + '</small></div>';
}

function setLaunchMode(mode) {
  APP_MODE = mode === 'realtime' ? 'realtime' : 'static';
  var staticButton = document.getElementById('launch-mode-static');
  var realtimeButton = document.getElementById('launch-mode-realtime');
  var staticOptions = document.getElementById('static-launch-options');
  var realtimeOptions = document.getElementById('realtime-launch-options');
  if (staticButton) {
    staticButton.classList.toggle('active', APP_MODE === 'static');
    staticButton.setAttribute('aria-checked', APP_MODE === 'static' ? 'true' : 'false');
  }
  if (realtimeButton) {
    realtimeButton.classList.toggle('active', APP_MODE === 'realtime');
    realtimeButton.setAttribute('aria-checked', APP_MODE === 'realtime' ? 'true' : 'false');
  }
  if (staticOptions) staticOptions.hidden = APP_MODE !== 'static';
  if (realtimeOptions) realtimeOptions.hidden = APP_MODE !== 'realtime';
  if (APP_MODE === 'realtime') updateRealtimeAvailability();
  else updateStartDatasetAvailability();
}

function updateRealtimeAvailability() {
  var wrap = document.getElementById('realtime-dataset-availability');
  var note = document.getElementById('realtime-dataset-note');
  var btn = document.getElementById('btn-load-dataset');
  var label = document.getElementById('btn-load-dataset-label');
  var verifiedGtfs = GITHUB_GTFS_FILES.filter(function (file) { return file.verified === true; });
  var verifiedDeco = GITHUB_DECO_FILES.filter(function (file) { return file.verified === true; });
  var vigenteDeco = verifiedDeco.filter(function (file) { return /deco.*vigent|vigent.*deco/i.test(file.name); });
  var gtfsItem = newestDatedFile(verifiedGtfs);
  var decoItem = newestDatedFile(vigenteDeco.length ? vigenteDeco : verifiedDeco);
  REALTIME_DATASET = { gtfs: gtfsItem, deco: decoItem };

  if (label && APP_MODE === 'realtime') label.textContent = 'Abrir buses en tiempo real';
  if (!wrap || !note || !btn) return;

  wrap.innerHTML = launchAvailabilityCard('Buses y operadores', decoItem) + launchAvailabilityCard('Recorridos y trazados', gtfsItem);
  if (!GITHUB_CATALOG_LIVE) {
    note.textContent = 'No se pudo verificar la información más reciente. Intenta nuevamente más tarde.';
    note.className = 'dataset-link-note is-warning';
    if (APP_MODE === 'realtime') btn.disabled = true;
    return;
  }
  if (!decoItem || !gtfsItem) {
    note.textContent = 'No se encontró toda la información necesaria para mostrar los buses en tiempo real.';
    note.className = 'dataset-link-note is-warning';
    if (APP_MODE === 'realtime') btn.disabled = true;
    return;
  }
  note.textContent = 'La información más reciente se selecciona automáticamente.';
  note.className = 'dataset-link-note is-ready';
  if (APP_MODE === 'realtime') btn.disabled = false;
}

function loadSelectedLaunchMode() {
  if (APP_MODE === 'realtime') loadLatestRealtime();
  else loadSelectedMainGTFS();
}

function linkedDatasetForDate(targetDate) {
  var targetKey = dateKey(targetDate);
  var gtfsExact = datedFiles(GITHUB_GTFS_FILES).filter(function (item) { return item.key === targetKey; });
  var gtfsItem = newestNamedFile(gtfsExact);
  if (!gtfsItem) return { date: targetDate, gtfs: null, deco: null, param: null, complete: false, availableCount: 0 };

  function nearestWithinWindow(files) {
    return datedFiles(files).filter(function (item) {
      return dateGapDays(targetDate, item.date) <= DATASET_MAX_GAP_DAYS;
    }).sort(function (a, b) {
      return dateGapDays(targetDate, a.date) - dateGapDays(targetDate, b.date) ||
        String(b.file.name).localeCompare(String(b.file.name), undefined, { numeric: true });
    })[0] || null;
  }

  var decoItem = nearestWithinWindow(GITHUB_DECO_FILES);
  var paramItem = nearestWithinWindow(GITHUB_PARAM_FILES);
  return {
    date: targetDate,
    gtfs: gtfsItem,
    deco: decoItem,
    param: paramItem,
    complete: !!(decoItem && paramItem),
    availableCount: 1 + (decoItem ? 1 : 0) + (paramItem ? 1 : 0)
  };
}

function availabilityDetail(item, targetDate) {
  if (!item) return 'No disponible para esta fecha';
  var gap = dateGapDays(targetDate, item.date);
  var relation = gap === 0 ? 'misma fecha' : (gap === 1 ? '1 día de diferencia' : gap + ' días de diferencia');
  return relation;
}

function availabilityCard(label, item, targetDate) {
  var available = !!item;
  return '<div class="availability-item ' + (available ? 'available' : 'missing') + '">' +
    '<span class="availability-label">' + esc(label) + '</span>' +
    '<strong>' + (available ? 'Disponible' : 'No disponible') + '</strong>' +
    '<small>' + availabilityDetail(item, targetDate) + '</small>' +
    '</div>';
}

function fillStartDateSelect() {
  var sel = document.getElementById('dataset-date-select');
  if (!sel) return;
  var old = sel.value;
  var groups = {};
  datedFiles(GITHUB_GTFS_FILES).forEach(function (item) { groups[item.key] = item.date; });
  var keys = Object.keys(groups).sort();
  sel.innerHTML = '';
  if (!keys.length) {
    var empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'No hay fechas disponibles';
    sel.appendChild(empty);
    START_DATASET = null;
    updateStartDatasetAvailability();
    return;
  }
  keys.forEach(function (key) {
    var o = document.createElement('option');
    o.value = key;
    o.textContent = formatDatasetDate(groups[key]);
    sel.appendChild(o);
  });
  sel.value = keys.indexOf(old) !== -1 ? old : keys[keys.length - 1];
  updateStartDatasetAvailability();
}

function updateStartDatasetAvailability() {
  var sel = document.getElementById('dataset-date-select');
  var wrap = document.getElementById('dataset-availability');
  var note = document.getElementById('dataset-link-note');
  var btn = document.getElementById('btn-load-dataset');
  var buttonLabel = document.getElementById('btn-load-dataset-label');
  var targetDate = sel ? dateFromKey(sel.value) : null;
  START_DATASET = targetDate ? linkedDatasetForDate(targetDate) : null;

  if (!wrap || !note || !btn) return;
  if (buttonLabel && APP_MODE === 'static') buttonLabel.textContent = 'Abrir recorridos y horarios';
  if (!START_DATASET || !START_DATASET.gtfs) {
    wrap.innerHTML = '<div class="availability-empty">No hay información disponible para esta fecha.</div>';
    note.textContent = 'No hay datos base disponibles para cargar.';
    note.className = 'dataset-link-note is-warning';
    if (APP_MODE === 'static') btn.disabled = true;
    return;
  }

  wrap.innerHTML =
    availabilityCard('Recorridos y horarios', START_DATASET.gtfs, targetDate) +
    availabilityCard('Operadores y servicios', START_DATASET.deco, targetDate) +
    availabilityCard('Indicadores', START_DATASET.param, targetDate);

  var missing = [];
  if (!START_DATASET.deco) missing.push('operadores y servicios');
  if (!START_DATASET.param) missing.push('indicadores');
  if (!missing.length) {
    note.textContent = 'Toda la información de esta fecha está disponible.';
    note.className = 'dataset-link-note is-ready';
  } else {
    note.textContent = 'Hay información parcial. No se encontraron ' + missing.join(' ni ') + '.';
    note.className = 'dataset-link-note is-warning';
  }
  if (APP_MODE === 'static') btn.disabled = false;
}

function fillGitHubSelects() {
  fillOneSelect('compare-base-select', GITHUB_GTFS_FILES, 'Sin fechas disponibles', 0);
  fillOneSelect('compare-target-select', GITHUB_GTFS_FILES, 'Sin fechas disponibles', Math.max(0, GITHUB_GTFS_FILES.length - 1));
  fillOneSelect('param-file-select', GITHUB_PARAM_FILES, 'Sin indicadores disponibles', Math.max(0, GITHUB_PARAM_FILES.length - 1));
  fillStartDateSelect();
  updateRealtimeAvailability();
}

function syncParamSelects(source) {
  var tab = document.getElementById('param-file-select');
  if (!tab) return;
  if (source === 'start') {
    if (START_DATASET && START_DATASET.param) {
      tab.value = START_DATASET.param.file.download_url;
      tab.disabled = false;
    } else {
      tab.value = '';
      tab.disabled = true;
    }
  }
}

async function fetchGTFSFileFromURL(url, name) {
  var res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudo descargar ' + name + ' (' + res.status + ')');
  var blob = await res.blob();
  try { return new File([blob], name, { type: 'application/zip' }); }
  catch (e) { blob.name = name; return blob; }
}

async function loadSelectedMainGTFS() {
  APP_MODE = 'static';
  if (!START_DATASET || !START_DATASET.gtfs) {
    alert('No hay información disponible para la fecha seleccionada.');
    return;
  }
  var gtfs = START_DATASET.gtfs.file;
  var deco = START_DATASET.deco ? START_DATASET.deco.file : null;
  var paramItem = START_DATASET.param || null;
  syncParamSelects('start');
  prog(3, deco ? 'Cargando recorridos y operadores…' : 'Cargando recorridos…');
  try {
    var file = await fetchGTFSFileFromURL(gtfs.download_url, gtfs.name);
    var decoFile = null;
    if (deco) {
      try {
        decoFile = await fetchGTFSFileFromURL(deco.download_url, deco.name);
      } catch (decoErr) {
        console.warn('No se pudo descargar la información de operadores. Se continuará con los recorridos.', decoErr);
      }
    }
    await handleFile(file, decoFile, paramItem, 'static');
  }
  catch (err) {
    console.error(err);
    prog(0, 'No se pudo cargar la información seleccionada.');
  }
}

async function loadLatestRealtime() {
  APP_MODE = 'realtime';
  updateRealtimeAvailability();
  if (!GITHUB_CATALOG_LIVE || !REALTIME_DATASET || !REALTIME_DATASET.deco || !REALTIME_DATASET.gtfs) {
    alert('No se pudo verificar la información más reciente. Intenta nuevamente más tarde.');
    return;
  }
  var deco = REALTIME_DATASET.deco.file;
  var gtfs = REALTIME_DATASET.gtfs.file;
  prog(3, 'Cargando la información más reciente…');
  try {
    var files = await Promise.all([
      fetchGTFSFileFromURL(gtfs.download_url, gtfs.name),
      fetchGTFSFileFromURL(deco.download_url, deco.name)
    ]);
    await handleFile(files[0], files[1], null, 'realtime');
  } catch (err) {
    console.error(err);
    prog(0, 'No se pudo cargar la información más reciente.');
    alert('No se pudo cargar la información más reciente. El monitoreo no mostrará datos antiguos.');
  }
}

document.addEventListener('DOMContentLoaded', initGitHubGTFSList);

function prog(pct, txt) {
  document.getElementById('prog-bar').style.display = 'block';
  document.getElementById('prog-fill').style.width = pct + '%';
  document.getElementById('prog-label').textContent = txt;
}

function csvNum(v, fallback) {
  if (v === undefined || v === null || v === '') return fallback === undefined ? 0 : fallback;
  var n = Number(v); return isNaN(n) ? (fallback === undefined ? 0 : fallback) : n;
}

function timeToSecs(t) {
  if (!t) return 0;
  var p = String(t).split(':');
  return csvNum(p[0]) * 3600 + csvNum(p[1]) * 60 + csvNum(p[2]);
}

function secsToTime(s) {
  if (s === null || s === undefined || isNaN(s)) return '—';
  var sign = Number(s) < 0 ? '-' : '';
  var value = Math.abs(Number(s));
  var h = Math.floor(value / 3600);
  var m = Math.floor((value % 3600) / 60);
  return sign + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function cleanName(n) { return (n || '').replace(/^[A-Z0-9]+-/, '').trim(); }
function freqClass(m) { return m <= 12 ? 'fg-good' : m <= 20 ? 'fg-mid' : 'fg-low'; }

function safeHexColor(value, fallback) {
  value = String(value || '').replace('#', '').trim();
  return /^[0-9a-fA-F]{6}$/.test(value) ? '#' + value : fallback;
}

function rColor(r) { return safeHexColor(r && r.route_color, '#AF2B1E'); }
function rText(r) { return safeHexColor(r && r.route_text_color, '#FFFFFF'); }
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function unique(arr) { return Array.from(new Set(arr.filter(function (x) { return x !== undefined && x !== null && x !== ''; }))); }

function extractDateFromName(name) {
  var value = String(name || '');
  var m = value.match(/(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)/);
  var y, mo, d;
  if (m) {
    y = Number(m[1]); mo = Number(m[2]) - 1; d = Number(m[3]);
  } else {
    m = value.match(/([0-3]\d)[-_]([01]\d)[-_](20\d{2})/);
    if (!m) return null;
    d = Number(m[1]); mo = Number(m[2]) - 1; y = Number(m[3]);
  }
  var dt = new Date(y, mo, d);
  if (isNaN(dt.getTime()) || dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

function daysAgo(dt) {
  if (!dt) return null;
  var now = new Date(), a = new Date(now.getFullYear(), now.getMonth(), now.getDate()), b = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  return Math.floor((a - b) / 86400000);
}

function ageText(label, dt) {
  var d = daysAgo(dt); if (d === null) return label + ': fecha no disponible';
  if (d === 0) return label + ': datos de hoy';
  if (d === 1) return label + ': datos de hace 1 día';
  return label + ': datos de hace ' + d + ' días';
}

function dateGapDays(a, b) {
  if (!a || !b) return null;
  var aDay = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var bDay = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round(Math.abs(aDay - bDay) / 86400000);
}

function updateDecoCompatibility() {
  var gap = dateGapDays(DATA.sourceDates.gtfs, DATA.sourceDates.deco);
  DATA.decoDateGapDays = gap;
  DATA.decoCompatible = gap !== null && gap <= 6;
}

function normalizeOpKey(v) { return String(v || '').trim().toLowerCase().replace(/\s+/g, ''); }
function operatorFromDeco(row) { return row ? String(row.CLI_DSC || row.OPERADOR || row.operador || 'Operador no informado').trim() : 'Operador no informado'; }

function routeOperator(route) {
  if (!DATA.decoCompatible) return 'No disponible';
  if (!route) return 'Operador no informado';
  var keys = [route.route_short_name, route.route_id].map(normalizeOpKey);
  for (var i = 0; i < keys.length; i++) { if (DATA.decoByRoute[keys[i]]) return operatorFromDeco(DATA.decoByRoute[keys[i]][0]); }
  return 'Operador no informado';
}

function routeMatchesOperator(route, op) {
  if (!DATA.decoCompatible) return true;
  return !op || op === '__all' || routeOperator(route) === op;
}

function fillOperatorSelect(selId, keepValue) {
  var sel = document.getElementById(selId); if (!sel) return;
  var old = keepValue || sel.value || '__all'; sel.innerHTML = '';
  var all = document.createElement('option'); all.value = '__all';
  if (!DATA.decoCompatible) {
    all.textContent = 'Sin filtro por operador';
    sel.appendChild(all);
    sel.value = '__all';
    sel.disabled = true;
    sel.title = DATA.availableSources.deco
      ? 'La información de operadores no corresponde a la fecha seleccionada.'
      : 'No hay información de operadores para esta fecha.';
    return;
  }
  all.textContent = 'Todos los operadores'; sel.appendChild(all);
  DATA.operators.forEach(function (op) { var o = document.createElement('option'); o.value = op; o.textContent = op; sel.appendChild(o); });
  sel.value = DATA.operators.indexOf(old) !== -1 ? old : '__all';
  sel.disabled = false;
  sel.removeAttribute('title');
}

function refreshDataAge() {
  var el = document.getElementById('data-age');
  var decoText = DATA.decoCompatible
    ? ageText('Operadores', DATA.sourceDates.deco)
    : (DATA.availableSources.deco ? 'Operadores: fecha distinta' : 'Operadores: no disponibles');
  if (el) el.textContent = ageText('Horarios', DATA.sourceDates.gtfs) + ' · ' + decoText;
  var side = document.getElementById('sidebar-source-summary');
  if (side) {
    var gtfsDate = DATA.sourceDates.gtfs ? formatDatasetDate(DATA.sourceDates.gtfs) : 'fecha no disponible';
    var available = ['Recorridos'];
    if (DATA.availableSources.deco) available.push('Operadores');
    if (DATA.availableSources.param) available.push('Indicadores');
    side.innerHTML = '<strong>' + esc(gtfsDate) + '</strong><br><span>' + esc(available.join(' · ')) + '</span>';
  }
}

function sortServices(a, b) {
  var order = { L: 1, LJ: 2, V: 3, S: 4, D: 5, F: 6 };
  return (order[a] || 99) - (order[b] || 99) || String(a).localeCompare(String(b), undefined, { numeric: true });
}

function serviceLabel(sid) {
  if (SVC[sid]) return SVC[sid];
  var c = DATA.calendar[sid];
  if (c) {
    var flags = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(function (k) { return String(c[k]) === '1' || c[k] === 1; });
    var active = flags.map(function (v, i) { return v ? DAY_NAMES[i] : null; }).filter(Boolean);
    if (active.length === 5 && flags.slice(0, 5).every(Boolean) && !flags[5] && !flags[6]) return 'Lunes a Viernes';
    if (active.length === 7) return 'Todos los días';
    if (active.length) return active.join(', ');
  }
  return sid;
}

function tripDir(t) { return String(t.direction_id == null || t.direction_id === '' ? 0 : t.direction_id); }
function dirName(dir) { return String(dir) === '1' ? 'Regreso' : 'Ida'; }
function busCountText(count) { count = Number(count) || 0; return count + ' ' + (count === 1 ? 'bus' : 'buses'); }

function getTripStartOffset(tripId) {
  var st = DATA.stopTimes[tripId] || [];
  if (!st.length) return 0;
  return timeToSecs(st[0].departure_time || st[0].arrival_time || '0:00:00');
}

function getStopOffsetInTrip(tripId, stopTimeRow) {
  return timeToSecs(stopTimeRow.departure_time || stopTimeRow.arrival_time || '0:00:00') - getTripStartOffset(tripId);
}

async function parseDECOFile(file) {
  var txt = '';
  if (/\.zip$/i.test(file.name || '')) {
    var zip = await JSZip.loadAsync(file);
    var names = Object.keys(zip.files).filter(function (n) { return /\.csv$/i.test(n); });
    if (!names.length) throw new Error('El archivo de operadores no contiene datos válidos.');
    txt = await zip.file(names[0]).async('string');
  } else {
    txt = await file.text();
  }
  var rows = Papa.parse(txt.trim(), { header: true, skipEmptyLines: true, dynamicTyping: false, delimiter: ';' }).data;
  DATA.decoRows = rows.filter(function (r) { return r && (r.CODIGO_USUARIO || r.CODIGO_MTT || r.SERVICIO_DECO || r.CODIGO_RUTA); });
  DATA.decoByRoute = {};
  DATA.decoRows.forEach(function (r) {
    [r.CODIGO_USUARIO, r.CODIGO_MTT, r.SERVICIO_DECO].forEach(function (k) {
      var key = normalizeOpKey(k); if (!key) return;
      if (!DATA.decoByRoute[key]) DATA.decoByRoute[key] = [];
      DATA.decoByRoute[key].push(r);
    });
  });
  DATA.operators = unique(DATA.decoRows.map(operatorFromDeco)).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); });
  BUS_STATE.decoReady = false;
  BUS_STATE.decoIndex = null;
}

function parseGTFSInWorker(file) {
  return new Promise(function (resolve, reject) {
    if (!window.Worker) {
      reject(new Error('Este navegador no puede procesar la información. Prueba con una versión reciente.'));
      return;
    }
    var worker = new Worker(new URL('assets/js/gtfs-worker.js', window.location.href));
    var done = false;
    worker.onmessage = function (e) {
      var msg = e.data || {};
      if (msg.type === 'progress') prog(msg.pct || 0, msg.text || 'Procesando...');
      if (msg.type === 'done') {
        done = true;
        worker.terminate();
        resolve(msg.data);
      }
      if (msg.type === 'error') {
        done = true;
        worker.terminate();
        reject(new Error(msg.message || 'No se pudo leer la información de recorridos.'));
      }
    };
    worker.onerror = function (err) {
      if (done) return;
      worker.terminate();
      reject(new Error(err.message || 'No se pudo procesar la información de recorridos.'));
    };
    worker.postMessage({ file: file });
  });
}

async function handleFile(file, decoFile, paramItem, mode) {
  if (!file) return;
  APP_MODE = mode === 'realtime' ? 'realtime' : 'static';
  DATA = freshData();
  BUS_STATE.decoReady = false;
  BUS_STATE.decoIndex = null;
  BUS_STATE.features = [];
  BUS_STATE.lastLoadedAt = null;
  DATA.availableSources.gtfs = true;
  DATA.availableSources.deco = !!decoFile;
  DATA.availableSources.param = !!(paramItem && paramItem.file);
  DATA.sourceNames.gtfs = file.name || 'gtfs.zip';
  DATA.sourceNames.deco = decoFile ? (decoFile.name || 'deco') : '';
  DATA.sourceNames.param = DATA.availableSources.param ? paramItem.file.name : '';
  DATA.sourceDates.gtfs = extractDateFromName(DATA.sourceNames.gtfs);
  DATA.sourceDates.deco = decoFile ? extractDateFromName(DATA.sourceNames.deco) : null;
  DATA.sourceDates.param = DATA.availableSources.param ? paramItem.date : null;
  updateDecoCompatibility();
  try {
    if (decoFile) {
      prog(5, 'Cargando operadores…');
      try {
        await parseDECOFile(decoFile);
      } catch (decoErr) {
        console.warn('No se pudo procesar la información de operadores. Se continuará con los recorridos.', decoErr);
        DATA.decoRows = [];
        DATA.decoByRoute = {};
        DATA.operators = [];
        DATA.availableSources.deco = false;
        DATA.sourceNames.deco = '';
        DATA.sourceDates.deco = null;
        updateDecoCompatibility();
      }
    }
    prog(8, 'Preparando recorridos y horarios…');
    var parsed = await parseGTFSInWorker(file);
    Object.keys(parsed).forEach(function (k) { DATA[k] = parsed[k]; });
    prog(100, 'Datos listos');
    setTimeout(function () {
      document.getElementById('upload-section').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      document.getElementById('btn-reload').style.display = 'inline-flex';
      buildUI();
      initMap();
      if (APP_MODE === 'realtime') switchTab('buses');
      else {
        renderMap();
        switchTab('resumen');
      }
    }, 120);
  } catch (err) {
    console.error(err);
    prog(0, err.message || 'No se pudo cargar la información.');
    alert(err.message || 'No se pudo cargar la información.');
  }
}

function tabAvailability() {
  var gtfs = !!(DATA.availableSources && DATA.availableSources.gtfs);
  var params = !!(DATA.availableSources && DATA.availableSources.param);
  return {
    resumen: gtfs,
    buses: APP_MODE === 'realtime' && !!(DATA.availableSources && DATA.availableSources.deco),
    ruta: gtfs,
    paradero: gtfs,
    parametros: params,
    simulacion: gtfs,
    comparar: gtfs && APP_MODE === 'static'
  };
}

function configureAvailableTabs() {
  var available = tabAvailability();
  document.querySelectorAll('.tab-btn[data-tab]').forEach(function (button) {
    var tab = button.getAttribute('data-tab');
    var enabled = !!available[tab];
    button.style.display = enabled ? '' : 'none';
    button.setAttribute('aria-hidden', enabled ? 'false' : 'true');
  });
  Object.keys(available).forEach(function (tab) {
    var panel = document.getElementById('tab-' + tab);
    if (panel && !available[tab]) panel.style.display = 'none';
  });
  var preferred = APP_MODE === 'realtime'
    ? ['buses', 'ruta', 'resumen', 'paradero', 'simulacion', 'comparar', 'parametros']
    : ['resumen', 'ruta', 'paradero', 'parametros', 'simulacion', 'comparar'];
  var first = preferred.find(function (tab) { return available[tab]; });
  if (first) switchTab(first);
}

function medianNumber(values) {
  var nums = (values || []).filter(function (v) { return v !== null && v !== undefined && !isNaN(v); }).map(Number).sort(function (a, b) { return a - b; });
  if (!nums.length) return null;
  var mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

function percent(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function estimatedTripInstances(trip, serviceId) {
  return 1;
}

function buildNetworkAnalytics() {
  var serviceId = document.getElementById('sel-service-global') ? document.getElementById('sel-service-global').value : DATA.serviceIds[0];
  var activeRoutes = {}, usedStops = {}, trips = [], routeRows = [];
  var earliest = null, latest = null;

  Object.values(DATA.trips).forEach(function (t) {
    if (t.service_id !== serviceId) return;
    trips.push(t);
    activeRoutes[t.route_id] = true;
    var st = DATA.stopTimes[t.trip_id] || [];
    st.forEach(function (s) { usedStops[s.stop_id] = true; });
    var se = tripStartEnd(t.trip_id);
    if (se) {
      if (earliest === null || se.departure < earliest) earliest = se.departure;
      if (latest === null || se.arrival > latest) latest = se.arrival;
    }
  });

  Object.values(DATA.routes).forEach(function (r) {
    var rTrips = (DATA.tripsByRoute[r.route_id] || []).filter(function (t) { return t.service_id === serviceId; });
    if (!rTrips.length) return;
    var offer = rTrips.length;
    routeRows.push({ label: r.route_short_name || r.route_id, offer: offer, route: r });
  });
  routeRows.sort(function (a, b) { return b.offer - a.offer; });

  var allStops = Object.keys(DATA.stops);
  var coords = allStops.filter(function (sid) { return DATA.stops[sid] && isFinite(DATA.stops[sid].stop_lat); });
  var withShape = trips.filter(function (t) { return t.shape_id && DATA.shapes[t.shape_id]; });
  var withTimes = trips.filter(function (t) { return DATA.stopTimes[t.trip_id] && DATA.stopTimes[t.trip_id].length; });

  var bothCount = Object.keys(activeRoutes).filter(function (rid) {
    var dirs = unique((DATA.tripsByRoute[rid] || []).filter(function (t) { return t.service_id === serviceId; }).map(tripDir));
    return dirs.indexOf('0') !== -1 && dirs.indexOf('1') !== -1;
  }).length;

  var stopCounts = trips.map(function (t) { return (DATA.stopTimes[t.trip_id] || []).length; });

  DATA.analytics = {
    serviceId: serviceId,
    serviceLabel: serviceLabel(serviceId),
    trips: trips.length,
    activeRoutes: Object.keys(activeRoutes).length,
    usedStops: Object.keys(usedStops).length,
    estimatedDepartures: routeRows.reduce(function (sum, r) { return sum + r.offer; }, 0),
    earliest: earliest,
    latest: latest,
    coordsPct: percent(coords.length, allStops.length),
    shapePct: percent(withShape.length, trips.length),
    stopTimesPct: percent(withTimes.length, trips.length),
    bothDirsPct: percent(bothCount, Object.keys(activeRoutes).length),
    medianStops: medianNumber(stopCounts),
    routeRows: routeRows
  };
  return DATA.analytics;
}

function metricCard(label, value, sub) {
  return '<div class="metric-card"><div class="lbl">' + esc(label) + '</div><div class="val">' + esc(value) + '</div>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>';
}

function sourceStatus(label, available, detail, warning) {
  return '<div class="source-item ' + (available ? (warning ? 'warn' : 'ok') : '') + '"><span class="source-dot"></span><div><strong>' + esc(label) + '</strong><small>' + esc(detail) + '</small></div></div>';
}

function renderOverview() {
  var a = buildNetworkAnalytics();
  var stats = document.getElementById('stats-row');
  if (stats) {
    var windowLabel = (a.earliest === null || a.latest === null) ? '—' : secsToTime(a.earliest) + '–' + secsToTime(a.latest);
    stats.innerHTML = [
      ['Recorridos activos', a.activeRoutes.toLocaleString('es-CL'), a.serviceLabel],
      ['Salidas estimadas', a.estimatedDepartures.toLocaleString('es-CL'), 'día tipo seleccionado'],
      ['Paradas utilizadas', a.usedStops.toLocaleString('es-CL'), 'con atención programada'],
      ['Ventana de servicio', windowLabel, 'primera salida a última llegada']
    ].map(function (x) { return '<div class="stat-card"><div class="lbl">' + esc(x[0]) + '</div><div class="val">' + esc(x[1]) + '</div><div class="sub">' + esc(x[2]) + '</div></div>'; }).join('');
  }
  var health = document.getElementById('overview-health');
  if (health) {
    health.innerHTML = [
      ['Paraderos ubicados en el mapa', a.coordsPct],
      ['Viajes con trazado', a.shapePct],
      ['Viajes con horarios', a.stopTimesPct],
      ['Recorridos con ambos sentidos', a.bothDirsPct]
    ].map(function (item) { return '<div class="health-item"><strong>' + esc(item[0]) + '</strong><span>' + item[1] + '%</span><div class="health-bar"><i style="width:' + item[1] + '%"></i></div></div>'; }).join('');
  }
  var sources = document.getElementById('overview-sources');
  if (sources) {
    var decoDetail = !DATA.availableSources.deco ? 'No disponible para esta fecha' : (DATA.decoCompatible ? 'Disponible' : 'Corresponde a otra fecha');
    sources.innerHTML = sourceStatus('Recorridos y horarios', true, formatDatasetDate(DATA.sourceDates.gtfs), false) + sourceStatus('Operadores y servicios', DATA.availableSources.deco, decoDetail, DATA.availableSources.deco && !DATA.decoCompatible) + sourceStatus('Indicadores', DATA.availableSources.param, DATA.availableSources.param ? 'Disponibles' : 'No disponibles para esta fecha', false);
  }
  var canvas = document.getElementById('overview-chart');
  if (canvas && window.Chart) {
    if (overviewChart) overviewChart.destroy();
    var top = a.routeRows.slice(0, 10);
    overviewChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: top.map(function (r) { return r.label; }),
        datasets: [{ label: 'Salidas estimadas', data: top.map(function (r) { return r.offer; }), backgroundColor: 'rgba(152,37,28,.82)', borderRadius: 5 }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { afterLabel: function () { return a.serviceLabel; } } } },
        scales: { x: { beginAtZero: true, grid: { color: 'rgba(23,32,39,.06)' }, title: { display: true, text: 'salidas estimadas' } }, y: { grid: { display: false } } }
      }
    });
  }
}

function buildUI() {
  var selR = document.getElementById('sel-route');
  if (!selR) return;
  selR.innerHTML = '';
  Object.values(DATA.routes)
    .filter(function (r) { return (DATA.tripsByRoute[String(r.route_id)] || []).length > 0; })
    .sort(function (a, b) { return String(a.route_short_name || a.route_id).localeCompare(String(b.route_short_name || b.route_id), undefined, { numeric: true }); })
    .forEach(function (r) {
      var o = document.createElement('option');
      o.value = r.route_id;
      o.textContent = (r.route_short_name || r.route_id) + ' — ' + (r.route_long_name || 'Sin nombre');
      selR.appendChild(o);
    });
  fillOperatorSelect('sel-operator');
  fillOperatorSelect('sel-operator-stop');
  if (typeof setupSimulationSelectors === 'function') setupSimulationSelectors();
  refreshDataAge();
  if (typeof updateStopGlobalServices === 'function') updateStopGlobalServices();
  
  selR.addEventListener('change', function () {
    if (typeof updateRouteServiceOptions === 'function') updateRouteServiceOptions();
    if (typeof renderAll === 'function') renderAll();
  });
  
  var selOp = document.getElementById('sel-operator');
  if (selOp) selOp.addEventListener('change', updateRouteOptionsByOperator);
  
  var selOpStop = document.getElementById('sel-operator-stop');
  if (selOpStop) selOpStop.addEventListener('change', function () { if (activeStop && typeof renderStop === 'function') renderStop(activeStop); });
  
  var selServ = document.getElementById('sel-service');
  if (selServ) selServ.addEventListener('change', function () { if (typeof renderAll === 'function') renderAll(); });
  
  var selServStop = document.getElementById('sel-service-stop');
  if (selServStop) selServStop.addEventListener('change', function () { if (activeStop && typeof renderStop === 'function') renderStop(activeStop); });
  
  if (typeof bindSimulationEvents === 'function') bindSimulationEvents();
  if (typeof setupStopSearch === 'function') setupStopSearch();
  if (typeof updateRouteServiceOptions === 'function') updateRouteServiceOptions();
  renderOverview();
  if (typeof renderAll === 'function') renderAll();
  configureAvailableTabs();

  // ===== NUEVO: inicializar filtros avanzados de buses =====
  initBusAdvancedFilters();
  // ===== FIN NUEVO =====
}

function updateRouteOptionsByOperator() {
  var op = document.getElementById('sel-operator').value;
  var selR = document.getElementById('sel-route'), old = selR.value;
  if (!selR) return;
  selR.innerHTML = '';
  var routes = Object.values(DATA.routes)
    .filter(function (r) { return (DATA.tripsByRoute[String(r.route_id)] || []).length > 0 && routeMatchesOperator(r, op); })
    .sort(function (a, b) { return String(a.route_short_name).localeCompare(String(b.route_short_name), undefined, { numeric: true }); });
  routes.forEach(function (r) {
    var o = document.createElement('option');
    o.value = r.route_id;
    o.textContent = (r.route_short_name || r.route_id) + ' — ' + (r.route_long_name || '');
    selR.appendChild(o);
  });
  if (routes.some(function (r) { return String(r.route_id) === String(old); })) selR.value = old;
  if (typeof updateRouteServiceOptions === 'function') updateRouteServiceOptions();
  if (typeof renderAll === 'function') renderAll();
}

function routeServices(routeId) {
  return unique((DATA.tripsByRoute[String(routeId)] || []).map(function (t) { return t.service_id; })).sort(sortServices);
}

function routeDirs(routeId, serviceId) {
  return unique((DATA.tripsByRoute[String(routeId)] || []).filter(function (t) { return String(t.service_id) === String(serviceId); }).map(function (t) { return tripDir(t); })).sort();
}

function fillServiceSelect(sel, services) {
  if (!sel) return;
  var old = sel.value;
  sel.innerHTML = '';
  services.forEach(function (s) {
    var o = document.createElement('option');
    o.value = s;
    o.textContent = serviceLabel(s);
    sel.appendChild(o);
  });
  if (services.indexOf(old) !== -1) sel.value = old;
}

function renderFreqTable(ida, regreso) {
  var wrap = document.getElementById('freq-table-wrap');
  if (!wrap) return;
  var routeSelect = document.getElementById('sel-route');
  var serviceSelect = document.getElementById('sel-service');
  if (!routeSelect || !serviceSelect) return;
  var dirs = routeDirs(routeSelect.value, serviceSelect.value);
  var rows = [];
  for (var h = 0; h < 24; h++) {
    var a = ida[h] || { count: 0, median: null };
    var b = regreso[h] || { count: 0, median: null };
    if (!a.count && !b.count) continue;
    var cells = '<td><b>' + String(h).padStart(2, '0') + ':00–' + String((h + 1) % 24).padStart(2, '0') + ':00</b></td>';
    if (dirs.indexOf('0') !== -1) {
      cells += '<td>' + a.count + '</td><td>' + (a.median === null ? '—' : '<span class="freq-pill ' + freqClass(a.median) + '">' + Math.round(a.median) + ' min</span>') + '</td>';
    }
    if (dirs.indexOf('1') !== -1) {
      cells += '<td>' + b.count + '</td><td>' + (b.median === null ? '—' : '<span class="freq-pill ' + freqClass(b.median) + '">' + Math.round(b.median) + ' min</span>') + '</td>';
    }
    rows.push('<tr>' + cells + '</tr>');
  }
  if (!rows.length) {
    wrap.innerHTML = '<div class="no-data">No hay salidas programadas para este filtro.</div>';
    return;
  }
  var head = '<th>Franja</th>';
  if (dirs.indexOf('0') !== -1) head += '<th>Salidas ida</th><th>Intervalo mediano</th>';
  if (dirs.indexOf('1') !== -1) head += '<th>Salidas regreso</th><th>Intervalo mediano</th>';
  wrap.innerHTML = '<div class="tbl-wrap"><table><thead><tr>' + head + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
}

function renderFreqChart(ida, regreso) {
  var routeSelect = document.getElementById('sel-route');
  var serviceSelect = document.getElementById('sel-service');
  if (!routeSelect || !serviceSelect) return;
  var dirs = routeDirs(routeSelect.value, serviceSelect.value);
  var labels = [];
  for (var h = 0; h < 24; h++) labels.push(String(h).padStart(2, '0') + 'h');
  var datasets = [];
  if (dirs.indexOf('0') !== -1) datasets.push({ label: 'Ida', data: ida.map(function (b) { return b.count; }), backgroundColor: 'rgba(37,99,235,.78)', borderRadius: 4 });
  if (dirs.indexOf('1') !== -1) datasets.push({ label: 'Regreso', data: regreso.map(function (b) { return b.count; }), backgroundColor: 'rgba(220,38,38,.72)', borderRadius: 4 });
  var canvas = document.getElementById('freq-chart');
  if (!canvas) return;
  if (freqChart) freqChart.destroy();
  freqChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'salidas' }, ticks: { precision: 0 }, grid: { color: 'rgba(23,32,39,.06)' } }, x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0 } } }
    }
  });
}

function setStopsDir(dir, skipRender) {
  curStopsDir = Number(dir);
  var b0 = document.getElementById('stops-btn-0'), b1 = document.getElementById('stops-btn-1');
  if (b0) b0.classList.toggle('active', curStopsDir === 0);
  if (b1) b1.classList.toggle('active', curStopsDir === 1);
  if (!skipRender && typeof renderStopsTable === 'function') renderStopsTable();
}

function tripDurationSecs(tripId) {
  var st = DATA.stopTimes[tripId] || [];
  if (st.length < 2) return 0;
  var first = timeToSecs(st[0].departure_time || st[0].arrival_time || '0:00:00');
  var last = timeToSecs(st[st.length - 1].arrival_time || st[st.length - 1].departure_time || '0:00:00');
  return Math.max(0, last - first);
}

function tripStartEnd(tripId) {
  var st = DATA.stopTimes[tripId] || [];
  if (!st.length) return null;
  var dep = timeToSecs(st[0].departure_time || st[0].arrival_time || '0:00:00');
  var arr = timeToSecs(st[st.length - 1].arrival_time || st[st.length - 1].departure_time || '0:00:00');
  return { departure: dep, arrival: arr };
}

function getFreqsForTrips(tripsList) {
  var ids = tripsList.map(function (t) { return t.trip_id; });
  return (DATA.frequencies || []).filter(function (f) { return ids.indexOf(f.trip_id) !== -1; });
}

function routeDepartures(routeId, serviceId, dir) {
  var trips = (DATA.tripsByRoute[String(routeId)] || []).filter(function (t) { return String(t.service_id) === String(serviceId) && (dir === -1 || tripDir(t) === String(dir)); });
  var out = [], seen = {};
  trips.forEach(function (t) {
    var se = tripStartEnd(t.trip_id);
    if (!se) return;
    var duration = Math.max(0, se.arrival - se.departure);
    var freqs = getFreqsForTrips([t]);
    if (freqs.length) {
      freqs.forEach(function (f) {
        var start = timeToSecs(f.start_time), end = timeToSecs(f.end_time), step = Math.max(1, csvNum(f.headway_secs, 0));
        for (var s = start; s < end; s += step) {
          var key = t.trip_id + '|' + s + '|' + tripDir(t);
          if (seen[key]) continue;
          seen[key] = true;
          out.push({ trip: t, dir: tripDir(t), departure: s, arrival: s + duration, headsign: t.trip_headsign || '', source: 'frecuencia' });
        }
      });
    } else {
      var key = t.trip_id + '|' + se.departure + '|' + tripDir(t);
      if (!seen[key]) {
        seen[key] = true;
        out.push({ trip: t, dir: tripDir(t), departure: se.departure, arrival: se.arrival, headsign: t.trip_headsign || '', source: 'programada' });
      }
    }
  });
  return out.sort(function (a, b) { return a.departure - b.departure || a.arrival - b.arrival || String(a.trip.trip_id).localeCompare(String(b.trip.trip_id)); });
}

function isComparableStopId(sid) {
  return typeof sid === 'string' && sid.length > 0;
}
function stopNameForFeed(feed, sid) {
  return feed && feed.stops[sid] ? feed.stops[sid].stop_name : sid;
}
function routeTrips(feed, route) {
  return feed && feed.tripsByRoute[route.route_id] || [];
}

function routeStopSeqsByDir(feed, route) {
  var out = {};
  routeTrips(feed, route).forEach(function (t) {
    var d = tripDir(t);
    if (out[d]) return;
    var st = feed.stopTimes[t.trip_id] || [];
    if (st.length) out[d] = st.map(function (x) { return x.stop_id; });
  });
  return out;
}

function routeStopSignature(feed, route) {
  var byDir = routeStopSeqsByDir(feed, route);
  return Object.keys(byDir).sort().map(function (k) { return k + ':' + byDir[k].join('>'); }).join('|');
}

function avgHeadwayForRoute(feed, route) {
  if (!route) return null;
  var trips = routeTrips(feed, route), ids = {};
  trips.forEach(function (t) { ids[t.trip_id] = true; });
  var freqs = (feed.frequencies || []).filter(function (f) { return ids[f.trip_id] && f.headway_secs > 0; });
  if (freqs.length) return Math.round(freqs.reduce(function (a, f) { return a + f.headway_secs; }, 0) / freqs.length / 60);
  var starts = [];
  trips.forEach(function (t) {
    var st = feed.stopTimes[t.trip_id];
    if (st && st.length) starts.push(timeToSecs(st[0].departure_time || st[0].arrival_time || '0:00:00'));
  });
  starts.sort(function (a, b) { return a - b; });
  if (starts.length < 2) return null;
  var diffs = [];
  for (var i = 1; i < starts.length; i++) {
    if (starts[i] - starts[i - 1] > 0) diffs.push(starts[i] - starts[i - 1]);
  }
  return diffs.length ? Math.round(diffs.reduce(function (a, b) { return a + b; }, 0) / diffs.length / 60) : null;
}

function stopDeltaDetails(oldFeed, newFeed, oldR, newR) {
  var oldSeqs = routeStopSeqsByDir(oldFeed, oldR), newSeqs = routeStopSeqsByDir(newFeed, newR), details = [];
  var dirs = unique(Object.keys(oldSeqs).concat(Object.keys(newSeqs))).sort();
  dirs.forEach(function (d) {
    var oldSeq = (oldSeqs[d] || []).filter(isComparableStopId);
    var newSeq = (newSeqs[d] || []).filter(isComparableStopId);
    if (oldSeq.join('>') === newSeq.join('>')) return;
    var oldSet = {}, newSet = {};
    oldSeq.forEach(function (x) { oldSet[x] = true; });
    newSeq.forEach(function (x) { newSet[x] = true; });
    var added = newSeq.filter(function (x) { return !oldSet[x]; }).length;
    var removed = oldSeq.filter(function (x) { return !newSet[x]; }).length;
    var oldFirst = oldSeq.length ? stopNameForFeed(oldFeed, oldSeq[0]) : '—';
    var newFirst = newSeq.length ? stopNameForFeed(newFeed, newSeq[0]) : '—';
    var oldLast = oldSeq.length ? stopNameForFeed(oldFeed, oldSeq[oldSeq.length - 1]) : '—';
    var newLast = newSeq.length ? stopNameForFeed(newFeed, newSeq[newSeq.length - 1]) : '—';
    var txt = dirName(d) + ': ' + oldSeq.length + ' → ' + newSeq.length + ' paraderos procesados con cambios';
    if (added || removed) txt += ' (' + added + ' nuevos, ' + removed + ' eliminados)';
    if (oldFirst !== newFirst || oldLast !== newLast) txt += '; inicio ' + oldFirst + ' → ' + newFirst;
    details.push(txt);
  });
  return details;
}

/* Buses en operación */
function normalizeBusKey(value) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

function busOperatorNameFromDeco(row) {
  return String(row && (row.CLI_DSC || row.OPERADOR) || '').trim();
}

function busOperatorKeyFromDeco(row) {
  var name = busOperatorNameFromDeco(row);
  if (!name) return 'sin-operador';
  var normalized = normalizeBusKey(name);
  var numeric = Object.keys(BUS_OPERATOR_NAMES).find(function (key) {
    return normalizeBusKey(BUS_OPERATOR_NAMES[key]) === normalized;
  });
  return numeric || 'deco:' + normalized;
}

function decoPublicRoute(row) {
  return String(row && row.CODIGO_USUARIO || '').trim();
}

function setBusStatus(title, detail, state, emphasis) {
  var box = document.getElementById('bus-status');
  if (!box) return;
  box.className = 'panel-status bus-status' + (state ? ' is-' + state : '');
  box.innerHTML = '<strong>' + esc(title) + '</strong><span>' + esc(detail) + '</span>' + (emphasis ? '<strong class="bus-refresh-emphasis">' + esc(emphasis) + '</strong>' : '');
}

function parseBusDate(value) {
  var raw = String(value || '').trim();
  if (!raw) return null;
  if (/[+-]\d{4}$/.test(raw)) raw = raw.replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
  var date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}

function formatBusDate(value) {
  var date = value instanceof Date ? value : parseBusDate(value);
  if (!date) return 'Hora no informada';
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
}

function buildBusDecoIndex(rows) {
  var index = { CODIGO_RUTA: Object.create(null), CODIGO_MTT: Object.create(null), SERVICIO_DECO: Object.create(null), CODIGO_USUARIO: Object.create(null) };
  (rows || []).forEach(function (row) {
    if (!row) return;
    Object.keys(index).forEach(function (field) {
      var key = normalizeBusKey(row[field]);
      if (key && !index[field][key]) index[field][key] = row;
    });
  });
  return index;
}

async function ensureBusDeco() {
  if (BUS_STATE.decoReady) return;
  var rows = (DATA.decoRows || []).slice();
  if (!rows.length) throw new Error('No hay información vigente de operadores para el monitoreo.');
  BUS_STATE.decoIndex = buildBusDecoIndex(rows);
  BUS_STATE.decoReady = true;
}

function findBusDeco(rawRoute) {
  var index = BUS_STATE.decoIndex;
  if (!index) return null;
  var key = normalizeBusKey(rawRoute);
  var exactOrder = ['CODIGO_RUTA', 'CODIGO_MTT', 'SERVICIO_DECO', 'CODIGO_USUARIO'];
  for (var i = 0; i < exactOrder.length; i++) {
    var exact = index[exactOrder[i]][key];
    if (exact) return exact;
  }
  var base = String(rawRoute || '').trim().toUpperCase().match(/^T(\d+)(?=\s|$)/);
  if (base) {
    var numericKey = base[1];
    var baseOrder = ['CODIGO_MTT', 'SERVICIO_DECO', 'CODIGO_USUARIO'];
    for (var j = 0; j < baseOrder.length; j++) {
      var row = index[baseOrder[j]][numericKey];
      if (row) return row;
    }
  }
  return null;
}

function busDirection(properties) {
  var label = String(properties.route_direction || '').trim().toLowerCase();
  if (label.indexOf('ida') === 0) return 'I';
  if (label.indexOf('reg') === 0) return 'R';
  var route = String(properties.route_code || '').trim().toUpperCase();
  if (/I$/.test(route)) return 'I';
  if (/R$/.test(route)) return 'R';
  return '';
}

function enrichBusFeature(feature) {
  if (!feature || !feature.geometry || feature.geometry.type !== 'Point') return null;
  var coordinates = feature.geometry.coordinates || [];
  var longitude = Number(coordinates[0]), latitude = Number(coordinates[1]);
  if (!isFinite(longitude) || !isFinite(latitude)) return null;
  if (latitude < -35 || latitude > -32 || longitude < -72 || longitude > -69) return null;
  var properties = feature.properties || {};
  var rawRoute = String(properties.route_code || '').trim();
  var deco = findBusDeco(rawRoute);
  var plate = String(properties.license_plate || 'Patente no informada').trim().toUpperCase();
  var internalMatch = rawRoute.match(/(T[^,;|]+)/i);
  var internalCode = String(deco && deco.CODIGO_RUTA || '').trim().toUpperCase();
  if (!internalCode) internalCode = internalMatch ? internalMatch[1].trim().toUpperCase() : (rawRoute || 'Código no informado');
  var fallbackRoute = internalCode || plate || rawRoute || 'Servicio no identificado';
  var publicRoute = String(deco && deco.CODIGO_USUARIO || fallbackRoute).trim() || fallbackRoute;
  var sourceOperatorKey = String(properties.operator === undefined || properties.operator === null ? '' : properties.operator).trim();
  var decoOperatorKey = deco ? busOperatorKeyFromDeco(deco) : '';
  var operatorKey = decoOperatorKey && decoOperatorKey !== 'sin-operador' ? decoOperatorKey : (sourceOperatorKey || 'sin-operador');
  var operatorName = busOperatorNameFromDeco(deco) || BUS_OPERATOR_NAMES[sourceOperatorKey] || 'Operador no informado';
  var timestamp = parseBusDate(properties.timestamp);
  var direction = busDirection(properties);

  // ===== NUEVO: añadir datos del registro de vehículos =====
  var vehicleInfo = vehicleInfoByPlate(plate) || {};
  var type = vehicleInfo.type || null;
  var tech = vehicleInfo.tech || null;
  var year = vehicleInfo.year || null;
  // ===== FIN NUEVO =====

  return {
    latitude: latitude, longitude: longitude, plate: plate, rawRoute: internalCode, internalCode: internalCode, publicRoute: publicRoute, routeKey: normalizeBusKey(publicRoute), direction: direction, directionLabel: direction === 'I' ? 'Ida' : (direction === 'R' ? 'Regreso' : 'Sin sentido'), operatorKey: operatorKey || 'sin-operador', operatorName: operatorName, speed: isFinite(Number(properties.speed)) ? Number(properties.speed) : null, timestamp: timestamp, timestampRaw: properties.timestamp || '',
    type: type, tech: tech, year: year
  };
}

function extractBusFeatures(payload) {
  if (typeof payload === 'string') {
    payload = JSON.parse(payload.replace(/^\uFEFF/, '').trim());
  }
  if (payload && payload.geojson && Array.isArray(payload.geojson.features)) return payload.geojson.features;
  if (payload && payload.data && payload.data.geojson && Array.isArray(payload.data.geojson.features)) return payload.data.geojson.features;
  if (payload && Array.isArray(payload.features)) return payload.features;
  if (Array.isArray(payload)) return payload;
  throw new Error('La respuesta no contiene una colección de buses válida.');
}

async function fetchBusEndpoint(url) {
  var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  var timeout = controller ? setTimeout(function () { controller.abort(); }, 20000) : null;
  try {
    var response = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: controller ? controller.signal : undefined });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    var text = await response.text();
    return extractBusFeatures(text);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function mergeBusFeatures(featureLists) {
  var byPlate = new Map();
  (featureLists || []).forEach(function (list) {
    (list || []).forEach(function (feature) {
      var bus = enrichBusFeature(feature);
      if (!bus) return;
      var key = normalizeBusKey(bus.plate);
      if (!key || key === 'PPUNOINFORMADA') {
        key = normalizeBusKey(bus.rawRoute) + '|' + bus.latitude.toFixed(6) + '|' + bus.longitude.toFixed(6);
      }
      var previous = byPlate.get(key);
      if (!previous || (!previous.timestamp && bus.timestamp) || (previous.timestamp && bus.timestamp && bus.timestamp > previous.timestamp)) {
        byPlate.set(key, bus);
      }
    });
  });
  return Array.from(byPlate.values());
}

function operatorDisplayLabel(key, name) {
  var publicName = String(name || '').trim();
  return publicName || 'Operador no informado';
}

function fillBusOperatorOptions() {
  var select = document.getElementById('bus-operator-filter');
  if (!select) return;
  var keep = select.value || '__all';
  var operators = Object.create(null);
  (DATA.decoRows || []).forEach(function (row) {
    var key = busOperatorKeyFromDeco(row);
    var name = busOperatorNameFromDeco(row) || 'Operador no informado';
    if (!operators[key]) operators[key] = { name: name, count: 0 };
  });
  BUS_STATE.features.forEach(function (bus) {
    if (!operators[bus.operatorKey]) operators[bus.operatorKey] = { name: bus.operatorName, count: 0 };
    operators[bus.operatorKey].count++;
  });
  select.innerHTML = '<option value="__all">Todos los operadores (' + busCountText(BUS_STATE.features.length) + ')</option>';
  Object.keys(operators).sort(function (a, b) { return operators[a].name.localeCompare(operators[b].name, undefined, { numeric: true, sensitivity: 'base' }); }).forEach(function (key) {
    var item = operators[key];
    var option = document.createElement('option');
    option.value = key;
    option.textContent = operatorDisplayLabel(key, item.name) + ' (' + (item.count ? busCountText(item.count) : 'sin buses actuales') + ')';
    select.appendChild(option);
  });
  if (Array.from(select.options).some(function (option) { return option.value === keep; })) select.value = keep;
  else select.value = '__all';
}

function updateBusRouteOptions() {
  var operatorSelect = document.getElementById('bus-operator-filter');
  var routeSelect = document.getElementById('bus-route-filter');
  if (!routeSelect) return;
  var operator = operatorSelect ? operatorSelect.value : '__all';
  var keep = routeSelect.value || '__all';
  var routes = Object.create(null);
  (DATA.decoRows || []).forEach(function (row) {
    var rowOperator = busOperatorKeyFromDeco(row);
    if (operator !== '__all' && rowOperator !== operator) return;
    var label = decoPublicRoute(row);
    var key = normalizeBusKey(label);
    if (!key) return;
    if (!routes[key]) routes[key] = { label: label, count: 0 };
  });
  BUS_STATE.features.forEach(function (bus) {
    if (operator !== '__all' && bus.operatorKey !== operator) return;
    if (!routes[bus.routeKey]) routes[bus.routeKey] = { label: bus.publicRoute, count: 0 };
    routes[bus.routeKey].count++;
  });
  routeSelect.innerHTML = '<option value="__all">Todos los recorridos</option>';
  Object.keys(routes).sort(function (a, b) { return routes[a].label.localeCompare(routes[b].label, undefined, { numeric: true }); }).forEach(function (key) {
    var item = routes[key];
    var option = document.createElement('option');
    option.value = key;
    option.textContent = item.label + ' (' + busCountText(item.count) + ')';
    routeSelect.appendChild(option);
  });
  if (Array.from(routeSelect.options).some(function (o) { return o.value === keep; })) routeSelect.value = o.value;
  else routeSelect.value = '__all';
}

// ===== NUEVO: Inicialización y lógica de filtros avanzados =====
function initBusAdvancedFilters() {
  var typeSel = document.getElementById('bus-type-filter');
  var techSel = document.getElementById('bus-tech-filter');
  var yearSel = document.getElementById('bus-year-filter');
  var speedMinInput = document.getElementById('bus-speed-min');
  var speedMaxInput = document.getElementById('bus-speed-max');

  if (typeSel) {
    typeSel.addEventListener('change', function() { BUS_FILTERS.type = this.value; if (typeof renderBuses === 'function') renderBuses(); });
  }
  if (techSel) {
    techSel.addEventListener('change', function() { BUS_FILTERS.tech = this.value; if (typeof renderBuses === 'function') renderBuses(); });
  }
  if (yearSel) {
    yearSel.addEventListener('change', function() { BUS_FILTERS.year = this.value; if (typeof renderBuses === 'function') renderBuses(); });
  }
  if (speedMinInput) {
    speedMinInput.addEventListener('input', function() { BUS_FILTERS.speedMin = Number(this.value) || 0; if (typeof renderBuses === 'function') renderBuses(); });
  }
  if (speedMaxInput) {
    speedMaxInput.addEventListener('input', function() { BUS_FILTERS.speedMax = Number(this.value) || 999; if (typeof renderBuses === 'function') renderBuses(); });
  }
}

function testBusAgainstFilters(bus) {
  if (BUS_FILTERS.type !== '__all' && bus.type !== BUS_FILTERS.type) return false;
  if (BUS_FILTERS.tech !== '__all' && bus.tech !== BUS_FILTERS.tech) return false;
  if (BUS_FILTERS.year !== '__all' && String(bus.year) !== String(BUS_FILTERS.year)) return false;
  var speed = bus.speed === null ? 0 : bus.speed;
  if (speed < BUS_FILTERS.speedMin || speed > BUS_FILTERS.speedMax) return false;
  return true;
}
// ===== FIN NUEVO =====

function switchTab(tab) {
  var meta = {
    resumen: ['Resumen del sistema', 'Panel General', 'Análisis Global'],
    buses: ['Monitoreo en línea', 'Buses en vivo', 'Flota'],
    ruta: ['Análisis por servicio', 'Detalle de Trazado', 'Recorrido'],
    paradero: ['Planificación por parada', 'Detalle de Parada', 'Paradero'],
    parametros: ['Monitoreo de parámetros', 'Indicadores de Calidad', 'Parámetros'],
    simulacion: ['Simulación por horario', 'Buses estimados', 'Estimación'],
    comparar: ['Cambios en el tiempo', 'Comparar fechas', 'Comparación']
  };

  document.querySelectorAll('.tab-btn[data-tab]').forEach(function (button) {
    button.classList.toggle('active', button.getAttribute('data-tab') === tab);
  });

  ['resumen', 'buses', 'ruta', 'paradero', 'parametros', 'simulacion', 'comparar'].forEach(function (name) {
    var panel = document.getElementById('tab-' + name);
    if (panel) panel.style.display = name === tab ? 'block' : 'none';
  });

  var title = document.getElementById('page-title');
  var eyebrow = document.getElementById('page-eyebrow');
  var panelTitle = document.getElementById('context-panel-title');
  if (title) title.textContent = (meta[tab] || ['', tab, ''])[1];
  if (eyebrow) eyebrow.textContent = (meta[tab] || ['', '', ''])[0];
  if (panelTitle) panelTitle.textContent = (meta[tab] || ['', '', tab])[2];
  document.title = (meta[tab] ? meta[tab][1] : 'Mapa Operativo RED') + ' — Mapa Operativo RED';

  if (tab !== 'simulacion' && typeof stopSimAuto === 'function') stopSimAuto();
  if (typeof setMapContext === 'function') setMapContext(tab);

  if (tab === 'resumen') {
    renderOverview();
    if (overviewChart) setTimeout(function () { overviewChart.resize(); }, 80);
  }
}