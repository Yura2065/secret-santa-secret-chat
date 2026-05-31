import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trash2, Shuffle, Copy, TreePine, Gift } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [exclusions, setExclusions] = useState([]);

  const [roomName, setRoomName] = useState('');
  const [budget, setBudget] = useState('');
  const [exP1, setExP1] = useState('');
  const [exP2, setExP2] = useState('');
  const [isTwoWay, setIsTwoWay] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { checkSession(); }, []);

  async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) navigate('/auth');
    else {
      setUser(session.user);
      loadData(session.user.id);
    }
  }

  async function loadData(userId) {
    const { data: rooms } = await supabase.from('rooms').select('*').eq('admin_id', userId).maybeSingle();
    if (rooms) {
      setRoom(rooms);
      const { data: parts } = await supabase.from('participants').select('*').eq('room_id', rooms.id);
      setParticipants(parts || []);
      const { data: excls } = await supabase.from('exclusions').select('*').eq('room_id', rooms.id);
      setExclusions(excls || []);
    }
  }

  async function createRoom(e) {
    e.preventDefault();
    // Генеруємо випадковий код
    const code = Math.random().toString(36).substring(2, 8);

    const { data, error } = await supabase.from('rooms').insert({
      name: roomName,
      admin_id: user.id,
      budget: budget || null,
      invite_code: code
    }).select();

    if (error) {
      console.error("Помилка Supabase:", error);
      alert("Помилка створення: " + error.message);
    } else {
      window.location.reload();
    }
  }
  async function handleDraw() {
    if (participants.length < 3) return alert("Треба мінімум 3 людини!");
    setLoading(true);
    let givers = participants.map(p => p.id);
    let receivers = [];
    let success = false;

    for (let attempt = 0; attempt < 500; attempt++) {
      receivers = [...givers].sort(() => Math.random() - 0.5);
      let conflict = false;
      for (let i = 0; i < givers.length; i++) {
        let g = givers[i], r = receivers[i];
        if (g === r) conflict = true;
        let blocked = exclusions.some(ex => {
          if (ex.participant1_id === g && ex.participant2_id === r) return true;
          if (ex.is_two_way && ex.participant1_id === r && ex.participant2_id === g) return true;
          return false;
        });
        if (blocked) conflict = true; if (conflict) break;
      }
      if (!conflict) { success = true; break; }
    }

    if (!success) { setLoading(false); return alert("Забагато обмежень!"); }

    const matchesData = givers.map((gid, index) => ({
      room_id: room.id, giver_id: gid, receiver_id: receivers[index]
    }));
    await supabase.from('matches').insert(matchesData);
    await supabase.from('rooms').update({ is_drawn: true }).eq('id', room.id);
    alert("Розіграш успішний! 🎉");
    window.location.reload();
  }

  if (!user) return <div className="p-10 text-center text-primary">Завантаження...</div>;

  return (
    <div className="min-h-screen font-sans pb-20">
      {/* Навігація */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-[#ECEADF] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            <TreePine className="text-accent" /> Секретний Санта
          </h1>
          <button onClick={() => { supabase.auth.signOut(); navigate('/auth'); }}
                  className="text-secondary hover:text-primary flex gap-1 text-sm font-medium transition-colors">
            <LogOut size={18} /> Вихід
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto mt-10 px-4">
        {!room ? (
          // Форма створення кімнати
          <div className="bg-card p-8 rounded-2xl shadow-xl border border-[#ECEADF]">
            <div className="text-center mb-8">
                <Gift size={40} className="mx-auto text-accent mb-4" />
                <h2 className="text-3xl font-bold mb-2">Створити кімнату</h2>
                <p className="text-secondary/80">Налаштуйте свою святкову гру</p>
            </div>
            <form onSubmit={createRoom} className="space-y-5 max-w-md mx-auto">
              <input className="w-full border-2 border-[#ECEADF] bg-background p-3 rounded-xl focus:border-primary outline-none"
                     placeholder="Назва (напр. 'Сім'я')" value={roomName} onChange={e => setRoomName(e.target.value)} required />
              <input className="w-full border-2 border-[#ECEADF] bg-background p-3 rounded-xl focus:border-primary outline-none"
                     placeholder="Бюджет (грн) - необов'язково" type="number" value={budget} onChange={e => setBudget(e.target.value)} />
              <button className="bg-primary text-white w-full p-3 rounded-xl font-bold hover:bg-[#244036] transition-colors shadow-md">
                Створити простір
              </button>
            </form>
          </div>
        ) : (
          // Інтерфейс кімнати
          <div className="space-y-8">
            {/* Картка Кімнати */}
            <div className="bg-card p-6 rounded-2xl shadow-md border-t-4 border-accent flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-1 flex items-center gap-2">
                    {room.name}
                    {room.is_drawn && <span className="bg-accent/20 text-primary text-sm px-3 py-1 rounded-full font-sans">Розіграно ✨</span>}
                </h2>
                <p className="text-secondary/70">{room.budget ? `Бюджет: ${room.budget} грн` : "Бюджет не вказано"}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/join/${room.invite_code}`);
                  alert("Посилання скопійовано!");
                }}
                className="bg-background border-2 border-primary/20 text-primary px-4 py-2 rounded-xl font-medium hover:bg-primary/5 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Copy size={16} /> Скопіювати запрошення
              </button>
            </div>

            {/* Учасники та Обмеження (Дві колонки на великих екранах) */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* Учасники */}
                <div className="bg-card p-6 rounded-2xl shadow-md border border-[#ECEADF]">
                <h3 className="font-bold text-xl mb-4 flex items-center gap-2">👥 Учасники <span className="text-secondary/50">({participants.length})</span></h3>
                {participants.length === 0 ? <p className="text-secondary/60 italic">Поки що пусто...</p> : (
                    <ul className="space-y-3">
                    {participants.map(p => (
                        <li key={p.id} className="flex justify-between items-center bg-background p-3 rounded-xl border border-[#ECEADF]">
                        <span className="font-medium">{p.name}</span>
                        {!room.is_drawn && (
                            <button onClick={async () => {
                            await supabase.from('participants').delete().eq('id', p.id);
                            loadData(user.id);
                            }} className="text-red-400 hover:text-red-600 transition-colors bg-white p-1 rounded-md shadow-sm"><Trash2 size={16} /></button>
                        )}
                        </li>
                    ))}
                    </ul>
                )}
                </div>

                {/* Обмеження */}
                {!room.is_drawn && (
                <div className="bg-card p-6 rounded-2xl shadow-md border border-[#ECEADF]">
                    <h3 className="font-bold text-xl mb-4">⛔ Обмеження (Don't Pair)</h3>

                    {exclusions.length > 0 ? (
                        <div className="space-y-2 mb-6">
                        {exclusions.map(ex => (
                            <div key={ex.id} className="flex justify-between items-center text-sm text-red-700 bg-red-50 border border-red-100 p-2 rounded-lg">
                            <span>
                                {participants.find(p => p.id === ex.participant1_id)?.name}
                                <span className="text-red-400 mx-1">→</span>
                                {participants.find(p => p.id === ex.participant2_id)?.name}
                                {ex.is_two_way ? <span className="text-red-500 font-bold ml-1">(↔)</span> : ""}
                            </span>
                            <button onClick={async () => {
                                await supabase.from('exclusions').delete().eq('id', ex.id);
                                loadData(user.id);
                            }} className="text-red-400 hover:text-red-600 ml-2">×</button>
                            </div>
                        ))}
                        </div>
                    ) : <p className="text-secondary/60 italic mb-4">Немає правил.</p>}

                    <div className="flex flex-col gap-3 bg-background p-4 rounded-xl border border-[#ECEADF]">
                        <div className="flex gap-2">
                            <select className="border border-[#ECEADF] p-2 rounded-lg flex-1 bg-white focus:border-primary outline-none" value={exP1} onChange={e => setExP1(e.target.value)}>
                                <option value="">Хто...</option>
                                {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                            <select className="border border-[#ECEADF] p-2 rounded-lg flex-1 bg-white focus:border-primary outline-none" value={exP2} onChange={e => setExP2(e.target.value)}>
                                <option value="">Кому...</option>
                                {participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <label className="flex items-center gap-2 text-sm cursor-pointer ml-1">
                            <input type="checkbox" className="accent-primary w-4 h-4" checked={isTwoWay} onChange={e => setIsTwoWay(e.target.checked)} />
                            <span className="font-medium">Взаємне обмеження (↔)</span>
                        </label>
                        <button
                            onClick={async () => {
                            if(!exP1 || !exP2 || exP1 === exP2) return alert("Помилка у виборі");
                            await supabase.from('exclusions').insert({ room_id: room.id, participant1_id: exP1, participant2_id: exP2, is_two_way: isTwoWay });
                            setExP1(''); setExP2(''); setIsTwoWay(false);
                            loadData(user.id);
                            }}
                            className="bg-secondary text-accent w-full py-2 rounded-lg font-bold hover:bg-primary transition-colors text-sm"
                        >Додати правило</button>
                    </div>
                </div>
                )}
            </div>

            {/* Кнопка розіграшу */}
            {!room.is_drawn ? (
              <button
                onClick={handleDraw}
                disabled={loading || participants.length < 3}
                className="w-full bg-primary text-white py-5 rounded-2xl text-xl font-bold shadow-lg hover:bg-[#244036] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 transition-all transform hover:scale-[1.01]"
              >
                {loading ? <Shuffle className="animate-spin" /> : <Shuffle />}
                {loading ? "Створюємо магію..." : "Запустити жеребкування"}
              </button>
            ) : (
              <div className="p-8 bg-accent/10 text-primary rounded-2xl text-center border-2 border-accent/30 flex flex-col items-center">
                <Gift size={48} className="text-accent mb-2" />
                <h3 className="text-2xl font-bold mb-2">Жеребкування завершено! 🎉</h3>
                <p className="text-lg">Учасники вже можуть зайти за своїм посиланням і побачити, кому вони дарують подарунок.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}