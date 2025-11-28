import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Lock, Eye, Database, Users, Bell } from "lucide-react";

export default function PrivacyPolicy() {
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
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: July 20, 2025</p>
          </div>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Our Commitment to Your Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              At Tracker Suite, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our client 
              relationship management platform.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">SOC 2 Compliant</Badge>
              <Badge variant="secondary">GDPR Ready</Badge>
              <Badge variant="secondary">CCPA Compliant</Badge>
              <Badge variant="secondary">Enterprise Security</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <a href="#information-collection" className="block text-sm text-muted-foreground hover:text-primary">
                    1. Information We Collect
                  </a>
                  <a href="#information-use" className="block text-sm text-muted-foreground hover:text-primary">
                    2. How We Use Your Information
                  </a>
                  <a href="#information-sharing" className="block text-sm text-muted-foreground hover:text-primary">
                    3. Information Sharing
                  </a>
                  <a href="#data-security" className="block text-sm text-muted-foreground hover:text-primary">
                    4. Data Security
                  </a>
                  <a href="#data-retention" className="block text-sm text-muted-foreground hover:text-primary">
                    5. Data Retention
                  </a>
                  <a href="#your-rights" className="block text-sm text-muted-foreground hover:text-primary">
                    6. Your Rights
                  </a>
                  <a href="#cookies" className="block text-sm text-muted-foreground hover:text-primary">
                    7. Cookies & Tracking
                  </a>
                  <a href="#contact" className="block text-sm text-muted-foreground hover:text-primary">
                    8. Contact Us
                  </a>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Policy Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Information Collection */}
            <Card id="information-collection">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  1. Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Personal Information You Provide:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Account registration details (name, email, company)</li>
                    <li>Client contact information you add to the platform</li>
                    <li>Communication logs and interaction notes</li>
                    <li>Follow-up schedules and task descriptions</li>
                    <li>Profile preferences and settings</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Automatically Collected Information:</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Device and browser information</li>
                    <li>IP addresses and location data</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Session duration and frequency of use</li>
                    <li>Performance and error logs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Information Use */}
            <Card id="information-use">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  2. How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li>Provide and maintain our CRM services</li>
                  <li>Process your client data and generate insights</li>
                  <li>Send notifications and reminders for follow-ups</li>
                  <li>Improve our platform through usage analytics</li>
                  <li>Provide customer support and technical assistance</li>
                  <li>Communicate important updates and security notices</li>
                  <li>Comply with legal obligations and prevent fraud</li>
                </ul>
              </CardContent>
            </Card>

            {/* Information Sharing */}
            <Card id="information-sharing">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  3. Information Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in these limited circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li><strong>With your consent:</strong> When you explicitly authorize sharing</li>
                  <li><strong>Service providers:</strong> Trusted partners who help us operate our platform</li>
                  <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                  <li><strong>Business transfers:</strong> In case of merger or acquisition (with notice)</li>
                  <li><strong>Safety purposes:</strong> To prevent harm or protect security</li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card id="data-security">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  4. Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">
                  We implement industry-standard security measures to protect your information:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium mb-2">Technical Safeguards:</h5>
                    <ul className="list-disc pl-6 space-y-1 text-xs text-muted-foreground">
                      <li>End-to-end encryption</li>
                      <li>Secure database storage</li>
                      <li>Regular security audits</li>
                      <li>Multi-factor authentication</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Operational Safeguards:</h5>
                    <ul className="list-disc pl-6 space-y-1 text-xs text-muted-foreground">
                      <li>Employee background checks</li>
                      <li>Limited access controls</li>
                      <li>Security training programs</li>
                      <li>Incident response procedures</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card id="data-retention">
              <CardHeader>
                <CardTitle>5. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li><strong>Account data:</strong> Until account deletion + 90 days</li>
                  <li><strong>Client information:</strong> As long as you maintain your account</li>
                  <li><strong>Usage logs:</strong> 2 years for analytics and security</li>
                  <li><strong>Financial records:</strong> 7 years as required by law</li>
                </ul>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card id="your-rights">
              <CardHeader>
                <CardTitle>6. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You have the following rights regarding your personal information:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your account and data</li>
                    <li>Export your data</li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                    <li>Restrict data processing</li>
                    <li>Object to data processing</li>
                    <li>Withdraw consent</li>
                    <li>File complaints with authorities</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card id="cookies">
              <CardHeader>
                <CardTitle>7. Cookies & Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li><strong>Essential cookies:</strong> Required for basic platform functionality</li>
                  <li><strong>Analytics cookies:</strong> Help us understand usage patterns</li>
                  <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Security cookies:</strong> Protect against unauthorized access</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card id="contact">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  8. Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Email:</strong> privacy@trackersuite.com</p>
                  <p><strong>Address:</strong> Tracker Suite Privacy Team</p>
                  <p>123 Business Ave, Suite 100</p>
                  <p>San Francisco, CA 94105</p>
                  <p><strong>Response Time:</strong> We respond to privacy requests within 30 days</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}