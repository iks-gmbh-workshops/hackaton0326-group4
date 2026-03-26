import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '@/api/activities';
import { RsvpStatus } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const statusLabel: Record<RsvpStatus, string> = {
  [RsvpStatus.ACCEPTED]: 'Accepted',
  [RsvpStatus.DECLINED]: 'Declined',
  [RsvpStatus.OPEN]: 'Open',
};

const statusVariant: Record<RsvpStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  [RsvpStatus.ACCEPTED]: 'default',
  [RsvpStatus.DECLINED]: 'destructive',
  [RsvpStatus.OPEN]: 'secondary',
};

export function ActivityDetailPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const id = Number(activityId);

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activitiesApi.getActivity(id).then((r) => r.data),
  });

  const { data: rsvps } = useQuery({
    queryKey: ['activity', id, 'rsvps'],
    queryFn: () => activitiesApi.getRsvps(id).then((r) => r.data),
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) => activitiesApi.updateRsvp(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id, 'rsvps'] });
    },
  });

  const myRsvp = rsvps?.find((r) => r.userId === user?.id);

  if (isLoading) {
    return <p className="text-muted-foreground">Loading activity...</p>;
  }

  if (!activity) {
    return <p className="text-muted-foreground">Activity not found.</p>;
  }

  const accepted = rsvps?.filter((r) => r.status === RsvpStatus.ACCEPTED) ?? [];
  const declined = rsvps?.filter((r) => r.status === RsvpStatus.DECLINED) ?? [];
  const open = rsvps?.filter((r) => r.status === RsvpStatus.OPEN) ?? [];

  return (
    <div className="space-y-8">
      {/* Activity header */}
      <div className="space-y-3">
        <Button asChild variant="outline" size="sm" className="w-fit text-iks-dark-blue">
          <Link to={`/groups/${activity.groupId}`}>
            Go to {activity.groupName}
          </Link>
        </Button>
        <h1 className="text-3xl">{activity.title}</h1>
        {activity.description && (
          <p className="text-muted-foreground">{activity.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span>
            {new Date(activity.scheduledAt).toLocaleDateString('de-DE', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span>Created by {activity.createdByEmail}</span>
        </div>
      </div>

      <Separator />

      {/* RSVP section */}
      <section className="space-y-4">
        <h2 className="text-xl">Your RSVP</h2>
        {myRsvp && (
          <p className="text-sm text-muted-foreground">
            Current status: <Badge variant={statusVariant[myRsvp.status]}>{statusLabel[myRsvp.status]}</Badge>
          </p>
        )}
        <div className="flex gap-3">
          <Button
            onClick={() => rsvpMutation.mutate(RsvpStatus.ACCEPTED)}
            disabled={rsvpMutation.isPending || myRsvp?.status === RsvpStatus.ACCEPTED}
            variant={myRsvp?.status === RsvpStatus.ACCEPTED ? 'default' : 'outline'}
          >
            Accept
          </Button>
          <Button
            onClick={() => rsvpMutation.mutate(RsvpStatus.DECLINED)}
            disabled={rsvpMutation.isPending || myRsvp?.status === RsvpStatus.DECLINED}
            variant={myRsvp?.status === RsvpStatus.DECLINED ? 'destructive' : 'outline'}
          >
            Decline
          </Button>
        </div>
      </section>

      <Separator />

      {/* Attendee list */}
      <section className="space-y-4">
        <h2 className="text-xl">Attendees</h2>

        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm font-semibold">Accepted</span>
                <Badge>{accepted.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {accepted.map((r) => (
                <p key={r.userId} className="text-sm">
                  {r.firstName} {r.lastName}
                </p>
              ))}
              {!accepted.length && (
                <p className="text-sm text-muted-foreground">None yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm font-semibold">Declined</span>
                <Badge variant="destructive">{declined.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {declined.map((r) => (
                <p key={r.userId} className="text-sm">
                  {r.firstName} {r.lastName}
                </p>
              ))}
              {!declined.length && (
                <p className="text-sm text-muted-foreground">None</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-sm font-semibold">Open</span>
                <Badge variant="secondary">{open.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {open.map((r) => (
                <p key={r.userId} className="text-sm">
                  {r.firstName} {r.lastName}
                </p>
              ))}
              {!open.length && (
                <p className="text-sm text-muted-foreground">None</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
