/**
 * No word (초등 5학년 영어 단어 게임) — Google Sheets 학습 기록 저장 스크립트
 * 대상 스프레드시트 ID: 1Sk7E4T2mM47ibF0CZ3aL4gB8I2O492c3zkViFWbOx90
 * 저장 열: timestamp | name | play_count | correct_count | wrong_count
 */

var SPREADSHEET_ID = '1Sk7E4T2mM47ibF0CZ3aL4gB8I2O492c3zkViFWbOx90';
var SHEET_NAME = ''; // 비워 두면 첫 번째 시트를 사용합니다. 특정 시트 탭 이름을 지정하려면 입력하세요.
var HEADERS = ['timestamp', 'name', 'play_count', 'correct_count', 'wrong_count'];

function getTargetSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME || 'Sheet1');
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: 'ok',
      message: 'No word Google Sheet Logger is running.',
      columns: HEADERS,
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var timestamp =
      payload.timestamp ||
      Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    var name = String(payload.name || '익명').trim();
    var playCount = Number(payload.play_count || 1);
    var correctCount = Number(payload.correct_count || 0);
    var wrongCount = Number(payload.wrong_count || 0);

    var sheet = getTargetSheet_();
    sheet.appendRow([timestamp, name, playCount, correctCount, wrongCount]);

    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'ok',
        saved: {
          timestamp: timestamp,
          name: name,
          play_count: playCount,
          correct_count: correctCount,
          wrong_count: wrongCount,
        },
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({
        status: 'error',
        message: err && err.message ? err.message : String(err),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
