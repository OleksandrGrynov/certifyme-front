// src/lib/useAchievementUnlock.js
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";

/**
 * Глобальне розблокування аудіо після першої взаємодії користувача.
 * Викликається автоматично з хука нижче; гарантує, що play() не буде заблоковано.
 */
let audioUnlocked = false;
let audioUnlockBound = false;

function ensureAudioUnlockedOnce() {
  if (audioUnlocked || audioUnlockBound) return;
  audioUnlockBound = true;

  const unlock = () => {
    const a = new Audio("/unlock.mp3");
    a.volume = 0;
    const p = a.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        a.pause();
        a.currentTime = 0;
        audioUnlocked = true;
        // console.log("✅ Audio context unlocked (global)");
      }).catch(() => {
        // Може не розблокуватись з першого разу — це ок.
      });
    }
    window.removeEventListener("pointerdown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
}

/**
 * Відтворити звук розблокування (якщо аудіо вже “розігріте”).
 */
function playUnlockSound() {
  if (!audioUnlocked) return; // уникнути помилки autoplay
  const audio = new Audio("/unlock.mp3");
  audio.volume = 0.8;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

/**
 * Хук для централізованого розблокування досягнень з тостом і звуком.
 * Використання:
 *   const { unlock } = useAchievementUnlock(lang);
 *   await unlock("first_certificate");
 */
export function useAchievementUnlock(lang = "ua") {
  // 1) гарантуємо розігрів аудіо на сторінці, де використовується хук
  if (typeof window !== "undefined") {
    ensureAudioUnlockedOnce();
  }

  const api = "http://localhost:5000"; // лишаю як у твоєму коді для узгодженості

  const unlock = async (code, { dedupePerUser = true } = {}) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      // Дедуплікація показу тосту + звуку (опціонально з урахуванням юзера)
      let userKey = "guest";
      try {
        const u = jwtDecode(token);
        userKey = u?.id || u?.user_id || u?.email || "guest";
      } catch {}

      const shownKey = dedupePerUser
        ? `shown-achievement-${userKey}-${code}`
        : `shown-achievement-${code}`;

      // Викликаємо бекенд — він поставить 100% і поверне об’єкт ачивки
      const res = await fetch(`${api}/api/achievements/unlock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!data?.success || !data?.achievement) return false;

      // Якщо цей тост уже показували — не спамимо
      if (!localStorage.getItem(shownKey)) {
        localStorage.setItem(shownKey, "true");

        toast.success(
          lang === "ua"
            ? `🏆 Досягнення розблоковано: ${data.achievement.title_ua}`
            : `🏆 Achievement unlocked: ${data.achievement.title_en}`,
          {
            style: {
              background: "#111",
              color: "#22c55e",
              border: "1px solid #22c55e",
            },
          }
        );

        playUnlockSound();
        // повідомимо інші сторінки/віджети оновити стейт досягнень
        window.dispatchEvent(new Event("achievementUpdated"));
      }

      return true;
    } catch {
      return false;
    }
  };

  /**
   * Допоміжний апдейтер прогресу пачкою: [{ code, progress }, ...]
   * Можна використовувати для щоденних/серійних ачивок без 100%.
   */
  const updateBatch = async (updates = []) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !Array.isArray(updates) || updates.length === 0) return false;

      const res = await fetch(`${api}/api/achievements/update-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates }),
      });

      const ok = res.ok;
      if (ok) window.dispatchEvent(new Event("achievementUpdated"));
      return ok;
    } catch {
      return false;
    }
  };

  return { unlock, updateBatch };
}
