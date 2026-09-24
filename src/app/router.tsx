import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { FullPageSpinner } from '../shared/ui/Spinner';
import { RouteError } from './RouteError';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const SubscribePage = lazy(() => import('../features/subscribe/SubscribePage'));

function page(element: ReactNode) {
  return <Suspense fallback={<FullPageSpinner />}>{element}</Suspense>;
}

export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', element: page(<LandingPage />) },
      { path: '/s/:code', element: page(<SubscribePage />) },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
];

export function createAppRouter() {
  return createBrowserRouter(routes);
}
