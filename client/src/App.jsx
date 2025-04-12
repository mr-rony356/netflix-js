import { Switch, Route } from "wouter";

import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import ProfilePage from "@/pages/profile-page";
import MoviesPage from "@/pages/movies-page";
import TVShowsPage from "@/pages/tv-shows-page";
import NewPopularPage from "@/pages/new-popular-page";
import MyListPage from "@/pages/my-list-page";
import SearchPage from "@/pages/search-page";
import ReviewPage from "@/pages/review-page";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import ContentForm from "@/pages/admin/content-form";
import { ProtectedRoute } from "./lib/protected-route";
import { AdminRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/movies" component={MoviesPage} />
      <ProtectedRoute path="/tvshows" component={TVShowsPage} />
      <ProtectedRoute path="/new-popular" component={NewPopularPage} />
      <ProtectedRoute path="/my-list" component={MyListPage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/review/:type/:id" component={ReviewPage} />
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/add-content" component={ContentForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
