import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

// --- MOVE THIS COMPONENT OUTSIDE ---
const PasswordInput = ({ label, field, value, onChange, show, onToggle }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(field, e.target.value)}
        requiblue
        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  </div>
);

export default function ChangePassword() {
  const { user, afterPasswordChange, logout } = useAuth();
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.new_password !== form.confirm_password) {
      setError('Les deux nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (form.new_password.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (form.new_password === form.current_password) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success('Mot de passe mis à jour. Bienvenue !');
      afterPasswordChange();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du changement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-600 text-white font-bold text-2xl px-4 py-2 rounded-lg mb-4">
            LEONI
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <ShieldCheck size={20} className="text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Changement de mot de passe requis</h1>
          </div>
          <p className="text-sm text-gray-500">
            Bonjour <span className="font-medium">{user?.prenom} {user?.nom}</span>, vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-800">
            🔐 Pour votre sécurité, le mot de passe provisoire fourni par l'administrateur doit être changé dès la première connexion.
          </div>

          {error && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordInput
              label="Mot de passe actuel (provisoire)"
              field="current_password"
              value={form.current_password}
              onChange={set}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
            />
            <PasswordInput
              label="Nouveau mot de passe"
              field="new_password"
              value={form.new_password}
              onChange={set}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />
            <PasswordInput
              label="Confirmer le nouveau mot de passe"
              field="confirm_password"
              value={form.confirm_password}
              onChange={set}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />

            {form.new_password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                      form.new_password.length >= i * 3
                        ? i <= 1 ? 'bg-blue-400'
                        : i <= 2 ? 'bg-orange-400'
                        : i <= 3 ? 'bg-yellow-400'
                        : 'bg-green-500'
                        : 'bg-gray-200'
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {form.new_password.length < 6 ? 'Trop court (6 caractères minimum)' :
                    form.new_password.length < 8 ? 'Faible' :
                    form.new_password.length < 10 ? 'Moyen' : 'Fort'}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Mise à jour...' : 'Confirmer et accéder à mon espace'}
            </button>
          </form>
        </div>

        <p
          onClick={logout}
          className="text-center text-xs text-gray-400 mt-4 cursor-pointer hover:text-blue-500 transition"
        >
          Se déconnecter
        </p>
      </div>
    </div>
  );
}