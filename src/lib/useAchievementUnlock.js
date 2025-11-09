
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { API_URL } from "./apiClient";


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
        
      }).catch(() => {
        
      });
    }
    window.removeEventListener("pointerdown", unlock);
  };

  window.addEventListener("pointerdown", unlock, { once: true });
}


function playUnlockSound() {
  if (!audioUnlocked) return; 
  const audio = new Audio("/public/unlock.mp3");
  audio.volume = 0.8;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}


export function useAchievementUnlock(lang = "ua") {
  
  if (typeof window !== "undefined") {
    ensureAudioUnlockedOnce();
  }

  const api = `${API_URL}`;

  const unlock = async (code, { dedupePerUser = true } = {}) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return false;

      
      let userKey = "guest";
      try {
        const u = jwtDecode(token);
        userKey = u?.id || u?.user_id || u?.email || "guest";
      } catch {}

      const shownKey = dedupePerUser
        ? `shown-achievement-${userKey}-${code}`
        : `shown-achievement-${code}`;

      
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
        
        window.dispatchEvent(new Event("achievementUpdated"));
      }

      return true;
    } catch {
      return false;
    }
  };

  
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
