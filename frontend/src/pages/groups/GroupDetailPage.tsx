import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { groupsApi } from '@/api/groups';
import { activitiesApi } from '@/api/activities';
import { GroupRole } from '@/api/types';
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [kickUserId, setKickUserId] = useState<number | null>(null);

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

  const currentMember = members?.find((m) => m.email === user?.email);
  const isAdmin = currentMember?.role === GroupRole.ADMIN;
  const adminCount = members?.filter((m) => m.role === GroupRole.ADMIN).length ?? 0;
  const isLastAdmin = isAdmin && adminCount <= 1;

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

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      navigate('/groups');
    },
  });

  const kickMutation = useMutation({
    mutationFn: (userId: number) => groupsApi.kickMember(id, userId),
    onSuccess: () => {
      setKickUserId(null);
      queryClient.invalidateQueries({ queryKey: ['group', id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: GroupRole }) =>
      groupsApi.changeRole(id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id, 'members'] });
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
        <div className="flex gap-2">
          {isAdmin && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger render={<Button variant="destructive" />}>
                Delete Group
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete group?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete the group, all its activities, RSVPs, and invitations. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Group'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
            <DialogTrigger render={<Button variant="outline" className="text-destructive border-destructive" />}>
              Leave Group
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave group?</DialogTitle>
                <DialogDescription>
                  {isLastAdmin
                    ? 'You are the last admin. Leaving will permanently delete the group and all its data.'
                    : 'You will be removed from this group and your RSVPs for its activities will be deleted. This cannot be undone.'}
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
            {members?.map((member) => {
              const isSelf = member.email === user?.email;
              const memberKickOpen = kickUserId === member.userId;
              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between rounded-md border px-4 py-2"
                >
                  <div>
                    <p className="font-medium">
                      {member.firstName} {member.lastName}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.role === GroupRole.ADMIN ? 'default' : 'secondary'}>
                      {member.role === GroupRole.ADMIN ? 'Admin' : 'Member'}
                    </Badge>
                    {isAdmin && !isSelf && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={roleMutation.isPending}
                          onClick={() =>
                            roleMutation.mutate({
                              userId: member.userId,
                              role: member.role === GroupRole.ADMIN ? GroupRole.MEMBER : GroupRole.ADMIN,
                            })
                          }
                        >
                          {member.role === GroupRole.ADMIN ? 'Demote' : 'Promote'}
                        </Button>
                        <Dialog
                          open={memberKickOpen}
                          onOpenChange={(open) => setKickUserId(open ? member.userId : null)}
                        >
                          <DialogTrigger render={<Button variant="outline" size="sm" className="text-destructive border-destructive" />}>
                            Kick
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Kick {member.firstName} {member.lastName}?</DialogTitle>
                              <DialogDescription>
                                This will remove them from the group and delete their RSVPs.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setKickUserId(null)}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => kickMutation.mutate(member.userId)}
                                disabled={kickMutation.isPending}
                              >
                                {kickMutation.isPending ? 'Kicking...' : 'Kick'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invite form — admin only */}
          {isAdmin && (
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
          )}
        </section>

        {/* Activities section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Upcoming Activities</h2>
            {isAdmin && (
              <Button
                size="sm"
                render={<Link to={`/activities/new?groupId=${id}`} />}
              >
                New Activity
              </Button>
            )}
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
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 flex-1 font-medium text-iks-dark-blue">{activity.title}</p>
                      <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                        <div className="flex items-center justify-end gap-2">
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
                      </div>
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
