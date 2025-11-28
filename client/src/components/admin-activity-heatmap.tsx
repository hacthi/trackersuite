import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, TrendingUp, Users, Activity, Clock } from "lucide-react";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  userRole: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityData {
  date: string;
  registrations: number;
  updates: number;
  totalActivity: number;
}

interface AdminActivityHeatmapProps {
  users: User[];
}

export default function AdminActivityHeatmap({ users }: AdminActivityHeatmapProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [viewType, setViewType] = useState<"registrations" | "updates" | "combined">("combined");

  // Generate activity data based on user data
  const activityData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const data: ActivityData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const registrations = users.filter(user => {
        const userDate = new Date(user.createdAt).toISOString().split('T')[0];
        return userDate === dateStr;
      }).length;
      
      const updates = users.filter(user => {
        const updateDate = new Date(user.updatedAt).toISOString().split('T')[0];
        const createDate = new Date(user.createdAt).toISOString().split('T')[0];
        return updateDate === dateStr && updateDate !== createDate;
      }).length;
      
      data.push({
        date: dateStr,
        registrations,
        updates,
        totalActivity: registrations + updates
      });
    }
    
    return data;
  }, [users, timeRange]);

  // Calculate max values for normalization
  const maxValues = useMemo(() => {
    return {
      registrations: Math.max(...activityData.map(d => d.registrations), 1),
      updates: Math.max(...activityData.map(d => d.updates), 1),
      combined: Math.max(...activityData.map(d => d.totalActivity), 1)
    };
  }, [activityData]);

  // Get intensity color based on value and type
  const getIntensityColor = (value: number, type: "registrations" | "updates" | "combined") => {
    const maxValue = maxValues[type];
    const intensity = value / maxValue;
    
    if (intensity === 0) return "bg-gray-100 dark:bg-gray-800";
    if (intensity <= 0.25) return type === "registrations" ? "bg-green-200 dark:bg-green-900/40" : 
                                type === "updates" ? "bg-blue-200 dark:bg-blue-900/40" : 
                                "bg-purple-200 dark:bg-purple-900/40";
    if (intensity <= 0.5) return type === "registrations" ? "bg-green-300 dark:bg-green-900/60" : 
                               type === "updates" ? "bg-blue-300 dark:bg-blue-900/60" : 
                               "bg-purple-300 dark:bg-purple-900/60";
    if (intensity <= 0.75) return type === "registrations" ? "bg-green-400 dark:bg-green-900/80" : 
                                type === "updates" ? "bg-blue-400 dark:bg-blue-900/80" : 
                                "bg-purple-400 dark:bg-purple-900/80";
    return type === "registrations" ? "bg-green-500 dark:bg-green-900" : 
           type === "updates" ? "bg-blue-500 dark:bg-blue-900" : 
           "bg-purple-500 dark:bg-purple-900";
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Get day of week
  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalRegistrations = activityData.reduce((sum, d) => sum + d.registrations, 0);
    const totalUpdates = activityData.reduce((sum, d) => sum + d.updates, 0);
    const avgDaily = (totalRegistrations + totalUpdates) / activityData.length;
    const peakDay = activityData.reduce((max, d) => 
      d.totalActivity > max.totalActivity ? d : max, activityData[0]);

    return {
      totalRegistrations,
      totalUpdates,
      avgDaily: Math.round(avgDaily * 10) / 10,
      peakDay: peakDay ? formatDate(peakDay.date) : "N/A",
      peakActivity: peakDay ? peakDay.totalActivity : 0
    };
  }, [activityData]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Admin Activity Heatmap
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select value={viewType} onValueChange={(value: "registrations" | "updates" | "combined") => setViewType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registrations">Registrations</SelectItem>
                <SelectItem value="updates">Updates</SelectItem>
                <SelectItem value="combined">Combined</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={(value: "7d" | "30d" | "90d") => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-600 dark:text-green-400">Registrations</span>
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">
              {summaryStats.totalRegistrations}
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-600 dark:text-blue-400">Updates</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {summaryStats.totalUpdates}
            </p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-purple-600 dark:text-purple-400">Avg Daily</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {summaryStats.avgDaily}
            </p>
          </div>
          
          <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-orange-600 dark:text-orange-400">Peak Day</span>
            </div>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
              {summaryStats.peakDay}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              {summaryStats.peakActivity} activities
            </p>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {viewType === "registrations" ? "User Registrations" : 
               viewType === "updates" ? "Profile Updates" : 
               "Combined Activity"} Heatmap
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
                <div className={`w-3 h-3 rounded-sm ${
                  viewType === "registrations" ? "bg-green-200 dark:bg-green-900/40" : 
                  viewType === "updates" ? "bg-blue-200 dark:bg-blue-900/40" : 
                  "bg-purple-200 dark:bg-purple-900/40"
                }`}></div>
                <div className={`w-3 h-3 rounded-sm ${
                  viewType === "registrations" ? "bg-green-400 dark:bg-green-900/80" : 
                  viewType === "updates" ? "bg-blue-400 dark:bg-blue-900/80" : 
                  "bg-purple-400 dark:bg-purple-900/80"
                }`}></div>
                <div className={`w-3 h-3 rounded-sm ${
                  viewType === "registrations" ? "bg-green-500 dark:bg-green-900" : 
                  viewType === "updates" ? "bg-blue-500 dark:bg-blue-900" : 
                  "bg-purple-500 dark:bg-purple-900"
                }`}></div>
              </div>
              <span>More</span>
            </div>
          </div>
          
          {/* Grid layout based on time range */}
          <div className={`grid gap-1 ${
            timeRange === "7d" ? "grid-cols-7" : 
            timeRange === "30d" ? "grid-cols-10" : 
            "grid-cols-13"
          }`}>
            {activityData.map((day, index) => {
              const value = viewType === "registrations" ? day.registrations : 
                           viewType === "updates" ? day.updates : 
                           day.totalActivity;
              
              return (
                <div
                  key={day.date}
                  className={`
                    w-8 h-8 rounded-sm border border-gray-200 dark:border-gray-700 
                    ${getIntensityColor(value, viewType)}
                    hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-600
                    cursor-pointer transition-all duration-200
                  `}
                  title={`${formatDate(day.date)} (${getDayOfWeek(day.date)}): ${value} ${
                    viewType === "registrations" ? "registrations" : 
                    viewType === "updates" ? "updates" : 
                    "activities"
                  }`}
                >
                  {value > 0 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {value > 9 ? "9+" : value || ""}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Week labels for better orientation */}
          {timeRange !== "7d" && (
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{formatDate(activityData[0]?.date || "")}</span>
              <span>{formatDate(activityData[Math.floor(activityData.length / 2)]?.date || "")}</span>
              <span>{formatDate(activityData[activityData.length - 1]?.date || "")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}