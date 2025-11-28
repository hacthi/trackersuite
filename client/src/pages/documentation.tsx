import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Book, 
  Search, 
  Users, 
  Calendar, 
  MessageSquare, 
  BarChart3,
  Settings,
  Zap,
  Trophy,
  Shield,
  Database,
  Download,
  ChevronRight,
  Clock,
  CheckCircle
} from "lucide-react";

export default function Documentation() {
  const quickStartGuides = [
    {
      title: "Getting Started with Tracker Suite",
      description: "Complete setup guide from registration to first client",
      duration: "5 min read",
      level: "Beginner",
      icon: Zap
    },
    {
      title: "Adding Your First Client",
      description: "Step-by-step guide to client management",
      duration: "3 min read", 
      level: "Beginner",
      icon: Users
    },
    {
      title: "Scheduling Follow-ups",
      description: "Master the follow-up system and reminders",
      duration: "4 min read",
      level: "Beginner", 
      icon: Calendar
    },
    {
      title: "Understanding Journey Milestones",
      description: "Learn how the gamified journey system works",
      duration: "6 min read",
      level: "Intermediate",
      icon: Trophy
    }
  ];

  const categories = [
    {
      title: "Client Management",
      description: "Everything about managing your clients",
      icon: Users,
      guides: [
        "Adding and editing client profiles",
        "Organizing clients with tags and categories", 
        "Client status management and workflows",
        "Bulk client operations and imports",
        "Client search and filtering"
      ]
    },
    {
      title: "Follow-ups & Tasks",
      description: "Master scheduling and task management",
      icon: Calendar,
      guides: [
        "Creating and scheduling follow-ups",
        "Setting up automated reminders",
        "Managing overdue tasks",
        "Follow-up templates and best practices",
        "Team collaboration on tasks"
      ]
    },
    {
      title: "Communication Tracking",
      description: "Log and track all client interactions",
      icon: MessageSquare,
      guides: [
        "Logging phone calls and meetings",
        "Email integration and tracking", 
        "Communication history management",
        "Interaction templates and notes",
        "Communication analytics"
      ]
    },
    {
      title: "Analytics & Reporting",
      description: "Insights and data-driven decisions",
      icon: BarChart3,
      guides: [
        "Dashboard metrics overview",
        "Generating custom reports",
        "Client performance analytics",
        "Team productivity insights",
        "Export options and scheduling"
      ]
    },
    {
      title: "Journey & Achievements",
      description: "Gamification and progress tracking",
      icon: Trophy,
      guides: [
        "Understanding milestone categories",
        "Earning points and leveling up",
        "Journey stages and progression",
        "Achievement unlocking guide",
        "Team journey competitions"
      ]
    },
    {
      title: "Account & Security",
      description: "Account settings and data protection", 
      icon: Shield,
      guides: [
        "Profile and account settings",
        "Security and privacy controls",
        "Data backup and export",
        "Team member management",
        "Subscription and billing"
      ]
    }
  ];

  const advancedTopics = [
    {
      title: "API Documentation",
      description: "Integrate Tracker Suite with your existing tools",
      icon: Database
    },
    {
      title: "Data Import/Export",
      description: "Migrate from other CRM systems seamlessly",
      icon: Download
    },
    {
      title: "Advanced Workflows",
      description: "Create custom workflows for your team",
      icon: Settings
    },
    {
      title: "Security Best Practices", 
      description: "Protect your client data with enterprise security",
      icon: Shield
    }
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
            <h1 className="text-3xl font-bold">Documentation</h1>
            <p className="text-muted-foreground">Comprehensive guides and tutorials for Tracker Suite</p>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search documentation..." 
                className="pl-10 text-lg h-12"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="outline">Getting Started</Badge>
              <Badge variant="outline">Client Management</Badge>
              <Badge variant="outline">Follow-ups</Badge>
              <Badge variant="outline">Analytics</Badge>
              <Badge variant="outline">API</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Quick Start Guides</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {quickStartGuides.map((guide, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <guide.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{guide.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="secondary" className="text-xs">{guide.level}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {guide.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{guide.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Documentation Categories */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Documentation Categories</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <category.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.guides.map((guide, guideIndex) => (
                      <li key={guideIndex} className="flex items-center gap-2 text-sm hover:text-primary cursor-pointer transition-colors">
                        <ChevronRight className="w-3 h-3" />
                        {guide}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Advanced Topics */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Advanced Topics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedTopics.map((topic, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <topic.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{topic.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Popular Articles */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How to Import Clients from Excel/CSV</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Import</Badge>
                  <span className="text-sm text-muted-foreground">Updated 2 days ago</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Complete guide to importing your existing client data from spreadsheets and other CRM systems.
                </CardDescription>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">8 min read</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Helpful for 94% of users
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Setting Up Automated Follow-up Reminders</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Automation</Badge>
                  <span className="text-sm text-muted-foreground">Updated 1 week ago</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Learn how to configure smart reminders that ensure you never miss important client follow-ups.
                </CardDescription>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">5 min read</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Helpful for 89% of users
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Understanding Your Journey Progress</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Journey</Badge>
                  <span className="text-sm text-muted-foreground">Updated 3 days ago</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Discover how the gamified journey system works and how to maximize your milestone achievements.
                </CardDescription>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">7 min read</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Helpful for 96% of users
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Analytics and Reporting</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Analytics</Badge>
                  <span className="text-sm text-muted-foreground">Updated 5 days ago</span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Master the analytics dashboard and create custom reports for deeper business insights.
                </CardDescription>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">12 min read</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Helpful for 87% of users
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}