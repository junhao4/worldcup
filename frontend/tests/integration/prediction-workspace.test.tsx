import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ScoreInput } from '../../src/features/predictions/components/ScoreInput';
import { AdvancementPicker } from '../../src/features/predictions/components/AdvancementPicker';
import { GroupStandingsPanel } from '../../src/features/predictions/components/GroupStandingsPanel';
import { KnockoutBracketView } from '../../src/features/predictions/components/KnockoutBracketView';
import type { Match, Group, Team } from '../../src/types/tournament';
import type { MatchPrediction } from '../../src/types/prediction';
import type { MatchPredictionBreakdown } from '../../src/engine';

const groupMatch: Match = {
  id: 'g-A-1',
  stage: 'group',
  roundOrder: 1,
  groupId: 'A',
  homeTeamId: 'usa',
  awayTeamId: 'mex',
  knockout: false,
};

const knockoutMatch: Match = {
  id: 'r32-1',
  stage: 'round-of-32',
  roundOrder: 73,
  groupId: null,
  homeTeamId: 'usa',
  awayTeamId: 'mex',
  knockout: true,
};

const teams: Team[] = [
  { id: 'usa', name: 'United States', fifaCode: 'USA', confederation: 'CONCACAF', flagAsset: '/flags/usa.svg' },
  { id: 'mex', name: 'Mexico', fifaCode: 'MEX', confederation: 'CONCACAF', flagAsset: '/flags/mex.svg' },
  { id: 'uru', name: 'Uruguay', fifaCode: 'URU', confederation: 'CONMEBOL', flagAsset: '/flags/uru.svg' },
  { id: 'mal', name: 'Mali', fifaCode: 'MLI', confederation: 'CAF', flagAsset: '/flags/mal.svg' },
];

const groupA: Group = { id: 'A', name: 'Group A', teamIds: ['usa', 'mex', 'uru', 'mal'] };

describe('ScoreInput', () => {
  it('renders home and away score inputs with labels', () => {
    const onChange = vi.fn();
    render(
      <ScoreInput
        match={groupMatch}
        prediction={undefined}
        onScoreChange={onChange}
        homeLabel="United States"
        awayLabel="Mexico"
      />,
    );
    expect(screen.getByLabelText('United States score')).toBeInTheDocument();
    expect(screen.getByLabelText('Mexico score')).toBeInTheDocument();
  });

  it('calls onScoreChange when both scores are entered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ScoreInput
        match={groupMatch}
        prediction={undefined}
        onScoreChange={onChange}
        homeLabel="United States"
        awayLabel="Mexico"
      />,
    );
    const homeInput = screen.getByLabelText('United States score');
    const awayInput = screen.getByLabelText('Mexico score');
    await user.type(homeInput, '2');
    await user.type(awayInput, '1');
    expect(onChange).toHaveBeenCalledWith('g-A-1', 2, 1);
  });

  it('shows advancement picker for knockout ties', () => {
    const onScore = vi.fn();
    const onAdvance = vi.fn();
    const tiePrediction: MatchPrediction = {
      matchId: 'r32-1',
      homeScore: 1,
      awayScore: 1,
      advancingTeamId: null,
    };
    render(
      <ScoreInput
        match={knockoutMatch}
        prediction={tiePrediction}
        onScoreChange={onScore}
        onAdvancingTeamChange={onAdvance}
        homeLabel="United States"
        awayLabel="Mexico"
      />,
    );
    expect(screen.getByRole('group', { name: 'Select advancing team' })).toBeInTheDocument();
  });

  it('does not show advancement picker for non-tied knockout match', () => {
    const onScore = vi.fn();
    const onAdvance = vi.fn();
    const winPrediction: MatchPrediction = {
      matchId: 'r32-1',
      homeScore: 2,
      awayScore: 1,
      advancingTeamId: null,
    };
    render(
      <ScoreInput
        match={knockoutMatch}
        prediction={winPrediction}
        onScoreChange={onScore}
        onAdvancingTeamChange={onAdvance}
        homeLabel="United States"
        awayLabel="Mexico"
      />,
    );
    expect(screen.queryByRole('group', { name: 'Select advancing team' })).not.toBeInTheDocument();
  });

  it('shows a per-match score breakdown tooltip for scored matches', () => {
    const breakdown: MatchPredictionBreakdown = {
      resultPoints: 2,
      goalDifferencePoints: 1,
      exactScorePoints: 0,
      totalPoints: 3,
    };

    render(
      <ScoreInput
        match={{ ...groupMatch, result: { homeScore: 2, awayScore: 1 } }}
        prediction={{ matchId: 'g-A-1', homeScore: 1, awayScore: 0, advancingTeamId: null }}
        onScoreChange={vi.fn()}
        homeLabel="United States"
        awayLabel="Mexico"
        officialResult={{ homeScore: 2, awayScore: 1 }}
        earnedPoints={3}
        scoreBreakdown={breakdown}
      />,
    );

    expect(screen.getByLabelText('Explain match score breakdown')).toBeInTheDocument();
    expect(screen.getByText('Result: 2/2')).toBeInTheDocument();
    expect(screen.getByText('Goal difference: 1/2')).toBeInTheDocument();
    expect(screen.getByText('Scoreline: 0/1')).toBeInTheDocument();
    expect(screen.getByText('Total: 3/5')).toBeInTheDocument();
  });
});

describe('AdvancementPicker', () => {
  it('renders both team buttons', () => {
    const onSelect = vi.fn();
    render(
      <AdvancementPicker
        matchId="r32-1"
        homeTeamId="usa"
        awayTeamId="mex"
        homeLabel="United States"
        awayLabel="Mexico"
        selectedTeamId={null}
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('button', { name: 'United States' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mexico' })).toBeInTheDocument();
  });

  it('calls onSelect with correct teamId on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AdvancementPicker
        matchId="r32-1"
        homeTeamId="usa"
        awayTeamId="mex"
        homeLabel="United States"
        awayLabel="Mexico"
        selectedTeamId={null}
        onSelect={onSelect}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Mexico' }));
    expect(onSelect).toHaveBeenCalledWith('r32-1', 'mex');
  });

  it('marks selected team with aria-pressed', () => {
    const onSelect = vi.fn();
    render(
      <AdvancementPicker
        matchId="r32-1"
        homeTeamId="usa"
        awayTeamId="mex"
        homeLabel="United States"
        awayLabel="Mexico"
        selectedTeamId="usa"
        onSelect={onSelect}
      />,
    );
    expect(screen.getByRole('button', { name: 'United States' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Mexico' })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('GroupStandingsPanel', () => {
  it('renders standings table with team names sorted by points', () => {
    const matches: Match[] = [
      { id: 'g-A-1', stage: 'group', roundOrder: 1, groupId: 'A', homeTeamId: 'usa', awayTeamId: 'mex', knockout: false },
      { id: 'g-A-2', stage: 'group', roundOrder: 2, groupId: 'A', homeTeamId: 'uru', awayTeamId: 'mal', knockout: false },
    ];
    const predictions: MatchPrediction[] = [
      { matchId: 'g-A-1', homeScore: 2, awayScore: 0, advancingTeamId: null },
      { matchId: 'g-A-2', homeScore: 1, awayScore: 1, advancingTeamId: null },
    ];
    render(
      <GroupStandingsPanel group={groupA} matches={matches} predictions={predictions} teams={teams} />,
    );
    expect(screen.getByTestId('group-standings-A')).toBeInTheDocument();
    // USA won, should be top with 3pts
    const rows = screen.getAllByTestId(/^standing-row-/);
    expect(rows[0]).toHaveAttribute('data-testid', 'standing-row-usa');
  });

  it('updates standings when predictions change', () => {
    const matches: Match[] = [
      { id: 'g-A-1', stage: 'group', roundOrder: 1, groupId: 'A', homeTeamId: 'usa', awayTeamId: 'mex', knockout: false },
    ];
    const predictions: MatchPrediction[] = [
      { matchId: 'g-A-1', homeScore: 0, awayScore: 3, advancingTeamId: null },
    ];
    render(
      <GroupStandingsPanel group={groupA} matches={matches} predictions={predictions} teams={teams} />,
    );
    const rows = screen.getAllByTestId(/^standing-row-/);
    // MEX won => top
    expect(rows[0]).toHaveAttribute('data-testid', 'standing-row-mex');
  });

  it('defaults to predicted standings even when official results exist', () => {
    const matches: Match[] = [
      {
        id: 'g-A-1',
        stage: 'group',
        roundOrder: 1,
        groupId: 'A',
        homeTeamId: 'usa',
        awayTeamId: 'mex',
        knockout: false,
        result: { homeScore: 0, awayScore: 2 },
      },
    ];
    const predictions: MatchPrediction[] = [
      { matchId: 'g-A-1', homeScore: 3, awayScore: 0, advancingTeamId: null },
    ];

    render(
      <GroupStandingsPanel group={groupA} matches={matches} predictions={predictions} teams={teams} />,
    );

    const rows = screen.getAllByTestId(/^standing-row-/);
    expect(rows[0]).toHaveAttribute('data-testid', 'standing-row-usa');
  });

  it('toggles between predicted and actual standings tables', async () => {
    const user = userEvent.setup();
    const matches: Match[] = [
      {
        id: 'g-A-1',
        stage: 'group',
        roundOrder: 1,
        groupId: 'A',
        homeTeamId: 'usa',
        awayTeamId: 'mex',
        knockout: false,
        result: { homeScore: 0, awayScore: 2 },
      },
    ];
    const predictions: MatchPrediction[] = [
      { matchId: 'g-A-1', homeScore: 3, awayScore: 0, advancingTeamId: null },
    ];

    render(
      <GroupStandingsPanel group={groupA} matches={matches} predictions={predictions} teams={teams} />,
    );

    let rows = screen.getAllByTestId(/^standing-row-/);
    expect(rows[0]).toHaveAttribute('data-testid', 'standing-row-usa');

    await user.click(screen.getByRole('button', { name: /actual table/i }));

    rows = screen.getAllByTestId(/^standing-row-/);
    expect(rows[0]).toHaveAttribute('data-testid', 'standing-row-mex');
  });
});

describe('KnockoutBracketView', () => {
  const mockGroups = [{ id: 'A', name: 'Group A', teamIds: ['usa', 'mex', 'can', 'bra'] }];
  const mockGroupMatches: Match[] = [];

  it('shows champion when final is resolved', () => {
    const finalMatch: Match = {
      id: 'final-1',
      stage: 'final',
      roundOrder: 104,
      groupId: null,
      homeTeamId: 'usa',
      awayTeamId: 'mex',
      knockout: true,
    };
    const predictions: MatchPrediction[] = [
      { matchId: 'final-1', homeScore: 3, awayScore: 1, advancingTeamId: null },
    ];
    render(
      <KnockoutBracketView knockoutMatches={[finalMatch]} groupMatches={mockGroupMatches} predictions={predictions} teams={teams} groups={mockGroups} />,
    );
    expect(screen.getByTestId('champion-display')).toHaveTextContent('United States');
  });

  it('shows TBD when no predictions exist', () => {
    const finalMatch: Match = {
      id: 'final-1',
      stage: 'final',
      roundOrder: 104,
      groupId: null,
      homeTeamId: 'usa',
      awayTeamId: 'mex',
      knockout: true,
    };
    render(
      <KnockoutBracketView knockoutMatches={[finalMatch]} groupMatches={mockGroupMatches} predictions={[]} teams={teams} groups={mockGroups} />,
    );
    expect(screen.queryByTestId('champion-display')).not.toBeInTheDocument();
  });

  it('displays winner for a resolved knockout match', () => {
    const r32: Match = {
      id: 'r32-1',
      stage: 'round-of-32',
      roundOrder: 73,
      groupId: null,
      homeTeamId: 'usa',
      awayTeamId: 'mex',
      knockout: true,
    };
    const predictions: MatchPrediction[] = [
      { matchId: 'r32-1', homeScore: 1, awayScore: 1, advancingTeamId: 'mex' },
    ];
    render(
      <KnockoutBracketView knockoutMatches={[r32]} groupMatches={mockGroupMatches} predictions={predictions} teams={teams} groups={mockGroups} />,
    );
    expect(screen.getByText('Mexico')).toBeInTheDocument();
  });

  it('displays predicted scores in the bracket match card', () => {
    const r32: Match = {
      id: 'r32-1',
      stage: 'round-of-32',
      roundOrder: 73,
      groupId: null,
      homeTeamId: 'usa',
      awayTeamId: 'mex',
      knockout: true,
    };
    const predictions: MatchPrediction[] = [
      { matchId: 'r32-1', homeScore: 3, awayScore: 2, advancingTeamId: null },
    ];
    render(
      <KnockoutBracketView knockoutMatches={[r32]} groupMatches={mockGroupMatches} predictions={predictions} teams={teams} groups={mockGroups} />,
    );
    expect(screen.getByTestId('bracket-score-r32-1-home')).toHaveTextContent('3');
    expect(screen.getByTestId('bracket-score-r32-1-away')).toHaveTextContent('2');
  });
});
