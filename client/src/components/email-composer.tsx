import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  Send, 
  FileText, 
  User,
  Building2,
  Phone,
  X,
  Eye,
  EyeOff,
  AlertTriangle
} from "lucide-react";
import type { Client } from "@shared/schema";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
}

interface EmailComposerProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailComposer({ client, isOpen, onClose }: EmailComposerProps) {
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch email templates
  const { data: templates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email/templates"],
    enabled: isOpen,
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      return apiRequest("POST", `/api/clients/${client.id}/send-email`, emailData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      // Invalidate interactions to show the email in client history
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      // Extract error message from the response
      let errorMessage = "Failed to send email";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Reset form
  const resetForm = () => {
    setFromEmail("");
    setFromName("");
    setSubject("");
    setMessage("");
    setSelectedTemplate("");
    setShowPreview(false);
    setPreviewHtml("");
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId && templateId !== "custom") {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setSubject(template.subject);
      }
    }
  };

  // Generate preview
  const generatePreview = () => {
    if (!message) {
      toast({
        title: "No content",
        description: "Please write your message first",
        variant: "destructive",
      });
      return;
    }

    let html = message;
    if (selectedTemplate && selectedTemplate !== "custom") {
      // Basic template rendering for preview
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${client.name},</h2>
          <p>${message}</p>
          <p>Best regards,<br>${fromName || 'Support Team'}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">This email was sent from Tracker Suite CRM</p>
        </div>
      `;
    }
    setPreviewHtml(html);
    setShowPreview(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      toast({
        title: "Missing subject",
        description: "Please enter an email subject",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Missing message",
        description: "Please enter your email message",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      subject,
      message,
      template: selectedTemplate && selectedTemplate !== "custom" ? selectedTemplate : undefined,
      fromEmail: fromEmail || undefined,
      fromName: fromName || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Email to {client.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Info Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Email Service Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Powered by Resend</p>
                  <p>Professional email delivery with excellent deliverability and no trial restrictions.</p>
                </div>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Client Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">{client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{client.email}</span>
                </div>
                {client.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{client.company}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                )}
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Email Templates</CardTitle>
                <CardDescription className="text-xs">
                  Choose a template to get started quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom Email</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Email Composition */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sender Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email (optional)</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="your@company.com"
                  />
                </div>
              </div>

              <Separator />

              {/* Email Content */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="message">Message *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-xs"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="w-3 h-3 mr-1" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </>
                    )}
                  </Button>
                </div>
                {!showPreview ? (
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your email message here..."
                    rows={8}
                    required
                  />
                ) : (
                  <div className="border rounded-md p-4 min-h-[200px] bg-white">
                    {previewHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    ) : (
                      <div className="text-gray-500 text-center py-8">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        Click "Generate Preview" to see your email
                      </div>
                    )}
                  </div>
                )}
                {showPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePreview}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Preview
                  </Button>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={sendEmailMutation.isPending}
                  className="flex-1"
                >
                  {sendEmailMutation.isPending ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={sendEmailMutation.isPending}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}