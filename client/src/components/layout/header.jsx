import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Bell, ChevronDown, Menu, X, Film } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES, AVATAR_IMAGES, GENRE_IDS } from "@/lib/constants";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get active profile
  const { data: activeProfile } = useQuery({
    queryKey: ["/api/profiles/active"],
    enabled: !!user,
  });

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // If on auth page, don't show header
  if (location === ROUTES.AUTH) return null;

  // Function to determine if a nav link is active
  const isActive = (path) => {
    return location === path;
  };

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-background" : "netflix-header-gradient"
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo and Navigation */}
        <div className="flex items-center">
          <Link href={ROUTES.HOME}>
            <svg
              className="w-32 h-12 mr-8"
              viewBox="0 0 1024 276.742"
              fill="#E50914"
            >
              <path d="M140.803 258.904c-15.404 2.705-31.079 3.516-47.294 5.676l-49.458-144.856v151.073c-15.404 1.621-29.457 3.783-44.051 5.945v-276.742h41.08l56.212 157.021v-157.021h43.511v258.904zm85.131-157.558c16.757 0 42.431-.811 57.835-.811v43.24c-19.189 0-41.619 0-57.835.811v64.322c25.405-1.621 50.809-3.785 76.482-4.596v41.617l-119.724 9.461v-255.39h119.724v43.241h-76.482v58.105zm237.284-58.104h-44.862v198.908c-14.594 0-29.188 0-43.239.539v-199.447h-44.862v-43.242h132.965l-.002 43.242zm70.266 55.132h59.187v43.24h-59.187v98.104h-42.433v-239.718h120.808v43.241h-78.375v55.133zm148.641 103.507c24.594.539 49.456 2.434 73.51 3.783v42.701c-38.646-2.434-77.293-4.863-116.75-5.676v-242.689h43.24v201.881zm109.994 49.457c13.783.812 28.377 1.623 42.43 3.242v-254.58h-42.43v251.338zm231.881-251.338l-54.863 131.615 54.863 145.127c-16.217-2.162-32.432-5.135-48.648-7.838l-31.078-79.994-31.617 73.51c-15.678-2.705-30.812-3.516-46.484-5.678l55.672-126.75-50.269-129.992h46.482l28.377 72.699 30.27-72.699h47.295z" />
            </svg>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex">
            <ul className="flex space-x-6">
              <li>
                <Link
                  href={ROUTES.HOME}
                  className={`text-sm ${
                    isActive(ROUTES.HOME)
                      ? "text-white font-bold"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TV_SHOWS}
                  className={`text-sm ${
                    isActive(ROUTES.TV_SHOWS)
                      ? "text-white font-bold"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  TV Shows
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.MOVIES}
                  className={`text-sm ${
                    isActive(ROUTES.MOVIES)
                      ? "text-white font-bold"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  Movies
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.NEW_POPULAR}
                  className={`text-sm ${
                    isActive(ROUTES.NEW_POPULAR)
                      ? "text-white font-bold"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  New & Popular
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.MY_LIST}
                  className={`text-sm ${
                    isActive(ROUTES.MY_LIST)
                      ? "text-white font-bold"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  My List
                </Link>
              </li>
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`text-sm ${
                      isActive(ROUTES.SEARCH)
                        ? "text-white font-bold"
                        : "text-gray-300 hover:text-white"
                    } flex items-center`}
                  >
                    Genres <ChevronDown className="ml-1 h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-gray-800 border-gray-700 max-h-[420px] overflow-y-auto">
                    {Object.entries(GENRE_IDS)
                      .sort((a, b) => a[1].localeCompare(b[1]))
                      .map(([genreId, genreName]) => (
                        <DropdownMenuItem key={genreId} asChild>
                          <Link
                            href={`/search?genre=${genreId}`}
                            className="cursor-pointer text-gray-300 hover:text-white w-full"
                          >
                            {genreName}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            </ul>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden ml-4 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <Link href={ROUTES.SEARCH} className="text-white">
            <Search size={20} />
          </Link>

          <button
            className="text-white hidden md:block"
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-sm p-0"
              >
                <Avatar className="h-8 w-8 rounded-sm">
                  {activeProfile && activeProfile.avatarId !== undefined ? (
                    <AvatarImage
                      src={
                        AVATAR_IMAGES[
                          activeProfile.avatarId % AVATAR_IMAGES.length
                        ]
                      }
                      alt={activeProfile.name || "Profile"}
                    />
                  ) : (
                    <AvatarImage src={AVATAR_IMAGES[0]} alt="Default Profile" />
                  )}
                  <AvatarFallback className="rounded-sm bg-primary">
                    {activeProfile && activeProfile.name
                      ? activeProfile.name.charAt(0).toUpperCase()
                      : user?.username
                      ? user.username.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="ml-1 h-4 w-4 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              {activeProfile && activeProfile.name && (
                <>
                  <DropdownMenuLabel>{activeProfile.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem asChild>
                <Link href={ROUTES.PROFILE} className="cursor-pointer w-full">
                  Manage Profiles
                </Link>
              </DropdownMenuItem>

              {user?.isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href={ROUTES.ADMIN} className="cursor-pointer w-full">
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Clear localStorage first
                  localStorage.removeItem("hasActiveProfile");
                  localStorage.removeItem("activeProfileId");
                  // Then attempt server logout
                  logoutMutation.mutate();
                  // Force redirect after a short delay
                  setTimeout(() => {
                    window.location.href = "/auth";
                  }, 300);
                }}
                className="cursor-pointer"
                disabled={logoutMutation.isPending}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background py-4 px-4">
          <nav>
            <ul className="space-y-4">
              <li>
                <Link
                  href={ROUTES.HOME}
                  className={`block text-sm ${
                    isActive(ROUTES.HOME)
                      ? "text-white font-bold"
                      : "text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.TV_SHOWS}
                  className={`block text-sm ${
                    isActive(ROUTES.TV_SHOWS)
                      ? "text-white font-bold"
                      : "text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  TV Shows
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.MOVIES}
                  className={`block text-sm ${
                    isActive(ROUTES.MOVIES)
                      ? "text-white font-bold"
                      : "text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Movies
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.NEW_POPULAR}
                  className={`block text-sm ${
                    isActive(ROUTES.NEW_POPULAR)
                      ? "text-white font-bold"
                      : "text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  New & Popular
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.MY_LIST}
                  className={`block text-sm ${
                    isActive(ROUTES.MY_LIST)
                      ? "text-white font-bold"
                      : "text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  My List
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.SEARCH}
                  className={`block text-sm ${
                    isActive(ROUTES.SEARCH)
                      ? "text-white font-bold"
                      : "text-gray-300"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Search
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
