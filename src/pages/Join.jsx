import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Join() {
  const { code } = useParams(); // Беремо код з URL
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [name, setName] = useState('');
  const [wishlist, setWishlist] = useState('');
  const [match, setMatch] = useState(null); // Якщо вже розіграно, показуємо результат
  const [myId, setMyId] = useState(localStorage.getItem(`santa_user_${code}`)); // "Запам'ятовуємо" юзера в браузері

  useEffect(() => {
    loadRoom();
  }, [code]);

  async function loadRoom() {
    const { data } = await supabase.from('rooms').select('*').eq('invite_code', code).single();
    if (data) setRoom(data);

    // Якщо юзер вже був тут, перевіримо чи є для нього подарунок
    if (myId && data?.is_drawn) {
      const { data: m } = await supabase.from('matches').select('*, receiver:receiver_id(name, wishlist)').eq('giver_id', myId).single();
      if (m) setMatch(m);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!name) return;
=
    const { data, error } = await supabase.from('participants').insert({
      room_id: room.id,
      name: name,
      wishlist: wishlist
    }).select().single();

    if (error) {
      alert("Помилка: " + error.message);
    } else {
      localStorage.setItem(`santa_user_${code}`, data.id);
      setMyId(data.id);
      alert("Ви успішно приєдналися! Чекайте на розіграш.");
    }
  }

  if (!room) return <div className="p-10 text-center">Завантаження або кімната не знайдена...</div>;

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-green-800 mb-2">{room.name}</h1>
        <p className="text-center text-gray-500 mb-6">Бюджет: {room.budget} грн</p>

        {/* 1. Якщо вже розіграно і ми знаємо хто це - показуємо результат */}
        {room.is_drawn && match ? (
          <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg text-center animate-bounce">
            <h2 className="text-xl font-bold text-red-800 mb-2">🎅 Ти Секретний Санта для:</h2>
            <div className="text-3xl font-black text-green-700 my-4">{match.receiver.name}</div>
            <div className="bg-white p-3 rounded text-sm text-gray-600">
              📝 Побажання: {match.receiver.wishlist || "Немає побажань"}
            </div>
          </div>
        ) : room.is_drawn && !match && myId ? (
          <div className="text-center">Помилка відображення. Зверніться до адміна.</div>
        ) : myId ? (
          /* 2. Якщо приєднався, але ще не розіграли */
          <div className="text-center py-10">
            <div className="text-4xl mb-4">⏳</div>
            <h3 className="text-xl font-bold">Ви у грі!</h3>
            <p className="text-gray-500">Чекайте, поки адміністратор запустить жеребкування.</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-blue-500 underline">Оновити сторінку</button>
          </div>
        ) : (
          /* 3. Форма входу */
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700">Твоє Ім'я</label>
              <input className="w-full border p-2 rounded" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700">Твої побажання (Wishlist)</label>
              <textarea className="w-full border p-2 rounded" value={wishlist} onChange={e => setWishlist(e.target.value)} placeholder="Хочу книгу, шкарпетки..." />
            </div>
            <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
              Приєднатися до гри 🎄
            </button>
          </form>
        )}
      </div>
    </div>
  );
}