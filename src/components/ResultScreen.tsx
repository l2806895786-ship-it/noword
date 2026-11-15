import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FileSpreadsheet,
  Home,
  Loader2,
  RotateCcw,
  Star,
  Volume2,
} from 'lucide-react';
import { AnsweredRecord } from './GameScreen';
import { VocabItem } from '../data/vocabBank';
import { playCompleteSound, speakEnglishWord } from '../utils/audio';
import { SheetSyncStatus } from '../utils/sheetLogger';

interface ResultScreenProps {
  studentName: string;
  playCount: number;
  score: number;
  records: AnsweredRecord[];
  sheetSyncStatus: SheetSyncStatus;
  sheetErrorMessage?: string | null;
  onRetrySheetSync: () => void;
  onOpenSheetSetup: () => void;
  onStartWrongReview: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  studentName,
  playCount,
  score,
  records,
  sheetSyncStatus,
  sheetErrorMessage,
  onRetrySheetSync,
  onOpenSheetSetup,
  onStartWrongReview,
  onPlayAgain,
  onGoHome,
}) => {
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  const totalCount = records.length;
  const correctCount = records.filter((r) => r.isCorrect).length;
  const wrongCount = totalCount - correctCount;
  const wrongWords: VocabItem[] = records
    .filter((r) => !r.isCorrect)
    .map((r) => r.question.target);

  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  const starCount = accuracy >= 80 ? 3 : accuracy >= 50 ? 2 : 1;

  const feedbackMessage =
    starCount === 3
      ? '훌륭해요! 오늘 단어를 확실하게 익혔네요.'
      : starCount === 2
        ? '좋아요! 틀린 단어만 한 번 더 확인해 볼까요?'
        : '괜찮아요! 오답 다시 학습으로 금방 외울 수 있어요.';

  useEffect(() => {
    playCompleteSound();
  }, []);

  const handlePlayWord = (item: VocabItem) => {
    speakEnglishWord(item.word, {
      rate: 0.9,
      onStart: () => setSpeakingWordId(item.id),
      onEnd: () => setSpeakingWordId((prev) => (prev === item.id ? null : prev)),
    });
  };

  const displayList = wrongWords.length > 0 ? wrongWords : records.map((r) => r.question.target);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Compact Header */}
      <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-lg font-extrabold tracking-tight text-slate-900">No word</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{studentName}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{playCount}회차 학습 결과</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-6 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
        {/* Left / Top Summary Card */}
        <section className="lg:col-span-5 rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center">
          {/* Star Rating (1~3개) */}
          <div className="flex items-center gap-2" aria-label={`별점 3개 중 ${starCount}개`}>
            {[1, 2, 3].map((idx) => {
              const earned = idx <= starCount;
              return (
                <Star
                  key={idx}
                  className={`w-9 h-9 sm:w-10 sm:h-10 transition-transform ${
                    earned
                      ? 'text-amber-400 fill-amber-400 scale-105'
                      : 'text-slate-200 fill-slate-100'
                  }`}
                />
              );
            })}
          </div>

          <p className="mt-4 text-xs font-semibold text-slate-500">총점</p>
          <h1 className="mt-1 text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {score}점
          </h1>

          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700 flex-wrap justify-center">
            <span className="tabular-nums">정답 {correctCount}개</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">오답 {wrongCount}개</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-blue-700">플레이 {playCount}회</span>
          </div>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed">{feedbackMessage}</p>

          {/* Google Sheet Sync Status Box */}
          <div className="w-full mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 text-xs">
              {sheetSyncStatus === 'sending' && (
                <>
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                  <span className="font-medium text-slate-700 truncate">
                    구글 시트에 기록 저장 중...
                  </span>
                </>
              )}
              {sheetSyncStatus === 'success' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-800 truncate">
                    구글 시트에 저장 완료
                  </span>
                </>
              )}
              {sheetSyncStatus === 'unconfigured' && (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-medium text-slate-700 truncate">
                    시트 웹 앱 URL 미설정
                  </span>
                </>
              )}
              {sheetSyncStatus === 'error' && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-medium text-red-700 leading-snug">
                    시트 저장 실패{sheetErrorMessage ? `: ${sheetErrorMessage}` : ''}
                  </span>
                </>
              )}
            </div>

            {sheetSyncStatus === 'unconfigured' && (
              <button
                type="button"
                onClick={onOpenSheetSetup}
                className="text-xs font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                연동 설정
              </button>
            )}
            {sheetSyncStatus === 'error' && (
              <button
                type="button"
                onClick={onRetrySheetSync}
                className="text-xs font-bold text-blue-700 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                다시 전송
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={onStartWrongReview}
              className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-base font-bold shadow-md shadow-blue-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-5 h-5" />
              <span>
                {wrongWords.length > 0
                  ? `오답 다시 학습 (${wrongWords.length}개)`
                  : '오답 다시 학습 (전체 복습)'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onPlayAgain}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>다시 하기</span>
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>처음으로</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right / Bottom Wrong Words List */}
        <section className="lg:col-span-7 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {wrongWords.length > 0 ? '틀린 단어 목록' : '오늘 학습한 단어'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {wrongWords.length > 0
                  ? '스피커를 눌러 틀린 단어의 발음을 바로 다시 들어보세요.'
                  : '모든 문제를 맞혔어요! 오늘 나온 단어를 다시 들어볼 수 있습니다.'}
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 tabular-nums shrink-0">
              {displayList.length}개
            </span>
          </div>

          {wrongWords.length === 0 && (
            <div className="px-5 sm:px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2.5 text-emerald-900 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>틀린 단어가 0개입니다! 완벽한 100점이에요.</span>
            </div>
          )}

          <ul className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
            {displayList.map((item) => {
              const isPlaying = speakingWordId === item.id;
              return (
                <li
                  key={item.id}
                  className="px-5 sm:px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {item.word}
                      </span>
                      <span className="text-xs font-mono text-slate-500">{item.phonetic}</span>
                      <span className="text-xs text-slate-400">{item.pos}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700 mt-0.5">{item.meaning}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayWord(item)}
                    aria-label={`${item.word} 발음 듣기`}
                    className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                      isPlaying
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : 'text-blue-600'}`} />
                    <span className="hidden sm:inline">발음 듣기</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
};
