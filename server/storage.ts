import { users, type User, type InsertUser, reports, type Report, type InsertReport } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Reports operations
  getReport(id: number): Promise<Report | undefined>;
  getReportsByUser(userId: number): Promise<Report[]>;
  getAllReports(): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  updateReportStatus(id: number, status: string): Promise<Report | undefined>;
  
  // Session storage
  sessionStore: session.SessionStore;
}

// In-memory implementation of storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private userIdCounter: number;
  private reportIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.userIdCounter = 1;
    this.reportIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired sessions every day
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...userData, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Report methods
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      (report) => report.userId === userId
    );
  }

  async getAllReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async createReport(reportData: InsertReport): Promise<Report> {
    const id = this.reportIdCounter++;
    const now = new Date();
    const report: Report = { 
      ...reportData, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.reports.set(id, report);
    return report;
  }

  async updateReportStatus(id: number, status: string): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const updatedReport: Report = {
      ...report,
      status,
      updatedAt: new Date()
    };
    
    this.reports.set(id, updatedReport);
    return updatedReport;
  }
}

export const storage = new MemStorage();
