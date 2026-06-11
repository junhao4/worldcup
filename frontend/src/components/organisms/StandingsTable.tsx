import type { StandingRow } from '../../data/mockData';
import type { StandingsRow } from '../../types/tournament';
import { FlagBadge } from '../atoms/FlagBadge';
import { Card, CardHeader, CardTitle } from '../ui/card';

export interface StandingsTableProps extends Readonly<{
  rows?: StandingRow[];
  liveRows?: StandingsRow[];
  teamNames?: Map<string, string>;
  title: string;
}> {}

/** Supports both mock StandingRow[] and live StandingsRow[] from engine */
export function StandingsTable({ rows, liveRows, teamNames, title }: StandingsTableProps) {
  return (
    <Card variant="panel">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <table className="standings-table">
        <thead>
          <tr>
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
          {liveRows
            ? liveRows.map((row, i) => (
                <tr key={row.teamId}>
                  <td>
                    <span className="team-cell">
                      <strong>{i + 1}</strong>
                      {teamNames?.get(row.teamId) ?? row.teamId}
                    </span>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.won}</td>
                  <td>{row.drawn}</td>
                  <td>{row.lost}</td>
                  <td>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  <td>{row.points}</td>
                </tr>
              ))
            : rows?.map((row) => (
                <tr key={row.team}>
                  <td>
                    <span className="team-cell">
                      <strong>{row.position}</strong>
                      <FlagBadge code={row.flag} label={row.team} />
                      {row.team}
                    </span>
                  </td>
                  <td>{row.played}</td>
                  <td>{row.win}</td>
                  <td>{row.draw}</td>
                  <td>{row.loss}</td>
                  <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                  <td>{row.points}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </Card>
  );
}
