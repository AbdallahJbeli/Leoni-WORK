import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Navbar from '../../components/Navbar';
import StatutBadge from '../../components/StatutBadge';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function DetailDemande() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get(`/demandes/${id}`);
      setData(res.data);
    } catch {
      toast.error('Erreur lors du chargement de la demande');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Demande introuvable
      </div>
    );
  }

  const { demande, fiche, approbation } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/demandeur')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition">
          <ArrowLeft size={16} /> Retour aux demandes
        </button>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-bold text-gray-900 text-lg">{demande.numero_bon}</span>
                <StatutBadge statut={demande.statut} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{demande.equipement}</h1>
              <p className="text-sm text-gray-500">Segment : {demande.segment_chaine} — Position : {demande.position} — N°Série : {demande.numero_serie}</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>Demandeur : {demande.prenom_demandeur} {demande.nom_demandeur}</p>
              <p>Matricule : {demande.matricule_demandeur}</p>
              <p>Date de la demande : {new Date(demande.date_demande).toLocaleString('fr-FR')}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Description de la panne</p>
              <p className="text-sm text-gray-800">{demande.description_panne}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Équipement en arrêt</p>
                <p className="text-sm text-gray-800">{demande.equipement_en_arret ? 'Oui' : 'Non'}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Heure / date d'arrêt</p>
                <p className="text-sm text-gray-800">{demande.heure_arret || '—'} / {demande.date_arret || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technicien assigné</h2>
            {fiche && fiche.matricule_tech ? (
              <div className="space-y-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Nom</p>
                  <p className="text-sm font-medium text-gray-800">{fiche.prenom_tech} {fiche.nom_tech}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Matricule</p>
                  <p className="text-sm font-medium text-gray-800">{fiche.matricule_tech}</p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{fiche.tech_email || '—'}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-600">
                Aucun technicien n'a encore pris en charge cette demande.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Suivi</h2>
            <div className="space-y-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Statut</p>
                <p className="text-sm font-medium text-gray-800">{demande.statut}</p>
              </div>
              {approbation && (
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">Approbation qualité</p>
                  <p className="text-sm font-medium text-gray-800">
                    {approbation.decision === 'approuve' ? 'Approuvée' : approbation.decision === 'refuse' ? 'Refusée' : 'En attente'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
