import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import tToast from "../lib/tToast";
import { API_URL } from "../lib/apiClient";

export default function TestPage() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ua";

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [explanations, setExplanations] = useState({});
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const secondsPerQuestion = 120;
  const [secondsLeft, setSecondsLeft] = useState(null);
  const timerRef = useRef(null);

  
  useEffect(() => {
    const unlock = () => {
      const audio = new Audio("/unlock.mp3");
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            console.log("Audio context unlocked (TestPage)");
            setAudioUnlocked(true);
          })
          .catch((err) => console.warn("⚠️ Unlock failed:", err.message));
      }
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  
  useEffect(() => {
    const saved = localStorage.getItem(`explanations_${id}`);
    if (saved) setExplanations(JSON.parse(saved));
  }, [id]);

  useEffect(() => {
    if (Object.keys(explanations).length > 0)
      localStorage.setItem(`explanations_${id}`, JSON.stringify(explanations));
  }, [explanations, id]);

  
  useEffect(() => {
    const loadTest = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_URL}/api/tests/${id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            tToast.error(
              "⛔ Спочатку увійдіть у свій акаунт",
              "⛔ Please sign in first"
            );
          } else if (res.status === 403) {
            tToast.error(
              "💳 Спочатку оплатіть тест",
              "💳 Please purchase the test first"
            );
            
            setTimeout(() => (window.location.href = "/tests"), 1000);
          } else {
            tToast.error(" Помилка доступу", " Access error");
          }

          setTest(null);
          return;
        }


        const data = await res.json();
        if (data.success) setTest(data.test);
      } catch (err) {
        console.error(" Помилка завантаження тесту:", err);
        tToast.error(" Сервер недоступний", " Server unavailable");
      }
    };

    loadTest();
  }, [id]);


  const getText = (item, field) =>
    item?.[`${field}_${lang}`] || item?.[`${field}_ua`] || "";

  const handleSelect = (qId, aId, checked) => {
    setAnswers((prev) => {
      const updated = checked
        ? [...(prev[qId] || []), aId]
        : (prev[qId] || []).filter((x) => x !== aId);
      return { ...prev, [qId]: updated };
    });
  };

  
  const playUnlockSound = () => {
    if (!audioUnlocked) {
      console.warn("⚠️ Audio context not yet unlocked");
      return;
    }
    const audio = new Audio("/unlock.mp3");
    audio.volume = 0.8;
    audio.currentTime = 0;
    audio
      .play()
      .catch((err) => console.warn("⚠️ Sound blocked:", err.message));
  };

  const unlockAchievement = async (code) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const user = jwtDecode(token);
      const userId = user?.id || user?.user_id || user?.email || "guest";

      const res = await fetch(`${API_URL}/api/achievements/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (data.success && data.achievement) {
        const key = `shown-achievement-${userId}-${data.achievement.id}`;

        
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, "true");

          
          window.dispatchEvent(
            new CustomEvent("achievementUnlocked", {
              detail: [data.achievement],
            })
          );

          
          window.dispatchEvent(new Event("achievementUpdated"));
        } else {
          console.log(
            `🟢 Досягнення "${data.achievement.title_ua}" вже показано для користувача ${userId}`
          );
        }
      }
    } catch (err) {
      console.error(" Achievement unlock failed:", err);
    }
  };


  
  const handleSubmit = async () => {
    let correct = 0;

    test.questions.forEach((q) => {
      const correctAnswers = q.answers.filter((a) => a.is_correct).map((a) => a.id);
      const selected = answers[q.id] || [];
      const isRight =
        correctAnswers.length === selected.length &&
        correctAnswers.every((id) => selected.includes(id));
      if (isRight) correct++;
    });

    setScore(correct);
    setSubmitted(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      
      const res = await fetch(`${API_URL}/api/tests/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          testId: test.id,
          score: correct,
          total: test.questions.length,
        }),
      });

      const data = await res.json();

      
      if (data.success && data.newAchievements?.length) {
        window.dispatchEvent(
          new CustomEvent("achievementUnlocked", {
            detail: data.newAchievements,
          })
        );

        
        window.dispatchEvent(new Event("achievementUpdated"));
      }

      
      await unlockAchievement("first_certificate");
      if (correct === test.questions.length)
        await unlockAchievement("no_mistakes");

    } catch (err) {
      console.error(" Помилка при оновленні досягнення:", err);
    }
  };


  const handleExplain = async (q, i) => {
    if (explanations[i]) {
      setExplanations((prev) => ({
        ...prev,
        [i]: { ...prev[i], visible: !prev[i].visible },
      }));
      return;
    }

    const userAnswer = q.answers.find((a) =>
      (answers[q.id] || []).includes(a.id)
    )?.answer_ua;

    try {
      const res = await fetch(`${API_URL}/api/tests/explain-one`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.question_ua,
          options: q.answers.map((a) => a.answer_ua),
          correct: q.answers.find((a) => a.is_correct)?.answer_ua,
          userAnswer,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const cleanUa = data.explanation_ua.replace(/\*\*/g, "").trim();
        const cleanEn = data.explanation_en.replace(/\*\*/g, "").trim();
        setExplanations((prev) => ({
          ...prev,
          [i]: { ua: cleanUa, en: cleanEn, visible: true },
        }));
      } else
        tToast.error(
          " Не вдалося отримати пояснення",
          " Failed to get explanation"
        );
    } catch {
      tToast.error(" Сервер недоступний", " Server unavailable");
    }
  };

  const handleCertificate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token)
        return tToast.error(
          "Спочатку увійди у свій акаунт!",
          "Please sign in first!"
        );

      const res = await fetch(`${API_URL}/api/tests/certificate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          testId: test.id, 
          score,           
          total: test.questions.length, 
        }),
      });


      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificate_${getText(test, "title")}_${new Date().toISOString().slice(0,10)}.pdf`;

      a.click();

      toast.success(
        lang === "ua" ? "🎓 Сертифікат згенеровано!" : "🎓 Certificate generated!"
      );
    } catch {
      tToast.error(
        " Не вдалося згенерувати сертифікат",
        " Failed to generate certificate"
      );
    }
  };

  
  useEffect(() => {
    if (!test) {
      setSecondsLeft(null);
      return;
    }

    const total = (test.questions?.length || 0) * secondsPerQuestion;
    setSecondsLeft(total);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return null;
        if (s <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;

          if (!submitted) {
            tToast.error(
              lang === "ua"
                ? "Час вичерпано — тест автоматично завершено"
                : "Time is up — test auto-submitted"
            );
            handleSubmit();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [test, submitted, lang]);

  useEffect(() => {
    if (submitted && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [submitted]);

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null) return "--:--";
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(totalSeconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!test)
    return (
      <div className="text-center text-white mt-10">
        {lang === "ua" ? "Завантаження..." : "Loading..."}
      </div>
    );

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-800"
      >
        <h1 className="text-3xl font-bold text-green-500 mb-4 text-center">
          {getText(test, "title")}
        </h1>

        <div className="flex items-center justify-center mb-4 gap-3">
          <div className="px-3 py-1 bg-gray-800 text-sm rounded-md border border-gray-700">
            {lang === "ua" ? "Час на питання:" : "Per-question"} 2{" "}
            {lang === "ua" ? "хв" : "min"}
          </div>
          <div className="px-3 py-1 bg-red-700 text-sm rounded-md font-mono">
            {formatTime(secondsLeft)}
          </div>
        </div>

        <p className="mb-6 text-gray-300 text-center">
          {getText(test, "description")}
        </p>

        {!submitted ? (
          <>
            {Array.isArray(test?.questions) && test.questions.length > 0 ? (
              test.questions.map((q, idx) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-gray-800 p-5 rounded-xl mb-5 border border-gray-700 hover:border-green-600 transition"
                >
                  <h3 className="font-semibold mb-3 text-lg">
                    {getText(q, "question")}
                  </h3>

                  {Array.isArray(q.answers) && q.answers.length > 0 ? (
                    q.answers.map((a) => {
                      const selected = (answers[q.id] || []).includes(a.id);
                      return (
                        <label
                          key={a.id}
                          className={`block mb-2 p-2 rounded transition ${
                            selected ? "bg-green-700/20" : "hover:bg-gray-700/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(e) =>
                              handleSelect(q.id, a.id, e.target.checked)
                            }
                            className="mr-2 accent-green-500"
                          />
                          {getText(a, "answer")?.trim() || "(empty option)"}
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-gray-400 italic">
                      {lang === "ua"
                        ? "Варіанти відповідей відсутні"
                        : "No answer options available"}
                    </p>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-center text-gray-400 mt-4">
                {lang === "ua"
                  ? "Питання відсутні або тест недоступний."
                  : "Questions are missing or test unavailable."}
              </p>
            )}


            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg w-full font-semibold transition"
            >
              {lang === "ua" ? "Завершити тест" : "Finish test"}
            </motion.button>
          </>
        ) : (
          <div className="mt-6 space-y-6">
            <h2 className="text-2xl text-green-400 font-semibold text-center">
              {lang === "ua" ? "Результати тесту" : "Test results"}
            </h2>

            {test.questions.map((q, i) => {
              const correctAnswers = q.answers.filter((a) => a.is_correct);
              const userAnswers = q.answers.filter((a) =>
                (answers[q.id] || []).includes(a.id)
              );

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-gray-800 p-5 rounded-xl border border-gray-700"
                >
                  <h3 className="font-semibold mb-2 text-white text-lg">
                    {getText(q, "question")}
                  </h3>

                  <p>
                    <span className="text-gray-400">
                      {lang === "ua" ? "Твої відповіді: " : "Your answers: "}
                    </span>
                    <span>
                      {userAnswers.length ? (
                        userAnswers.map((ua, idx) => (
                          <span
                            key={ua.id}
                            className={
                              ua.is_correct ? "text-green-400" : "text-red-400"
                            }
                          >
                            {getText(ua, "answer") || "—"}
                            {idx < userAnswers.length - 1 ? ", " : ""}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>
                  </p>

                  <p className="text-gray-300 mb-3">
                    <span className="text-gray-400">
                      {lang === "ua"
                        ? "Правильні відповіді: "
                        : "Correct answers: "}
                    </span>
                    <span className="text-green-400">
                      {correctAnswers.map((ca, idx) => (
                        <span key={ca.id}>
                          {getText(ca, "answer")}
                          {idx < correctAnswers.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  </p>

                  <button
                    onClick={() => handleExplain(q, i)}
                    className={`${
                      explanations[i]?.visible
                        ? "bg-green-700 hover:bg-green-800"
                        : "bg-blue-600 hover:bg-blue-700"
                    } px-3 py-2 rounded-lg transition flex items-center gap-2`}
                  >
                    {explanations[i]?.visible
                      ? lang === "ua"
                        ? "🔽 Сховати"
                        : "🔽 Hide"
                      : lang === "ua"
                        ? "🧠 Пояснити це питання"
                        : "🧠 Explain this question"}
                  </button>

                  <AnimatePresence>
                    {explanations[i]?.visible && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="mt-3 bg-gray-900 border border-green-600 p-4 rounded-xl shadow-inner"
                      >
                        <h4 className="text-green-400 font-semibold mb-3">
                          💡 {lang === "ua" ? "Пояснення" : "Explanation"}
                        </h4>

                        {(lang === "ua"
                            ? explanations[i].ua
                            : explanations[i].en || explanations[i].ua
                        )
                          .split(/\n|(?=✅||👉)/)
                          .filter((p) => p.trim())
                          .map((p, j) => (
                            <p key={j} className="mb-2 text-gray-200">
                              {p.trim()}
                            </p>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCertificate}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg w-full font-semibold transition"
            >
              {lang === "ua"
                ? "🎓 Отримати сертифікат"
                : "🎓 Get Certificate"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.reload()}
              className="mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg w-full font-semibold transition"
            >
              {lang === "ua" ? "Пройти ще раз" : "Try again"}
            </motion.button>
          </div>
        )}
      </motion.div>

    </section>
  );
}
