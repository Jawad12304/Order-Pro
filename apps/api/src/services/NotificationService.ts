import { Server } from "socket.io";
import * as admin from "firebase-admin";
import { Resend } from "resend";
import twilio from "twilio";
import axios from "axios";
import React from "react";
// import { render } from "@react-email/components";
// We will mock the render to avoid react-dom/server issues if not strictly set up, 
// or implement it fully if we have the emails ready.
import { OrderReceiptEmail } from "../emails/OrderReceipt";

// Ensure React Email render is dynamically imported if needed to avoid build issues
let render: any = null;
try {
  render = require("@react-email/components").render;
} catch (e) {
  console.warn("React Email render not available natively.");
}

export class NotificationService {
  private static instance: NotificationService;
  
  private io: Server | null = null;
  private resend: Resend | null = null;
  private twilioClient: twilio.Twilio | null = null;

  // Firebase Config
  private isFirebaseInitialized = false;

  private constructor() {
    this.initFirebase();
    this.initResend();
    this.initTwilio();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public setSocketInstance(io: Server) {
    this.io = io;
  }

  // --- INITIALIZERS ---

  private initFirebase() {
    try {
      if (!admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Parse the JSON string
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        this.isFirebaseInitialized = true;
      }
    } catch (err) {
      console.warn("[NotificationService] Firebase init failed. Check FIREBASE_SERVICE_ACCOUNT_KEY env var.");
    }
  }

  private initResend() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else {
      console.warn("[NotificationService] Resend API Key missing. Email disabled.");
    }
  }

  private initTwilio() {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } else {
      console.warn("[NotificationService] Twilio credentials missing. SMS disabled.");
    }
  }

  // --- OMNICHANNEL Senders ---

  /**
   * 1. IN-APP (SOCKET.IO)
   */
  public emitSocketEvent(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
      console.log(`[Socket] Emitted '${event}' to room '${room}'`);
    } else {
      console.warn("[Socket] IO instance not set in NotificationService");
    }
  }

  /**
   * 2. FIREBASE PUSH
   */
  public async sendPushNotification(tokens: string | string[], title: string, body: string, data?: any) {
    if (!this.isFirebaseInitialized) {
      console.log(`[FCM Mock] Push to ${tokens}: ${title} - ${body}`);
      return;
    }

    try {
      const message = {
        notification: { title, body },
        data: data || {},
      };
      
      if (Array.isArray(tokens)) {
        await admin.messaging().sendEachForMulticast({ ...message, tokens });
      } else {
        await admin.messaging().send({ ...message, token: tokens });
      }
    } catch (err) {
      console.error("[FCM] Failed to send push notification", err);
    }
  }

  /**
   * 3. WHATSAPP CLOUD API
   */
  public async sendWhatsAppTemplate(phone: string, templateName: string, languageCode: string = "en_US") {
    const phoneNumberId = process.env.WHATSAPP_PHONE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!phoneNumberId || !token) {
      console.log(`[WhatsApp Mock] Sending template '${templateName}' to ${phone}`);
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phone,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      console.log(`[WhatsApp] Template sent to ${phone}`);
    } catch (err: any) {
      console.error("[WhatsApp] Failed to send message", err.response?.data || err.message);
    }
  }

  /**
   * 4. TWILIO SMS
   */
  public async sendSMS(phone: string, body: string) {
    if (!this.twilioClient || !process.env.TWILIO_FROM_NUMBER) {
      console.log(`[SMS Mock] To ${phone}: ${body}`);
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body,
        from: process.env.TWILIO_FROM_NUMBER,
        to: phone
      });
      console.log(`[SMS] Sent to ${phone}`);
    } catch (err) {
      console.error("[SMS] Failed to send SMS", err);
    }
  }

  /**
   * 5. RESEND EMAIL
   */
  public async sendEmailReceipt(to: string, orderData: any) {
    if (!this.resend || !render) {
      console.log(`[Email Mock] Sending receipt to ${to} for order ${orderData.id}`);
      return;
    }

    try {
      const html = await render(React.createElement(OrderReceiptEmail, { order: orderData }));
      
      await this.resend.emails.send({
        from: "Order Pro <receipts@orderpro.app>",
        to,
        subject: `Your Order Receipt (#${orderData.id.split("_")[1]})`,
        html
      });
      console.log(`[Email] Receipt sent to ${to}`);
    } catch (err) {
      console.error("[Email] Failed to send receipt", err);
    }
  }

  // --- HIGH LEVEL USE CASES ---

  public async notifyNewOrder(restaurantId: string, order: any) {
    // 1. Alert Kitchen (Socket)
    this.emitSocketEvent(`kitchen_${restaurantId}`, "new_order", order);
    
    // 2. Alert Admins/Staff (Socket & FCM)
    this.emitSocketEvent(`staff_${restaurantId}`, "new_order", order);
    
    // Optional: If we tracked staff FCM tokens in DB, we'd query them here and send Push.
    this.sendPushNotification("staff_fcm_topic", "New Order!", `Order #${order.id} received for Table ${order.tableId}.`);
  }

  public async notifyOrderReady(restaurantId: string, order: any, customerPhone?: string, customerEmail?: string) {
    // 1. Notify Customer via Web Socket if they are tracking live
    this.emitSocketEvent(`order_${order.id}`, "order_status_changed", { status: "READY" });

    // 2. Notify Customer via WhatsApp (Primary) or SMS (Fallback)
    if (customerPhone) {
      // Logic could be: try WA, if fails, do SMS. We just trigger both/mock here.
      await this.sendWhatsAppTemplate(customerPhone, "order_ready");
      await this.sendSMS(customerPhone, `Your order at ${order.restaurantName || 'the restaurant'} is ready! Table ${order.tableId}`);
    }

    // 3. Email Receipt if email provided and order is complete/paid
    if (customerEmail) {
      await this.sendEmailReceipt(customerEmail, order);
    }
  }
}

export const notificationService = NotificationService.getInstance();
