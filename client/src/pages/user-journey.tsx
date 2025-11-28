import { UserJourneyVisualization } from "@/components/user-journey-visualization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Target } from "lucide-react";
import { Link } from "wouter";

export default function UserJourneyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Your Journey
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your progress and achievements in Tracker Suite
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              How It Works
            </CardTitle>
            <CardDescription>
              Your journey is tracked automatically as you use the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Complete Actions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add clients, schedule follow-ups, and log interactions
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Earn Points</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Each milestone achievement earns you points and levels
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Track Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Watch your journey stage evolve from beginner to expert
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Journey Visualization */}
        <UserJourneyVisualization />
      </div>
    </div>
  );
}