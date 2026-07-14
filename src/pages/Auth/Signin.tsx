import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { string, z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useAuthStore } from '@/store/useAuthStore';

import { TOAST_VARIANT_DESTRUCTIVE } from '@/constants/components/ui/toastConstant';
import { ROUTES } from '@/constants/routes';
import { Label } from '@/components/ui/label';

const SigninSchema = z.object({
  email: string(),
  password: string(),
});

const Signin = () => {
  const [disableSubmit, setDisableSubmit] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const { signin, auth } = useAuthStore();

  const form = useForm<z.infer<typeof SigninSchema>>({
    resolver: zodResolver(SigninSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const formWatch = form.watch();

  const onSubmit = async (values: z.infer<typeof SigninSchema>) => {
    signin.initializeState();

    await signin.request({
      data: {
        email: values.email,
        password: values.password
      }
    });
  }

  useEffect(() => {
    if (signin.errorMessage) {
      toast({
        variant: TOAST_VARIANT_DESTRUCTIVE,
        title: signin.errorMessage,
      });
    }
  }, [signin.errorMessage, toast]);

  useEffect(() => {
    if (formWatch.email.length > 0 && formWatch.password.length > 0) {
      setDisableSubmit(false);
    } else {
      !disableSubmit && setDisableSubmit(true);
    }
  }, [form, formWatch, disableSubmit, setDisableSubmit]);

  return !auth.isAuthenticated() ? (
    <div className="flex justify-center min-h-screen min-w-full mx-auto my-auto items-center align-middle">
      <Card className="px-12">
        <CardTitle className="mt-10 mb-10 text-center">File Manager</CardTitle>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <div className="min-h-5">
                      <FormMessage />
                    </div>
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
                      <Input {...field} type="password" />
                    </FormControl>
                    <div className="min-h-5">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col">
              <Button type="submit" disabled={disableSubmit}>
                Signin
              </Button>
              <Label className="mt-6 text-sm">
                Don't have an account?
                <Button
                  variant="link"
                  className="m-0 p-0 pl-2 text-sm"
                  onClick={() => {
                    navigate(ROUTES.signup);
                  }}
                >
                  Signup
                </Button>
              </Label>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  ) : (
    <></>
  );
};

export default Signin;
