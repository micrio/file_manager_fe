import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

import { ROUTES } from "@/constants/routes";

import NotFound from "@/components/common/NotFound";

import DefaultLayout from '@/layouts/default/DefaultLayout';
import PrivateRoute from '@/layouts/private/PrivateRoute';
import Signin from '@/pages/Auth/Signin';
import Signup from '@/pages/Auth/Signup';
import Home from '@/pages/Home/Home';
import SharedBrowser from '@/pages/Shared/SharedBrowser';
import SharedView from '@/pages/Shared/SharedView';
import SharedWithMe from '@/pages/Shared/SharedWithMe';
import Storage from '@/pages/Storage/Storage';
import Trash from "@/pages/Trash/Trash";

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
            path: ROUTES.trash,
            element: (
              <PrivateRoute>
                <DefaultLayout>
                  <Trash />
                </DefaultLayout>
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.sharedWithMe,
            element: (
              <PrivateRoute>
                <DefaultLayout>
                  <SharedWithMe />
                </DefaultLayout>
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.sharedBrowseWithToken,
            element: (
              <PrivateRoute>
                <DefaultLayout>
                  <SharedBrowser />
                </DefaultLayout>
              </PrivateRoute>
            ),
          },
          {
            path: ROUTES.shareWithToken,
            element: <SharedView />,
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
