import { useCallback, useEffect, useState } from 'react';
import { GameScreen, AnsweredRecord } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { SheetSetupModal } from './components/SheetSetupModal';
import { StartScreen } from './components/StartScreen';
import {
  CefrLevel,
  QuizQuestion,
  VOCAB_BANK,
  VocabItem,
  generateQuizRound,
} from './data/vocabBank';
import {
  SheetLogPayload,
  SheetSyncStatus,
  formatKoreaTimestamp,
  getAppsScriptUrl,
  getStudentPlayCount,
  incrementStudentPlayCount,
  loadStudentName,
  logGameResultToSheet,
  saveStudentName,
} from './utils/sheetLogger';

type AppScreen = 'START' | 'GAME' | 'RESULT' | 'REVIEW';

const STORAGE_WRONG_KEY = 'noword_wrong_ids_v1';
const STORAGE_BEST_KEY = 'noword_best_score_v1';

function loadSavedWrongWords(): VocabItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_WRONG_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw) as string[];
    return VOCAB_BANK.filter((item) => ids.includes(item.id));
  } catch {
    return [];
  }
}

function loadBestScore(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_BEST_KEY);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('START');
  const [studentName, setStudentName] = useState<string>(() => loadStudentName());
  const [levelFilter, setLevelFilter] = useState<'ALL' | CefrLevel>('ALL');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [sessionId, setSessionId] = useState(0);

  const [lastScore, setLastScore] = useState(0);
  const [lastRecords, setLastRecords] = useState<AnsweredRecord[]>([]);
  const [lastPlayCount, setLastPlayCount] = useState(0);
  const [lastLogPayload, setLastLogPayload] = useState<SheetLogPayload | null>(null);

  const [sheetSyncStatus, setSheetSyncStatus] = useState<SheetSyncStatus>('idle');
  const [sheetErrorMsg, setSheetErrorMsg] = useState<string | null>(null);
  const [hasSheetConfigured, setHasSheetConfigured] = useState<boolean>(() => Boolean(getAppsScriptUrl()));
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);

  const [reviewWords, setReviewWords] = useState<VocabItem[]>([]);
  const [cameFromResult, setCameFromResult] = useState(false);

  const [savedWrongWords, setSavedWrongWords] = useState<VocabItem[]>(() => loadSavedWrongWords());
  const [bestScore, setBestScore] = useState<number | null>(() => loadBestScore());

  useEffect(() => {
    try {
      const ids = savedWrongWords.map((w) => w.id);
      localStorage.setItem(STORAGE_WRONG_KEY, JSON.stringify(ids));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedWrongWords]);

  const handleStudentNameChange = useCallback((nextName: string) => {
    setStudentName(nextName);
    saveStudentName(nextName);
  }, []);

  const syncPayloadToSheet = useCallback(async (payload: SheetLogPayload) => {
    setSheetSyncStatus('sending');
    setSheetErrorMsg(null);
    const result = await logGameResultToSheet(payload);
    setSheetSyncStatus(result.status);
    if (!result.ok && result.message) {
      setSheetErrorMsg(result.message);
    }
  }, []);

  const startFreshGame = useCallback(() => {
    const cleanName = studentName.trim();
    if (cleanName) {
      saveStudentName(cleanName);
    }
    const round = generateQuizRound(levelFilter, 10);
    setQuestions(round);
    setIsRetryMode(false);
    setSessionId((prev) => prev + 1);
    setScreen('GAME');
  }, [levelFilter, studentName]);

  const startRetryQuiz = useCallback(
    (words: VocabItem[]) => {
      const round = generateQuizRound(levelFilter, words.length, words);
      setQuestions(round);
      setIsRetryMode(true);
      setSessionId((prev) => prev + 1);
      setScreen('GAME');
    },
    [levelFilter]
  );

  const handleGameFinish = useCallback(
    (finalScore: number, records: AnsweredRecord[]) => {
      setLastScore(finalScore);
      setLastRecords(records);

      if (!isRetryMode) {
        setBestScore((prev) => {
          const next = prev === null ? finalScore : Math.max(prev, finalScore);
          try {
            localStorage.setItem(STORAGE_BEST_KEY, String(next));
          } catch {
            // Ignore storage errors
          }
          return next;
        });
      }

      const missedIds = new Set(records.filter((r) => !r.isCorrect).map((r) => r.question.target.id));
      const masteredIds = new Set(records.filter((r) => r.isCorrect).map((r) => r.question.target.id));

      setSavedWrongWords((prev) => {
        const nextMap = new Map<string, VocabItem>();
        prev.forEach((w) => {
          if (!masteredIds.has(w.id)) {
            nextMap.set(w.id, w);
          }
        });
        records.forEach((r) => {
          if (missedIds.has(r.question.target.id)) {
            nextMap.set(r.question.target.id, r.question.target);
          }
        });
        return Array.from(nextMap.values());
      });

      const cleanName = studentName.trim() || '익명';
      const nextPlayCount = incrementStudentPlayCount(cleanName);
      const correctCount = records.filter((r) => r.isCorrect).length;
      const wrongCount = records.length - correctCount;

      setLastPlayCount(nextPlayCount);
      const payload: SheetLogPayload = {
        timestamp: formatKoreaTimestamp(),
        name: cleanName,
        play_count: nextPlayCount,
        correct_count: correctCount,
        wrong_count: wrongCount,
      };
      setLastLogPayload(payload);
      setScreen('RESULT');

      // Log asynchronously to Google Sheet via Apps Script Web App
      void syncPayloadToSheet(payload);
    },
    [isRetryMode, studentName, syncPayloadToSheet]
  );

  const handleOpenResultReview = useCallback(() => {
    const wrongFromSession = lastRecords
      .filter((r) => !r.isCorrect)
      .map((r) => r.question.target);
    const wordsToStudy =
      wrongFromSession.length > 0
        ? wrongFromSession
        : lastRecords.map((r) => r.question.target);

    setReviewWords(wordsToStudy);
    setCameFromResult(true);
    setScreen('REVIEW');
  }, [lastRecords]);

  const handleOpenSavedReview = useCallback(() => {
    if (savedWrongWords.length === 0) return;
    setReviewWords(savedWrongWords);
    setCameFromResult(false);
    setScreen('REVIEW');
  }, [savedWrongWords]);

  const currentPlayCount = getStudentPlayCount(studentName);

  return (
    <>
      {screen === 'GAME' && (
        <GameScreen
          key={sessionId}
          questions={questions}
          isRetryMode={isRetryMode}
          onFinish={handleGameFinish}
          onExit={() => setScreen('START')}
        />
      )}

      {screen === 'RESULT' && (
        <ResultScreen
          studentName={studentName.trim() || '익명'}
          playCount={lastPlayCount}
          score={lastScore}
          records={lastRecords}
          sheetSyncStatus={sheetSyncStatus}
          sheetErrorMessage={sheetErrorMsg}
          onRetrySheetSync={() => {
            if (lastLogPayload) {
              void syncPayloadToSheet(lastLogPayload);
            }
          }}
          onOpenSheetSetup={() => setIsSheetModalOpen(true)}
          onStartWrongReview={handleOpenResultReview}
          onPlayAgain={startFreshGame}
          onGoHome={() => setScreen('START')}
        />
      )}

      {screen === 'REVIEW' && (
        <ReviewScreen
          words={reviewWords}
          title={cameFromResult && lastRecords.every((r) => r.isCorrect) ? '오늘의 단어 복습' : '오답 다시 학습'}
          onRetryQuizWithWords={startRetryQuiz}
          onBackToResult={cameFromResult ? () => setScreen('RESULT') : undefined}
          onGoHome={() => setScreen('START')}
        />
      )}

      {screen === 'START' && (
        <StartScreen
          studentName={studentName}
          onStudentNameChange={handleStudentNameChange}
          playCountForStudent={currentPlayCount}
          levelFilter={levelFilter}
          onLevelChange={setLevelFilter}
          onStartGame={startFreshGame}
          savedWrongCount={savedWrongWords.length}
          onReviewSavedWrong={handleOpenSavedReview}
          bestScore={bestScore}
          hasSheetConfigured={hasSheetConfigured}
          onOpenSheetSetup={() => setIsSheetModalOpen(true)}
        />
      )}

      <SheetSetupModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        onUrlUpdated={(newUrl) => {
          const configured = Boolean(newUrl.trim() || getAppsScriptUrl());
          setHasSheetConfigured(configured);
          if (configured && screen === 'RESULT' && lastLogPayload && sheetSyncStatus === 'unconfigured') {
            void syncPayloadToSheet(lastLogPayload);
          }
        }}
      />
    </>
  );
}
