export interface Collaborator {
  id: string;
  name: string;
}

export interface AccountState {
  lastValidated: number | null; // Timestamp
  collaborators: Collaborator[];
}

export interface Account {
  id: string;
  name: string;
  isInfos: boolean;
}

export type FilterType = 'all' | 'validated' | 'pending';

export const SNAPCHAT_ACCOUNTS: string[] = [
  "vannes infos",
  "LAYI Agency",
  "Marseille infos",
  "sarcelles infos",
  "infos 77",
  "Rouen infos",
  "Le havre infos",
  "Rennes infos",
  "veripiya",
  "Melli création",
  "Niya digital",
  "rohff",
  "Jarry",
  "imen es",
  "lH conciergerie",
  "Attou",
  "Comores Mayotte",
  "angel",
  "Gims"
];
