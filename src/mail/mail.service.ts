import * as nodemailer from "nodemailer";
import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class MailService {
  private readonly IS_LOCAL: string;
  constructor() {
    this.IS_LOCAL = process.env.IS_LOCAL === "true" ? "src" : "dist";
  }
  async sendEmail(htmlContent, userEmail, subject) {
    const transporter = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "info@work-break.com",
        pass: "workbreak(())info",
      },
      tls: {
        rejectUnauthorized: false, // Fixes potential SSL/TLS errors
      },
    });

    const mailOptions = {
      from: '"Work-Break Support" <info@work-break.com>',
      to: userEmail,
      subject,
      html: htmlContent,
    };

    try {
      const response = await transporter.sendMail(mailOptions);
      if (response?.messageId) {
        return response.messageId;
      }
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  async sendRegistrationEmail(userEmail, userName, verificationLink) {
    const templatePath = path.join(
      process.cwd(),
      this.IS_LOCAL,
      "mail",
      "signup-verify.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    const subject = "Complete Your Registration at Work-Break";
    try {
      htmlContent = htmlContent
        .replace("{{userName}}", userName)
        .replace(/{{verificationLink}}/g, verificationLink)
        .replace("{{currentYear}}", new Date().getFullYear().toString());
      await this.sendEmail(htmlContent, userEmail, subject);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  async sendNewEmailVerification(userEmail, userName, verificationLink) {
    const templatePath = path.join(
      process.cwd(),
      this.IS_LOCAL,
      "mail",
      "email-update.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    const subject = "Update Your Email at Work-Break";
    try {
      htmlContent = htmlContent
        .replace("{{userName}}", userName)
        .replace(/{{verificationLink}}/g, verificationLink)
        .replace("{{currentYear}}", new Date().getFullYear().toString());

      await this.sendEmail(htmlContent, userEmail, subject);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  async sendForgotPasswordMail(userEmail, userName, verificationLink) {
    const templatePath = path.join(
      process.cwd(),
      this.IS_LOCAL,
      "mail",
      "password-reset.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    const subject = "Reset Your Password at Work-Break";
    htmlContent = htmlContent
      .replace("{{userName}}", userName)
      .replace(/{{verificationLink}}/g, verificationLink)
      .replace("{{currentYear}}", new Date().getFullYear().toString());
    await this.sendEmail(htmlContent, userEmail, subject);
  }

  async sendInvitationMail(
    userEmail: string,
    userName: string,
    adminEmail: string,
    adminName: string,
    acceptInvitationLink: string,
  ) {
    const templatePath = path.join(
      process.cwd(),
      this.IS_LOCAL,
      "mail",
      "admin-invitation.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    const subject = "Admin Invitation at Work-Break";
    try {
      htmlContent = htmlContent
        .replace("{{userName}}", userName)
        .replace("{{adminEmail}}", adminEmail)
        .replace("{{adminName}}", adminName)
        .replace(/{{acceptInvitationLink}}/g, acceptInvitationLink)
        .replace("{{currentYear}}", new Date().getFullYear().toString());

      const response = await this.sendEmail(htmlContent, userEmail, subject);
      return response;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  async sendGoogleCalendarSyncedEmail(userEmail) {
    const templatePath = path.join(
      process.cwd(),
      this.IS_LOCAL,
      "mail",
      "synced-email.html",
    );
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    const subject = "Google Calendar Successfully Synced - Work-Break";
    try {
      htmlContent = htmlContent
        .replace("{{currentYear}}", new Date().getFullYear().toString());
      await this.sendEmail(htmlContent, userEmail, subject);
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}
