import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertReportSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);

  // Check if user is authenticated middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Get all reports
  app.get("/api/reports", isAuthenticated, async (req, res, next) => {
    try {
      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  // Get reports by logged-in user
  app.get("/api/user/reports", isAuthenticated, async (req, res, next) => {
    try {
      const reports = await storage.getReportsByUser(req.user.id);
      res.json(reports);
    } catch (error) {
      next(error);
    }
  });

  // Get a specific report
  app.get("/api/reports/:id", isAuthenticated, async (req, res, next) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(report);
    } catch (error) {
      next(error);
    }
  });

  // Create a new report
  app.post("/api/reports", isAuthenticated, async (req, res, next) => {
    try {
      // Validate request body
      const validatedData = insertReportSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      // Create the report
      const newReport = await storage.createReport(validatedData);
      res.status(201).json(newReport);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      next(error);
    }
  });

  // Update a report status
  app.patch("/api/reports/:id/status", isAuthenticated, async (req, res, next) => {
    try {
      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        return res.status(400).json({ message: "Invalid report ID" });
      }

      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      // Verify valid status values
      if (!["pendente", "em_andamento", "resolvido", "cancelado"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const report = await storage.getReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Only allow users to update their own reports
      if (report.userId !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You can only update your own reports" });
      }

      const updatedReport = await storage.updateReportStatus(reportId, status);
      res.json(updatedReport);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
