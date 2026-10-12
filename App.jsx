import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  Search, Home, LayoutDashboard, MessageSquareText, Film,
  TrendingUp, TrendingDown, Sparkles, AlertTriangle, Clapperboard,
} from "lucide-react";
import { api } from "./services/api.js";

const COLORS = { positive: "#2FBF87", negative: "#E85C4A", neutral: "#C9A66B", gold: "#E8A33D", rani: "#C2185B" };
const SENTIMENT_HI = {
  positive: { label: "सकारात्मक", emoji: "😊", color: COLORS.positive },
  negative: { label: "नकारात्मक", emoji: "😞", color: COLORS.negative },
  neutral: { label: "तटस्थ", emoji: "😐", color: COLORS.neutral },
};

function ClapStripe() {
  return (
    <div
      className="h-2.5 w-full"
      style={{ backgroundImage: `repeating-linear-gradient(-45deg, ${COLORS.gold} 0 14px, #17100f 14px 28px)` }}
    />
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-2xl bg-cinema-card/80 border border-cinema-border p-5 shadow-lg">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${accent}22`, color: accent }}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-cinema-text" style={{ fontFamily: "'Baloo 2', cursive" }}>{value}</div>
      <div className="text-sm text-cinema-muted mt-1">{label}</div>
    </div>
  );
}

function ScoreDial({ score }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 65 ? COLORS.positive : score >= 50 ? COLORS.neutral : COLORS.negative;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r="54" fill="none" stroke="#3A2530" strokeWidth="12" />
      <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 70 70)" />
      <text x="70" y="66" textAnchor="middle" fontSize="30" fontWeight="700" fill="#F5E9DA" fontFamily="'Baloo 2', cursive">{score}</text>
      <text x="70" y="86" textAnchor="middle" fontSize="12" fill="#C9B8AE">/ 100</text>
    </svg>
  );
}

function SentimentPie({ pos, neu, neg }) {
  const data = [
    { name: "सकारात्मक", value: pos, color: COLORS.positive },
    { name: "तटस्थ", value: neu, color: COLORS.neutral },
    { name: "नकारात्मक", value: neg, color: COLORS.negative },
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {data.map((d, i) => <Cell key={i} fill={d.color} />)}
        </Pie>
        <Tooltip contentStyle={{ background: "#1F1418", border: "1px solid #3A2530", borderRadius: 10, color: "#F5E9DA" }} />
        <Legend wrapperStyle={{ color: "#C9B8AE", fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function Loading({ text = "विश्लेषण हो रहा है..." }) {
  return <div className="text-center text-cinema-muted py-10">{text}</div>;
}

function ErrorBox({ message }) {
  return (
    <div className="flex items-center gap-2 text-[#E85C4A] bg-cinema-card border border-cinema-border rounded-xl p-4">
      <AlertTriangle size={18} /> {message}
    </div>
  );
}

function HomePage({ goto }) {
  const [dash, setDash] = useState(null);
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getMovies()])
      .then(([d, m]) => { setDash(d); setMovies(m.movies); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!dash) return <Loading />;

  const top3 = movies.slice(0, 3);

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl border border-cinema-border mb-10">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 20%, rgba(232,163,61,0.18), transparent 55%), radial-gradient(circle at 80% 60%, rgba(194,24,91,0.18), transparent 55%), linear-gradient(160deg, #1B1013, #100A0C)" }} />
        <div className="relative px-6 py-14 sm:px-14 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-cinema-gold mb-4">
            <Clapperboard size={16} /> दर्शकों की असली राय
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-cinema-text mb-4" style={{ fontFamily: "'Baloo 2', cursive" }}>फिल्म भावना विश्लेषण</h1>
          <p className="text-cinema-muted text-base sm:text-lg max-w-2xl mx-auto mb-8">जानिए दर्शकों की राय और तय करें — कौन सी फिल्म देखनी चाहिए!</p>
          <button onClick={() => goto("search")} className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-[#1B1013] shadow-lg" style={{ backgroundColor: COLORS.gold }}>
            <Search size={18} /> फिल्म का विश्लेषण करें
          </button>
        </div>
        <ClapStripe />
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <StatCard icon={<Film size={18} />} label="कुल फिल्में" value={dash.total_movies} accent={COLORS.gold} />
        <StatCard icon={<MessageSquareText size={18} />} label="कुल समीक्षाएँ" value={dash.total_reviews} accent={COLORS.rani} />
        <StatCard icon={<TrendingUp size={18} />} label="सकारात्मक" value={`${dash.positive_pct}%`} accent={COLORS.positive} />
        <StatCard icon={<span>😐</span>} label="तटस्थ" value={`${dash.neutral_pct}%`} accent={COLORS.neutral} />
        <StatCard icon={<TrendingDown size={18} />} label="नकारात्मक" value={`${dash.negative_pct}%`} accent={COLORS.negative} />
        <StatCard icon={<Sparkles size={18} />} label="औसत देखने की सलाह" value={dash.avg_watchability} accent={COLORS.gold} />
      </div>

      <h2 className="text-xl font-bold text-cinema-text mb-4" style={{ fontFamily: "'Baloo 2', cursive" }}>सबसे अधिक पसंद की गई फिल्में</h2>
      <div className="grid sm:grid-cols-3 gap-5">
        {top3.map((m, i) => (
          <button key={m.movie_name} onClick={() => goto("search", m.movie_name)} className="text-left rounded-2xl bg-cinema-card/80 border border-cinema-border p-5 hover:border-cinema-gold transition-colors">
            <div className="text-xs text-[#8A7A72] mb-1">{["🥇", "🥈", "🥉"][i]} रैंक #{i + 1}</div>
            <div className="text-lg font-bold text-cinema-text mb-2" style={{ fontFamily: "'Baloo 2', cursive" }}>{m.movie_name}</div>
            <div>
              <span className="text-2xl font-bold" style={{ color: COLORS.gold }}>{m.watchability_score}</span>
              <span className="text-sm text-cinema-muted"> /100 — {m.recommendation.emoji} {m.recommendation.label}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchPage({ initialMovie }) {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [selectedName, setSelectedName] = useState(initialMovie || null);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => { api.getMovies().then((d) => setMovies(d.movies)).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    if (!selectedName) { setDetail(null); return; }
    setError("");
    api.getMovie(selectedName).then(setDetail).catch((e) => { setError(e.message); setDetail(null); });
  }, [selectedName]);

  const filtered = useMemo(
    () => (query.trim() ? movies.filter((m) => m.movie_name.toLowerCase().includes(query.trim().toLowerCase())) : movies),
    [query, movies]
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-cinema-text mb-6" style={{ fontFamily: "'Baloo 2', cursive" }}>फिल्म खोजें</h2>
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A7A72]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="फिल्म का नाम लिखें..."
          className="w-full rounded-full bg-cinema-card border border-cinema-border pl-11 pr-4 py-3 text-cinema-text placeholder-[#8A7A72] focus:outline-none focus:ring-2 focus:ring-cinema-gold" />
      </div>

      {filtered.length === 0 ? (
        <ErrorBox message="इस नाम की फिल्म डेटासेट में नहीं मिली।" />
      ) : (
        <div className="flex flex-wrap gap-2 mb-8">
          {filtered.map((m) => (
            <button key={m.movie_name} onClick={() => setSelectedName(m.movie_name)}
              className="px-4 py-2 rounded-full text-sm font-medium border"
              style={{
                borderColor: selectedName === m.movie_name ? COLORS.gold : "#3A2530",
                backgroundColor: selectedName === m.movie_name ? "#E8A33D22" : "#1F1418",
                color: selectedName === m.movie_name ? COLORS.gold : "#C9B8AE",
              }}>
              {m.movie_name}
            </button>
          ))}
        </div>
      )}

      {!selectedName && <ErrorBox message="कृपया पहले कोई फिल्म चुनें।" />}
      {error && <ErrorBox message={error} />}

      {detail && (
        <div className="rounded-3xl bg-cinema-card/80 border border-cinema-border overflow-hidden">
          <ClapStripe />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-cinema-text" style={{ fontFamily: "'Baloo 2', cursive" }}>{detail.movie_name}</h2>
                <div className="text-sm text-[#8A7A72] mt-1">{detail.total_reviews} समीक्षाओं के आधार पर</div>
                <div className="text-sm font-semibold mt-2" style={{ color: COLORS.gold }}>{detail.recommendation.emoji} {detail.recommendation.label}</div>
              </div>
              <ScoreDial score={detail.watchability_score} />
            </div>
            <div className="rounded-xl bg-[#150C10] border border-cinema-border p-3 text-xs text-[#8A7A72] mb-6">
              देखने की सलाह का स्कोर समीक्षाओं के भावनात्मक विश्लेषण के आधार पर तैयार किया गया है। यह फिल्म की वस्तुनिष्ठ गुणवत्ता का प्रतिनिधित्व नहीं करता।
            </div>
            <SentimentPie pos={detail.positive_pct} neu={detail.neutral_pct} neg={detail.negative_pct} />
            <h3 className="text-lg font-bold text-cinema-text my-3" style={{ fontFamily: "'Baloo 2', cursive" }}>कुछ नमूना समीक्षाएँ</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {detail.sample_reviews.map((r, i) => (
                <div key={i} className="rounded-xl bg-[#150C10] border border-cinema-border p-3 flex items-start justify-between gap-3">
                  <p className="text-sm text-[#E7D9CE] line-clamp-2">{r.text}</p>
                  <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: `${SENTIMENT_HI[r.sentiment].color}22`, color: SENTIMENT_HI[r.sentiment].color }}>
                    {SENTIMENT_HI[r.sentiment].emoji} {SENTIMENT_HI[r.sentiment].label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const [movies, setMovies] = useState([]);
  const [dash, setDash] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.getMovies(), api.getDashboard()])
      .then(([m, d]) => { setMovies(m.movies); setDash(d); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!dash) return <Loading />;

  const m = dash.model_metrics;
  const barData = movies.map((mv) => ({ name: mv.movie_name, स्कोर: mv.watchability_score }));

  return (
    <div>
      <h2 className="text-2xl font-bold text-cinema-text mb-6" style={{ fontFamily: "'Baloo 2', cursive" }}>फिल्म विश्लेषण डैशबोर्ड</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard icon={<Film size={18} />} label="कुल फिल्में" value={dash.total_movies} accent={COLORS.gold} />
        <StatCard icon={<MessageSquareText size={18} />} label="कुल समीक्षाएँ" value={dash.total_reviews} accent={COLORS.rani} />
        <StatCard icon={<span>😊</span>} label="सकारात्मक समीक्षाएँ" value={dash.positive_count} accent={COLORS.positive} />
        <StatCard icon={<span>😐</span>} label="तटस्थ समीक्षाएँ" value={dash.neutral_count} accent={COLORS.neutral} />
        <StatCard icon={<span>😞</span>} label="नकारात्मक समीक्षाएँ" value={dash.negative_count} accent={COLORS.negative} />
        <StatCard icon={<Sparkles size={18} />} label="औसत देखने की सलाह" value={dash.avg_watchability} accent={COLORS.gold} />
      </div>

      <div className="rounded-2xl bg-cinema-card/80 border border-cinema-border p-5 mb-8">
        <h3 className="text-sm font-semibold text-cinema-text mb-3">फिल्मों के अनुसार देखने की सलाह स्कोर</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3A2530" />
            <XAxis dataKey="name" tick={{ fill: "#C9B8AE", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fill: "#C9B8AE", fontSize: 11 }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: "#1F1418", border: "1px solid #3A2530", borderRadius: 10, color: "#F5E9DA" }} />
            <Bar dataKey="स्कोर" fill={COLORS.gold} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {m && (
        <div className="rounded-2xl bg-cinema-card/80 border border-cinema-border p-5">
          <h3 className="text-sm font-semibold text-cinema-text mb-3">मॉडल प्रदर्शन (TF-IDF + Logistic Regression)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
            <div><div className="text-xs text-[#8A7A72]">सटीकता</div><div className="text-xl font-bold text-cinema-text">{(m.accuracy * 100).toFixed(1)}%</div></div>
            <div><div className="text-xs text-[#8A7A72]">Precision</div><div className="text-xl font-bold text-cinema-text">{(m.precision * 100).toFixed(1)}%</div></div>
            <div><div className="text-xs text-[#8A7A72]">Recall</div><div className="text-xl font-bold text-cinema-text">{(m.recall * 100).toFixed(1)}%</div></div>
            <div><div className="text-xs text-[#8A7A72]">F1 Score</div><div className="text-xl font-bold text-cinema-text">{(m.f1_score * 100).toFixed(1)}%</div></div>
          </div>
          <div className="text-xs text-[#8A7A72]">प्रशिक्षण सेट: {m.train_size} · परीक्षण सेट: {m.test_size} — weak-supervision लेबल पर आधारित।</div>
        </div>
      )}
    </div>
  );
}

function PredictPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleCheck = async () => {
    if (!text.trim()) { setError("कृपया अपनी समीक्षा लिखें।"); setResult(null); return; }
    setError("");
    try {
      const r = await api.predict(text.trim());
      setResult(r);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-cinema-text mb-2 text-center" style={{ fontFamily: "'Baloo 2', cursive" }}>अपनी समीक्षा लिखें</h2>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5}
        placeholder="फिल्म के बारे में अपनी राय यहाँ लिखें..."
        className="w-full rounded-2xl bg-cinema-card border border-cinema-border p-4 text-cinema-text placeholder-[#8A7A72] focus:outline-none focus:ring-2 focus:ring-cinema-gold mb-3" />
      {error && <ErrorBox message={error} />}
      <div className="flex justify-center my-6">
        <button onClick={handleCheck} className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-semibold text-[#1B1013]" style={{ backgroundColor: COLORS.gold }}>
          <Sparkles size={18} /> भावना जांचें
        </button>
      </div>
      {result && (
        <div className="rounded-2xl bg-cinema-card/80 border border-cinema-border p-6 text-center">
          <div className="text-xs uppercase tracking-widest text-[#8A7A72] mb-2">भावना</div>
          <div className="text-3xl font-bold mb-3" style={{ color: SENTIMENT_HI[result.sentiment].color, fontFamily: "'Baloo 2', cursive" }}>
            {result.sentiment_hindi} {SENTIMENT_HI[result.sentiment].emoji}
          </div>
          <div className="text-xs uppercase tracking-widest text-[#8A7A72] mb-1">विश्वास स्तर</div>
          <div className="text-2xl font-bold text-cinema-text mb-4">{Math.round(result.confidence * 100)}%</div>
          <p className="text-sm text-cinema-muted">आपकी समीक्षा {result.sentiment_hindi} भावना दर्शाती है।</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [pickedMovie, setPickedMovie] = useState(null);
  const goto = (p, movieName) => { setPage(p); if (movieName) setPickedMovie(movieName); };

  const navItems = [
    { id: "home", label: "होम", icon: <Home size={16} /> },
    { id: "search", label: "फिल्म खोजें", icon: <Search size={16} /> },
    { id: "dashboard", label: "डैशबोर्ड", icon: <LayoutDashboard size={16} /> },
    { id: "predict", label: "समीक्षा जांचें", icon: <MessageSquareText size={16} /> },
  ];

  return (
    <div className="min-h-screen w-full bg-cinema-bg">
      <nav className="sticky top-0 z-20 backdrop-blur-md bg-cinema-bg/85 border-b border-cinema-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cinema-text font-bold" style={{ fontFamily: "'Baloo 2', cursive" }}>
            <Clapperboard size={20} style={{ color: COLORS.gold }} /> फिल्म भावना विश्लेषण
          </div>
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setPage(item.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap"
                style={{ color: page === item.id ? "#1B1013" : "#C9B8AE", backgroundColor: page === item.id ? COLORS.gold : "transparent" }}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {page === "home" && <HomePage goto={goto} />}
        {page === "search" && <SearchPage initialMovie={pickedMovie} />}
        {page === "dashboard" && <DashboardPage />}
        {page === "predict" && <PredictPage />}
      </main>
      <footer className="text-center text-xs text-[#8A7A72] py-8">
        डेटा स्रोत: Hindi Movie Reviews Dataset · भावना TF-IDF + Logistic Regression मॉडल द्वारा निर्धारित
      </footer>
    </div>
  );
}
