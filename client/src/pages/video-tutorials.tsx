import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  Trophy,
  Settings,
  Zap,
  Eye,
  ThumbsUp
} from "lucide-react";

export default function VideoTutorials() {
  const tutorialSeries = [
    {
      title: "Getting Started Series",
      description: "Complete walkthrough for new users",
      videos: 5,
      duration: "23 minutes",
      level: "Beginner",
      thumbnail: "/api/placeholder/320/180",
      videos_list: [
        { title: "Account Setup & First Login", duration: "3:45" },
        { title: "Dashboard Overview", duration: "4:20" }, 
        { title: "Adding Your First Client", duration: "5:15" },
        { title: "Basic Navigation", duration: "4:30" },
        { title: "Settings & Preferences", duration: "5:10" }
      ]
    },
    {
      title: "Client Management Mastery",
      description: "Advanced client organization techniques",
      videos: 7,
      duration: "35 minutes", 
      level: "Intermediate",
      thumbnail: "/api/placeholder/320/180",
      videos_list: [
        { title: "Client Profile Deep Dive", duration: "6:20" },
        { title: "Tags and Categories", duration: "4:45" },
        { title: "Bulk Operations", duration: "5:30" },
        { title: "Search and Filtering", duration: "4:15" },
        { title: "Client Status Workflows", duration: "5:45" },
        { title: "Data Import/Export", duration: "4:30" },
        { title: "Best Practices", duration: "3:55" }
      ]
    },
    {
      title: "Journey & Achievements",
      description: "Maximize your gamified experience",
      videos: 4,
      duration: "18 minutes",
      level: "All Levels",
      thumbnail: "/api/placeholder/320/180", 
      videos_list: [
        { title: "Understanding Milestones", duration: "4:30" },
        { title: "Point System Explained", duration: "3:45" },
        { title: "Journey Stages", duration: "5:20" },
        { title: "Achievement Strategies", duration: "4:25" }
      ]
    }
  ];

  const featuredVideos = [
    {
      title: "Complete Tracker Suite Overview",
      description: "30-minute comprehensive tour of all features",
      duration: "30:15",
      views: "12,543",
      likes: "98%", 
      category: "Overview",
      thumbnail: "/api/placeholder/400/225",
      isNew: true
    },
    {
      title: "Follow-up Automation Setup",
      description: "Never miss a follow-up with smart automation",
      duration: "8:45",
      views: "8,921",
      likes: "96%",
      category: "Automation", 
      thumbnail: "/api/placeholder/400/225",
      isPopular: true
    },
    {
      title: "Advanced Analytics Dashboard",
      description: "Unlock powerful insights from your client data",
      duration: "12:30",
      views: "6,432",
      likes: "94%",
      category: "Analytics",
      thumbnail: "/api/placeholder/400/225",
      isNew: false
    }
  ];

  const categories = [
    { name: "Getting Started", count: 12, icon: Zap, color: "bg-blue-500" },
    { name: "Client Management", count: 18, icon: Users, color: "bg-green-500" },
    { name: "Follow-ups", count: 15, icon: Calendar, color: "bg-orange-500" },
    { name: "Communication", count: 10, icon: MessageSquare, color: "bg-purple-500" },
    { name: "Analytics", count: 8, icon: BarChart3, color: "bg-red-500" },
    { name: "Journey System", count: 6, icon: Trophy, color: "bg-yellow-500" },
    { name: "Settings", count: 9, icon: Settings, color: "bg-gray-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/support">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Support
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Video Tutorials</h1>
            <p className="text-muted-foreground">Step-by-step video walkthroughs for every feature</p>
          </div>
        </div>

        {/* Featured Videos */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Featured Videos</h2>
          <div className="grid lg:grid-cols-3 gap-6">
            {featuredVideos.map((video, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Play className="w-16 h-16 text-primary/70" />
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    {video.isNew && <Badge className="bg-green-500">New</Badge>}
                    {video.isPopular && <Badge className="bg-orange-500">Popular</Badge>}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                    {video.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{video.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {video.likes}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">{video.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tutorial Series */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Tutorial Series</h2>
          <div className="space-y-6">
            {tutorialSeries.map((series, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  <div className="lg:w-80 h-48 lg:h-auto bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Play className="w-12 h-12 text-primary/70" />
                  </div>
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{series.title}</h3>
                        <p className="text-muted-foreground mb-3">{series.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{series.videos} videos</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {series.duration}
                          </span>
                          <Badge variant="secondary">{series.level}</Badge>
                        </div>
                      </div>
                      <Button>
                        <Play className="w-4 h-4 mr-2" />
                        Start Series
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {series.videos_list.slice(0, 3).map((video, videoIndex) => (
                        <div key={videoIndex} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded">
                          <span className="text-sm">{video.title}</span>
                          <span className="text-xs text-muted-foreground">{video.duration}</span>
                        </div>
                      ))}
                      {series.videos_list.length > 3 && (
                        <div className="text-center py-2">
                          <Button variant="ghost" size="sm">
                            View All {series.videos} Videos
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                    <category.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} videos</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Video Tips */}
        <section>
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Video Learning Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Getting the Most from Video Tutorials</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use the pause button to follow along step-by-step</li>
                    <li>• Keep Tracker Suite open in another tab for practice</li>
                    <li>• Take notes on key shortcuts and tips</li>
                    <li>• Replay sections as needed - there's no rush!</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Video Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• All videos include closed captions</li>
                    <li>• Adjustable playback speed (0.5x to 2x)</li>
                    <li>• Mobile-friendly responsive player</li>
                    <li>• Chapter markers for easy navigation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}