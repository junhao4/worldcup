export interface NavigationItem {
  label: string;
  href: string;
  isComplete?: boolean;
}

export interface TeamScore {
  flag: string;
  name: string;
  score: number;
}

export interface MatchPrediction {
  id: string;
  date: string;
  home: TeamScore;
  away: TeamScore;
  stage: string;
  status: 'empty' | 'predicted';
  venue: string;
}

export interface StandingRow {
  draw: number;
  flag: string;
  gd: number;
  loss: number;
  played: number;
  points: number;
  position: number;
  team: string;
  win: number;
}

export interface PredictionCardData {
  champion: string;
  creator: string;
  route: string[];
  subtitle: string;
  title: string;
}

export interface ThemeOption {
  id: string;
  label: string;
  selected?: boolean;
  tone: 'gold' | 'green' | 'midnight' | 'mint';
}

export interface BracketMatch {
  away: TeamScore;
  home: TeamScore;
  id: string;
  round: string;
  winner: string;
}

export interface InfoTileData {
  label: string;
  value: string;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Groups', href: '#groups', isComplete: true },
  { label: 'Predictions', href: '#predictions' },
  { label: 'Knockouts', href: '#knockouts' },
  { label: 'Export', href: '#export' },
];

export const standingsRows: StandingRow[] = [
  { position: 1, flag: 'MX', team: 'Mexico', played: 3, win: 2, draw: 1, loss: 0, gd: 4, points: 7 },
  { position: 2, flag: 'CA', team: 'Canada', played: 3, win: 1, draw: 2, loss: 0, gd: 2, points: 5 },
  { position: 3, flag: 'ZA', team: 'South Africa', played: 3, win: 1, draw: 0, loss: 2, gd: -1, points: 3 },
  { position: 4, flag: 'KR', team: 'Korea Republic', played: 3, win: 0, draw: 1, loss: 2, gd: -5, points: 1 },
];

export const matchPredictions: MatchPrediction[] = [
  {
    id: 'mex-can',
    stage: 'Group A',
    date: 'Jun 11, 2026',
    venue: 'Estadio Azteca',
    status: 'predicted',
    home: { flag: 'MX', name: 'Mexico', score: 2 },
    away: { flag: 'CA', name: 'Canada', score: 1 },
  },
  {
    id: 'rsa-kor',
    stage: 'Group A',
    date: 'Jun 12, 2026',
    venue: 'BC Place',
    status: 'empty',
    home: { flag: 'ZA', name: 'South Africa', score: 1 },
    away: { flag: 'KR', name: 'Korea Republic', score: 1 },
  },
];

export const bracketMatches: BracketMatch[] = [
  {
    id: 'qf-01',
    round: 'Quarterfinal',
    winner: 'Mexico',
    home: { flag: 'MX', name: 'Mexico', score: 2 },
    away: { flag: 'US', name: 'United States', score: 1 },
  },
  {
    id: 'sf-01',
    round: 'Semifinal',
    winner: 'Brazil',
    home: { flag: 'BR', name: 'Brazil', score: 3 },
    away: { flag: 'DE', name: 'Germany', score: 2 },
  },
];

export const predictionCard: PredictionCardData = {
  title: 'My 2026 World Cup Path',
  subtitle: 'Full tournament score predictions',
  champion: 'Brazil',
  route: ['Mexico', 'Argentina', 'Brazil'],
  creator: 'Jun Hao',
};

export const themeOptions: ThemeOption[] = [
  { id: 'emerald', label: 'Emerald', tone: 'green', selected: true },
  { id: 'gold', label: 'Gold Cup', tone: 'gold' },
  { id: 'midnight', label: 'Midnight', tone: 'midnight' },
  { id: 'mint', label: 'Mint', tone: 'mint' },
];

export const infoTiles: InfoTileData[] = [
  { label: 'Predicted', value: '48 matches' },
  { label: 'Accuracy mode', value: 'Scoreline' },
  { label: 'Export size', value: '1080 px' },
];
