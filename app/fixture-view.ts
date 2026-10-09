import type {Fixture} from './content';

export type MatchView = 'Upcoming' | 'Results' | 'Other matches';
export function inMatchView(fixture: Fixture, view: MatchView, today: string) {
  if (view === 'Results') return fixture.status === 'played';
  const upcoming = fixture.status === 'live' || fixture.status === 'scheduled' && (fixture.date >= today || fixture.liveMinute !== undefined);
  return view === 'Upcoming' ? upcoming : fixture.status !== 'played' && !upcoming;
}
