// utils/emailService.ts - Email service using Gmail SMTP
import nodemailer from 'nodemailer';
import logger from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection configuration
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service is ready to send emails');
    } catch (error) {
      logger.error('Email service connection error:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM_NAME || 'ProfSale'} <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Error sending email:', error);
      return false;
    }
  }

  // Welcome email for new registrations
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    businessName: string,
  ): Promise<boolean> {
    const subject = 'Welcome to ProfSale!';
    const html = this.getWelcomeEmailTemplate(firstName, businessName);
    return this.sendEmail({ to: email, subject, html });
  }

  // Password reset email
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
  ): Promise<boolean> {
    const subject = 'Reset Your ProfSale Password';
    const html = this.getPasswordResetTemplate(firstName, resetToken);
    return this.sendEmail({ to: email, subject, html });
  }

  // Email verification
  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string,
  ): Promise<boolean> {
    const subject = 'Verify Your ProfSale Email';
    const html = this.getVerificationEmailTemplate(
      firstName,
      verificationToken,
    );
    return this.sendEmail({ to: email, subject, html });
  }

  // Staff invitation email
  async sendStaffInviteEmail(
    email: string,
    staffName: string,
    businessName: string,
    tempPassword: string,
  ): Promise<boolean> {
    const subject = `You've been invited to join ${businessName} on ProfSale`;
    const html = this.getStaffInviteTemplate(
      staffName,
      businessName,
      tempPassword,
    );
    return this.sendEmail({ to: email, subject, html });
  }

  // Low stock alert email
  async sendLowStockAlert(
    email: string,
    businessName: string,
    products: Array<{ name: string; quantity: number }>,
  ): Promise<boolean> {
    const subject = 'Low Stock Alert - ProfSale';
    const html = this.getLowStockAlertTemplate(businessName, products);
    return this.sendEmail({ to: email, subject, html });
  }

  // Receipt email
  async sendReceiptEmail(
    email: string,
    customerName: string,
    receiptData: any,
  ): Promise<boolean> {
    const subject = 'Your Purchase Receipt - ProfSale';
    const html = this.getReceiptTemplate(customerName, receiptData);
    return this.sendEmail({ to: email, subject, html });
  }

  // Email Templates
  private getWelcomeEmailTemplate(
    firstName: string,
    businessName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ProfSale!</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for registering <strong>${businessName}</strong> with ProfSale!</p>
            <p>We're excited to help you manage your business more efficiently. With ProfSale, you can:</p>
            <ul>
              <li>Manage inventory and products</li>
              <li>Track sales and revenue</li>
              <li>Manage customers and staff</li>
              <li>Generate insightful reports</li>
              <li>Handle expenses and subscriptions</li>
            </ul>
            <p>Get started by logging into your account and exploring the features.</p>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Best regards,<br>The ProfSale Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ProfSale. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(
    firstName: string,
    resetToken: string,
  ): string {
    // In production, this should be your actual app URL
    const resetUrl = `${process.env.APP_URL || 'http://localhost:19006'}/reset-password?token=${resetToken}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background-color: #FF9800; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
          .warning { background-color: #fff3cd; border-left: 4px solid #FF9800; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>We received a request to reset your ProfSale password.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0066cc;">${resetUrl}</p>
            <div class="warning">
              <strong>Note:</strong> This password reset link will expire in 1 hour.
            </div>
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br>The ProfSale Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ProfSale. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getVerificationEmailTemplate(
    firstName: string,
    verificationToken: string,
  ): string {
    const verificationUrl = `${process.env.APP_URL || 'http://localhost:19006'}/verify-email?token=${verificationToken}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for registering with ProfSale! Please verify your email address to complete your registration.</p>
            <p>Click the button below to verify your email:</p>
            <a href="${verificationUrl}" class="button">Verify Email</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #0066cc;">${verificationUrl}</p>
            <p>If you didn't create a ProfSale account, you can safely ignore this email.</p>
            <p>Best regards,<br>The ProfSale Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ProfSale. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getStaffInviteTemplate(
    staffName: string,
    businessName: string,
    tempPassword: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .credentials { background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #9C27B0; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Staff Invitation</h1>
          </div>
          <div class="content">
            <h2>Hi ${staffName},</h2>
            <p>You've been invited to join <strong>${businessName}</strong> on ProfSale as a staff member!</p>
            <p>ProfSale is a comprehensive business management platform that will help you efficiently manage your daily tasks.</p>
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              <p style="color: #d32f2f;"><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
            </div>
            <a href="${process.env.APP_URL || 'http://localhost:19006'}" class="button">Login to ProfSale</a>
            <p>If you have any questions, please contact your business administrator.</p>
            <p>Best regards,<br>The ProfSale Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ProfSale. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getLowStockAlertTemplate(
    businessName: string,
    products: Array<{ name: string; quantity: number }>,
  ): string {
    const productList = products
      .map(
        p =>
          `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.name}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${p.quantity}</td></tr>`,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #f44336; color: white; padding: 10px; text-align: left; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Low Stock Alert</h1>
          </div>
          <div class="content">
            <h2>Attention ${businessName},</h2>
            <p>The following products are running low on stock and need to be restocked:</p>
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th style="text-align: center;">Current Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${productList}
              </tbody>
            </table>
            <p>Please restock these items to avoid running out of inventory.</p>
            <p>Best regards,<br>The ProfSale Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ProfSale. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getReceiptTemplate(customerName: string, receiptData: any): string {
    const items = receiptData.items
      .map(
        (item: any) =>
          `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">UGX ${item.price.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">UGX ${item.total.toLocaleString()}</td>
        </tr>`,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #4CAF50; color: white; padding: 10px; text-align: left; }
          .total-row { font-weight: bold; background-color: #e8f5e9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Purchase Receipt</h1>
          </div>
          <div class="content">
            <h2>Thank you for your purchase, ${customerName}!</h2>
            <p><strong>Receipt #:</strong> ${receiptData.receiptNumber}</p>
            <p><strong>Date:</strong> ${new Date(receiptData.date).toLocaleDateString()}</p>
            <p><strong>Business:</strong> ${receiptData.businessName}</p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: right;">Price</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${items}
                <tr class="total-row">
                  <td colspan="3" style="padding: 10px; text-align: right;">Total:</td>
                  <td style="padding: 10px; text-align: right;">UGX ${receiptData.total.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
            <p>We appreciate your business!</p>
            <p>Best regards,<br>${receiptData.businessName}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ProfSale. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
