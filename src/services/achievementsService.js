import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function getUserAchievements() {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${API}/api/achievements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.achievements || [];
}
export async function unlockAchievement(code) {
  const token = localStorage.getItem("token");
  const res = await axios.post(
    `${API}/api/achievements/unlock`,
    { code },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function updateAchievementsBatch(updates) {
  const token = localStorage.getItem("token");
  await axios.post(
    `${API}/api/achievements/update-batch`,
    { updates },
    { headers: { Authorization: `Bearer ${token}` } },
  );
}
