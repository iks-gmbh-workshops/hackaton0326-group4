import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { groupsApi } from '@/api/groups';
import { activitiesApi } from '@/api/activities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ActivityResponse } from '@/api/types';

export function ActivityListPage() {
  const { data: groups, isLoading: groupsLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getMyGroups().then((r) => r.data),
  });

  const { data: activitiesByGroup, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'all', groups?.map((g) => g.id)],
    queryFn: async () => {
      if (!groups?.length) return [];
      const results = await Promise.all(
        groups.map((g) =>
          activitiesApi.getUpcoming(g.id).then((r) => r.data)
        )
      );
      return results
        .flat()
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    },
    enabled: !!groups,
  });

  if (groupsLoading || activitiesLoading) {
    return <p className="text-muted-foreground">Loading activities...</p>;
  }

  const activities: ActivityResponse[] = activitiesByGroup ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Upcoming Activities</h1>
        <Button render={<Link to="/activities/new" />}>
          Create Activity
        </Button>
      </div>

      {!activities.length && (
        <p className="text-muted-foreground">No upcoming activities across your groups.</p>
      )}

      <div className="space-y-3">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            to={`/activities/${activity.id}`}
            className="no-underline"
          >
            <Card className="transition hover:border-accent">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 font-medium text-iks-dark-blue">{activity.title}</p>
                      <div className="flex shrink-0 items-center justify-end gap-2 sm:hidden">
                        <Badge aria-label={`${activity.acceptedCount} accepted`} className="min-w-6 px-1.5">
                          {activity.acceptedCount}
                        </Badge>
                        <Badge
                          variant="destructive"
                          aria-label={`${activity.declinedCount} declined`}
                          className="min-w-6 px-1.5"
                        >
                          {activity.declinedCount}
                        </Badge>
                        <Badge
                          variant="secondary"
                          aria-label={`${activity.openCount} open`}
                          className="min-w-6 px-1.5"
                        >
                          {activity.openCount}
                        </Badge>
                      </div>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="hidden items-center justify-end gap-2 sm:flex">
                      <Badge aria-label={`${activity.acceptedCount} accepted`} className="min-w-6 px-1.5">
                        {activity.acceptedCount}
                      </Badge>
                      <Badge
                        variant="destructive"
                        aria-label={`${activity.declinedCount} declined`}
                        className="min-w-6 px-1.5"
                      >
                        {activity.declinedCount}
                      </Badge>
                      <Badge
                        variant="secondary"
                        aria-label={`${activity.openCount} open`}
                        className="min-w-6 px-1.5"
                      >
                        {activity.openCount}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(activity.scheduledAt).toLocaleDateString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <Badge variant="secondary">{activity.groupName}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
