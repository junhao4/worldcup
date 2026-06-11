import type { Group, Match, StandingsRow, Team } from '../../../types/tournament';
import type { MatchPrediction } from '../../../types/prediction';
import { computeGroupStandings } from '../../../engine';

const fifaToIso: Record<string, string> = {
  MEX: 'mx', RSA: 'za', KOR: 'kr', CZE: 'cz', CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  BRA: 'br', MAR: 'ma', HAI: 'ht', SCO: 'gb-sct', USA: 'us', PAR: 'py', AUS: 'au', TUR: 'tr',
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec', NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  BEL: 'be', EGY: 'eg', IRN: 'ir', NZL: 'nz', ESP: 'es', CPV: 'cv', KSA: 'sa', URU: 'uy',
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no', ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co', ENG: 'gb-eng', CRO: 'hr', GHA: 'gh', PAN: 'pa',
};

export interface GroupStandingsPanelProps {
  readonly group: Group;
  readonly matches: Match[];
  readonly predictions: MatchPrediction[];
  readonly teams: Team[];
}

const positionColors: Record<number, string> = {
  1: '#059669',
  2: '#059669',
  3: '#d97706',
};

function getQualifyAttr(position: number): string {
  if (position <= 2) return 'yes';
  if (position === 3) return 'maybe';
  return 'no';
}

export function GroupStandingsPanel({ group, matches, predictions, teams }: GroupStandingsPanelProps) {
  const groupMatches = matches.filter((m) => m.groupId === group.id);
  const standings: StandingsRow[] = computeGroupStandings(groupMatches, predictions);
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return (
    <div className="panel" data-testid={`group-standings-${group.id}`}>
      <div className="panel__header">
        <h3 className="panel__title">{group.name}</h3>
      </div>
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row, idx) => {
            const position = idx + 1;
            const team = teamMap.get(row.teamId);
            const iso = team ? fifaToIso[team.fifaCode] : undefined;
            const color = positionColors[position];
            return (
              <tr
                key={row.teamId}
                data-testid={`standing-row-${row.teamId}`}
                data-position={position}
                data-qualify={getQualifyAttr(position)}
              >
                <td>
                  <span style={{ color: color ?? 'var(--ink-soft)', fontWeight: 800 }}>
                    {position}
                  </span>
                </td>
                <td>
                  <span className="team-cell">
                    {iso ? (
                      <img className="flag-img" src={`/flags/${iso}.svg`} alt="" width={40} height={30} />
                    ) : (
                      <span className="flag">{team?.fifaCode ?? ''}</span>
                    )}
                    {team?.name ?? row.teamId}
                  </span>
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                <td><strong>{row.points}</strong></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
