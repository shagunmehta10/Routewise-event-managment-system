import React from 'react';
import { createBrowserRouter } from 'react-router';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import LiveMap from './pages/LiveMap';
import AuthorityDashboard from './pages/AuthorityDashboard';
import CreateEventPage from './pages/CreateEventPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';
import EventDetailsPage from './pages/EventDetailsPage';
import EditEventPage from './pages/EditEventPage';
import GlobalFleetMap from './pages/GlobalFleetMap';
import VenueRegistration from './pages/VenueRegistration';

import LandingPage from './pages/LandingPage';
import ErrorPage from './pages/ErrorPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VenueDashboard from './pages/VenueDashboard';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
    errorElement: React.createElement(ErrorPage),
  },
  {
    path: '/user-dashboard',
    Component: Dashboard,
  },
  {
    path: '/events',
    Component: Events,
  },
  {
    path: '/events/:id',
    Component: EventDetailsPage,
  },
  {
    path: '/events/:id/edit',
    Component: EditEventPage,
  },
  {
    path: '/live-map',
    Component: LiveMap,
  },
  {
    path: '/fleet-map',
    Component: GlobalFleetMap,
  },
  {
    path: '/dashboard',
    Component: AuthorityDashboard,
  },
  {
    path: '/create-event',
    Component: CreateEventPage,
  },
  {
    path: '/register-venue',
    Component: VenueRegistration,
  },
  {
    path: '/profile',
    Component: ProfilePage,
  },
  {
    path: '/settings',
    Component: SettingsPage,
  },
  {
    path: '/about',
    Component: AboutPage,
  },
  {
    path: '/venues',
    Component: VenueDashboard,
  },

  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/forgot-password',
    Component: ForgotPasswordPage,
  },
  {
    path: '/reset-password',
    Component: ResetPasswordPage,
  },
  {
    path: '*',
    Component: NotFound,
  },
]);
