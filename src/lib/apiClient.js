export async function fetchWithAuth(input, init = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return fetch(input, {
    credentials: "include",
    ...init,
    headers,
  });
}
