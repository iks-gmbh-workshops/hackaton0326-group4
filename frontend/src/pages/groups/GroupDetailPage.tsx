import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { groupsApi } from '@/api/groups';
import { activitiesApi } from '@/api/activities';
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

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type InviteForm = z.infer<typeof inviteSchema>;

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [leaveOpen, setLeaveOpen] = useState(false);

  const id = Number(groupId);

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => groupsApi.getGroup(id).then((r) => r.data),
  });

  const { data: members } = useQuery({
    queryKey: ['group', id, 'members'],
    queryFn: () => groupsApi.getMembers(id).then((r) => r.data),
  });

  const { data: activities } = useQuery({
    queryKey: ['group', id, 'activities'],
    queryFn: () => activitiesApi.getUpcoming(id).then((r) => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteForm) => groupsApi.invite(id, data),
    onSuccess: (res) => {
      setInviteSuccess(`Invitation sent to ${res.data.invitedEmail}`);
      setInviteError('');
      reset();
    },
    onError: () => {
      setInviteError('Failed to send invitation');
      setInviteSuccess('');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupsApi.leaveGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate('/groups');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  });

  if (groupLoading) {
    return <p className="text-muted-foreground">Loading group...</p>;
  }

  if (!group) {
    return <p className="text-muted-foreground">Group not found.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Group header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl">{group.name}</h1>
          {group.description && (
            <p className="mt-2 text-muted-foreground">{group.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            Created by {group.createdByEmail}
          </p>
        </div>
        <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
          <DialogTrigger render={<Button variant="outline" className="text-destructive border-destructive" />}>
            Leave Group
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave group?</DialogTitle>
              <DialogDescription>
                You will be removed from this group and your RSVPs for its activities will be deleted. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLeaveOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
              >
                {leaveMutation.isPending ? 'Leaving...' : 'Leave Group'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Members section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Members</h2>
            <Badge variant="secondary">{members?.length ?? 0}</Badge>
          </div>
          <div className="space-y-2">
            {members?.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-md border px-4 py-2"
              >
                <div>
                  <p className="font-medium">
                    {member.firstName} {member.lastName}
                    {member.email === user?.email && (
                      <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Invite form */}
          <Card>
            <CardHeader>
              <CardTitle>
                <h3 className="text-base">Invite a member</h3>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit((data) => inviteMutation.mutate(data))}
                className="space-y-3"
              >
                {inviteSuccess && (
                  <p className="text-sm text-accent">{inviteSuccess}</p>
                )}
                {inviteError && (
                  <p className="text-sm text-destructive">{inviteError}</p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email address</Label>
                  <Input id="inviteEmail" type="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* Activities section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Upcoming Activities</h2>
            <Button asChild size="sm">
              <Link to={`/activities/new?groupId=${id}`}>New Activity</Link>
            </Button>
          </div>

          {!activities?.length && (
            <p className="text-muted-foreground">No upcoming activities.</p>
          )}

          <div className="space-y-3">
            {activities?.map((activity) => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="no-underline"
              >
                <Card className="transition hover:border-accent">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-iks-dark-blue">{activity.title}</p>
                      <span className="text-sm text-muted-foreground">
                        {new Date(activity.scheduledAt).toLocaleDateString('de-DE', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
