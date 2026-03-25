import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { activitiesApi } from '@/api/activities';
import { groupsApi } from '@/api/groups';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  groupId: z.number().min(1, 'Please select a group'),
  scheduledAt: z.string().min(1, 'Date and time is required'),
});

type FormData = z.infer<typeof schema>;

export function CreateActivityPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('groupId');
  const [error, setError] = useState('');

  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getMyGroups().then((r) => r.data),
  });

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      groupId: preselectedGroupId ? Number(preselectedGroupId) : 0,
    },
  });

  useEffect(() => {
    if (preselectedGroupId && groups?.some((group) => group.id === Number(preselectedGroupId))) {
      setValue('groupId', Number(preselectedGroupId));
    }
  }, [groups, preselectedGroupId, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      const res = await activitiesApi.create({
        ...data,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
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
              <Label htmlFor="scheduledAt">Date & Time</Label>
              <Input id="scheduledAt" type="datetime-local" {...register('scheduledAt')} />
              {errors.scheduledAt && (
                <p className="text-sm text-destructive">{errors.scheduledAt.message}</p>
              )}
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
