import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { invitationsApi } from '@/api/invitations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'loading' | 'accepted' | 'declined' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!token) return;
    setStatus('loading');
    try {
      await invitationsApi.accept(token);
      setStatus('accepted');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Failed to accept invitation');
      setStatus('error');
    }
  };

  const handleDecline = () => {
    setStatus('declined');
  };

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl">Group Invitation</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && status === 'idle' && (
            <>
              <p className="text-muted-foreground">
                You need to be logged in to accept this invitation. If you don't have an account yet,
                please register first with the email address the invitation was sent to.
              </p>
              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link to={`/login?redirect=/invite/${token}`}>Login</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to={`/register?redirect=/invite/${token}`}>Register</Link>
                </Button>
              </div>
            </>
          )}

          {user && status === 'idle' && (
            <>
              <p className="text-muted-foreground">
                Hi {user.firstName}, you've been invited to join a group. Would you like to accept or decline?
              </p>
              <div className="flex gap-3">
                <Button onClick={handleAccept} className="flex-1">
                  Accept
                </Button>
                <Button variant="outline" onClick={handleDecline} className="flex-1">
                  Decline
                </Button>
              </div>
            </>
          )}

          {status === 'loading' && <p className="text-muted-foreground">Accepting invitation...</p>}

          {status === 'accepted' && (
            <>
              <p className="text-green-700">Invitation accepted! You are now a member of the group.</p>
              <Button onClick={() => navigate('/groups')} className="w-full">
                Go to Groups
              </Button>
            </>
          )}

          {status === 'declined' && (
            <>
              <p className="text-muted-foreground">You have declined this invitation.</p>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Go to Home
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
              <Button variant="outline" onClick={() => setStatus('idle')} className="w-full">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
