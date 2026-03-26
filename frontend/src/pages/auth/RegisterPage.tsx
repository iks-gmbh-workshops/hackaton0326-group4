import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/\d/, 'Must contain at least one digit')
    .refine((value) => /[\p{P}\p{S}]/u.test(value), 'Must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  tosAccepted: z.literal(true, { error: 'You must accept the terms of service' }),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { tosAccepted: false as unknown as true },
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      await authApi.register({ ...data, tosAccepted: true });
      navigate(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(message || 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h2 className="text-2xl">Register</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              <p className="text-xs text-muted-foreground">
                At least 10 characters with uppercase, lowercase, digit, and special character.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="tosAccepted"
                aria-labelledby="tosAccepted-label tosAccepted-link"
                className="mt-1"
                {...register('tosAccepted')}
              />
              <div className="text-sm leading-6">
                <Label htmlFor="tosAccepted" id="tosAccepted-label" className="mr-1 inline font-normal leading-6">
                  I accept the
                </Label>
                <Link
                  id="tosAccepted-link"
                  to="/terms-of-service"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-accent underline underline-offset-4 hover:text-primary"
                >
                  terms of service
                </Link>
              </div>
            </div>
            {errors.tosAccepted && <p className="text-sm text-destructive">{errors.tosAccepted.message}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-accent hover:underline">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
