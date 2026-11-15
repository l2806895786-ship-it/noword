import React, { useState } from 'react';
import {
  BookOpen,
  FileSpreadsheet,
  Headphones,
  Play,
  RotateCcw,
  Sparkles,
  User,
  Volume2,
} from 'lucide-react';
import mascotOwlImg from '../assets/images/noword_mascot_owl_1794751640542.jpg';
import { CefrLevel } from '../data/vocabBank';

interface StartScreenProps {
  studentName: string;
  onStudentNameChange: (name: string) => void;
  playCountForStudent: number;
  levelFilter: 'ALL' | CefrLevel;
  onLevelChange: (level: 'ALL' | CefrLevel) => void;
  onStartGame: () => void;
  savedWrongCount: number;
  onReviewSavedWrong: () => void;
  bestScore: number | null;
  hasSheetConfigured: boolean;
  onOpenSheetSetup: () => void;
}

const LEVEL_OPTIONS: { value: 'ALL' | CefrLevel; label: string }[] = [
  { value: 'ALL', label: '전체 (A1~A2)' },
  { value: 'A1', label: 'A1 기초' },
  { value: 'A2', label: 'A2 도약' },
];

export const StartScreen: React.FC<StartScreenProps> = ({
  studentName,
  onStudentNameChange,
  playCountForStudent,
  levelFilter,
  onLevelChange,
  onStartGame,
  savedWrongCount,
  onReviewSavedWrong,
  bestScore,
  hasSheetConfigured,
  onOpenSheetSetup,
}) => {
  const [imgError, setImgError] = useState(false);
  const [nameError, setNameError] = useState(false);

  const handleStartClick = () => {
    if (!studentName.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Compact Header */}
      <header className="w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-sm tracking-tight">
              NW
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              No word
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden sm:inline text-xs font-medium text-slate-500 whitespace-nowrap">
              초등 5학년 영어 단어 · CEFR A1~A2
            </span>
            <button
              type="button"
              onClick={onOpenSheetSetup}
              className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{hasSheetConfigured ? '시트 연동됨' : '구글 시트 연동'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-5 py-6 sm:py-10">
        <div className="w-full max-w-md lg:max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Mascot & Visual Column (Top on Mobile, Right on Desktop) */}
          <div className="lg:col-span-5 lg:order-2 flex flex-col items-center">
            <div className="w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center p-3">
              {!imgError ? (
                <img
                  src={mascotOwlImg}
                  alt="헤드폰을 쓰고 영어 단어 노트를 들고 있는 No word 부엉이 캐릭터"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain rounded-2xl"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 flex flex-col items-center justify-center gap-3 p-6 text-center">
                  <Headphones className="w-14 h-14 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">No word 학습 캐릭터</span>
                </div>
              )}
            </div>

            {/* Quiet Unboxed Study Info Below Mascot */}
            <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 flex-wrap justify-center">
              <span>오늘의 학습 · 10문제</span>
              <span aria-hidden="true">·</span>
              <span>정답당 +10점</span>
              {bestScore !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-blue-700 font-semibold tabular-nums">최고 {bestScore}점</span>
                </>
              )}
            </div>
          </div>

          {/* Primary Action & Controls Column */}
          <div className="lg:col-span-7 lg:order-1 flex flex-col items-center lg:items-start text-center lg:text-left">
            <p className="text-xs sm:text-sm font-semibold text-blue-700 tracking-tight mb-2">
              초등 5학년을 위한 영어 단어 뜻 맞히기 게임
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight [text-wrap:balance]">
              No word와 함께
              <br />
              단어 10개 끝내기
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
              영어 단어를 보고 4개의 보기에서 알맞은 한국어 뜻을 고르세요. 이름을 입력하면 플레이 횟수와 정답·오답 기록이 저장됩니다.
            </p>

            {/* Student Name Input + Level Selector */}
            <div className="w-full max-w-md mt-6 space-y-4 text-left">
              <div>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <label htmlFor="student-name-input" className="text-xs font-semibold text-slate-700">
                    학생 이름
                  </label>
                  {studentName.trim() && (
                    <span className="text-xs font-semibold text-blue-700 tabular-nums">
                      누적 플레이 {playCountForStudent}회
                    </span>
                  )}
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="student-name-input"
                    type="text"
                    value={studentName}
                    maxLength={24}
                    onChange={(e) => {
                      onStudentNameChange(e.target.value);
                      if (nameError && e.target.value.trim()) {
                        setNameError(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleStartClick();
                      }
                    }}
                    placeholder="이름을 입력하세요 (예: 김민준)"
                    className={`w-full min-h-[50px] pl-10 pr-4 py-2.5 rounded-xl bg-white border text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-2 focus:outline-blue-600 transition-colors ${
                      nameError ? 'border-red-500' : 'border-slate-300'
                    }`}
                  />
                </div>
                {nameError && (
                  <p className="mt-1.5 text-xs font-semibold text-red-600">
                    학습 기록 저장을 위해 먼저 이름을 입력해 주세요.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 px-0.5">
                  <span className="text-xs font-semibold text-slate-700">단어 수준</span>
                  <span className="text-xs text-slate-500">4지선다 한국어 뜻 맞히기</span>
                </div>
                <div
                  role="tablist"
                  aria-label="CEFR 수준 선택"
                  className="grid grid-cols-3 gap-1 p-1 bg-slate-200/75 rounded-xl"
                >
                  {LEVEL_OPTIONS.map((lvl) => {
                    const active = levelFilter === lvl.value;
                    return (
                      <button
                        key={lvl.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onLevelChange(lvl.value)}
                        className={`min-h-[40px] px-2 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Central Primary CTA: [게임 시작] */}
            <div className="w-full max-w-md mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleStartClick}
                className="w-full min-h-[58px] px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xl font-extrabold tracking-tight shadow-md shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>게임 시작</span>
              </button>

              {savedWrongCount > 0 && (
                <button
                  type="button"
                  onClick={onReviewSavedWrong}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span className="tabular-nums">저장된 오답 단어 {savedWrongCount}개 다시 학습</span>
                </button>
              )}
            </div>

            {/* Concise 3-step summary */}
            <div className="w-full max-w-md mt-7 pt-5 border-t border-slate-200 grid grid-cols-3 gap-3 text-left">
              <div className="flex flex-col gap-1">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">단어 & 발음</span>
                <span className="text-[11px] text-slate-500 leading-snug">단어 확인 후 발음 듣기</span>
              </div>
              <div className="flex flex-col gap-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">즉각 피드백</span>
                <span className="text-[11px] text-slate-500 leading-snug">정답 +10점 · 오답 시 뜻 안내</span>
              </div>
              <div className="flex flex-col gap-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">자동 기록</span>
                <span className="text-[11px] text-slate-500 leading-snug">시트에 플레이·정오답 저장</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
