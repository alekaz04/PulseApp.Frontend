import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { FullPageSpinner } from '../shared/ui/Spinner';
import { RouteError } from './RouteError';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const SubscribePage = lazy(() => import('../features/subscribe/SubscribePage'));
const AuthLayout = lazy(() => import('../features/auth/AuthLayout'));
const CallbackPage = lazy(() => import('../features/auth/CallbackPage'));
const SignupRedirect = lazy(() => import('../features/auth/SignupRedirect'));
const CabinetLayout = lazy(() => import('../pages/CabinetLayout'));
const ComplimentsPage = lazy(() => import('../features/compliments/ComplimentsPage'));

function page(element: ReactNode) {
  return <Suspense fallback={<FullPageSpinner />}>{element}</Suspense>;
}

export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: page(<LandingPage />) },
      { path: '/s/:code', element: page(<SubscribePage />) },
      {
        element: page(<AuthLayout />),
        children: [
          { path: '/auth/callback', element: page(<CallbackPage />) },
          { path: '/auth/signup', element: page(<SignupRedirect />) },
          {
            path: '/app',
            element: page(<CabinetLayout />),
            children: [
              { index: true, element: <Navigate to="/app/compliments" replace /> },
              { path: 'compliments', element: page(<ComplimentsPage />) },
            ],
          },
        ],
      },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
