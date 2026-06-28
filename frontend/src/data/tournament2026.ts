import type { Tournament, Team, Group, Match } from '../types/tournament';

const teams: Team[] = [
  // Group A
  { id: 'mex', name: 'Mexico', fifaCode: 'MEX', confederation: 'CONCACAF', flagAsset: '/flags/mex.svg' },
  { id: 'rsa', name: 'South Africa', fifaCode: 'RSA', confederation: 'CAF', flagAsset: '/flags/rsa.svg' },
  { id: 'kor', name: 'South Korea', fifaCode: 'KOR', confederation: 'AFC', flagAsset: '/flags/kor.svg' },
  { id: 'cze', name: 'Czech Republic', fifaCode: 'CZE', confederation: 'UEFA', flagAsset: '/flags/cze.svg' },
  // Group B
  { id: 'can', name: 'Canada', fifaCode: 'CAN', confederation: 'CONCACAF', flagAsset: '/flags/can.svg' },
  { id: 'bih', name: 'Bosnia & Herzegovina', fifaCode: 'BIH', confederation: 'UEFA', flagAsset: '/flags/bih.svg' },
  { id: 'qat', name: 'Qatar', fifaCode: 'QAT', confederation: 'AFC', flagAsset: '/flags/qat.svg' },
  { id: 'sui', name: 'Switzerland', fifaCode: 'SUI', confederation: 'UEFA', flagAsset: '/flags/sui.svg' },
  // Group C
  { id: 'bra', name: 'Brazil', fifaCode: 'BRA', confederation: 'CONMEBOL', flagAsset: '/flags/bra.svg' },
  { id: 'mar', name: 'Morocco', fifaCode: 'MAR', confederation: 'CAF', flagAsset: '/flags/mar.svg' },
  { id: 'hai', name: 'Haiti', fifaCode: 'HAI', confederation: 'CONCACAF', flagAsset: '/flags/hai.svg' },
  { id: 'sco', name: 'Scotland', fifaCode: 'SCO', confederation: 'UEFA', flagAsset: '/flags/sco.svg' },
  // Group D
  { id: 'usa', name: 'United States', fifaCode: 'USA', confederation: 'CONCACAF', flagAsset: '/flags/usa.svg' },
  { id: 'par', name: 'Paraguay', fifaCode: 'PAR', confederation: 'CONMEBOL', flagAsset: '/flags/par.svg' },
  { id: 'aus', name: 'Australia', fifaCode: 'AUS', confederation: 'AFC', flagAsset: '/flags/aus.svg' },
  { id: 'tur', name: 'Turkey', fifaCode: 'TUR', confederation: 'UEFA', flagAsset: '/flags/tur.svg' },
  // Group E
  { id: 'ger', name: 'Germany', fifaCode: 'GER', confederation: 'UEFA', flagAsset: '/flags/ger.svg' },
  { id: 'cur', name: 'Curaçao', fifaCode: 'CUW', confederation: 'CONCACAF', flagAsset: '/flags/cur.svg' },
  { id: 'civ', name: 'Ivory Coast', fifaCode: 'CIV', confederation: 'CAF', flagAsset: '/flags/civ.svg' },
  { id: 'ecu', name: 'Ecuador', fifaCode: 'ECU', confederation: 'CONMEBOL', flagAsset: '/flags/ecu.svg' },
  // Group F
  { id: 'ned', name: 'Netherlands', fifaCode: 'NED', confederation: 'UEFA', flagAsset: '/flags/ned.svg' },
  { id: 'jpn', name: 'Japan', fifaCode: 'JPN', confederation: 'AFC', flagAsset: '/flags/jpn.svg' },
  { id: 'swe', name: 'Sweden', fifaCode: 'SWE', confederation: 'UEFA', flagAsset: '/flags/swe.svg' },
  { id: 'tun', name: 'Tunisia', fifaCode: 'TUN', confederation: 'CAF', flagAsset: '/flags/tun.svg' },
  // Group G
  { id: 'bel', name: 'Belgium', fifaCode: 'BEL', confederation: 'UEFA', flagAsset: '/flags/bel.svg' },
  { id: 'egy', name: 'Egypt', fifaCode: 'EGY', confederation: 'CAF', flagAsset: '/flags/egy.svg' },
  { id: 'irn', name: 'Iran', fifaCode: 'IRN', confederation: 'AFC', flagAsset: '/flags/irn.svg' },
  { id: 'nzl', name: 'New Zealand', fifaCode: 'NZL', confederation: 'OFC', flagAsset: '/flags/nzl.svg' },
  // Group H
  { id: 'esp', name: 'Spain', fifaCode: 'ESP', confederation: 'UEFA', flagAsset: '/flags/esp.svg' },
  { id: 'cpv', name: 'Cape Verde', fifaCode: 'CPV', confederation: 'CAF', flagAsset: '/flags/cpv.svg' },
  { id: 'ksa', name: 'Saudi Arabia', fifaCode: 'KSA', confederation: 'AFC', flagAsset: '/flags/ksa.svg' },
  { id: 'uru', name: 'Uruguay', fifaCode: 'URU', confederation: 'CONMEBOL', flagAsset: '/flags/uru.svg' },
  // Group I
  { id: 'fra', name: 'France', fifaCode: 'FRA', confederation: 'UEFA', flagAsset: '/flags/fra.svg' },
  { id: 'sen', name: 'Senegal', fifaCode: 'SEN', confederation: 'CAF', flagAsset: '/flags/sen.svg' },
  { id: 'irq', name: 'Iraq', fifaCode: 'IRQ', confederation: 'AFC', flagAsset: '/flags/irq.svg' },
  { id: 'nor', name: 'Norway', fifaCode: 'NOR', confederation: 'UEFA', flagAsset: '/flags/nor.svg' },
  // Group J
  { id: 'arg', name: 'Argentina', fifaCode: 'ARG', confederation: 'CONMEBOL', flagAsset: '/flags/arg.svg' },
  { id: 'alg', name: 'Algeria', fifaCode: 'ALG', confederation: 'CAF', flagAsset: '/flags/alg.svg' },
  { id: 'aut', name: 'Austria', fifaCode: 'AUT', confederation: 'UEFA', flagAsset: '/flags/aut.svg' },
  { id: 'jor', name: 'Jordan', fifaCode: 'JOR', confederation: 'AFC', flagAsset: '/flags/jor.svg' },
  // Group K
  { id: 'por', name: 'Portugal', fifaCode: 'POR', confederation: 'UEFA', flagAsset: '/flags/por.svg' },
  { id: 'cod', name: 'DR Congo', fifaCode: 'COD', confederation: 'CAF', flagAsset: '/flags/cod.svg' },
  { id: 'uzb', name: 'Uzbekistan', fifaCode: 'UZB', confederation: 'AFC', flagAsset: '/flags/uzb.svg' },
  { id: 'col', name: 'Colombia', fifaCode: 'COL', confederation: 'CONMEBOL', flagAsset: '/flags/col.svg' },
  // Group L
  { id: 'eng', name: 'England', fifaCode: 'ENG', confederation: 'UEFA', flagAsset: '/flags/eng.svg' },
  { id: 'cro', name: 'Croatia', fifaCode: 'CRO', confederation: 'UEFA', flagAsset: '/flags/cro.svg' },
  { id: 'gha', name: 'Ghana', fifaCode: 'GHA', confederation: 'CAF', flagAsset: '/flags/gha.svg' },
  { id: 'pan', name: 'Panama', fifaCode: 'PAN', confederation: 'CONCACAF', flagAsset: '/flags/pan.svg' },
];

const groups: Group[] = [
  { id: 'A', name: 'Group A', teamIds: ['mex', 'rsa', 'kor', 'cze'] },
  { id: 'B', name: 'Group B', teamIds: ['can', 'bih', 'qat', 'sui'] },
  { id: 'C', name: 'Group C', teamIds: ['bra', 'mar', 'hai', 'sco'] },
  { id: 'D', name: 'Group D', teamIds: ['usa', 'par', 'aus', 'tur'] },
  { id: 'E', name: 'Group E', teamIds: ['ger', 'cur', 'civ', 'ecu'] },
  { id: 'F', name: 'Group F', teamIds: ['ned', 'jpn', 'swe', 'tun'] },
  { id: 'G', name: 'Group G', teamIds: ['bel', 'egy', 'irn', 'nzl'] },
  { id: 'H', name: 'Group H', teamIds: ['esp', 'cpv', 'ksa', 'uru'] },
  { id: 'I', name: 'Group I', teamIds: ['fra', 'sen', 'irq', 'nor'] },
  { id: 'J', name: 'Group J', teamIds: ['arg', 'alg', 'aut', 'jor'] },
  { id: 'K', name: 'Group K', teamIds: ['por', 'cod', 'uzb', 'col'] },
  { id: 'L', name: 'Group L', teamIds: ['eng', 'cro', 'gha', 'pan'] },
];

const singaporeKickoffs: Record<string, string> = {
  'g-A-1': '2026-06-12T03:00:00+08:00',
  'g-A-2': '2026-06-12T10:00:00+08:00',
  'g-A-3': '2026-06-19T09:00:00+08:00',
  'g-A-4': '2026-06-19T00:00:00+08:00',
  'g-A-5': '2026-06-25T09:00:00+08:00',
  'g-A-6': '2026-06-25T09:00:00+08:00',
  'g-B-7': '2026-06-13T03:00:00+08:00',
  'g-B-8': '2026-06-14T03:00:00+08:00',
  'g-B-9': '2026-06-19T06:00:00+08:00',
  'g-B-10': '2026-06-19T03:00:00+08:00',
  'g-B-11': '2026-06-25T03:00:00+08:00',
  'g-B-12': '2026-06-25T03:00:00+08:00',
  'g-C-13': '2026-06-14T06:00:00+08:00',
  'g-C-14': '2026-06-14T09:00:00+08:00',
  'g-C-15': '2026-06-20T08:30:00+08:00',
  'g-C-16': '2026-06-20T06:00:00+08:00',
  'g-C-17': '2026-06-25T06:00:00+08:00',
  'g-C-18': '2026-06-25T06:00:00+08:00',
  'g-D-19': '2026-06-13T09:00:00+08:00',
  'g-D-20': '2026-06-14T12:00:00+08:00',
  'g-D-21': '2026-06-20T03:00:00+08:00',
  'g-D-22': '2026-06-20T11:00:00+08:00',
  'g-D-23': '2026-06-26T10:00:00+08:00',
  'g-D-24': '2026-06-26T10:00:00+08:00',
  'g-E-25': '2026-06-15T01:00:00+08:00',
  'g-E-26': '2026-06-15T07:00:00+08:00',
  'g-E-27': '2026-06-21T04:00:00+08:00',
  'g-E-28': '2026-06-21T08:00:00+08:00',
  'g-E-29': '2026-06-26T04:00:00+08:00',
  'g-E-30': '2026-06-26T04:00:00+08:00',
  'g-F-31': '2026-06-15T04:00:00+08:00',
  'g-F-32': '2026-06-15T10:00:00+08:00',
  'g-F-33': '2026-06-21T01:00:00+08:00',
  'g-F-34': '2026-06-21T12:00:00+08:00',
  'g-F-35': '2026-06-26T07:00:00+08:00',
  'g-F-36': '2026-06-26T07:00:00+08:00',
  'g-G-37': '2026-06-16T03:00:00+08:00',
  'g-G-38': '2026-06-16T09:00:00+08:00',
  'g-G-39': '2026-06-22T03:00:00+08:00',
  'g-G-40': '2026-06-22T09:00:00+08:00',
  'g-G-41': '2026-06-27T11:00:00+08:00',
  'g-G-42': '2026-06-27T11:00:00+08:00',
  'g-H-43': '2026-06-16T00:00:00+08:00',
  'g-H-44': '2026-06-16T06:00:00+08:00',
  'g-H-45': '2026-06-22T00:00:00+08:00',
  'g-H-46': '2026-06-22T06:00:00+08:00',
  'g-H-47': '2026-06-27T08:00:00+08:00',
  'g-H-48': '2026-06-27T08:00:00+08:00',
  'g-I-49': '2026-06-17T03:00:00+08:00',
  'g-I-50': '2026-06-17T06:00:00+08:00',
  'g-I-51': '2026-06-23T05:00:00+08:00',
  'g-I-52': '2026-06-23T08:00:00+08:00',
  'g-I-53': '2026-06-27T03:00:00+08:00',
  'g-I-54': '2026-06-27T03:00:00+08:00',
  'g-J-55': '2026-06-17T09:00:00+08:00',
  'g-J-56': '2026-06-17T12:00:00+08:00',
  'g-J-57': '2026-06-23T01:00:00+08:00',
  'g-J-58': '2026-06-23T11:00:00+08:00',
  'g-J-59': '2026-06-28T10:00:00+08:00',
  'g-J-60': '2026-06-28T10:00:00+08:00',
  'g-K-61': '2026-06-18T01:00:00+08:00',
  'g-K-62': '2026-06-18T10:00:00+08:00',
  'g-K-63': '2026-06-24T01:00:00+08:00',
  'g-K-64': '2026-06-24T10:00:00+08:00',
  'g-K-65': '2026-06-28T07:30:00+08:00',
  'g-K-66': '2026-06-28T07:30:00+08:00',
  'g-L-67': '2026-06-18T04:00:00+08:00',
  'g-L-68': '2026-06-18T07:00:00+08:00',
  'g-L-69': '2026-06-24T04:00:00+08:00',
  'g-L-70': '2026-06-24T07:00:00+08:00',
  'g-L-71': '2026-06-28T05:00:00+08:00',
  'g-L-72': '2026-06-28T05:00:00+08:00',
  'r32-3': '2026-06-29T03:00:00+08:00',
  'r32-1': '2026-06-30T01:00:00+08:00',
  'r32-4': '2026-06-30T04:30:00+08:00',
  'r32-9': '2026-06-30T09:00:00+08:00',
  'r32-2': '2026-07-01T01:00:00+08:00',
  'r32-10': '2026-07-01T05:00:00+08:00',
  'r32-11': '2026-07-01T09:00:00+08:00',
  'r32-12': '2026-07-02T00:00:00+08:00',
  'r32-7': '2026-07-02T04:00:00+08:00',
  'r32-8': '2026-07-02T08:00:00+08:00',
  'r32-5': '2026-07-03T03:00:00+08:00',
  'r32-6': '2026-07-03T07:00:00+08:00',
  'r32-15': '2026-07-03T11:00:00+08:00',
  'r32-13': '2026-07-04T02:00:00+08:00',
  'r32-16': '2026-07-04T06:00:00+08:00',
  'r32-14': '2026-07-04T09:30:00+08:00',
  'r16-2': '2026-07-05T01:00:00+08:00',
  'r16-1': '2026-07-05T05:00:00+08:00',
  'r16-5': '2026-07-06T04:00:00+08:00',
  'r16-6': '2026-07-06T08:00:00+08:00',
  'r16-3': '2026-07-07T03:00:00+08:00',
  'r16-4': '2026-07-07T08:00:00+08:00',
  'r16-7': '2026-07-08T00:00:00+08:00',
  'r16-8': '2026-07-08T04:00:00+08:00',
  'qf-1': '2026-07-10T04:00:00+08:00',
  'qf-3': '2026-07-11T03:00:00+08:00',
  'qf-2': '2026-07-12T05:00:00+08:00',
  'qf-4': '2026-07-12T09:00:00+08:00',
  'sf-1': '2026-07-15T03:00:00+08:00',
  'sf-2': '2026-07-16T03:00:00+08:00',
  'tp-1': '2026-07-19T05:00:00+08:00',
  'final-1': '2026-07-20T03:00:00+08:00',
};

function withSingaporeKickoff(match: Match): Match {
  return {
    ...match,
    kickoffAt: singaporeKickoffs[match.id],
    kickoffTimeZone: 'Asia/Singapore',
  };
}

function buildGroupMatches(): Match[] {
  const matches: Match[] = [];
  let order = 1;
  for (const group of groups) {
    const t = group.teamIds;
    // Round-robin: 6 matches per group (4 teams)
    const pairs: [number, number][] = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
    for (const [h, a] of pairs) {
      matches.push(withSingaporeKickoff({
        id: `g-${group.id}-${order}`,
        stage: 'group',
        roundOrder: order,
        groupId: group.id,
        homeTeamId: t[h],
        awayTeamId: t[a],
        knockout: false,
      }));
      order++;
    }
  }
  return matches;
}

function buildKnockoutMatches(startOrder: number): Match[] {
  const knockoutIds = [
    'r32-3', 'r32-1', 'r32-4', 'r32-9', 'r32-2', 'r32-10', 'r32-11', 'r32-12',
    'r32-7', 'r32-8', 'r32-5', 'r32-6', 'r32-15', 'r32-13', 'r32-16', 'r32-14',
    'r16-2', 'r16-1', 'r16-5', 'r16-6', 'r16-3', 'r16-4', 'r16-7', 'r16-8',
    'qf-1', 'qf-3', 'qf-2', 'qf-4',
    'sf-1', 'sf-2',
    'tp-1',
    'final-1',
  ] as const;

  const stageForId = (matchId: string): Match['stage'] => {
    if (matchId.startsWith('r32-')) return 'round-of-32';
    if (matchId.startsWith('r16-')) return 'round-of-16';
    if (matchId.startsWith('qf-')) return 'quarterfinal';
    if (matchId.startsWith('sf-')) return 'semifinal';
    if (matchId.startsWith('tp-')) return 'third-place';
    return 'final';
  };

  return knockoutIds.map((matchId, index) => withSingaporeKickoff({
    id: matchId,
    stage: stageForId(matchId),
    roundOrder: startOrder + index,
    groupId: null,
    homeTeamId: `${matchId}-home`,
    awayTeamId: `${matchId}-away`,
    knockout: true,
  }));
}

const groupMatches = buildGroupMatches(); // 72 matches
const knockoutMatches = buildKnockoutMatches(groupMatches.length + 1); // 32 matches
const allMatches = [...groupMatches, ...knockoutMatches]; // 104 total

export const tournament2026: Tournament = {
  id: 'world-cup-2026',
  name: 'FIFA World Cup 2026',
  year: 2026,
  teams,
  groups,
  matches: allMatches as Tournament['matches'],
};
