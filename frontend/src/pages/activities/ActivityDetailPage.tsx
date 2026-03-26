import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi } from '@/api/activities';
import { groupsApi } from '@/api/groups';
import { RsvpStatus, GroupRole } from '@/api/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [editError, setEditError] = useState('');
  const id = Number(activityId);

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => activitiesApi.getActivity(id).then((r) => r.data),
  });

  const { data: rsvps } = useQuery({
    queryKey: ['activity', id, 'rsvps'],
    queryFn: () => activitiesApi.getRsvps(id).then((r) => r.data),
  });

  const { data: members } = useQuery({
    queryKey: ['group', activity?.groupId, 'members'],
    queryFn: () => groupsApi.getMembers(activity!.groupId).then((r) => r.data),
    enabled: !!activity,
  });

  const isAdmin = members?.some(
    (m) => m.email === user?.email && m.role === GroupRole.ADMIN,
  );

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) => activitiesApi.updateRsvp(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id, 'rsvps'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => activitiesApi.cancel(id),
    onSuccess: async () => {
      if (!activity) return;
      await queryClient.invalidateQueries({ queryKey: ['activities'] });
      await queryClient.invalidateQueries({ queryKey: ['group', activity.groupId, 'activities'] });
      queryClient.removeQueries({ queryKey: ['activity', id] });
      queryClient.removeQueries({ queryKey: ['activity', id, 'rsvps'] });
      setCancelOpen(false);
      navigate(`/groups/${activity.groupId}`);
    },
    onError: () => {
      setCancelError('Failed to cancel activity');
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { title?: string; description?: string; scheduledAt?: string }) =>
      activitiesApi.update(id, data),
    onSuccess: () => {
      setEditing(false);
      setEditError('');
      queryClient.invalidateQueries({ queryKey: ['activity', id] });
    },
    onError: () => {
      setEditError('Failed to update activity');
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

  const startEditing = () => {
    setEditTitle(activity.title);
    setEditDescription(activity.description ?? '');
    const date = new Date(activity.scheduledAt);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60000);
    setEditScheduledAt(local.toISOString().slice(0, 16));
    setEditError('');
    setEditing(true);
  };

  const submitEdit = () => {
    const data: { title?: string; description?: string; scheduledAt?: string } = {};
    if (editTitle !== activity.title) data.title = editTitle;
    if (editDescription !== (activity.description ?? '')) data.description = editDescription;
    const newScheduled = new Date(editScheduledAt).toISOString();
    if (newScheduled !== activity.scheduledAt) data.scheduledAt = newScheduled;
    if (Object.keys(data).length === 0) {
      setEditing(false);
      return;
    }
    editMutation.mutate(data);
  };

  return (
    <div className="space-y-8">
      {/* Activity header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Button variant="outline" size="sm" className="w-fit text-iks-dark-blue" render={<Link to={`/groups/${activity.groupId}`} />}>
            Go to {activity.groupName}
          </Button>
          <div className="flex gap-2">
            {activity.canceled ? (
              <Badge variant="destructive">Canceled</Badge>
            ) : isAdmin ? (
              <>
                <Button variant="outline" size="sm" onClick={startEditing}>
                  Edit
                </Button>
                <Dialog
                  open={cancelOpen}
                  onOpenChange={(open) => {
                    setCancelOpen(open);
                    if (!open) setCancelError('');
                  }}
                >
                  <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                    Cancel Activity
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel this activity?</DialogTitle>
                      <DialogDescription>
                        This will keep the activity in the database as canceled, keep its RSVP entries, and send a cancellation email to the group's members.
                      </DialogDescription>
                    </DialogHeader>
                    {cancelError && (
                      <p className="rounded border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        {cancelError}
                      </p>
                    )}
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelOpen(false)}>
                        Back
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setCancelError('');
                          cancelMutation.mutate();
                        }}
                        disabled={cancelMutation.isPending}
                      >
                        {cancelMutation.isPending ? 'Canceling...' : 'Cancel Activity'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : null}
          </div>
        </div>

        {editing ? (
          <div className="space-y-3 rounded-md border p-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Title</Label>
              <Input id="editTitle" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Input id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editScheduledAt">Date & Time</Label>
              <Input id="editScheduledAt" type="datetime-local" value={editScheduledAt} onChange={(e) => setEditScheduledAt(e.target.value)} />
            </div>
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <div className="flex gap-2">
              <Button onClick={submitEdit} disabled={editMutation.isPending}>
                {editMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      <Separator />

      {/* RSVP section */}
      <section className="space-y-4">
        <h2 className="text-xl">Your RSVP</h2>
        {activity.canceled && (
          <p className="text-sm text-muted-foreground">
            RSVPs are closed because this activity has been canceled.
          </p>
        )}
        {myRsvp && (
          <p className="text-sm text-muted-foreground">
            Current status: <Badge variant={statusVariant[myRsvp.status]}>{statusLabel[myRsvp.status]}</Badge>
          </p>
        )}
        {!activity.canceled && (
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
        )}
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
