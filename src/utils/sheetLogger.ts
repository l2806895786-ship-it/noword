export const TARGET_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1Sk7E4T2mM47ibF0CZ3aL4gB8I2O492c3zkViFWbOx90/edit?usp=sharing';

export const TARGET_SPREADSHEET_ID = '1Sk7E4T2mM47ibF0CZ3aL4gB8I2O492c3zkViFWbOx90';

const STORAGE_NAME_KEY = 'noword_student_name_v1';
const STORAGE_PLAY_COUNTS_KEY = 'noword_play_counts_v1';
const STORAGE_GAS_URL_KEY = 'noword_gas_webhook_url_v1';

export interface SheetLogPayload {
  timestamp: string;
  name: string;
  play_count: number;
  correct_count: number;
  wrong_count: number;
}

export type SheetSyncStatus = 'idle' | 'sending' | 'success' | 'unconfigured' | 'error';

export const GOOGLE_APPS_SCRIPT_SOURCE = `/**
 * No word (초등 5학년 영어 단어 게임) — Google Sheets 학습 기록 저장 스크립트
 * 대상 스프레드시트 ID: 1Sk7E4T2mM47ibF0CZ3aL4gB8I2O492c3zkViFWbOx90
 * 저장 열: timestamp | name | play_count | correct_count | wrong_count
 */

var SPREADSHEET_ID = '1Sk7E4T2mM47ibF0CZ3aL4gB8I2O492c3zkViFWbOx90';
var SHEET_NAME = ''; // 비워 두면 첫 번째 시트를 사용합니다.
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
    JSON.stringify({ status: 'ok', columns: HEADERS })
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
}`;

export function loadStudentName(): string {
  try {
    return localStorage.getItem(STORAGE_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStudentName(name: string): void {
  try {
    localStorage.setItem(STORAGE_NAME_KEY, name);
  } catch {
    // Ignore storage errors
  }
}

function loadPlayCountMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_PLAY_COUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function getStudentPlayCount(name: string): number {
  const key = name.trim().toLowerCase();
  if (!key) return 0;
  const map = loadPlayCountMap();
  return map[key] || 0;
}

export function incrementStudentPlayCount(name: string): number {
  const key = name.trim().toLowerCase();
  if (!key) return 1;
  const map = loadPlayCountMap();
  const next = (map[key] || 0) + 1;
  map[key] = next;
  try {
    localStorage.setItem(STORAGE_PLAY_COUNTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }
  return next;
}

export function getAppsScriptUrl(): string {
  try {
    const localUrl = localStorage.getItem(STORAGE_GAS_URL_KEY)?.trim();
    if (localUrl) return localUrl;
  } catch {
    // Ignore storage errors
  }
  const envUrl = (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string | undefined)?.trim();
  return envUrl || '';
}

export function saveAppsScriptUrl(url: string): void {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_GAS_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_GAS_URL_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function formatKoreaTimestamp(date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
    return parts.replace('T', ' ');
  } catch {
    return date.toISOString();
  }
}

export async function logGameResultToSheet(
  payload: SheetLogPayload,
  overrideUrl?: string
): Promise<{ ok: boolean; status: SheetSyncStatus; message?: string }> {
  const url = (overrideUrl ?? getAppsScriptUrl()).trim();
  if (!url) {
    return { ok: false, status: 'unconfigured', message: 'Apps Script 웹 앱 URL이 설정되지 않았습니다.' };
  }

  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      ok: false,
      status: 'error',
      message: '구글 시트 주소가 아닌 Apps Script 배포 URL(/exec)을 입력해야 합니다.',
    };
  }

  if (!url.startsWith('https://script.google.com/') || !url.endsWith('/exec')) {
    return {
      ok: false,
      status: 'error',
      message: 'https://script.google.com/.../exec 형식의 배포 URL인지 확인해 주세요.',
    };
  }

  try {
    // Use text/plain to avoid CORS OPTIONS preflight against Google Apps Script Web App
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      try {
        const data = (await response.json()) as { status?: string; message?: string };
        if (data.status === 'error') {
          return { ok: false, status: 'error', message: data.message || '시트 저장 오류' };
        }
      } catch {
        // Opaque or non-JSON response still succeeded
      }
      return { ok: true, status: 'success' };
    }

    return { ok: false, status: 'error', message: `HTTP ${response.status}` };
  } catch {
    // Fallback to no-cors so Google Apps Script redirect still receives the POST body
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });
      return { ok: true, status: 'success' };
    } catch (err) {
      return {
        ok: false,
        status: 'error',
        message: err instanceof Error ? err.message : '네트워크 오류',
      };
    }
  }
}
