import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Clock, 
  Users, 
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  User,
  Bot,
  Minimize2,
  Maximize2
} from "lucide-react";

export default function LiveChat() {
  const [message, setMessage] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: "agent",
      name: "Sarah from Support",
      message: "Hello! Welcome to Tracker Suite support. How can I help you today?",
      time: "2:30 PM",
      avatar: "S"
    },
    {
      id: 2,
      sender: "user", 
      name: "You",
      message: "Hi! I'm having trouble importing my client data from Excel.",
      time: "2:31 PM",
      avatar: "Y"
    },
    {
      id: 3,
      sender: "agent",
      name: "Sarah from Support", 
      message: "I'd be happy to help with that! Can you tell me what specific error or issue you're encountering during the import process?",
      time: "2:32 PM",
      avatar: "S"
    }
  ]);

  const supportAgents = [
    { name: "Sarah Johnson", status: "online", department: "Technical Support", avatar: "S" },
    { name: "Mike Chen", status: "online", department: "Account Management", avatar: "M" },
    { name: "Emma Rodriguez", status: "busy", department: "Billing Support", avatar: "E" },
    { name: "David Kim", status: "online", department: "Technical Support", avatar: "D" }
  ];

  const chatStats = {
    avgResponseTime: "< 2 minutes",
    customersHelped: "1,247",
    satisfactionRate: "98.5%",
    agentsOnline: 8
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: chatMessages.length + 1,
        sender: "user" as const,
        name: "You",
        message: message.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avatar: "Y"
      };
      
      setChatMessages([...chatMessages, newMessage]);
      setMessage("");
      
      // Simulate agent response after 2 seconds
      setTimeout(() => {
        const agentResponse = {
          id: chatMessages.length + 2,
          sender: "agent" as const,
          name: "Sarah from Support",
          message: "Thanks for that information. Let me help you resolve this right away. Can you please share what error message you're seeing?",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: "S"
        };
        setChatMessages(prev => [...prev, agentResponse]);
      }, 2000);
    }
  };

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
            <h1 className="text-3xl font-bold">Live Chat Support</h1>
            <p className="text-muted-foreground">Real-time assistance from our expert team</p>
          </div>
        </div>

        {/* Status Banner */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Chat Support is Online</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {chatStats.agentsOnline} agents available • Average response time: {chatStats.avgResponseTime}
                  </p>
                </div>
              </div>
              <Badge className="bg-green-500 text-white">Available Now</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Live Chat with Support</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Sarah Johnson is online
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {!isMinimized && (
                <>
                  {/* Chat Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.sender === "agent" && (
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-primary">{msg.avatar}</span>
                            </div>
                          )}
                          <div className={`max-w-[70%] ${msg.sender === "user" ? "order-first" : ""}`}>
                            <div
                              className={`p-3 rounded-lg ${
                                msg.sender === "user"
                                  ? "bg-primary text-primary-foreground ml-auto"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                            </div>
                            <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${msg.sender === "user" ? "justify-end" : ""}`}>
                              <span>{msg.name}</span>
                              <span>•</span>
                              <span>{msg.time}</span>
                            </div>
                          </div>
                          {msg.sender === "user" && (
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-primary-foreground">{msg.avatar}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} disabled={!message.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to send • Our team typically responds within 2 minutes
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Chat Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Live Chat Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Response Time</span>
                  <Badge variant="secondary">{chatStats.avgResponseTime}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customer Satisfaction</span>
                  <span className="text-sm font-medium text-green-600">{chatStats.satisfactionRate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Agents Online</span>
                  <span className="text-sm font-medium">{chatStats.agentsOnline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Customers Helped Today</span>
                  <span className="text-sm font-medium">{chatStats.customersHelped}</span>
                </div>
              </CardContent>
            </Card>

            {/* Online Agents */}
            <Card>
              <CardHeader>
                <CardTitle>Available Agents</CardTitle>
                <CardDescription>Our support team ready to help</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportAgents.map((agent, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{agent.avatar}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            agent.status === "online" ? "bg-green-500" :
                            agent.status === "busy" ? "bg-yellow-500" : "bg-gray-500"
                          }`}
                        />
                        <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Support Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Monday - Friday</span>
                  <span className="font-medium">6:00 AM - 10:00 PM PST</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Saturday</span>
                  <span className="font-medium">8:00 AM - 8:00 PM PST</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sunday</span>
                  <span className="font-medium">10:00 AM - 6:00 PM PST</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Currently Open
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alternative Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Other Ways to Reach Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Phone Support</p>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Email Support</p>
                    <p className="text-muted-foreground">support@trackersuite.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Features */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Chat Support Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Instant Responses</h3>
                <p className="text-sm text-muted-foreground">Get help from real humans in under 2 minutes</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Expert Team</h3>
                <p className="text-sm text-muted-foreground">Certified Tracker Suite specialists ready to help</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Issue Resolution</h3>
                <p className="text-sm text-muted-foreground">Most issues resolved in a single chat session</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold mb-2">Extended Hours</h3>
                <p className="text-sm text-muted-foreground">Available 7 days a week with extended coverage</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}