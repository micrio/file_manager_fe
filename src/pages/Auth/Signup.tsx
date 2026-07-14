import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { string, z } from 'zod';
import { useTimeout } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

import { useAuthStore } from '@/store/useAuthStore';
import { TOAST_VARIANT_DEFAULT, TOAST_VARIANT_DESTRUCTIVE } from '@/constants/components/ui/toastConstant';
import { SIGNUP_ERROR_RESPONSE_MESSAGE } from '@/constants/reponseMessage';
import { SHORT_DELAY_TIME } from '@/constants/timer';
import { ROUTES } from '@/constants/routes';

const SignupSchema = z
  .object({
    fname: string().min(1, { message: 'Required' }),
    lname: string().min(1, { message: 'Required' }),
    email: string().email(),
    password: string()
      .min(1, { message: 'Required' })
      .min(8, { message: 'Minimum of 8 characters' })
      .min(8, 'Password must be at least 8 characters long')
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
  const navigate = useNavigate();

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
    if(signup.errorMessage) {
      toast({
        variant: TOAST_VARIANT_DESTRUCTIVE,
        title: SIGNUP_ERROR_RESPONSE_MESSAGE,
      });
    }
  }, [signup.errorMessage])

  useEffect(() => {
    if (signup.success) {
      toast({
        variant: TOAST_VARIANT_DEFAULT,
        title: signup.successMessage,
        duration: SHORT_DELAY_TIME,
      });
    }
  }, [signup.success, signup.successMessage, navigate]);

  useTimeout(() => {
    if (signup.success) {
      signup.initializeState();
      navigate(ROUTES.signin);
    }
  }, SHORT_DELAY_TIME);

  return (
    <React.Fragment>
      <div className="flex justify-center min-h-screen min-w-full mx-auto my-auto items-center align-middle">
        <Card className="px-12 pb-5 w-[1000px] h-auto">
          <CardTitle className="mt-10 mb-10 text-center">
            Create Account
          </CardTitle>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="mb-5">
                <div className="flex gap-12 mb-5">
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="fname"
                      render={({ field }) => (
                        <FormItem>
                          <Label>First Name</Label>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <div className="min-h-5">
                            <FormMessage className="first-letter:uppercase">
                              {signup.error?.fname}
                            </FormMessage>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="lname"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Last Name</Label>
                          <FormControl>
                            <Input {...field} type="text" autoComplete="off" />
                          </FormControl>
                          <div className="min-h-5">
                            <FormMessage className="first-letter:uppercase">
                              {signup.error?.lname}
                            </FormMessage>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex gap-12 mb-5">
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Email</Label>
                          <FormControl>
                            <Input {...field} autoComplete="off" />
                          </FormControl>
                          <div className="min-h-5">
                            <FormMessage className="first-letter:uppercase">
                              {signup.error?.email}
                            </FormMessage>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-1/2"></div>
                </div>
                <div className="flex gap-12">
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Password</Label>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="false"
                              type="password"
                            />
                          </FormControl>
                          <div className="min-h-5">
                            <FormMessage className="first-letter:uppercase">
                              {signup.error?.password}
                            </FormMessage>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="w-1/2">
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <Label>Confirm Password</Label>
                          <FormControl>
                            <Input
                              {...field}
                              autoComplete="off"
                              type="password"
                            />
                          </FormControl>
                          <div className="min-h-5">
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="w-full flex flex-col">
                <Button type="submit" disabled={!validForm || loading}>
                  Signup
                </Button>
                <div className="mt-8">
                  <Label>Already have account?</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="m-0 p-0 pl-2 text-sm"
                    onClick={() => {
                      navigate(ROUTES.signin);
                    }}
                  >
                    Signin
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </React.Fragment>
  );
};

export default Signup;
