/**
 * 집회 참가 접수 - Google Apps Script 백엔드
 * -----------------------------------------------------------------------------
 * 역할
 *   - 접수 폼(index.html)에서 POST 로 보낸 신청을 스프레드시트에 한 줄씩 추가
 *   - 관리자 화면(admin.html)에서 JSONP(GET)로 요청하면 전체 목록을 돌려줌
 *
 * 설치 방법은 같은 폴더의 README.md 참고.
 * -----------------------------------------------------------------------------
 */

/** 관리자 암호 — assets/config.js 의 adminPass 와 반드시 똑같이 맞추세요. */
var ADMIN_PASS = '2618';

/** 데이터를 기록할 시트 이름 (없으면 자동 생성) */
var SHEET_NAME = '접수';

/** 열 순서 정의 — [저장키, 표시 헤더]. 순서를 바꾸면 기존 데이터와 어긋나니 주의. */
var FIELDS = [
  ['submittedAt',    '접수시각'],
  ['name',           '이름'],
  ['adults',         '동반성인'],
  ['kids',           '동반어린이'],
  ['companions',     '동반합계'],
  ['companionNames', '동반자이름'],
  ['totalCount',     '총원'],
  ['schedules',      '참석일정'],
  ['scheduleIds',    '일정ID'],
  ['meals',          '식사내역'],
  ['mealTotal',      '식사합계'],
  ['lodging',        '숙박내역'],
  ['lodgingTotal',   '숙박합계'],
  ['transport',      '차량'],
  ['departure',      '출발지'],
  ['notes',          '기타'],
];

/* ========================================================================= */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    if (body.action !== 'add' || !body.data) {
      return json({ ok: false, error: 'bad request' });
    }
    appendRow(body.data);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  var callback = p.callback;

  if (p.action === 'list') {
    if (String(p.pass) !== String(ADMIN_PASS)) {
      return reply({ ok: false, error: 'unauthorized' }, callback);
    }
    return reply({ ok: true, rows: readRows() }, callback);
  }

  return reply({ ok: true, message: '집회 참가 접수 API 정상 동작 중' }, callback);
}

/* ------------------------------------------------------------------------- */

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(FIELDS.map(function (f) { return f[1]; }));
    sh.setFrozenRows(1);
  }
  return sh;
}

function appendRow(data) {
  var sh = sheet_();
  var row = FIELDS.map(function (f) {
    var v = data[f[0]];
    return (v === undefined || v === null) ? '' : v;
  });
  sh.appendRow(row);
}

function readRows() {
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, FIELDS.length).getValues();
  return values.map(function (r) {
    var o = {};
    FIELDS.forEach(function (f, i) {
      var v = r[i];
      if (f[0] === 'submittedAt' && v instanceof Date) v = v.toISOString();
      o[f[0]] = v;
    });
    return o;
  });
}

/* ------------------------------------------------------------------------- */

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** callback 이 있으면 JSONP, 없으면 순수 JSON */
function reply(obj, callback) {
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(obj) + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json(obj);
}
