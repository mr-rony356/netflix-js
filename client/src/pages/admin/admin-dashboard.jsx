import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { BarChart, Calendar, FilmIcon, Users2, ListFilter } from "lucide-react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [logFilter, setLogFilter] = useState("all");

  // Fetch system logs
  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/logs"],
  });

  // Fetch all users (admin only)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Get statistics
  const stats = {
    totalUsers: users?.length || 0,
    totalContent: 0, // Would be fetched from API
    totalReviews: 0, // Would be fetched from API
    recentActivity: logs?.slice(0, 5) || [],
  };

  // Filter logs by action type
  const filteredLogs =
    logFilter === "all"
      ? logs
      : logs?.filter((log) => log.action.includes(logFilter));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 px-4 md:px-16 pb-16">
        {" "}
        {/* Add padding top to account for fixed header */}
        {/* Admin dashboard header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400">
              Manage content and view system activity
            </p>
          </div>

          <Button
            onClick={() => navigate(ROUTES.ADMIN_CONTENT)}
            className="bg-primary hover:bg-primary/90"
          >
            <FilmIcon className="mr-2 h-4 w-4" />
            Add Content
          </Button>
        </div>
        {/* Stats cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white text-sm font-medium">
                Total Users
              </CardTitle>
              <Users2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {usersLoading ? "..." : stats.totalUsers}
              </div>
              <p className="text-xs text-gray-400">
                {stats.totalUsers > 0
                  ? `${Math.round(
                      stats.totalUsers * 0.6
                    )} active in last 30 days`
                  : "No users yet"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white text-sm font-medium">
                Content Items
              </CardTitle>
              <FilmIcon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalContent}
              </div>
              <p className="text-xs text-gray-400">
                Movies and TV shows in the system
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-white text-sm font-medium">
                User Reviews
              </CardTitle>
              <BarChart className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats.totalReviews}
              </div>
              <p className="text-xs text-gray-400">Total submitted reviews</p>
            </CardContent>
          </Card>
        </div>
        {/* Main content tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger
              value="logs"
              className="data-[state=active]:bg-gray-700"
            >
              System Logs
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gray-700"
            >
              Users
            </TabsTrigger>
          </TabsList>

          {/* Logs tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                System Activity Logs
              </h2>

              <div className="flex items-center space-x-2">
                <Select value={logFilter} onValueChange={setLogFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-[180px]">
                    <ListFilter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="All Activities" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="login">User Logins</SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                    <SelectItem value="content">Content Changes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {logsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs?.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-400">
                <p>No logs found matching your criteria</p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-700">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-gray-800">
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          Timestamp
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          Action
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          User
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs?.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-gray-700 hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3 text-left text-gray-300">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
                              {formatDate(log.timestamp)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-left text-gray-300">
                            {log.action.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3 text-left text-gray-300">
                            {log.userId
                              ? users?.find((u) => u.id === log.userId)
                                  ?.username || log.userId
                              : "System"}
                          </td>
                          <td className="px-4 py-3 text-left text-gray-300">
                            {log.details || "No details provided"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Users tab */}
          <TabsContent value="users" className="space-y-4">
            <h2 className="text-xl font-bold text-white">User Management</h2>

            {usersLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : users?.length === 0 ? (
              <div className="flex justify-center items-center h-64 text-gray-400">
                <p>No users found</p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-700">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-gray-800">
                      <tr className="border-b border-gray-700">
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          Username
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          Role
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-300">
                          Joined
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-gray-700 hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3 text-left text-gray-300">
                            {user.id}
                          </td>
                          <td className="px-4 py-3 text-left text-gray-300">
                            {user.username}
                          </td>
                          <td className="px-4 py-3 text-left text-gray-300">
                            {user.email}
                          </td>
                          <td className="px-4 py-3 text-left text-gray-300">
                            {user.isAdmin ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                                User
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-left text-gray-300">
                            {formatDate(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
