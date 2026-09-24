import { useEffect, useState } from 'react';

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
import { useToast } from '@/components/ui/use-toast';

import { APP } from '@/constants/app';
import { TOAST_VARIANT_DESTRUCTIVE } from '@/constants/components/ui/toastConstant';
import { ROUTES } from '@/constants/routes';

import { useAuthStore } from '@/store/useAuthStore';

import { ThemeToggle } from '@/components/common/ThemeToggle';

const SigninSchema = z.object({
  email: string().email({ message: 'Enter a valid email' }),
  password: string().min(1, { message: 'Password is required' }),
});

const Signin = () => {
  const { toast } = useToast();
  const { signin, auth } = useAuthStore();

  const [disableSubmit, setDisableSubmit] = useState(true);

  const form = useForm<z.infer<typeof SigninSchema>>({
    resolver: zodResolver(SigninSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const formWatch = form.watch();

  const onSubmit = async (values: z.infer<typeof SigninSchema>) => {
    signin.initializeState();

    await signin.request({
      data: {
        email: values.email,
        password: values.password,
      },
    });
  };

  useEffect(() => {
    if (signin.errorMessage) {
      toast({
        variant: TOAST_VARIANT_DESTRUCTIVE,
        title: signin.errorMessage,
      });
    }
  }, [signin.errorMessage, toast]);

  useEffect(() => {
    const isComplete =
      formWatch.email.length > 0 && formWatch.password.length > 0;
    setDisableSubmit(!isComplete);
  }, [formWatch]);

  if (auth.isAuthenticated()) return <></>;

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background px-4">
      <div className="absolute left-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm border-border shadow-sm">
        <CardContent className="p-8">
          <div className="mb-8 space-y-1 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              {APP.appName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back. Sign in to continue.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
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
                    <FormMessage />
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
                        autoComplete="current-password"
                        placeholder="••••••••"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={disableSubmit}
              >
                Sign in
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to={ROUTES.signup}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signin;
