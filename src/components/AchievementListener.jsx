import { useEffect, useState } from "react";
import tToast from "../lib/tToast";

export default function AchievementListener() {
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    const unlock = () => {
      const audio = new Audio("/unlock.mp3");
      audio.volume = 0;
      audio.play().then(() => {
        audio.pause();
        setAudioUnlocked(true);
      }).catch(() => {});
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const handleAchievements = (e) => {
      const newAchievements = e.detail || [];
      if (!newAchievements.length) return;

      newAchievements.forEach((a, i) => {
        setTimeout(() => {
          const audio = new Audio("/unlock.mp3");
          audio.volume = 0.7;
          if (audioUnlocked) audio.play().catch(() => {});

          tToast.success(
            `🏆 ${a.title_ua || "Досягнення"}`,
            `🏆 ${a.title_en || "Achievement"}`
          );
        }, i * 1200);
      });

      window.dispatchEvent(new Event("achievementUpdated"));
    };

    window.addEventListener("achievementUnlocked", handleAchievements);
    return () => window.removeEventListener("achievementUnlocked", handleAchievements);
  }, [audioUnlocked]);

  return null;
}
