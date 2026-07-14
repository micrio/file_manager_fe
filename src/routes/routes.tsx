import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";

import DefaultLayout from '@/layouts/default/DefaultLayout';
import PrivateRoute from '@/layouts/private/PrivateRoute';
import Signup from '@/pages/Auth/Signup';
import Signin from '@/pages/Auth/Signin';
import Home from '@/pages/Home/Home';
import Storage from '@/pages/Storage/Storage';

import { ROUTES } from "@/constants/routes";
import NotFound from "@/components/common/NotFound";

const Routes = () => {
  return (
    <>
      <RouterProvider
        router={createBrowserRouter([
          {
            path: "/",
            element: (
              <PrivateRoute>
                <DefaultLayout>
                  <Home />
                </DefaultLayout>
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.signin,
            element: (
              <DefaultLayout>
                <Signin />
              </DefaultLayout>
            ),
          },
          {
            path: ROUTES.signup,
            element: (
              <DefaultLayout>
                <Signup />
              </DefaultLayout>
            ),
          },
          {
            path: ROUTES.home,
            element: (
              <PrivateRoute>
                <DefaultLayout>
                  <Home />
                </DefaultLayout>
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.storage,
            element: (
              <PrivateRoute>
                <DefaultLayout>
                  <Storage />
                </DefaultLayout>
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.storageWithId,
            element: (
              <PrivateRoute>
                <DefaultLayout>
                  <Storage />
                </DefaultLayout>
              </PrivateRoute>
            ),
          },
          {
            path: "*",
            element: (
              <PrivateRoute>
                <NotFound />
              </PrivateRoute>
            ),
          },
        ])}
      />
    </>
  );
}

export default Routes;
