import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Send, X } from 'lucide-react';
import {
  GOOGLE_APPS_SCRIPT_SOURCE,
  TARGET_SPREADSHEET_URL,
  formatKoreaTimestamp,
  getAppsScriptUrl,
  logGameResultToSheet,
  saveAppsScriptUrl,
} from '../utils/sheetLogger';

interface SheetSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUrlUpdated: (url: string) => void;
}

export const SheetSetupModal: React.FC<SheetSetupModalProps> = ({
  isOpen,
  onClose,
  onUrlUpdated,
}) => {
  const [urlInput, setUrlInput] = useState(() => getAppsScriptUrl());
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_SOURCE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleSaveUrl = () => {
    saveAppsScriptUrl(urlInput);
    onUrlUpdated(urlInput.trim());
    setSavedNotice(true);
    setTestResult(null);
    window.setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleTestSend = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setTestResult('먼저 Apps Script 웹 앱 URL(/exec)을 입력해 주세요.');
      return;
    }
    setTesting(true);
    setTestResult(null);
    saveAppsScriptUrl(trimmed);
    onUrlUpdated(trimmed);

    const res = await logGameResultToSheet(
      {
        timestamp: formatKoreaTimestamp(),
        name: '테스트 학생',
        play_count: 1,
        correct_count: 8,
        wrong_count: 2,
      },
      trimmed
    );

    setTesting(false);
    if (res.ok) {
      setTestResult('테스트 데이터를 구글 시트에 전송했습니다. 시트에서 새 행을 확인해 보세요.');
    } else {
      setTestResult(`전송 실패: ${res.message || 'URL 및 배포 권한을 확인해 주세요.'}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-setup-title"
    >
      <div className="w-full sm:max-w-2xl max-h-[90vh] bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="sheet-setup-title" className="text-lg font-extrabold text-slate-900">
              구글 시트 연동 & Apps Script
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              저장 열: timestamp · name · play_count · correct_count · wrong_count
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="창 닫기"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Step 1: Sheet Link + Copy Script */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-slate-900">
                1. 구글 시트 확장 프로그램 &gt; Apps Script에 코드 붙여넣기
              </span>
              <a
                href={TARGET_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <span>구글 시트 열기</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="relative rounded-2xl border border-slate-200 bg-slate-900 text-slate-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Code.gs</span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="min-h-[32px] px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>스크립트 복사</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto max-h-52">
                <code>{GOOGLE_APPS_SCRIPT_SOURCE}</code>
              </pre>
            </div>
          </div>

          {/* Step 2: Deploy Instruction */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5 text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900">2. 웹 앱으로 배포 방법</p>
            <p>
              Apps Script 상단 [배포] &gt; [새 배포] &gt; 유형: <strong>웹 앱</strong> · 다음 사용자 권한으로 실행: <strong>나</strong> · 액세스 권한: <strong>모든 사용자</strong> 선택 후 배포하고 생성된 <code>/exec</code> URL을 아래에 입력하세요.
            </p>
          </div>

          {/* Step 3: Webhook URL Input */}
          <div className="space-y-2">
            <label htmlFor="gas-url-input" className="block font-bold text-slate-900">
              3. 배포된 Apps Script 웹 앱 URL
            </label>
            <input
              id="gas-url-input"
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-blue-600"
            />

            <div className="flex items-center gap-2.5 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleSaveUrl}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                {savedNotice ? '저장 완료!' : 'URL 저장'}
              </button>
              <button
                type="button"
                disabled={testing}
                onClick={handleTestSend}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>{testing ? '전송 중...' : '테스트 행 전송'}</span>
              </button>
            </div>

            {testResult && (
              <p className="text-xs font-medium text-slate-700 pt-1">{testResult}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
