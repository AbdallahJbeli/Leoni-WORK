import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Loader2, Users } from 'lucide-react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['demandeur','technicien','qualite','admin'];
const roleColors = {
  admin:      'bg-purple-100 text-purple-700',
  demandeur:  'bg-blue-100 text-blue-700',
  technicien: 'bg-green-100 text-green-700',
  qualite:    'bg-yellow-100 text-yellow-700',
};

export default function DashboardAdmin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);

  const [form, setForm] = useState({
    nom: '', prenom: '', matricule: '', email: '',
    password: '', role: 'demandeur'
  });

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/auth/users', form);
      toast.success(`Utilisateur ${form.prenom} ${form.nom} créé`);
      setShowForm(false);
      setForm({ nom:'',prenom:'',matricule:'',email:'',password:'',role:'demandeur' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const toggleActif = async (u) => {
    // Sécurité : empêche l'admin de désactiver son propre compte
    if (u.id === currentUser.id) {
      toast.error('Vous ne pouvez pas désactiver votre propre compte');
      return;
    }
    try {
      await api.put(`/auth/users/${u.id}`, {
        nom: u.nom, prenom: u.prenom, email: u.email,
        role: u.role, actif: u.actif ? 0 : 1
      });
      toast.success(u.actif ? 'Utilisateur désactivé' : 'Utilisateur activé');
      fetchUsers();
    } catch {
      toast.error('Erreur');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
            <p className="text-sm text-gray-500 mt-1">{users.length} utilisateur(s) enregistré(s)</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchUsers} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
              <RefreshCw size={16} className="text-gray-500" />
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              <Plus size={16} /> Nouvel utilisateur
            </button>
          </div>
        </div>

        {/* Stats par rôle */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {ROLES.map(r => (
            <div key={r} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-800">{users.filter(u => u.role === r).length}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${roleColors[r]}`}>{r}</span>
            </div>
          ))}
        </div>

        {/* Formulaire création */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Users size={18} /> Créer un utilisateur
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input value={form.nom} onChange={e => set('nom', e.target.value)} requiblue
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                  <input value={form.prenom} onChange={e => set('prenom', e.target.value)} requiblue
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Matricule *</label>
                  <input value={form.matricule} onChange={e => set('matricule', e.target.value)} requiblue placeholder="ex: EMP002"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} requiblue
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe provisoire *</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} requiblue
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle *</label>
                  <select value={form.role} onChange={e => set('role', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition disabled:opacity-60">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Création...' : 'Créer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste utilisateurs */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Matricule</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className={`hover:bg-gray-50 ${isSelf ? 'bg-blue-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {u.prenom} {u.nom}
                        {isSelf && (
                          <span className="ml-2 text-xs text-blue-500 font-normal">(vous)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600">{u.matricule}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${roleColors[u.role]}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${u.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {/* Bouton caché si c'est le compte connecté */}
                        {isSelf ? (
                          <span className="text-xs text-gray-300 italic">—</span>
                        ) : (
                          <button
                            onClick={() => toggleActif(u)}
                            className={`text-xs underline transition ${
                              u.actif
                                ? 'text-blue-400 hover:text-blue-600'
                                : 'text-green-500 hover:text-green-700'
                            }`}
                          >
                            {u.actif ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}