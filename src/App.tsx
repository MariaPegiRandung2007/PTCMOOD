import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
  LayoutDashboard, 
  History, 
  PlusCircle, 
  LogOut, 
  User as UserIcon, 
  Bell, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight,
  BrainCircuit,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subDays, isAfter, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

import { MoodType, MoodEntry, User, MOOD_CONFIG } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = ({ user, onLogout }: { user: User; onLogout: () => void }) => (
  <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <BrainCircuit size={24} />
        </div>
        <span className="font-bold text-xl text-slate-800 tracking-tight">SchoolMood</span>
      </Link>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-sm font-semibold text-slate-700">{user.name}</span>
          <span className="text-xs text-slate-500 capitalize">{user.role === 'teacher' ? 'Guru BK' : 'Siswa'}</span>
        </div>
        <button 
          onClick={onLogout}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  </nav>
);

const Sidebar = ({ role }: { role: string }) => {
  const links = role === 'student' ? [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/input", icon: PlusCircle, label: "Input Mood" },
    { to: "/history", icon: History, label: "Riwayat" },
  ] : [
    { to: "/", icon: LayoutDashboard, label: "Statistik Sekolah" },
    { to: "/alerts", icon: AlertTriangle, label: "Peringatan" },
  ];

  return (
    <div className="w-full md:w-64 bg-white md:min-h-[calc(100vh-65px)] border-r border-slate-200 p-4 space-y-2">
      {links.map(link => (
        <Link 
          key={link.to} 
          to={link.to}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all group"
        >
          <link.icon size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">{link.label}</span>
        </Link>
      ))}
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const Card = ({ children, className, title, subtitle }: CardProps) => (
  <div className={cn("bg-white rounded-2xl border border-slate-200 p-6 shadow-sm", className)}>
    {(title || subtitle) && (
      <div className="mb-6">
        {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

// --- Pages ---

const LoginPage = ({ onLogin }: { onLogin: (token: string, user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mx-auto mb-4">
            <BrainCircuit size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">SchoolMood</h1>
          <p className="text-slate-500 mt-2">Pantau kondisi emosionalmu untuk masa depan yang lebih cerah.</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Masukkan username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Masukkan password"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? 'Masuk...' : 'Masuk ke Akun'}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2 uppercase tracking-widest font-bold">Akun Demo</p>
            <div className="flex justify-center gap-4 text-xs text-slate-500">
              <div>
                <p className="font-bold">Siswa:</p>
                <p>student1 / student123</p>
              </div>
              <div>
                <p className="font-bold">Guru BK:</p>
                <p>teacher1 / teacher123</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const MoodInput = ({ token }: { token: string }) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setLoading(true);
    try {
      const res = await fetch('/api/moods', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mood_type: selectedMood, reason })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Mood berhasil disimpan! Mengalihkan...');
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage(data.error);
      }
    } catch (e) {
      setMessage('Gagal menyimpan mood.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card title="Bagaimana perasaanmu hari ini?" subtitle="Pilih satu emosi yang paling menggambarkan dirimu saat ini.">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
            {(Object.entries(MOOD_CONFIG) as [MoodType, typeof MOOD_CONFIG.happy][]).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setSelectedMood(type)}
                className={cn(
                  "flex flex-col items-center p-4 rounded-2xl border-2 transition-all",
                  selectedMood === type 
                    ? `border-indigo-500 ${config.bg} scale-105 shadow-md` 
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                )}
              >
                <span className="text-4xl mb-2">{config.emoji}</span>
                <span className={cn("text-xs font-bold", selectedMood === type ? "text-indigo-700" : "text-slate-500")}>
                  {config.label}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Apa yang menyebabkan perasaan tersebut? (Opsional)</label>
              <textarea 
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ceritakan sedikit tentang harimu..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[120px] transition-all"
              />
            </div>
            
            {message && (
              <p className={cn("text-sm font-medium text-center", message.includes('berhasil') ? "text-green-600" : "text-red-500")}>
                {message}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!selectedMood || loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Menyimpan...' : 'Simpan Mood Hari Ini'}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

const StudentDashboard = ({ token }: { token: string }) => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moodsRes, insightRes] = await Promise.all([
          fetch('/api/moods/me', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/ai/insight?days=7', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const moodsData = await moodsRes.json();
        const insightData = await insightRes.json();
        setMoods(moodsData);
        setInsight(insightData.insight);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const chartData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    return last7Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = moods.find(m => m.date === dateStr);
      return {
        name: format(date, 'EEE', { locale: localeId }),
        value: entry ? (Object.keys(MOOD_CONFIG).indexOf(entry.mood_type) + 1) : 0,
        mood: entry?.mood_type || null,
        fullDate: dateStr
      };
    });
  }, [moods]);

  const moodDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    moods.forEach(m => {
      counts[m.mood_type] = (counts[m.mood_type] || 0) + 1;
    });
    return Object.entries(MOOD_CONFIG).map(([type, config]) => ({
      name: config.label,
      value: counts[type] || 0,
      color: config.color
    }));
  }, [moods]);

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Tren Mood 7 Hari Terakhir" subtitle="Perkembangan suasana hatimu seminggu ini.">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis hide domain={[0, 5]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        if (!data.mood) return null;
                        const config = MOOD_CONFIG[data.mood as MoodType];
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 mb-1">{data.fullDate}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{config.emoji}</span>
                              <span className="font-bold text-slate-700">{config.label}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Distribusi Emosi" subtitle="Persentase perasaanmu selama ini.">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {moodDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {moodDistribution.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-slate-600">{item.name}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-indigo-600 text-white border-none shadow-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp size={20} />
                </div>
                <h3 className="font-bold text-lg">Insight AI</h3>
              </div>
              <p className="text-indigo-50 leading-relaxed italic">
                "{insight || 'Sedang menganalisis datamu...'}"
              </p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <Link to="/input" className="inline-flex items-center gap-2 text-sm font-bold bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                  Isi Mood Hari Ini <ChevronRight size={16} />
                </Link>
              </div>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Riwayat Terakhir" className="h-full">
            <div className="space-y-4">
              {moods.slice(0, 5).map(mood => (
                <div key={mood.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0", MOOD_CONFIG[mood.mood_type].bg)}>
                    {MOOD_CONFIG[mood.mood_type].emoji}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 text-sm">{MOOD_CONFIG[mood.mood_type].label}</p>
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{format(parseISO(mood.date), 'dd MMM')}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{mood.reason || 'Tidak ada alasan'}</p>
                    {mood.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">
                        {mood.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {moods.length === 0 && <p className="text-center text-slate-400 py-8">Belum ada data riwayat.</p>}
              {moods.length > 5 && (
                <Link to="/history" className="block text-center text-sm font-bold text-indigo-600 hover:text-indigo-700 mt-4">
                  Lihat Semua Riwayat
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TeacherDashboard = ({ token }: { token: string }) => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moodsRes, insightRes] = await Promise.all([
          fetch('/api/moods/stats', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/ai/insight?days=7', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const moodsData = await moodsRes.json();
        const insightData = await insightRes.json();
        setMoods(moodsData);
        setInsight(insightData.insight);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const aggregateStats = useMemo(() => {
    const counts: Record<string, number> = {};
    moods.forEach(m => {
      counts[m.mood_type] = (counts[m.mood_type] || 0) + 1;
    });
    return Object.entries(MOOD_CONFIG).map(([type, config]) => ({
      name: config.label,
      value: counts[type] || 0,
      color: config.color
    }));
  }, [moods]);

  const alerts = useMemo(() => {
    // Detect students with sad/anxious/angry for 3+ consecutive days
    const studentMoods: Record<number, MoodEntry[]> = {};
    moods.forEach(m => {
      if (!studentMoods[m.student_id]) studentMoods[m.student_id] = [];
      studentMoods[m.student_id].push(m);
    });

    const flagged: { student_id: number; name: string; reason: string }[] = [];
    Object.entries(studentMoods).forEach(([id, entries]) => {
      const sorted = entries.sort((a, b) => b.date.localeCompare(a.date));
      let count = 0;
      for (let i = 0; i < Math.min(sorted.length, 3); i++) {
        if ([MoodType.SAD, MoodType.ANXIOUS, MoodType.ANGRY].includes(sorted[i].mood_type)) {
          count++;
        } else {
          break;
        }
      }
      if (count >= 3) {
        flagged.push({ 
          student_id: Number(id), 
          name: sorted[0].student_name || 'Siswa',
          reason: `Mood negatif berturut-turut selama ${count} hari.`
        });
      }
    });
    return flagged;
  }, [moods]);

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat data statistik...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Rekapitulasi Suasana Hati Sekolah</h2>
          <p className="text-slate-500">Gambaran umum kondisi emosional seluruh siswa.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-medium text-slate-600">
          <Calendar size={16} />
          <span>7 Hari Terakhir</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Distribusi Emosi Sekolah">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aggregateStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {aggregateStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="bg-indigo-600 text-white border-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BrainCircuit size={20} />
                </div>
                <h3 className="font-bold text-lg">Analisis Sekolah (AI)</h3>
              </div>
              <p className="text-indigo-50 leading-relaxed italic">
                "{insight || 'Menganalisis data sekolah...'}"
              </p>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-indigo-200">Berdasarkan {moods.length} entri mood</span>
                <TrendingUp size={16} className="text-indigo-300" />
              </div>
            </Card>
          </div>

          <Card title="Daftar Mood Terkini (Agregat)" subtitle="Daftar mood siswa tanpa menampilkan alasan pribadi.">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 px-2">Tanggal</th>
                    <th className="pb-3 px-2">Siswa</th>
                    <th className="pb-3 px-2">Mood</th>
                    <th className="pb-3 px-2">Kategori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {moods.slice(0, 10).map(mood => (
                    <tr key={mood.id} className="text-sm text-slate-600">
                      <td className="py-4 px-2">{format(parseISO(mood.date), 'dd/MM/yyyy')}</td>
                      <td className="py-4 px-2 font-medium text-slate-800">{mood.student_name}</td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-2">
                          <span>{MOOD_CONFIG[mood.mood_type].emoji}</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", MOOD_CONFIG[mood.mood_type].bg, MOOD_CONFIG[mood.mood_type].text)}>
                            {MOOD_CONFIG[mood.mood_type].label}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium">
                          {mood.category || 'Lainnya'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-red-50 border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-lg text-red-800">Peringatan Dini</h3>
            </div>
            <div className="space-y-3">
              {alerts.map((alert, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                  <p className="font-bold text-slate-800 text-sm">{alert.name}</p>
                  <p className="text-xs text-red-600 mt-1">{alert.reason}</p>
                  <button className="mt-3 w-full py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors">
                    Tindak Lanjut
                  </button>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-4">Tidak ada peringatan saat ini.</p>
              )}
            </div>
          </Card>

          <Card title="Statistik Kategori" subtitle="Penyebab mood terbanyak.">
            <div className="space-y-4">
              {(() => {
                const cats: Record<string, number> = {};
                moods.forEach(m => { if(m.category) cats[m.category] = (cats[m.category] || 0) + 1; });
                return Object.entries(cats)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <div key={cat}>
                      <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                        <span>{cat}</span>
                        <span>{Math.round((count / moods.length) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${(count / moods.length) * 100}%` }} />
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const HistoryPage = ({ token }: { token: string }) => {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/moods/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setMoods(data);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Riwayat Mood Kamu</h2>
      <div className="space-y-4">
        {moods.map(mood => (
          <div key={mood.id}>
            <Card className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0", MOOD_CONFIG[mood.mood_type].bg)}>
                {MOOD_CONFIG[mood.mood_type].emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-slate-800">{MOOD_CONFIG[mood.mood_type].label}</h4>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{format(parseISO(mood.date), 'EEEE, dd MMMM yyyy', { locale: localeId })}</span>
                </div>
                <p className="text-sm text-slate-600 italic">"{mood.reason || 'Tidak ada alasan yang ditulis.'}"</p>
                {mood.category && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase">
                    Kategori: {mood.category}
                  </span>
                )}
              </div>
            </Card>
          </div>
        ))}
        {moods.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-slate-400">Belum ada riwayat mood. Mulai isi hari ini!</p>
            <Link to="/input" className="inline-block mt-4 text-indigo-600 font-bold">Isi Mood Sekarang</Link>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) return null;

  if (!token || !user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="flex flex-col md:flex-row">
          <Sidebar role={user.role} />
          <main className="flex-1 min-h-[calc(100vh-65px)]">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={
                  user.role === 'student' ? <StudentDashboard token={token} /> : <TeacherDashboard token={token} />
                } />
                {user.role === 'student' && (
                  <>
                    <Route path="/input" element={<MoodInput token={token} />} />
                    <Route path="/history" element={<HistoryPage token={token} />} />
                  </>
                )}
                {user.role === 'teacher' && (
                  <Route path="/alerts" element={<TeacherDashboard token={token} />} />
                )}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
