import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { string, z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

import { APP } from '@/constants/app';
import { TOAST_VARIANT_DEFAULT, TOAST_VARIANT_DESTRUCTIVE } from '@/constants/components/ui/toastConstant';
import { SIGNUP_ERROR_RESPONSE_MESSAGE } from '@/constants/reponseMessage';
import { ROUTES } from '@/constants/routes';
import { SHORT_DELAY_TIME } from '@/constants/timer';

import { useAuthStore } from '@/store/useAuthStore';

import { ThemeToggle } from '@/components/common/ThemeToggle';

const SignupSchema = z
  .object({
    fname: string().min(1, { message: 'Required' }),
    lname: string().min(1, { message: 'Required' }),
    email: string().email({ message: 'Enter a valid email' }),
    password: string()
      .min(1, { message: 'Required' })
      .min(8, { message: 'Minimum of 8 characters' })
      .regex(/\d/, 'Password must contain at least one digit')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[^\w_ ]/, 'Password must contain at least one special character'),
    confirmPassword: string().min(1, { message: 'Required' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password does not match',
    path: ['confirmPassword'],
  });

const Signup = () => {
  const { signup, loading } = useAuthStore();

  const form = useForm<z.infer<typeof SignupSchema>>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      fname: '',
      lname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  const validForm = Object.keys(form.formState.errors).length === 0;

  const onSubmit = async (values: z.infer<typeof SignupSchema>) => {
    signup.initializeState();

    await signup.request({
      user: {
        fname: values.fname,
        lname: values.lname,
        email: values.email,
        password: values.password,
      },
    });
  };

  useEffect(() => {
    if (signup.errorMessage) {
      toast({
        variant: TOAST_VARIANT_DESTRUCTIVE,
        title: SIGNUP_ERROR_RESPONSE_MESSAGE,
      });
    }
  }, [signup.errorMessage]);

  useEffect(() => {
    if (signup.success) {
      toast({
        variant: TOAST_VARIANT_DEFAULT,
        title: signup.successMessage,
        duration: SHORT_DELAY_TIME,
      });
    }
  }, [signup.success, signup.successMessage]);

  // Redirect after a successful signup. Keyed on `signup.success` so it runs
  // only when the flag flips true; `useTimeout` here would have fired once on
  // mount (before success) and never again, leaving the user on the form.
  //
  // Use a hard reload instead of client-side navigation: TOAST_REMOVE_DELAY is
  // ~16min, so the success toast stays in the global Toaster and would linger
  // over the signin page. A full reload resets that store (and the auth state).
  useEffect(() => {
    if (!signup.success) return;

    const timer = setTimeout(() => {
      useAuthStore.getState().signup.initializeState();
      window.location.href = ROUTES.signin;
    }, SHORT_DELAY_TIME);

    return () => clearTimeout(timer);
  }, [signup.success]);

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
      <div className="absolute left-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md border-border shadow-sm">
        <CardContent className="p-8">
          <div className="mb-8 space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {APP.appName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Create an account to get started.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="given-name"
                          placeholder="Jane"
                        />
                      </FormControl>
                      <FormMessage>{signup.error?.fname}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          autoComplete="family-name"
                          placeholder="Doe"
                        />
                      </FormControl>
                      <FormMessage>{signup.error?.lname}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                      />
                    </FormControl>
                    <FormMessage>{signup.error?.email}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                      />
                    </FormControl>
                    <FormMessage>{signup.error?.password}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                        placeholder="••••••••"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={!validForm || loading}>
                Sign up
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to={ROUTES.signin}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
