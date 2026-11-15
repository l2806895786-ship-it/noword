import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Volume2, X, XCircle } from 'lucide-react';
import { QuizQuestion, VocabItem } from '../data/vocabBank';
import {
  isSpeechSupported,
  playCorrectSound,
  playWrongSound,
  speakEnglishWord,
  stopSpeaking,
} from '../utils/audio';

export interface AnsweredRecord {
  question: QuizQuestion;
  selectedOption: VocabItem;
  isCorrect: boolean;
}

interface GameScreenProps {
  questions: QuizQuestion[];
  isRetryMode?: boolean;
  onFinish: (score: number, records: AnsweredRecord[]) => void;
  onExit: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  questions,
  isRetryMode = false,
  onFinish,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showScorePop, setShowScorePop] = useState(false);
  const [records, setRecords] = useState<AnsweredRecord[]>([]);
  const [speechNotice, setSpeechNotice] = useState(false);

  const advanceTimerRef = useRef<number | null>(null);
  const scorePopTimerRef = useRef<number | null>(null);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const isAnswered = selectedId !== null;
  const isCorrectAnswer = selectedId === currentQuestion?.target.id;

  const clearTimers = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (scorePopTimerRef.current !== null) {
      window.clearTimeout(scorePopTimerRef.current);
      scorePopTimerRef.current = null;
    }
  }, []);

  const handleSpeak = useCallback(() => {
    if (!currentQuestion) return;
    const supported = speakEnglishWord(currentQuestion.target.word, {
      rate: 0.9,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
    });
    if (!supported && !isSpeechSupported()) {
      setSpeechNotice(true);
    }
  }, [currentQuestion]);

  // Clean up audio & timers on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      stopSpeaking();
    };
  }, [clearTimers]);

  const advanceToNext = useCallback(
    (nextRecords: AnsweredRecord[], nextScore: number) => {
      clearTimers();
      stopSpeaking();
      setIsSpeaking(false);

      if (currentIndex + 1 >= totalQuestions) {
        onFinish(nextScore, nextRecords);
      } else {
        setSelectedId(null);
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [clearTimers, currentIndex, onFinish, totalQuestions]
  );

  const handleSelectOption = useCallback(
    (option: VocabItem) => {
      if (isAnswered || !currentQuestion) return;

      setSelectedId(option.id);
      const correct = option.id === currentQuestion.target.id;
      const updatedScore = correct ? score + 10 : score;
      const newRecord: AnsweredRecord = {
        question: currentQuestion,
        selectedOption: option,
        isCorrect: correct,
      };
      const updatedRecords = [...records, newRecord];
      setRecords(updatedRecords);

      if (correct) {
        setScore(updatedScore);
        setShowScorePop(true);
        playCorrectSound();
        scorePopTimerRef.current = window.setTimeout(() => {
          setShowScorePop(false);
        }, 900);
      } else {
        playWrongSound();
      }

      const delay = correct ? 1100 : 2100;
      advanceTimerRef.current = window.setTimeout(() => {
        advanceToNext(updatedRecords, updatedScore);
      }, delay);
    },
    [advanceToNext, currentQuestion, isAnswered, records, score]
  );

  // Keyboard shortcuts: 1-4 to pick, R to play audio, Enter/Space to advance if answered
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!currentQuestion) return;
      if (e.key >= '1' && e.key <= '4' && !isAnswered) {
        const idx = Number(e.key) - 1;
        const opt = currentQuestion.options[idx];
        if (opt) handleSelectOption(opt);
      } else if (e.key.toLowerCase() === 'r') {
        handleSpeak();
      } else if ((e.key === 'Enter' || e.key === ' ') && isAnswered) {
        e.preventDefault();
        advanceToNext(records, score);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advanceToNext, currentQuestion, handleSelectOption, handleSpeak, isAnswered, records, score]);

  if (!currentQuestion) return null;

  const progressPercent = ((currentIndex + (isAnswered ? 1 : 0)) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Progress Bar (화면 위쪽 진행 바) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="w-full h-2 bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={totalQuestions}
          />
        </div>

        {/* HUD Bar: 왼쪽 위 문제 번호 (1/10 형식) · 오른쪽 위 점수 (정답당 +10점) */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              aria-label={`현재 문제 ${currentIndex + 1}번 / 전체 ${totalQuestions}문제`}
              className="text-lg font-extrabold text-slate-900 tabular-nums tracking-tight"
            >
              {currentIndex + 1}/{totalQuestions}
            </span>
            <span className="text-xs font-medium text-slate-500">
              {isRetryMode ? '오답 재도전' : '단어 뜻 맞히기'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">점수</span>
              <span className="text-lg font-extrabold text-blue-700 tabular-nums">{score}점</span>
              {showScorePop && (
                <span className="absolute -bottom-6 right-0 text-xs font-extrabold text-emerald-600 tabular-nums animate-bounce whitespace-nowrap">
                  +10점
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                clearTimers();
                stopSpeaking();
                onExit();
              }}
              aria-label="게임 그만하고 처음으로 돌아가기"
              className="min-h-[40px] min-w-[40px] -mr-2 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <main className="flex-1 flex flex-col justify-between max-w-2xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Question Display Area: English Word */}
        <section aria-live="polite" className="flex flex-col items-center text-center">
          <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm px-5 py-8 sm:py-10 flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-3">
              <span>영어 단어 뜻 맞히기 · 정답당 +10점</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              {currentQuestion.target.word}
            </h2>

            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <span className="font-mono">{currentQuestion.target.phonetic}</span>
              <span aria-hidden="true">·</span>
              <span>{currentQuestion.target.pos}</span>
              <span aria-hidden="true">·</span>
              <span>{currentQuestion.target.level}</span>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600">
              아래 4개의 보기 중 알맞은 한국어 뜻을 선택하세요
            </p>
          </div>

          {/* [스피커 다시 듣기] 버튼 (문제 아래) */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`mt-4 min-h-[48px] px-5 py-2.5 rounded-xl border text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              isSpeaking
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Volume2 className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : 'text-blue-600'}`} />
            <span>스피커 다시 듣기</span>
          </button>

          {speechNotice && (
            <p className="mt-2 text-xs text-amber-700">
              이 브라우저에서는 음성 합성이 제한될 수 있습니다.
            </p>
          )}
        </section>

        {/* 4 Korean Meaning Choices Area (Thumb Zone Friendly) */}
        <section className="mt-5 sm:mt-6 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedId === option.id;
              const isTarget = option.id === currentQuestion.target.id;

              let cardClasses =
                'bg-white border-slate-200 text-slate-900 hover:border-blue-400 hover:bg-blue-50/40';
              let numberClasses = 'bg-slate-100 text-slate-600';
              let statusIcon: React.ReactNode = null;

              if (isAnswered) {
                if (isTarget) {
                  cardClasses = 'bg-emerald-50 border-emerald-600 text-emerald-950';
                  numberClasses = 'bg-emerald-600 text-white';
                  statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
                } else if (isSelected && !isTarget) {
                  cardClasses = 'bg-red-50 border-red-600 text-red-950';
                  numberClasses = 'bg-red-600 text-white';
                  statusIcon = <XCircle className="w-5 h-5 text-red-600 shrink-0" />;
                } else {
                  cardClasses = 'bg-slate-100/80 border-slate-200 text-slate-400 opacity-75';
                  numberClasses = 'bg-slate-200 text-slate-400';
                }
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full min-h-[60px] px-4 py-3.5 rounded-2xl border-2 text-left flex items-center justify-between gap-3 transition-all active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                    isAnswered ? 'cursor-default' : 'cursor-pointer'
                  } ${cardClasses}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-lg text-xs font-bold tabular-nums flex items-center justify-center shrink-0 transition-colors ${numberClasses}`}
                    >
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-base font-semibold">
                        {option.meaning}
                      </span>
                      {isAnswered && (
                        <span className="block text-xs text-slate-600 truncate mt-0.5">
                          {option.word}
                        </span>
                      )}
                    </div>
                  </div>
                  {statusIcon}
                </button>
              );
            })}
          </div>

          {/* Instant Feedback Bar (Non-Hue-Only State Signaling) */}
          <div className="min-h-[68px] flex items-center">
            {isAnswered ? (
              <div
                role="status"
                className={`w-full rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 ${
                  isCorrectAnswer
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isCorrectAnswer ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <div className="min-w-0 text-sm">
                    {isCorrectAnswer ? (
                      <p className="font-bold">
                        정답입니다! <span className="tabular-nums">+10점</span>
                      </p>
                    ) : (
                      <p className="font-bold truncate">
                        오답 · 정답: {currentQuestion.target.word} ({currentQuestion.target.meaning})
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => advanceToNext(records, score)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs font-bold inline-flex items-center gap-1 hover:bg-slate-50 shrink-0 cursor-pointer"
                >
                  <span>{currentIndex + 1 >= totalQuestions ? '결과 보기' : '다음'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <p className="w-full text-center text-xs text-slate-400">
                알맞은 한국어 뜻(1~4)을 선택하세요
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
