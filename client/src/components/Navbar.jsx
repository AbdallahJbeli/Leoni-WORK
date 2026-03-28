import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User } from 'lucide-react';
import api from '../api/axios';

const roleLabels = {
  admin: 'Administrateur',
  demandeur: 'Demandeur',
  technicien: 'Technicien',
  qualite: 'Qualité',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);

  const unread = notifs.filter(n => !n.lu).length;

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000); // poll toutes les 30s
    return () => clearInterval(interval);
  }, []);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/demandes/notifications/mes');
      setNotifs(res.data);
    } catch (_) {}
  };

  const marquerLues = async () => {
    try {
      await api.put('/demandes/notifications/lire-tout');
      setNotifs(prev => prev.map(n => ({ ...n, lu: 1 })));
    } catch (_) {}
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 text-white font-bold text-sm px-2 py-1 rounded">
          LEONI
        </div>
        <span className="font-semibold text-gray-800 hidden sm:block">
          Bon de Travail
        </span>
      </div>

      {/* Droite */}
      <div className="flex items-center gap-4">

        {/* Cloche notifications */}
        <div className="relative">
          <button
            onClick={() => { setOpen(!open); if (!open) marquerLues(); }}
            className="relative p-2 rounded-full hover:bg-gray-100 transition"
          >
            <Bell size={20} className="text-gray-600" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-sm text-gray-800">Notifications</span>
                <span className="text-xs text-gray-400">{unread} non lue(s)</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                {notifs.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">Aucune notification</p>
                ) : (
                  notifs.slice(0, 15).map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 text-sm ${n.lu ? 'text-gray-500' : 'text-gray-800 bg-blue-50'}`}
                    >
                      <p className={n.lu ? '' : 'font-medium'}>{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(n.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <div className="bg-gray-100 rounded-full p-1.5">
            <User size={16} className="text-gray-500" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium leading-none">{user?.prenom} {user?.nom}</p>
            <p className="text-xs text-gray-400 mt-0.5">{roleLabels[user?.role]}</p>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 transition"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}