import TeamDetailPageClient from './TeamDetailPageClient';

export default async function TeamDetailPage({ params }) {
  // Await the params (wrap in a resolved promise) before using its properties
  const resolvedParams = await Promise.resolve(params);
  const { team_id } = resolvedParams;
  return <TeamDetailPageClient team_id={team_id} />;
}
