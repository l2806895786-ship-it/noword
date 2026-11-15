import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Home, Play, Volume2 } from 'lucide-react';
import { VocabItem } from '../data/vocabBank';
import { speakEnglishWord, stopSpeaking } from '../utils/audio';

interface ReviewScreenProps {
  words: VocabItem[];
  title?: string;
  onRetryQuizWithWords: (words: VocabItem[]) => void;
  onBackToResult?: () => void;
  onGoHome: () => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  words,
  title = '오답 다시 학습',
  onRetryQuizWithWords,
  onBackToResult,
  onGoHome,
}) => {
  const [index, setIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const currentWord = words[index];

  useEffect(() => {
    if (!currentWord) return;
    const t = window.setTimeout(() => {
      speakEnglishWord(currentWord.word, {
        rate: 0.88,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    }, 150);
    return () => {
      window.clearTimeout(t);
      stopSpeaking();
    };
  }, [currentWord]);

  if (!currentWord) {
    return null;
  }

  const handleSpeak = () => {
    speakEnglishWord(currentWord.word, {
      rate: 0.88,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
  };

  const toggleChecked = () => {
    setCheckedIds((prev) => ({
      ...prev,
      [currentWord.id]: !prev[currentWord.id],
    }));
  };

  const learnedCount = Object.values(checkedIds).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="w-full border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBackToResult && (
              <button
                type="button"
                onClick={onBackToResult}
                aria-label="결과 화면으로 돌아가기"
                className="min-h-[40px] min-w-[40px] -ml-2 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <span className="text-base font-extrabold text-slate-900">{title}</span>
          </div>

          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-600 tabular-nums">
            <span>
              {index + 1}/{words.length}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700">암기 완료 {learnedCount}/{words.length}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-between gap-6">
        {/* Flashcard Study Panel */}
        <section className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>{currentWord.level}</span>
            <span aria-hidden="true">·</span>
            <span>{currentWord.pos}</span>
          </div>

          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
            {currentWord.word}
          </h1>
          <p className="mt-2 text-sm font-mono text-slate-500">{currentWord.phonetic}</p>

          {/* [스피커 다시 듣기] */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`mt-5 min-h-[48px] px-5 py-2.5 rounded-xl border text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
              isSpeaking
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100'
            }`}
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
            <span>스피커 다시 듣기</span>
          </button>

          {/* Meaning & Example */}
          <div className="w-full mt-6 pt-6 border-t border-slate-100 flex flex-col items-center">
            <p className="text-xs font-semibold text-slate-400">한국어 뜻</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{currentWord.meaning}</p>

            <div className="w-full mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left">
              <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
                {currentWord.example}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600">{currentWord.exampleKo}</p>
            </div>
          </div>

          {/* Learned Check Button */}
          <button
            type="button"
            onClick={toggleChecked}
            className={`mt-5 min-h-[44px] px-4 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer ${
              checkedIds[currentWord.id]
                ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 ${
                checkedIds[currentWord.id] ? 'text-emerald-600' : 'text-slate-400'
              }`}
            />
            <span>{checkedIds[currentWord.id] ? '외웠어요 체크됨' : '이 단어 외웠어요'}</span>
          </button>
        </section>

        {/* Bottom Navigation & Re-quiz CTA */}
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => setIndex((prev) => Math.max(0, prev - 1))}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전 단어</span>
            </button>
            <button
              type="button"
              disabled={index === words.length - 1}
              onClick={() => setIndex((prev) => Math.min(words.length - 1, prev + 1))}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer"
            >
              <span>다음 단어</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRetryQuizWithWords(words)}
            className="w-full min-h-[52px] px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-base font-bold shadow-md shadow-blue-600/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>이 단어들로 다시 퀴즈 풀기</span>
          </button>

          <button
            type="button"
            onClick={onGoHome}
            className="w-full min-h-[44px] px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>처음으로</span>
          </button>
        </section>
      </main>
    </div>
  );
};
