import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  ArrowLeft, 
  HelpCircle, 
  MessageSquare, 
  Book, 
  Video, 
  Mail, 
  Phone, 
  Clock, 
  CheckCircle,
  Search,
  FileText,
  Users,
  Zap,
  Settings,
  AlertTriangle,
  CreditCard
} from "lucide-react";

const supportFormSchema = z.object({
  category: z.string().min(1, "Please select a category"),
  subject: z.string().min(1, "Subject is required").max(100, "Subject must be less than 100 characters"),
  priority: z.string().min(1, "Please select a priority level"),
  description: z.string().min(10, "Please provide more details (at least 10 characters)")
    .max(1000, "Description must be less than 1000 characters"),
  email: z.string().email("Please enter a valid email address")
});

type SupportForm = z.infer<typeof supportFormSchema>;

export default function Support() {
  const form = useForm<SupportForm>({
    resolver: zodResolver(supportFormSchema),
    defaultValues: {
      category: "",
      subject: "",
      priority: "",
      description: "",
      email: ""
    }
  });

  const onSubmit = (data: SupportForm) => {
    console.log("Support form submitted:", data);
    // Here you would typically send the form data to your backend
    alert("Thank you for contacting us! We'll get back to you within 24 hours.");
    form.reset();
  };

  const faqs = [
    {
      question: "How do I get started with Tracker Suite?",
      answer: "Sign up for your free 7-day trial, verify your email, and follow our guided onboarding. No credit card required!"
    },
    {
      question: "Can I import my existing client data?",
      answer: "Yes! We support CSV imports and provide templates to help you migrate from other CRM systems."
    },
    {
      question: "How does the journey tracking system work?",
      answer: "Our gamified journey system automatically tracks your platform usage and awards points for milestones like adding clients, scheduling follow-ups, and logging interactions."
    },
    {
      question: "What happens during my trial period?",
      answer: "You get full access to all features for 7 days. No limitations, no credit card required. Your trial automatically expires if you don't upgrade."
    },
    {
      question: "How secure is my client data?",
      answer: "We use enterprise-grade security including end-to-end encryption, SOC 2 compliance, and regular security audits to protect your data."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely! Cancel anytime through your account settings. You'll retain access until your billing period ends, and can export your data for 90 days."
    }
  ];

  const supportCategories = [
    { icon: Users, title: "Account & Billing", description: "Subscription, payments, trial questions" },
    { icon: Settings, title: "Technical Issues", description: "Bugs, performance, feature problems" },
    { icon: FileText, title: "Data & Import", description: "Client data, exports, integrations" },
    { icon: Zap, title: "Feature Requests", description: "Suggest new features or improvements" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Support Center</h1>
            <p className="text-muted-foreground">Get help and find answers to your questions</p>
          </div>
        </div>

        {/* Quick Help Options */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Link href="/documentation">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Book className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">Documentation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  40+ comprehensive guides covering everything from setup to advanced analytics. Organized by feature with difficulty levels and estimated reading times.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/video-tutorials">
            <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-lg">Video Tutorials</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  6 video series with 40+ tutorials totaling 5+ hours of content. From beginner basics to advanced features, all with step-by-step visual guidance.
                </CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-lg">Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Real-time support during business hours
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                <HelpCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Answers to common questions
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Send us a message and we'll help you out.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="account">Account & Billing</SelectItem>
                              <SelectItem value="technical">Technical Issues</SelectItem>
                              <SelectItem value="data">Data & Import</SelectItem>
                              <SelectItem value="feature">Feature Request</SelectItem>
                              <SelectItem value="general">General Question</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low - General question</SelectItem>
                              <SelectItem value="medium">Medium - Feature not working</SelectItem>
                              <SelectItem value="high">High - Service disruption</SelectItem>
                              <SelectItem value="urgent">Urgent - Business critical</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of your issue" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please provide detailed information about your issue..."
                              className="h-32"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </Form>

                {/* Response Times */}
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Expected Response Times
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Low Priority:</span>
                      <span className="text-muted-foreground">48 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium Priority:</span>
                      <span className="text-muted-foreground">24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Priority:</span>
                      <span className="text-muted-foreground">4 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Urgent:</span>
                      <span className="text-green-600 font-medium">1 hour</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ and Resources */}
          <div className="space-y-8">
            {/* Support Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Support Categories</CardTitle>
                <CardDescription>
                  Browse help topics by category
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {supportCategories.map((category, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{category.title}</h4>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-medium mb-2">{faq.question}</h4>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Other Ways to Reach Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@trackersuite.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                    <p className="text-xs text-muted-foreground">Mon-Fri, 9 AM - 6 PM PST</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-muted-foreground">Available during business hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status & Updates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span>All Systems Operational</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Healthy
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check our status page for real-time updates on system performance and scheduled maintenance.
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  View Status Page
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}