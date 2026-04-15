import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Users, 
  ChevronRight, 
  Search, 
  RefreshCcw,
  TrendingUp,
  Plus,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { 
  SNAPCHAT_ACCOUNTS, 
  AccountState, 
  FilterType 
} from './types';

// --- Constants ---
const VALIDATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in ms

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const percentage = (current / total) * 100;
  return (
    <div className="w-[300px] bg-surface h-2 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        className="h-full bg-accent-green"
      />
    </div>
  );
};

export default function App() {
  const [states, setStates] = useState<Record<string, AccountState>>({});
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('snap_mgmt_states');
    if (saved) {
      try {
        setStates(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved states", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('snap_mgmt_states', JSON.stringify(states));
    }
  }, [states, isLoaded]);

  // Auto-revert logic (check every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const newStates = { ...states };

      Object.keys(newStates).forEach(name => {
        const state = newStates[name];
        if (state.lastValidated && now - state.lastValidated >= VALIDATION_DURATION) {
          newStates[name] = { ...state, lastValidated: null };
          changed = true;
        }
      });

      if (changed) setStates(newStates);
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [states]);

  const getAccountState = (name: string): AccountState => {
    return states[name] || { lastValidated: null, collaborators: [] };
  };

  const isAccountValidated = (name: string) => {
    const state = getAccountState(name);
    if (!state.lastValidated) return false;
    return Date.now() - state.lastValidated < VALIDATION_DURATION;
  };

  const toggleValidation = (name: string) => {
    const currentState = getAccountState(name);
    const isValidated = isAccountValidated(name);
    
    setStates(prev => ({
      ...prev,
      [name]: {
        ...currentState,
        lastValidated: isValidated ? null : Date.now()
      }
    }));
  };

  const addCollaborator = (accountName: string, collaboratorName: string) => {
    if (!collaboratorName.trim()) return;
    const currentState = getAccountState(accountName);
    setStates(prev => ({
      ...prev,
      [accountName]: {
        ...currentState,
        collaborators: [
          ...currentState.collaborators,
          { id: Math.random().toString(36).substr(2, 9), name: collaboratorName, active: true }
        ]
      }
    }));
  };

  const toggleCollaboratorStatus = (accountName: string, collaboratorId: string) => {
    const currentState = getAccountState(accountName);
    setStates(prev => ({
      ...prev,
      [accountName]: {
        ...currentState,
        collaborators: currentState.collaborators.map(c => 
          c.id === collaboratorId ? { ...c, active: !c.active } : c
        )
      }
    }));
  };

  const removeCollaborator = (accountName: string, collaboratorId: string) => {
    const currentState = getAccountState(accountName);
    setStates(prev => ({
      ...prev,
      [accountName]: {
        ...currentState,
        collaborators: currentState.collaborators.filter(c => c.id !== collaboratorId)
      }
    }));
  };

  const resetAll = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes les validations ?")) {
      const newStates = { ...states };
      Object.keys(newStates).forEach(name => {
        newStates[name] = { ...newStates[name], lastValidated: null };
      });
      setStates(newStates);
    }
  };

  const filteredAccounts = useMemo(() => {
    return SNAPCHAT_ACCOUNTS.filter(name => {
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const isValidated = isAccountValidated(name);
      
      if (filter === 'validated') return matchesSearch && isValidated;
      if (filter === 'pending') return matchesSearch && !isValidated;
      return matchesSearch;
    });
  }, [searchQuery, filter, states]);

  const validatedCount = SNAPCHAT_ACCOUNTS.filter(isAccountValidated).length;
  const totalCount = SNAPCHAT_ACCOUNTS.length;

  const getTimeRemaining = (lastValidated: number | null) => {
    if (!lastValidated) return null;
    const remaining = VALIDATION_DURATION - (Date.now() - lastValidated);
    if (remaining <= 0) return "Expiré";
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans flex flex-col">
      {/* --- Header --- */}
      <header className="px-10 py-6 border-b border-border grid grid-cols-3 items-center">
        <h1 className="text-[11px] font-black tracking-[0.2em] uppercase text-text-secondary">
          GESTION SNAPCHAT
        </h1>
        
        <div className="flex items-center justify-center gap-5">
          <ProgressBar current={validatedCount} total={totalCount} />
        </div>

        <div className="flex justify-end">
          <button 
            onClick={resetAll}
            className="p-2 rounded-md bg-surface border border-border hover:bg-border transition-all text-text-secondary hover:text-white"
            title="Réinitialiser tout"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </header>

      {/* --- Filter Bar --- */}
      <nav className="px-10 py-3 bg-bg border-b border-border flex items-center gap-5">
        {(['all', 'validated', 'pending'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[12px] font-semibold px-3 py-1 rounded-md transition-all ${
              filter === f 
                ? 'bg-surface text-white' 
                : 'text-text-secondary hover:text-white'
            }`}
          >
            {f === 'all' ? 'Tous les comptes' : f === 'validated' ? `Validés (${validatedCount})` : `Non validés (${totalCount - validatedCount})`}
          </button>
        ))}
      </nav>

      {/* --- Main Container --- */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] bg-border gap-[1px]">
        {/* Dashboard Grid */}
        <div className="bg-bg p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 auto-rows-max gap-3 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredAccounts.map((name) => {
              const isValidated = isAccountValidated(name);
              const isInfos = name.toLowerCase().includes('infos');
              const state = getAccountState(name);

              return (
                <motion.div
                  layout
                  key={name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => isInfos && setSelectedAccount(name)}
                  className={`account-card bg-surface border border-border rounded-xl p-3.5 flex flex-col justify-between relative cursor-pointer group transition-all ${
                    isValidated ? 'border-accent-green/30' : ''
                  } ${selectedAccount === name ? 'ring-1 ring-white/20' : ''}`}
                >
                  {/* Status Dot */}
                  <div className={`absolute top-3.5 right-3.5 w-2 h-2 rounded-full transition-all ${
                    isValidated 
                      ? 'bg-accent-green shadow-[0_0_10px_#34c759]' 
                      : 'bg-accent-red'
                  }`} />

                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-text-secondary flex items-center gap-1.5 mb-1">
                      {name.split(' ')[0]} {isInfos && <span className="bg-[#007aff] text-white text-[9px] px-1.5 py-0.5 rounded-[3px] font-bold">INFO</span>}
                    </div>
                    <div className="text-[13px] font-semibold text-text-primary group-hover:text-white transition-colors">
                      {name}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleValidation(name);
                    }}
                    className={`mt-2 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                      isValidated
                        ? 'bg-accent-green text-white'
                        : 'bg-border text-white hover:bg-zinc-800'
                    }`}
                  >
                    {isValidated ? 'Terminé' : 'Valider'}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Detail Pane / Sidebar */}
        <aside className="bg-bg p-6 border-l border-border flex flex-col overflow-y-auto no-scrollbar">
          {selectedAccount ? (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h2 className="text-[18px] font-bold mb-1">{selectedAccount}</h2>
                <div className={`inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full font-medium ${
                  isAccountValidated(selectedAccount)
                    ? 'bg-accent-green/10 text-accent-green'
                    : 'bg-accent-red/10 text-accent-red'
                }`}>
                  {isAccountValidated(selectedAccount) ? 'PUBLIÉ' : 'NON PUBLIÉ'}
                </div>
                
                <div className="mt-4 flex justify-between text-[11px] font-mono text-text-secondary">
                  <span>Statut quotidien</span>
                  <span>{isAccountValidated(selectedAccount) ? `Expire dans ${getTimeRemaining(getAccountState(selectedAccount).lastValidated)}` : 'Expire dans 24h'}</span>
                </div>

                <button
                  onClick={() => toggleValidation(selectedAccount)}
                  className="w-full mt-4 py-3 rounded-md font-bold text-[14px] transition-all bg-white text-black hover:bg-zinc-200"
                >
                  {isAccountValidated(selectedAccount) ? 'ANNULER LA PUBLICATION' : 'VALIDER LA PUBLICATION'}
                </button>
              </div>

              <div className="text-[11px] uppercase tracking-[0.1em] text-text-secondary mb-3 font-bold">
                Collaboration
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.target as any).collabName;
                  addCollaborator(selectedAccount, input.value);
                  input.value = '';
                }}
                className="flex gap-2 mb-5"
              >
                <input 
                  name="collabName"
                  type="text"
                  placeholder="Nom de la personne..."
                  className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-[12px] text-white focus:outline-none focus:border-text-secondary transition-all"
                />
                <button 
                  type="submit"
                  className="bg-text-primary text-bg px-3 rounded-md font-bold text-[18px] hover:bg-zinc-200 transition-all"
                >
                  +
                </button>
              </form>

              <ul className="mb-4 space-y-0">
                {getAccountState(selectedAccount).collaborators.map((c) => (
                  <li key={c.id} className="flex justify-between items-center py-2.5 border-b border-border text-[13px] group/item">
                    <span className={c.active ? 'text-text-primary' : 'text-text-secondary line-through opacity-50'}>
                      {c.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[12px] ${c.active ? 'text-text-secondary' : 'text-text-secondary/30'}`}>50 €</span>
                      <button 
                        onClick={() => toggleCollaboratorStatus(selectedAccount, c.id)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                          c.active 
                            ? 'bg-accent-red/10 text-accent-red hover:bg-accent-red hover:text-white' 
                            : 'bg-accent-green/10 text-accent-green hover:bg-accent-green hover:text-white'
                        }`}
                      >
                        {c.active ? 'ANNULER' : 'RÉACTIVER'}
                      </button>
                      <button 
                        onClick={() => removeCollaborator(selectedAccount, c.id)}
                        className="text-text-secondary hover:text-accent-red opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
                {getAccountState(selectedAccount).collaborators.length === 0 && (
                  <div className="py-10 text-center text-text-secondary text-[12px] border border-dashed border-border rounded-lg">
                    Aucun collaborateur
                  </div>
                )}
              </ul>

              <div className="mt-auto bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-border p-5 rounded-xl text-center">
                <div className="text-[28px] font-extrabold text-text-primary">
                  {getAccountState(selectedAccount).collaborators.filter(c => c.active).length * 50} €
                </div>
                <div className="text-[11px] text-text-secondary uppercase mt-1 font-bold tracking-wider">
                  Total Mensuel
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-secondary">
              <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center mb-4">
                <ChevronRight size={20} />
              </div>
              <p className="text-[13px] font-medium">Sélectionnez un compte "Infos" pour voir les détails et collaborations</p>
            </div>
          )}
        </aside>
      </main>

      {/* Mobile Sidebar Overlay (if needed, but design is desktop-centric) */}
      <AnimatePresence>
        {selectedAccount && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAccount(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative w-[320px] h-full bg-bg border-l border-border p-6 shadow-2xl overflow-y-auto"
            >
              {/* Re-using the same sidebar content logic here for mobile */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setSelectedAccount(null)} className="text-text-secondary hover:text-white">
                    <ArrowLeft size={20} />
                  </button>
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    isAccountValidated(selectedAccount) 
                      ? 'bg-accent-green/10 text-accent-green border border-accent-green/20' 
                      : 'bg-accent-red/10 text-accent-red border border-accent-red/20'
                  }`}>
                    {isAccountValidated(selectedAccount) ? 'Validé' : 'Non validé'}
                  </div>
                </div>
                
                <h2 className="text-[20px] font-bold mb-1">{selectedAccount}</h2>
                <div className="mt-4 flex justify-between text-[11px] font-mono text-text-secondary">
                  <span>Statut quotidien</span>
                  <span>{isAccountValidated(selectedAccount) ? `Expire dans ${getTimeRemaining(getAccountState(selectedAccount).lastValidated)}` : 'Expire dans 24h'}</span>
                </div>

                <button
                  onClick={() => toggleValidation(selectedAccount)}
                  className="w-full mt-4 py-3 rounded-md font-bold text-[14px] transition-all bg-white text-black"
                >
                  {isAccountValidated(selectedAccount) ? 'ANNULER LA PUBLICATION' : 'VALIDER LA PUBLICATION'}
                </button>

                <div className="text-[11px] uppercase tracking-[0.1em] text-text-secondary mt-8 mb-3 font-bold">
                  Collaboration
                </div>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as any).collabName;
                    addCollaborator(selectedAccount, input.value);
                    input.value = '';
                  }}
                  className="flex gap-2 mb-5"
                >
                  <input 
                    name="collabName"
                    type="text"
                    placeholder="Nom..."
                    className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-[12px] text-white"
                  />
                  <button type="submit" className="bg-text-primary text-bg px-3 rounded-md font-bold text-[18px]">+</button>
                </form>

                <ul className="mb-4 space-y-0">
                  {getAccountState(selectedAccount).collaborators.map((c) => (
                    <li key={c.id} className="flex justify-between items-center py-2.5 border-b border-border text-[13px]">
                      <span className={c.active ? 'text-text-primary' : 'text-text-secondary line-through opacity-50'}>
                        {c.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={`text-[12px] ${c.active ? 'text-text-secondary' : 'text-text-secondary/30'}`}>50 €</span>
                        <button 
                          onClick={() => toggleCollaboratorStatus(selectedAccount, c.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                            c.active 
                              ? 'bg-accent-red/10 text-accent-red' 
                              : 'bg-accent-green/10 text-accent-green'
                          }`}
                        >
                          {c.active ? 'ANNULER' : 'ACTIVER'}
                        </button>
                        <button onClick={() => removeCollaborator(selectedAccount, c.id)} className="text-text-secondary"><Trash2 size={14} /></button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-border p-5 rounded-xl text-center">
                  <div className="text-[28px] font-extrabold text-text-primary">
                    {getAccountState(selectedAccount).collaborators.filter(c => c.active).length * 50} €
                  </div>
                  <div className="text-[11px] text-text-secondary uppercase mt-1 font-bold">Total Mensuel</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
