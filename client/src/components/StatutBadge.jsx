const config = {
  en_attente:        { label: 'En attente',             bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400'   },
  en_revision:       { label: 'En cours de révision',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  acceptee:          { label: 'Acceptée',               bg: 'bg-cyan-100',   text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
  en_reparation:     { label: 'En cours de réparation', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  repare:            { label: 'Réparé',                 bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  hors_service:      { label: 'Hors service',           bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  attente_qualite:   { label: 'Attente qualité',        bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  qualite_approuvee: { label: 'Qualité approuvée',      bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-600'  },
  qualite_refusee:   { label: 'Qualité refusée',        bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-600'    },
};

export default function StatutBadge({ statut }) {
  const c = config[statut] || config.en_attente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}