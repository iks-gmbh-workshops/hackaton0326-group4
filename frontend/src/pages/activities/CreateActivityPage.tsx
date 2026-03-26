import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '@/api/activities';
import { groupsApi } from '@/api/groups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatDatePart(value: number) {
  return value.toString().padStart(2, '0');
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${formatDatePart(date.getMonth() + 1)}-${formatDatePart(date.getDate())}`;
}

function toTimeInputValue(date: Date) {
  return `${formatDatePart(date.getHours())}:${formatDatePart(date.getMinutes())}`;
}

function getMinimumScheduledAt(now = new Date()) {
  const nextMinute = new Date(now);
  nextMinute.setSeconds(0, 0);
  nextMinute.setMinutes(nextMinute.getMinutes() + 1);

  return {
    date: toDateInputValue(nextMinute),
    time: toTimeInputValue(nextMinute),
  };
}

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  groupId: z.number().min(1, 'Please select a group'),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().min(1, 'Time is required'),
}).superRefine((value, ctx) => {
  if (!value.scheduledDate || !value.scheduledTime) {
    return;
  }

  const scheduledAt = new Date(`${value.scheduledDate}T${value.scheduledTime}`);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
    ctx.addIssue({
      code: 'custom',
      path: ['scheduledTime'],
      message: 'Date and time must be in the future',
    });
  }
});

type FormData = z.infer<typeof schema>;

export function CreateActivityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('groupId');
  const [error, setError] = useState('');
  const [minimumScheduledAt, setMinimumScheduledAt] = useState(getMinimumScheduledAt);

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getMyGroups().then((r) => r.data),
  });

  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      groupId: preselectedGroupId ? Number(preselectedGroupId) : 0,
    },
  });
  const scheduledDate = useWatch({ control, name: 'scheduledDate' });
  const scheduledTime = useWatch({ control, name: 'scheduledTime' });

  useEffect(() => {
    if (preselectedGroupId && groups?.some((group) => group.id === Number(preselectedGroupId))) {
      setValue('groupId', Number(preselectedGroupId));
    }
  }, [groups, preselectedGroupId, setValue]);

  useEffect(() => {
    if (scheduledDate === minimumScheduledAt.date && scheduledTime && scheduledTime < minimumScheduledAt.time) {
      setValue('scheduledTime', '', { shouldDirty: true, shouldValidate: true });
    }
  }, [minimumScheduledAt, scheduledDate, scheduledTime, setValue]);

  const refreshMinimumScheduledAt = () => {
    setMinimumScheduledAt(getMinimumScheduledAt());
  };

  const minimumTime = scheduledDate === minimumScheduledAt.date ? minimumScheduledAt.time : undefined;

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await activitiesApi.create({
        title: data.title,
        description: data.description,
        groupId: data.groupId,
        scheduledAt: new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString(),
      });
      navigate(`/activities/${res.data.id}`);
    } catch {
      setError('Failed to create activity');
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-3xl">Create Activity</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="groupId">Group</Label>
              <select
                id="groupId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register('groupId', {
                  setValueAs: (value) => (value === '' ? 0 : Number(value)),
                })}
              >
                <option value="">Select a group</option>
                {groups?.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.groupId && (
                <p className="text-sm text-destructive">{errors.groupId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register('title')} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label>Date & Time</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    min={minimumScheduledAt.date}
                    onFocus={refreshMinimumScheduledAt}
                    onPointerDown={refreshMinimumScheduledAt}
                    {...register('scheduledDate')}
                  />
                  {errors.scheduledDate && (
                    <p className="text-sm text-destructive">{errors.scheduledDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    min={minimumTime}
                    step={60}
                    onFocus={refreshMinimumScheduledAt}
                    onPointerDown={refreshMinimumScheduledAt}
                    {...register('scheduledTime')}
                  />
                  {errors.scheduledTime && (
                    <p className="text-sm text-destructive">{errors.scheduledTime.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Activity'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
