const BASE = "/api";

async function handle(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "अज्ञात त्रुटि हुई।");
  return data;
}

export const api = {
  getDashboard: () => fetch(`${BASE}/dashboard`).then(handle),
  getMovies: () => fetch(`${BASE}/movies`).then(handle),
  getMovie: (name) => fetch(`${BASE}/movie/${encodeURIComponent(name)}`).then(handle),
  predict: (review) =>
    fetch(`${BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review }),
    }).then(handle),
};
