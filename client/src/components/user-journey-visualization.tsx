import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Users, 
  Calendar, 
  MessageSquare, 
  Target, 
  Star, 
  CheckCircle, 
  Clock,
  Zap,
  Crown,
  Award,
  Rocket,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserJourneyMilestone {
  id: number;
  milestoneType: string;
  title: string;
  description: string;
  isCompleted: boolean;
  completedAt: string | null;
  points: number;
  category: string;
  createdAt: string;
}

interface UserJourneyProgress {
  id: number;
  userId: number;
  totalPoints: number;
  completedMilestones: number;
  currentLevel: number;
  journeyStage: string;
  lastActivityAt: string;
  updatedAt: string;
}

interface JourneyData {
  progress: UserJourneyProgress | null;
  milestones: UserJourneyMilestone[];
}

const CATEGORY_ICONS = {
  getting_started: Rocket,
  client_management: Users,
  engagement: MessageSquare,
  growth: BarChart3,
  advanced: Crown,
};

const CATEGORY_COLORS = {
  getting_started: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  client_management: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  engagement: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  growth: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  advanced: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
};

const STAGE_INFO = {
  onboarding: { 
    title: "Onboarding", 
    icon: Rocket, 
    color: "text-blue-600 dark:text-blue-400",
    description: "Getting started with the platform"
  },
  exploring: { 
    title: "Exploring", 
    icon: Target, 
    color: "text-green-600 dark:text-green-400",
    description: "Learning the core features"
  },
  active: { 
    title: "Active User", 
    icon: Zap, 
    color: "text-purple-600 dark:text-purple-400",
    description: "Actively managing clients"
  },
  power_user: { 
    title: "Power User", 
    icon: Star, 
    color: "text-orange-600 dark:text-orange-400",
    description: "Advanced feature utilization"
  },
  expert: { 
    title: "Expert", 
    icon: Crown, 
    color: "text-yellow-600 dark:text-yellow-400",
    description: "Master of the platform"
  },
};

export function UserJourneyVisualization() {
  const { data: journeyData, isLoading } = useQuery<JourneyData>({
    queryKey: ["/api/journey"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!journeyData?.progress) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Your journey data will appear here once it's loaded.
          </div>
        </CardContent>
      </Card>
    );
  }

  const { progress, milestones } = journeyData;
  const stageInfo = STAGE_INFO[progress.journeyStage as keyof typeof STAGE_INFO];
  const StageIcon = stageInfo.icon;

  // Calculate progress to next level
  const pointsForCurrentLevel = (progress.currentLevel - 1) * 50;
  const pointsForNextLevel = progress.currentLevel * 50;
  const progressToNextLevel = ((progress.totalPoints - pointsForCurrentLevel) / 50) * 100;

  // Group milestones by category
  const milestonesByCategory = milestones.reduce((acc, milestone) => {
    if (!acc[milestone.category]) {
      acc[milestone.category] = [];
    }
    acc[milestone.category].push(milestone);
    return acc;
  }, {} as Record<string, UserJourneyMilestone[]>);

  // Calculate completion percentage
  const completionPercentage = milestones.length > 0 
    ? (progress.completedMilestones / milestones.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StageIcon className={cn("w-5 h-5", stageInfo.color)} />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {stageInfo.title}
                </h2>
                <Badge variant="secondary" className="ml-2">
                  Level {progress.currentLevel}
                </Badge>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {stageInfo.description}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {progress.totalPoints}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Points
              </div>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Level Progress</span>
              <span className="text-gray-600 dark:text-gray-300">
                {progress.totalPoints - pointsForCurrentLevel}/{50} points to Level {progress.currentLevel + 1}
              </span>
            </div>
            <Progress value={progressToNextLevel} className="h-2" />
          </div>
        </div>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {progress.completedMilestones}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Completed
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {milestones.length - progress.completedMilestones}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Remaining
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round(completionPercentage)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Complete
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {progress.currentLevel}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Level
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones by Category */}
      <div className="space-y-6">
        {Object.entries(milestonesByCategory).map(([category, categoryMilestones]) => {
          const CategoryIcon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
          const completedInCategory = categoryMilestones.filter(m => m.isCompleted).length;
          
          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryIcon className="w-5 h-5" />
                    <CardTitle className="capitalize">
                      {category.replace('_', ' ')}
                    </CardTitle>
                    <Badge 
                      className={cn(
                        "text-xs",
                        CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                      )}
                    >
                      {completedInCategory}/{categoryMilestones.length}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {categoryMilestones.reduce((sum, m) => sum + (m.isCompleted ? m.points : 0), 0)} points
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {categoryMilestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                        milestone.isCompleted
                          ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {milestone.isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={cn(
                            "font-medium",
                            milestone.isCompleted
                              ? "text-green-900 dark:text-green-100"
                              : "text-gray-900 dark:text-gray-100"
                          )}>
                            {milestone.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {milestone.points} pts
                            </Badge>
                            {milestone.isCompleted && (
                              <Trophy className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm mt-1",
                          milestone.isCompleted
                            ? "text-green-700 dark:text-green-300"
                            : "text-gray-600 dark:text-gray-400"
                        )}>
                          {milestone.description}
                        </p>
                        {milestone.isCompleted && milestone.completedAt && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Completed {new Date(milestone.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievement Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Journey Summary
          </CardTitle>
          <CardDescription>
            Your progress through the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {Math.round(completionPercentage)}% Complete
              </span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {progress.totalPoints}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Total Points Earned
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {progress.completedMilestones}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400">
                  Milestones Achieved
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserJourneyVisualization;