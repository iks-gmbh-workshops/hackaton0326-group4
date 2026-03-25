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
        <Button asChild>
          <Link to="/activities/new">Create Activity</Link>
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
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-iks-dark-blue">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
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
