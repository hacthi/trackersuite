import { Resend } from 'resend';

let resend: Resend | null = null;

// Initialize Resend with API key
function initializeResend() {
  if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log("Resend email service initialized successfully");
    return true;
  } else {
    console.log("RESEND_API_KEY not provided - email functionality will be disabled");
    return false;
  }
}

// Initialize on startup
initializeResend();

interface SendEmailParams {
  to: string;
  toName?: string;
  from: string;
  fromName: string;
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  templateVariables?: Record<string, any>;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Try to initialize Resend if not already done
    if (!resend) {
      const initialized = initializeResend();
      if (!initialized) {
        return {
          success: false,
          error: 'Email service not configured. Please add your RESEND_API_KEY to enable email functionality.',
        };
      }
    }

    const fromEmail = `${params.fromName} <${params.from}>`;
    const toEmail = params.toName ? `${params.toName} <${params.to}>` : params.to;

    const emailData = {
      from: fromEmail,
      to: [toEmail],
      subject: params.subject,
      html: params.html || undefined,
      text: params.text || undefined,
    };

    const response = await resend.emails.send(emailData);
    
    if (response.error) {
      console.error('Resend error:', response.error);
      return {
        success: false,
        error: response.error.message || 'Failed to send email',
      };
    }
    
    return {
      success: true,
      messageId: response.data?.id || 'unknown',
    };
  } catch (error: any) {
    console.error('Email sending error:', error);
    
    let errorMessage = 'Failed to send email';
    
    if (error.message && error.message.includes('API key')) {
      errorMessage = 'Email service authentication failed. Please check your Resend API key.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Email templates for common communications
export const emailTemplates = {
  followUpReminder: {
    subject: "Follow-up on our recent conversation",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello {{clientName}},</h2>
        <p>I hope this email finds you well. I wanted to follow up on our recent conversation regarding {{topic}}.</p>
        <p>{{message}}</p>
        <p>Please feel free to reach out if you have any questions or would like to schedule a call.</p>
        <p>Best regards,<br>{{senderName}}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This email was sent from Tracker Suite CRM</p>
      </div>
    `,
  },
  welcomeMessage: {
    subject: "Welcome to our service!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome {{clientName}}!</h2>
        <p>Thank you for choosing our services. We're excited to work with you.</p>
        <p>{{message}}</p>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>{{senderName}}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This email was sent from Tracker Suite CRM</p>
      </div>
    `,
  },
  projectUpdate: {
    subject: "Project Update - {{projectName}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project Update: {{projectName}}</h2>
        <p>Hello {{clientName}},</p>
        <p>I wanted to provide you with an update on {{projectName}}:</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          {{message}}
        </div>
        <p>Please let me know if you have any questions or feedback.</p>
        <p>Best regards,<br>{{senderName}}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This email was sent from Tracker Suite CRM</p>
      </div>
    `,
  },
};

export function renderEmailTemplate(templateKey: keyof typeof emailTemplates, variables: Record<string, string>): { subject: string; html: string } {
  const template = emailTemplates[templateKey];
  if (!template) {
    throw new Error(`Template ${templateKey} not found`);
  }

  let subject = template.subject;
  let html = template.html;

  // Replace variables in both subject and HTML
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    html = html.replace(new RegExp(placeholder, 'g'), value);
  });

  return { subject, html };
}