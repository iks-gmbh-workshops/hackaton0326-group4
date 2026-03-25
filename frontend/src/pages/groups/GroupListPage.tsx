import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { groupsApi } from '@/api/groups';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function GroupListPage() {
  const { data: groups, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.getMyGroups().then((r) => r.data),
  });

  if (isLoading) {
    return <p className="text-muted-foreground">Loading groups...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">My Groups</h1>
        <Button render={<Link to="/groups/new" />}>
          Create Group
        </Button>
      </div>

      {!groups?.length && (
        <p className="text-muted-foreground">You are not a member of any groups yet.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {groups?.map((group) => (
          <Link key={group.id} to={`/groups/${group.id}`} className="no-underline">
            <Card className="transition hover:border-accent">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-iks-dark-blue">{group.name}</span>
                  <Badge variant="secondary">{group.memberCount} members</Badge>
                </CardTitle>
              </CardHeader>
              {group.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
