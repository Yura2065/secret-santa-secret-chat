import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { TreePine } from 'lucide-react'; // Додали іконку ялинки

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Реєстрація успішна! Тепер увійдіть.');
        setIsLogin(true);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md w-full border border-[#ECEADF]">
        <div className="flex justify-center mb-6 text-primary">
           <TreePine size={48} />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2">
          {isLogin ? 'З поверненням' : 'Створити акаунт'}
        </h1>
        <p className="text-center text-secondary/80 mb-8">
           {isLogin ? 'Увійдіть, щоб керувати Секретним Сантою' : 'Зареєструйтесь для початку гри'}
        </p>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
             <label className="block text-sm font-medium mb-1 pl-1">Email</label>
             <input
               type="email"
               className="w-full border-2 border-[#ECEADF] bg-background p-3 rounded-xl focus:outline-none focus:border-primary transition-colors"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
             />
          </div>
          <div>
             <label className="block text-sm font-medium mb-1 pl-1">Пароль</label>
             <input
               type="password"
               className="w-full border-2 border-[#ECEADF] bg-background p-3 rounded-xl focus:outline-none focus:border-primary transition-colors"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
             />
          </div>

          <button
            disabled={loading}
            className="bg-primary text-white p-3 rounded-xl font-bold hover:bg-[#244036] transition-colors mt-2 shadow-md disabled:opacity-70"
          >
            {loading ? 'Зачекайте...' : (isLogin ? 'Увійти' : 'Зареєструватись')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-secondary">
          {isLogin ? 'Ще немає акаунту? ' : 'Вже є акаунт? '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Створити' : 'Увійти'}
          </button>
        </p>
      </div>
    </div>
  );
}