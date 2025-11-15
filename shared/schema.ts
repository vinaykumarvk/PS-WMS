import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, date, doublePrecision, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("relationship_manager"),
  avatarUrl: text("avatar_url"),
  jobTitle: text("job_title"),
  email: text("email"),
  phone: text("phone"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Client model
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  // Basic Personal Information
  fullName: text("full_name").notNull(),
  initials: text("initials"),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  maritalStatus: text("marital_status"), // Single, Married, Divorced, Widowed
  anniversaryDate: timestamp("anniversary_date"),
  
  // Address Information
  homeAddress: text("home_address"),
  homeCity: text("home_city"),
  homeState: text("home_state"),
  homePincode: text("home_pincode"),
  workAddress: text("work_address"),
  workCity: text("work_city"),
  workState: text("work_state"),
  workPincode: text("work_pincode"),
  
  // Professional Information
  profession: text("profession"),
  sectorOfEmployment: text("sector_of_employment"),
  designation: text("designation"),
  companyName: text("company_name"),
  annualIncome: text("annual_income"),
  workExperience: integer("work_experience"), // in years
  
  // KYC & Compliance Information
  kycDate: timestamp("kyc_date"),
  kycStatus: text("kyc_status"), // Verified, Pending, Expired
  identityProofType: text("identity_proof_type"), // Aadhaar, PAN, Passport
  identityProofNumber: text("identity_proof_number"),
  addressProofType: text("address_proof_type"),
  panNumber: text("pan_number"),
  taxResidencyStatus: text("tax_residency_status"),
  fatcaStatus: text("fatca_status"),
  riskAssessmentScore: integer("risk_assessment_score"),
  
  // Family Information
  spouseName: text("spouse_name"),
  dependentsCount: integer("dependents_count"),
  childrenDetails: text("children_details"), // Stored as JSON text
  nomineeDetails: text("nominee_details"),
  familyFinancialGoals: text("family_financial_goals"),
  
  // Investment Profile
  tier: text("tier").notNull().default("silver"), // silver, gold, platinum
  aum: text("aum").notNull(), // Assets Under Management
  aumValue: real("aum_value").notNull(), // Numeric value for sorting
  riskProfile: text("risk_profile").default("moderate"), // conservative, moderate, aggressive
  investmentHorizon: text("investment_horizon"), // Short-term, Medium-term, Long-term
  
  // Portfolio Information
  totalInvestedAmount: integer("total_invested_amount"),
  currentValue: integer("current_value"),
  unrealizedGains: integer("unrealized_gains"),
  unrealizedGainsPercent: doublePrecision("unrealized_gains_percent"),
  oneYearReturn: doublePrecision("one_year_return"),
  threeYearReturn: doublePrecision("three_year_return"),
  fiveYearReturn: doublePrecision("five_year_return"),
  portfolioStartDate: date("portfolio_start_date"),
  lastValuationDate: date("last_valuation_date"),
  riskScore: integer("risk_score"),
  esgScore: integer("esg_score"),
  volatility: doublePrecision("volatility"),
  sharpeRatio: doublePrecision("sharpe_ratio"),
  assetAllocation: jsonb("asset_allocation"), // {equity: 60, fixedIncome: 30, cash: 5, alternative: 5}
  sectorExposure: jsonb("sector_exposure"), // {financial: 30, technology: 25, ...}
  geographicExposure: jsonb("geographic_exposure"), // {india: 80, us: 15, ...}
  investmentObjectives: text("investment_objectives"), // Comma-separated or JSON
  preferredProducts: text("preferred_products"), // Comma-separated or JSON
  sourceOfWealth: text("source_of_wealth"),
  
  // Communication & Relationship
  lastContactDate: timestamp("last_contact_date"),
  preferredContactMethod: text("preferred_contact_method"), // Email, Phone, In-person
  preferredContactTime: text("preferred_contact_time"), // Morning, Afternoon, Evening
  communicationFrequency: text("communication_frequency"), // Weekly, Monthly, Quarterly
  clientSince: timestamp("client_since"),
  clientAcquisitionSource: text("client_acquisition_source"),
  
  // Transaction Information
  lastTransactionDate: timestamp("last_transaction_date"),
  totalTransactionCount: integer("total_transaction_count"),
  averageTransactionValue: real("average_transaction_value"),
  recurringInvestments: text("recurring_investments"), // JSON text
  
  // Additional Wealth Management Fields
  taxPlanningPreferences: text("tax_planning_preferences"),
  insuranceCoverage: text("insurance_coverage"), // JSON text
  retirementGoals: text("retirement_goals"),
  majorLifeEvents: text("major_life_events"), // JSON text
  financialInterests: text("financial_interests"), // Comma-separated
  netWorth: text("net_worth"),
  liquidityRequirements: text("liquidity_requirements"),
  foreignInvestments: text("foreign_investments"),
  
  // System Fields
  alertCount: integer("alert_count").default(0), // Number of active alerts
  createdAt: timestamp("created_at").defaultNow(),
  assignedTo: integer("assigned_to").references(() => users.id),
  profileStatus: text("profile_status").default("incomplete"),
  incompleteSections: text("incomplete_sections").array(),
  lastAccessedAt: timestamp("last_accessed_at"),
  
  // Document references could be added here or in a separate table
  // For now, we'll assume documents are stored in a separate table
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
});

// Prospect model (leads in pipeline)
export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  initials: text("initials"),
  potentialAum: text("potential_aum"),
  potentialAumValue: real("potential_aum_value"),
  email: text("email"),
  phone: text("phone"),
  stage: text("stage").notNull().default("new"), // new, qualified, proposal, won, lost
  lastContactDate: timestamp("last_contact_date"),
  probabilityScore: integer("probability_score").default(50), // 0-100
  productsOfInterest: text("products_of_interest").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  assignedTo: integer("assigned_to").references(() => users.id),
});

// Base prospect schema
const baseProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
});

// Enhanced prospect schema with better validation and error messages
export const insertProspectSchema = baseProspectSchema.extend({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").regex(/^[+]?[0-9\s-()]+$/, "Invalid phone number format"),
  potentialAum: z.string().min(1, "Potential AUM is required"),
  potentialAumValue: z.number().min(0, "Potential AUM value cannot be negative"),
  stage: z.string().min(1, "Stage is required"),
  probabilityScore: z.number().min(0, "Probability must be at least 0%").max(100, "Probability cannot exceed 100%"),
  initials: z.string().optional(),
  lastContactDate: z.date().optional().nullable(),
  productsOfInterest: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// Task model
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false),
  priority: text("priority").default("medium"), // low, medium, high
  urgency: text("urgency"), // now, next, scheduled (computed field, optional for backward compatibility)
  category: text("category").default("task"), // task, alert, follow_up, appointment
  clientId: integer("client_id").references(() => clients.id),
  prospectId: integer("prospect_id").references(() => prospects.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
}).extend({
  dueDate: z.string().transform((str) => new Date(str)).optional(),
});

// Meeting/Appointment model
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  clientId: integer("client_id").references(() => clients.id),
  prospectId: integer("prospect_id").references(() => prospects.id),
  assignedTo: integer("assigned_to").references(() => users.id),
  priority: text("priority").default("medium"), // low, medium, high
  type: text("type").notNull(), // meeting, call, email, other
  followUpDate: timestamp("follow_up_date"), // For follow-up tracking
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.string().transform((str) => new Date(str)),
  endTime: z.string().transform((str) => new Date(str)),
});

// Portfolio Alert model
export const portfolioAlerts = pgTable("portfolio_alerts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  clientId: integer("client_id").references(() => clients.id),
  severity: text("severity").notNull(), // info, warning, critical
  read: boolean("read").default(false),
  actionRequired: boolean("action_required").default(true),
  scheduledFor: timestamp("scheduled_for"), // For scheduling alerts
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPortfolioAlertSchema = createInsertSchema(portfolioAlerts).omit({
  id: true,
  createdAt: true,
});

// Performance Metrics model
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  metricType: text("metric_type").notNull(), // new_aum, new_clients, revenue, retention
  currentValue: real("current_value").notNull(),
  targetValue: real("target_value").notNull(),
  percentageChange: real("percentage_change"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
});

// Monthly AUM Trend model
export const aumTrends = pgTable("aum_trends", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  totalAum: real("total_aum").notNull(),
  previousYearAum: real("previous_year_aum").notNull(),
  growthPercentage: real("growth_percentage").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAumTrendSchema = createInsertSchema(aumTrends).omit({
  id: true,
  createdAt: true,
});

// Sales Pipeline model
export const salesPipeline = pgTable("sales_pipeline", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  stage: text("stage").notNull(), // new_leads, qualified, proposal, closed
  count: integer("count").notNull().default(0),
  value: real("value").notNull().default(0), // value in the pipeline
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalesPipelineSchema = createInsertSchema(salesPipeline).omit({
  id: true,
  createdAt: true,
});

// Transactions model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  transactionDate: timestamp("transaction_date").notNull(),
  settlementDate: timestamp("settlement_date"),
  transactionType: text("transaction_type").notNull(), // buy, sell, dividend, interest, fee, deposit, withdrawal
  productType: text("product_type").notNull(), // equity, mutual_fund, bond, fixed_deposit, insurance, etc.
  productName: text("product_name").notNull(),
  productCategory: text("product_category"), // large_cap, mid_cap, small_cap, debt, hybrid, etc.
  quantity: real("quantity"),
  price: real("price"),
  amount: real("amount").notNull(),
  fees: real("fees").default(0),
  taxes: real("taxes").default(0),
  totalAmount: real("total_amount").notNull(),
  currencyCode: text("currency_code").default("INR"),
  status: text("status").notNull().default("completed"), // pending, completed, failed, cancelled
  reference: text("reference"), // Reference number or ID
  description: text("description"),
  portfolioImpact: real("portfolio_impact"), // Percentage change in portfolio value
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type PortfolioAlert = typeof portfolioAlerts.$inferSelect;
export type InsertPortfolioAlert = z.infer<typeof insertPortfolioAlertSchema>;

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;

export type AumTrend = typeof aumTrends.$inferSelect;
export type InsertAumTrend = z.infer<typeof insertAumTrendSchema>;

export type SalesPipeline = typeof salesPipeline.$inferSelect;
export type InsertSalesPipeline = z.infer<typeof insertSalesPipelineSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Business Metrics Aggregation Tables for Dashboard Analytics

// Client Portfolio Breakdown - stores current AUM breakdowns by various dimensions
export const clientPortfolioBreakdowns = pgTable("client_portfolio_breakdowns", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(), // RM managing the client
  
  // Dimension and value pairs
  dimension: text("dimension").notNull(), // asset_class, product_type, risk_profile, customer_segment, geography
  category: text("category").notNull(), // equity, debt, mf, etc. OR platinum, gold, silver, etc.
  
  // Financial values
  aumAmount: real("aum_amount").notNull(),
  investedAmount: real("invested_amount").notNull(),
  currentValue: real("current_value").notNull(),
  unrealizedGains: real("unrealized_gains").notNull(),
  
  // Metadata
  asOfDate: date("as_of_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// RM Business Metrics - aggregated metrics per RM for dashboard
export const rmBusinessMetrics = pgTable("rm_business_metrics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Core business metrics
  totalAum: real("total_aum").notNull(),
  totalClients: integer("total_clients").notNull(),
  revenueMonthToDate: real("revenue_month_to_date").notNull(),
  pipelineValue: real("pipeline_value").notNull(),
  
  // Client tier distribution
  platinumClients: integer("platinum_clients").notNull().default(0),
  goldClients: integer("gold_clients").notNull().default(0),
  silverClients: integer("silver_clients").notNull().default(0),
  
  // Asset class distribution (amounts)
  equityAum: real("equity_aum").notNull().default(0),
  debtAum: real("debt_aum").notNull().default(0),
  mutualFundAum: real("mutual_fund_aum").notNull().default(0),
  othersAum: real("others_aum").notNull().default(0),
  
  // Risk profile distribution
  conservativeClients: integer("conservative_clients").notNull().default(0),
  moderateClients: integer("moderate_clients").notNull().default(0),
  aggressiveClients: integer("aggressive_clients").notNull().default(0),
  
  // Time-based data
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  asOfDate: date("as_of_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Product Revenue Breakdown - for revenue drill-down analysis
export const productRevenue = pgTable("product_revenue", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Product information
  productType: text("product_type").notNull(), // mutual_fund, equity, bond, insurance, etc.
  productCategory: text("product_category"), // large_cap, debt, term_plan, etc.
  productName: text("product_name"),
  
  // Revenue metrics
  grossRevenue: real("gross_revenue").notNull(),
  netRevenue: real("net_revenue").notNull(),
  commissionRate: real("commission_rate"),
  trailCommission: real("trail_commission").notNull().default(0),
  upfrontCommission: real("upfront_commission").notNull().default(0),
  
  // Volume metrics
  transactionCount: integer("transaction_count").notNull().default(0),
  clientCount: integer("client_count").notNull().default(0),
  totalVolume: real("total_volume").notNull().default(0),
  
  // Time period
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer Segment Analysis - for client drill-down by segments
export const customerSegmentAnalysis = pgTable("customer_segment_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Segment definition
  segmentType: text("segment_type").notNull(), // tier, age_group, profession, geography, aum_band
  segmentValue: text("segment_value").notNull(), // platinum, 25-35, corporate, mumbai, 1cr-5cr
  
  // Metrics for this segment
  clientCount: integer("client_count").notNull(),
  totalAum: real("total_aum").notNull(),
  averageAum: real("average_aum").notNull(),
  revenueContribution: real("revenue_contribution").notNull(),
  
  // Behavioral metrics
  averageTransactionSize: real("average_transaction_size"),
  transactionFrequency: real("transaction_frequency"), // transactions per month
  retentionRate: real("retention_rate"),
  
  // Growth metrics
  newClientsThisMonth: integer("new_clients_this_month").notNull().default(0),
  aumGrowthRate: real("aum_growth_rate"),
  
  // Time period
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  asOfDate: date("as_of_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pipeline Analysis - for prospect/pipeline drill-down
export const pipelineAnalysis = pgTable("pipeline_analysis", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  
  // Pipeline stage breakdown
  stage: text("stage").notNull(), // new, qualified, proposal, negotiation, won, lost
  prospectCount: integer("prospect_count").notNull(),
  totalValue: real("total_value").notNull(),
  averageValue: real("average_value").notNull(),
  averageProbability: real("average_probability"),
  
  // Velocity metrics
  averageStageTime: integer("average_stage_time"), // days in this stage
  conversionRate: real("conversion_rate"), // to next stage
  
  // Source analysis
  leadSource: text("lead_source"), // referral, digital, events, cold_calling
  sourceProspectCount: integer("source_prospect_count"),
  sourceConversionRate: real("source_conversion_rate"),
  
  // Time period
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  asOfDate: date("as_of_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client Complaints - for tracking customer service issues
export const clientComplaints = pgTable("client_complaints", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  assignedTo: integer("assigned_to").references(() => users.id).notNull(),
  
  // Complaint details
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // service_quality, transaction_issue, product_complaint, documentation, fees_charges, others
  subcategory: text("subcategory"), // delayed_execution, wrong_advice, mis_selling, etc.
  
  // Severity and status
  severity: text("severity").notNull(), // critical, high, medium, low
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  priority: text("priority").notNull(), // urgent, high, normal, low
  
  // Resolution details
  resolutionDetails: text("resolution_details"),
  resolutionDate: timestamp("resolution_date"),
  resolutionBy: integer("resolution_by").references(() => users.id),
  
  // Regulatory compliance
  isRegulatory: boolean("is_regulatory").notNull().default(false), // SEBI/RBI reportable
  regulatoryRefNumber: text("regulatory_ref_number"),
  
  // Timeline tracking
  reportedDate: timestamp("reported_date").notNull().defaultNow(),
  acknowledgmentDate: timestamp("acknowledgment_date"),
  targetResolutionDate: timestamp("target_resolution_date"),
  
  // Source and channel
  reportedVia: text("reported_via"), // phone, email, branch, online, mobile_app
  escalationLevel: integer("escalation_level").notNull().default(1), // 1=L1, 2=L2, etc.
  
  // Customer satisfaction
  resolutionRating: integer("resolution_rating"), // 1-5 scale
  customerFeedback: text("customer_feedback"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas for the new tables
export const insertClientPortfolioBreakdownSchema = createInsertSchema(clientPortfolioBreakdowns).omit({
  id: true,
  createdAt: true,
});

export const insertRmBusinessMetricSchema = createInsertSchema(rmBusinessMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertClientComplaintSchema = createInsertSchema(clientComplaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type Complaint = typeof clientComplaints.$inferSelect;
export type InsertComplaint = z.infer<typeof insertClientComplaintSchema>;

export const insertProductRevenueSchema = createInsertSchema(productRevenue).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSegmentAnalysisSchema = createInsertSchema(customerSegmentAnalysis).omit({
  id: true,
  createdAt: true,
});

export const insertPipelineAnalysisSchema = createInsertSchema(pipelineAnalysis).omit({
  id: true,
  createdAt: true,
});

// Export types for the new tables
export type ClientPortfolioBreakdown = typeof clientPortfolioBreakdowns.$inferSelect;
export type InsertClientPortfolioBreakdown = z.infer<typeof insertClientPortfolioBreakdownSchema>;

export type RmBusinessMetric = typeof rmBusinessMetrics.$inferSelect;
export type InsertRmBusinessMetric = z.infer<typeof insertRmBusinessMetricSchema>;

export type ProductRevenue = typeof productRevenue.$inferSelect;
export type InsertProductRevenue = z.infer<typeof insertProductRevenueSchema>;

export type CustomerSegmentAnalysis = typeof customerSegmentAnalysis.$inferSelect;
export type InsertCustomerSegmentAnalysis = z.infer<typeof insertCustomerSegmentAnalysisSchema>;

export type PipelineAnalysis = typeof pipelineAnalysis.$inferSelect;
export type InsertPipelineAnalysis = z.infer<typeof insertPipelineAnalysisSchema>;

// Communications model - track all client interactions
export const communications = pgTable("communications", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  initiatedBy: integer("initiated_by").references(() => users.id).notNull(), // the RM who initiated or received
  communicationType: text("communication_type").notNull(), // call, email, meeting, message, note
  direction: text("direction").notNull(), // inbound, outbound
  subject: text("subject").notNull(),
  summary: text("summary").notNull(),
  details: text("details"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in minutes
  channel: text("channel"), // phone, video, in-person, email, chat
  sentiment: text("sentiment").default("neutral"), // positive, neutral, negative
  followupRequired: boolean("followup_required").default(false),
  followupDate: timestamp("followup_date"),
  hasAttachments: boolean("has_attachments").default(false),
  tags: text("tags").array(), // topics discussed, categorization
  status: text("status").default("completed"), // scheduled, in-progress, completed, cancelled
  location: text("location"), // for in-person meetings
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

// Communication Action Items - tasks generated from communications
export const communicationActionItems = pgTable("communication_action_items", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").references(() => communications.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("pending"), // pending, in-progress, completed, cancelled
  completedAt: timestamp("completed_at"),
  actionType: text("action_type").default("task"), // task, deal_closure, follow_up
  dealValue: real("deal_value"), // monetary value for deal_closure type
  expectedCloseDate: timestamp("expected_close_date"), // expected closure date for deals
});

export const insertCommunicationActionItemSchema = createInsertSchema(communicationActionItems).omit({
  id: true,
});

// Communication Attachments - documents exchanged in communications
export const communicationAttachments = pgTable("communication_attachments", {
  id: serial("id").primaryKey(),
  communicationId: integer("communication_id").references(() => communications.id).notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // PDF, DOCX, XLSX, JPG, etc.
  fileSize: integer("file_size").notNull(), // in bytes
  filePath: text("file_path").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  description: text("description"),
  isClientVisible: boolean("is_client_visible").default(true),
  viewedByClient: boolean("viewed_by_client").default(false),
  viewedAt: timestamp("viewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunicationAttachmentSchema = createInsertSchema(communicationAttachments).omit({
  id: true,
  createdAt: true,
});

// Client Communication Preferences - detailed preferences for client communications
export const clientCommunicationPreferences = pgTable("client_communication_preferences", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).unique().notNull(),
  preferredChannels: text("preferred_channels").array(), // ranked list: [email, phone, in-person]
  preferredFrequency: text("preferred_frequency").default("monthly"), // daily, weekly, monthly, quarterly
  preferredDays: text("preferred_days").array(), // Monday, Tuesday, etc.
  preferredTimeSlots: text("preferred_time_slots").array(), // morning, afternoon, evening
  doNotContactTimes: text("do_not_contact_times"),
  preferredLanguage: text("preferred_language").default("English"),
  communicationStyle: text("communication_style"), // formal, informal, detailed, concise
  topicsOfInterest: text("topics_of_interest").array(), // market updates, tax planning, etc.
  optOutCategories: text("opt_out_categories").array(), // marketing, newsletters, etc.
  specialInstructions: text("special_instructions"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertClientCommunicationPreferenceSchema = createInsertSchema(clientCommunicationPreferences).omit({
  id: true,
  lastUpdated: true,
});

// Communication Templates - reusable templates for common communications
export const communicationTemplates = pgTable("communication_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // market update, portfolio review, birthday wish, etc.
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  variables: text("variables").array(), // placeholders like {{client_name}}, {{portfolio_value}}
  createdBy: integer("created_by").references(() => users.id).notNull(),
  isGlobal: boolean("is_global").default(false), // available to all RMs or just creator
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCommunicationTemplateSchema = createInsertSchema(communicationTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Products - wealth management products offered by the bank
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  productCode: text("product_code").unique().notNull(),
  category: text("category").notNull(), // mutual_funds, bonds, equity, margin_lending, deposits, insurance, structured_products
  subCategory: text("sub_category"), // large_cap, debt, term_plan, etc.
  
  // Basic Details
  description: text("description").notNull(),
  keyFeatures: text("key_features").array(), // array of key features
  targetAudience: text("target_audience"), // HNI, retail, corporate, etc.
  
  // Investment Details
  minInvestment: integer("min_investment").notNull(), // in rupees
  maxInvestment: integer("max_investment"), // in rupees, null for no limit
  investmentMultiples: integer("investment_multiples").default(1000), // minimum increment amount
  
  // Risk and Returns
  riskLevel: text("risk_level").notNull(), // Low, Moderate, High, Very High
  expectedReturns: text("expected_returns"), // e.g., "8-12% p.a."
  lockInPeriod: integer("lock_in_period"), // in months, null if no lock-in
  
  // Terms and Conditions
  tenure: text("tenure"), // e.g., "1-5 years", "Open ended"
  exitLoad: text("exit_load"), // e.g., "1% if redeemed within 1 year"
  managementFee: real("management_fee"), // annual fee as percentage
  
  // Regulatory Information
  regulatoryApprovals: text("regulatory_approvals").array(), // SEBI, RBI, etc.
  taxImplications: text("tax_implications"),
  
  // Documents
  factsheetUrl: text("factsheet_url"), // path to PDF factsheet
  kimsUrl: text("kims_url"), // Key Information Memorandum
  applicationFormUrl: text("application_form_url"), // application form PDF
  
  // Status and Availability
  isActive: boolean("is_active").default(true),
  isOpenForSubscription: boolean("is_open_for_subscription").default(true),
  launchDate: timestamp("launch_date"),
  maturityDate: timestamp("maturity_date"), // for fixed tenure products
  
  // Performance Metrics (for tracking)
  totalSubscriptions: doublePrecision("total_subscriptions").default(0), // total amount subscribed
  totalInvestors: integer("total_investors").default(0),
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Communication Analytics - aggregated metrics for communication analysis
export const communicationAnalytics = pgTable("communication_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // optional, if null = all RMs
  clientId: integer("client_id").references(() => clients.id), // optional, if null = all clients
  period: text("period").notNull(), // daily, weekly, monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalCommunications: integer("total_communications").notNull(),
  communicationsByType: jsonb("communications_by_type").notNull(), // {call: 10, email: 15, meeting: 5}
  communicationsByDirection: jsonb("communications_by_direction").notNull(), // {inbound: 15, outbound: 15}
  averageResponseTime: integer("average_response_time"), // in minutes
  averageDuration: integer("average_duration"), // in minutes
  communicationsByChannel: jsonb("communications_by_channel"), // {phone: 10, video: 5, in-person: 5, email: 10}
  sentimentAnalysis: jsonb("sentiment_analysis"), // {positive: 60, neutral: 30, negative: 10} (percentages)
  mostDiscussedTopics: jsonb("most_discussed_topics"), // {portfolio_review: 5, tax_planning: 3}
  communicationEffectiveness: real("communication_effectiveness"), // 0-100 score based on outcomes
  followupCompletion: real("followup_completion"), // percentage of follow-ups completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunicationAnalyticSchema = createInsertSchema(communicationAnalytics).omit({
  id: true,
  createdAt: true,
});

// Export types for new tables
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;

export type CommunicationActionItem = typeof communicationActionItems.$inferSelect;
export type InsertCommunicationActionItem = z.infer<typeof insertCommunicationActionItemSchema>;

export type CommunicationAttachment = typeof communicationAttachments.$inferSelect;
export type InsertCommunicationAttachment = z.infer<typeof insertCommunicationAttachmentSchema>;

export type ClientCommunicationPreference = typeof clientCommunicationPreferences.$inferSelect;
export type InsertClientCommunicationPreference = z.infer<typeof insertClientCommunicationPreferenceSchema>;

export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;
export type InsertCommunicationTemplate = z.infer<typeof insertCommunicationTemplateSchema>;

export type CommunicationAnalytic = typeof communicationAnalytics.$inferSelect;
export type InsertCommunicationAnalytic = z.infer<typeof insertCommunicationAnalyticSchema>;

// AI Advice Interactions - capture RM feedback on AI recommendations
export const aiAdviceInteractions = pgTable("ai_advice_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  clientId: integer("client_id").references(() => clients.id),
  adviceId: text("advice_id").notNull(),
  recommendation: text("recommendation").notNull(),
  action: text("action").notNull(),
  source: text("source").default("dashboard_briefing"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiAdviceInteractionSchema = createInsertSchema(aiAdviceInteractions).omit({
  id: true,
  createdAt: true,
});

export type AiAdviceInteraction = typeof aiAdviceInteractions.$inferSelect;
export type InsertAiAdviceInteraction = z.infer<typeof insertAiAdviceInteractionSchema>;

// Talking Points - insights and conversation starters for RMs
export const talkingPoints = pgTable("talking_points", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(), // quarterly_results, market_analysis, regulatory_update, product_launch, etc.
  summary: text("summary").notNull(),
  detailedContent: text("detailed_content").notNull(),
  source: text("source"), // Research team, Market analysis, News, etc.
  relevanceScore: integer("relevance_score").default(5), // 1-10 scale
  validUntil: timestamp("valid_until"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertTalkingPointSchema = createInsertSchema(talkingPoints).omit({
  id: true,
  createdAt: true,
});

// Announcements - messages from product team/CIO to RMs
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // campaign, compliance, incentive, product_update, regulation
  priority: text("priority").default("medium"), // high, medium, low
  targetAudience: text("target_audience").default("all_rms"), // all_rms, senior_rms, new_rms
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  author: text("author").notNull(), // Product Team, CIO, Compliance, etc.
  actionRequired: boolean("action_required").default(false),
  actionDeadline: timestamp("action_deadline"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

// Performance Targets - targets set for each RM by period
export const performanceTargets = pgTable("performance_targets", {
  id: serial("id").primaryKey(),
  rmId: integer("rm_id").references(() => users.id).notNull(),
  period: text("period").notNull(), // M, Q, HY, Y
  year: integer("year").notNull(),
  quarter: integer("quarter"), // 1-4 for quarterly, null for others
  month: integer("month"), // 1-12 for monthly, null for others
  
  // Primary Metrics Targets
  newClientsTarget: integer("new_clients_target").default(0),
  netNewMoneyTarget: doublePrecision("net_new_money_target").default(0), // in lakhs
  clientMeetingsTarget: integer("client_meetings_target").default(0),
  prospectPipelineTarget: doublePrecision("prospect_pipeline_target").default(0), // in lakhs
  revenueTarget: doublePrecision("revenue_target").default(0), // in lakhs
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPerformanceTargetSchema = createInsertSchema(performanceTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Performance Actuals - actual performance achieved by each RM
export const performanceActuals = pgTable("performance_actuals", {
  id: serial("id").primaryKey(),
  rmId: integer("rm_id").references(() => users.id).notNull(),
  period: text("period").notNull(), // M, Q, HY, Y
  year: integer("year").notNull(),
  quarter: integer("quarter"), // 1-4 for quarterly, null for others
  month: integer("month"), // 1-12 for monthly, null for others
  
  // Primary Metrics Actuals
  newClientsActual: integer("new_clients_actual").default(0),
  netNewMoneyActual: doublePrecision("net_new_money_actual").default(0), // in lakhs
  clientMeetingsActual: integer("client_meetings_actual").default(0),
  prospectPipelineActual: doublePrecision("prospect_pipeline_actual").default(0), // in lakhs
  revenueActual: doublePrecision("revenue_actual").default(0), // in lakhs
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPerformanceActualSchema = createInsertSchema(performanceActuals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Performance Peer Rankings - peer comparison data
export const performancePeerRankings = pgTable("performance_peer_rankings", {
  id: serial("id").primaryKey(),
  rmId: integer("rm_id").references(() => users.id).notNull(),
  period: text("period").notNull(), // M, Q, HY, Y
  year: integer("year").notNull(),
  quarter: integer("quarter"), // 1-4 for quarterly, null for others
  month: integer("month"), // 1-12 for monthly, null for others
  
  // Rankings (1 = best performer)
  newClientsRank: integer("new_clients_rank"),
  netNewMoneyRank: integer("net_new_money_rank"),
  clientMeetingsRank: integer("client_meetings_rank"),
  prospectPipelineRank: integer("prospect_pipeline_rank"),
  revenueRank: integer("revenue_rank"),
  overallRank: integer("overall_rank"),
  
  // Percentiles (0-100, higher is better)
  newClientsPercentile: integer("new_clients_percentile"),
  netNewMoneyPercentile: integer("net_new_money_percentile"),
  clientMeetingsPercentile: integer("client_meetings_percentile"),
  prospectPipelinePercentile: integer("prospect_pipeline_percentile"),
  revenuePercentile: integer("revenue_percentile"),
  overallPercentile: integer("overall_percentile"),
  
  totalRMs: integer("total_rms").notNull(), // total number of RMs for context
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPerformancePeerRankingSchema = createInsertSchema(performancePeerRankings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types for all tables
export type TalkingPoint = typeof talkingPoints.$inferSelect;
export type InsertTalkingPoint = z.infer<typeof insertTalkingPointSchema>;

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

export type PerformanceTarget = typeof performanceTargets.$inferSelect;
export type InsertPerformanceTarget = z.infer<typeof insertPerformanceTargetSchema>;

export type PerformanceActual = typeof performanceActuals.$inferSelect;
export type InsertPerformanceActual = z.infer<typeof insertPerformanceActualSchema>;

export type PerformancePeerRanking = typeof performancePeerRankings.$inferSelect;
export type InsertPerformancePeerRanking = z.infer<typeof insertPerformancePeerRankingSchema>;

// Performance Incentives - earned, projected, and possible incentives
export const performanceIncentives = pgTable("performance_incentives", {
  id: serial("id").primaryKey(),
  rmId: integer("rm_id").references(() => users.id).notNull(),
  period: text("period").notNull(), // M, Q, HY, Y
  year: integer("year").notNull(),
  quarter: integer("quarter"), // 1-4 for quarterly, null for others
  month: integer("month"), // 1-12 for monthly, null for others
  
  // Incentive amounts in rupees
  earnedAmount: doublePrecision("earned_amount").default(0), // Already earned
  projectedAmount: doublePrecision("projected_amount").default(0), // Projected for full period
  possibleAmount: doublePrecision("possible_amount").default(0), // Maximum possible
  
  // Target achievement percentages
  targetAchievementPercent: doublePrecision("target_achievement_percent").default(0),
  
  // Incentive breakdown by category
  baseIncentive: doublePrecision("base_incentive").default(0),
  performanceBonus: doublePrecision("performance_bonus").default(0),
  teamBonus: doublePrecision("team_bonus").default(0),
  specialIncentives: doublePrecision("special_incentives").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPerformanceIncentiveSchema = createInsertSchema(performanceIncentives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PerformanceIncentive = typeof performanceIncentives.$inferSelect;
export type InsertPerformanceIncentive = z.infer<typeof insertPerformanceIncentiveSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Knowledge Profiling (KP) System Tables
// KP Questions - Stores questions for knowledge profiling
export const kpQuestions = pgTable("kp_questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  questionCategory: text("question_category").notNull(), // e.g., 'investment_basics', 'risk_management', 'tax_planning', 'portfolio_management'
  questionType: text("question_type").notNull().default("multiple_choice"), // 'multiple_choice', 'single_select', 'rating'
  questionLevel: text("question_level").default("basic"), // 'basic' (Q1-Q5), 'intermediate' or 'advanced' (Q6-Q15)
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isRequired: boolean("is_required").notNull().default(true),
  helpText: text("help_text"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKpQuestionSchema = createInsertSchema(kpQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// KP Question Options - Stores answer options for each question
export const kpQuestionOptions = pgTable("kp_question_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => kpQuestions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  optionValue: text("option_value").notNull(),
  weightage: integer("weightage").notNull().default(0), // 0-100
  displayOrder: integer("display_order").notNull().default(0),
  isCorrect: boolean("is_correct").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKpQuestionOptionSchema = createInsertSchema(kpQuestionOptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// KP User Responses - Stores user responses to KP questions
export const kpUserResponses = pgTable("kp_user_responses", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => kpQuestions.id, { onDelete: "cascade" }),
  selectedOptionId: integer("selected_option_id").references(() => kpQuestionOptions.id, { onDelete: "set null" }),
  responseText: text("response_text"),
  score: integer("score").default(0),
  submittedBy: integer("submitted_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKpUserResponseSchema = createInsertSchema(kpUserResponses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// KP Assessment Results - Stores overall assessment results per client
export const kpAssessmentResults = pgTable("kp_assessment_results", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().unique().references(() => clients.id, { onDelete: "cascade" }),
  totalScore: integer("total_score").notNull().default(0),
  maxPossibleScore: integer("max_possible_score").notNull().default(0),
  percentageScore: real("percentage_score").notNull().default(0),
  knowledgeLevel: text("knowledge_level"), // 'beginner', 'intermediate', 'advanced', 'expert'
  assessmentDate: timestamp("assessment_date").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  isComplete: boolean("is_complete").notNull().default(false),
  submittedBy: integer("submitted_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKpAssessmentResultSchema = createInsertSchema(kpAssessmentResults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// KP Scoring Configuration - Stores scoring algorithm configuration
export const kpScoringConfig = pgTable("kp_scoring_config", {
  id: serial("id").primaryKey(),
  configKey: text("config_key").notNull().unique(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertKpScoringConfigSchema = createInsertSchema(kpScoringConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type KpQuestion = typeof kpQuestions.$inferSelect;
export type InsertKpQuestion = z.infer<typeof insertKpQuestionSchema>;

export type KpQuestionOption = typeof kpQuestionOptions.$inferSelect;
export type InsertKpQuestionOption = z.infer<typeof insertKpQuestionOptionSchema>;

export type KpUserResponse = typeof kpUserResponses.$inferSelect;
export type InsertKpUserResponse = z.infer<typeof insertKpUserResponseSchema>;

export type KpAssessmentResult = typeof kpAssessmentResults.$inferSelect;
export type InsertKpAssessmentResult = z.infer<typeof insertKpAssessmentResultSchema>;

export type KpScoringConfig = typeof kpScoringConfig.$inferSelect;
export type InsertKpScoringConfig = z.infer<typeof insertKpScoringConfigSchema>;

// Risk Profiling (RP) System Tables
// RP Questions - Stores questions for risk profiling
export const riskQuestions = pgTable("risk_questions", {
  id: serial("id").primaryKey(),
  questionText: text("question_text").notNull(),
  section: text("section").notNull(), // 'capacity', 'horizon', 'attitude', 'knowledge', 'experience'
  orderIndex: integer("order_index").notNull().default(0),
  ceilingFlag: boolean("ceiling_flag").notNull().default(false), // Questions that can cap maximum risk
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskQuestionSchema = createInsertSchema(riskQuestions).omit({
  id: true,
  createdAt: true,
});

// RP Question Options - Stores answer options for each question
export const riskOptions = pgTable("risk_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => riskQuestions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  score: integer("score").notNull().default(0), // 0-4
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskOptionSchema = createInsertSchema(riskOptions).omit({
  id: true,
  createdAt: true,
});

// RP Responses - Individual answers per client
export const riskResponses = pgTable("risk_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => riskQuestions.id, { onDelete: "cascade" }),
  optionId: integer("option_id").references(() => riskOptions.id, { onDelete: "set null" }),
  scoreObtained: integer("score_obtained").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskResponseSchema = createInsertSchema(riskResponses).omit({
  id: true,
  createdAt: true,
});

// RP Assessment - Final summary after completion
export const riskAssessment = pgTable("risk_assessment", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: integer("client_id").notNull().unique().references(() => clients.id, { onDelete: "cascade" }),
  totalScore: integer("total_score").notNull().default(0),
  riskCategory: text("risk_category").notNull(), // 'Conservative', 'Moderate', 'Moderately Aggressive', 'Aggressive'
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  expiryDate: timestamp("expiry_date", { withTimezone: true }), // 12 months from completedAt
  verifiedBy: integer("verified_by").references(() => users.id, { onDelete: "set null" }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  overrideReason: text("override_reason"), // Reason for ceiling or override
  ceilingApplied: boolean("ceiling_applied").notNull().default(false), // Whether ceiling logic was applied
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskAssessmentSchema = createInsertSchema(riskAssessment).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// RP Scoring Matrix - Editable scoring rules without code change
export const riskScoringMatrix = pgTable("risk_scoring_matrix", {
  id: uuid("id").primaryKey().defaultRandom(),
  scoreMin: integer("score_min").notNull(),
  scoreMax: integer("score_max").notNull(),
  riskCategory: text("risk_category").notNull(), // 'Conservative', 'Moderate', 'Moderately Aggressive', 'Aggressive'
  guidance: text("guidance").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRiskScoringMatrixSchema = createInsertSchema(riskScoringMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Audit Risk Changes - Tracks RM overrides (optional but recommended for compliance)
export const auditRiskChanges = pgTable("audit_risk_changes", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  oldCategory: text("old_category").notNull(),
  newCategory: text("new_category").notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAuditRiskChangeSchema = createInsertSchema(auditRiskChanges).omit({
  id: true,
  changedAt: true,
});

// Export types
export type RiskQuestion = typeof riskQuestions.$inferSelect;
export type InsertRiskQuestion = z.infer<typeof insertRiskQuestionSchema>;

export type RiskOption = typeof riskOptions.$inferSelect;
export type InsertRiskOption = z.infer<typeof insertRiskOptionSchema>;

export type RiskResponse = typeof riskResponses.$inferSelect;
export type InsertRiskResponse = z.infer<typeof insertRiskResponseSchema>;

export type RiskAssessment = typeof riskAssessment.$inferSelect;
export type InsertRiskAssessment = z.infer<typeof insertRiskAssessmentSchema>;

export type RiskScoringMatrix = typeof riskScoringMatrix.$inferSelect;
export type InsertRiskScoringMatrix = z.infer<typeof insertRiskScoringMatrixSchema>;

export type AuditRiskChange = typeof auditRiskChanges.$inferSelect;
export type InsertAuditRiskChange = z.infer<typeof insertAuditRiskChangeSchema>;

// Quick Order Favorites - User's favorite schemes for quick order placement
export const quickOrderFavorites = pgTable("quick_order_favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  addedAt: timestamp("added_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQuickOrderFavoriteSchema = createInsertSchema(quickOrderFavorites).omit({
  id: true,
  addedAt: true,
  createdAt: true,
});

export type QuickOrderFavorite = typeof quickOrderFavorites.$inferSelect;
export type InsertQuickOrderFavorite = z.infer<typeof insertQuickOrderFavoriteSchema>;

// SIP Plans table
export const sipPlans = pgTable("sip_plans", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  schemeId: integer("scheme_id").references(() => products.id).notNull(),
  schemeName: text("scheme_name").notNull(),
  amount: integer("amount").notNull(),
  frequency: text("frequency").notNull(), // Daily, Weekly, Monthly, Quarterly
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  installments: integer("installments").notNull(),
  completedInstallments: integer("completed_installments").default(0),
  status: text("status").notNull().default("Active"), // Active, Paused, Cancelled, Completed, Failed
  nextInstallmentDate: date("next_installment_date"),
  totalInvested: integer("total_invested").default(0),
  currentValue: integer("current_value").default(0),
  gainLoss: integer("gain_loss").default(0),
  gainLossPercent: doublePrecision("gain_loss_percent").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  pausedAt: timestamp("paused_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  lastExecutionDate: timestamp("last_execution_date"),
  lastExecutionStatus: text("last_execution_status"), // Success, Failed
  failureCount: integer("failure_count").default(0),
  dayOfMonth: integer("day_of_month"), // For monthly SIPs
  dayOfWeek: integer("day_of_week"), // For weekly SIPs
});

export const insertSIPPlanSchema = createInsertSchema(sipPlans).omit({
  id: true,
  createdAt: true,
});

export type SIPPlanDB = typeof sipPlans.$inferSelect;
export type InsertSIPPlan = z.infer<typeof insertSIPPlanSchema>;

// Goals table
export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // Retirement, Child Education, House Purchase, Vacation, Emergency Fund, Other
  targetAmount: integer("target_amount").notNull(),
  targetDate: date("target_date").notNull(),
  currentAmount: integer("current_amount").default(0),
  monthlyContribution: integer("monthly_contribution"),
  schemes: jsonb("schemes").default([]), // JSON array of scheme allocations
  progress: doublePrecision("progress").default(0), // 0-100 percentage
  status: text("status").default("Active"), // Active, Completed, Paused, Cancelled
  description: text("description"),
  priority: text("priority").default("Medium"), // Low, Medium, High
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GoalDB = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// Goal Allocations table - links transactions/orders to goals
export const goalAllocations = pgTable("goal_allocations", {
  id: serial("id").primaryKey(),
  goalId: text("goal_id").references(() => goals.id).notNull(),
  transactionId: integer("transaction_id").references(() => transactions.id), // Reference to transaction
  amount: integer("amount").notNull(),
  allocatedAt: timestamp("allocated_at").defaultNow(),
  notes: text("notes"),
});

export const insertGoalAllocationSchema = createInsertSchema(goalAllocations).omit({
  id: true,
  allocatedAt: true,
});

export type GoalAllocationDB = typeof goalAllocations.$inferSelect;
export type InsertGoalAllocation = z.infer<typeof insertGoalAllocationSchema>;

// ============================================================================
// Module 11: Automation Features Tables
// ============================================================================

// Auto-Invest Rules table
export const autoInvestRules = pgTable("auto_invest_rules", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  schemeId: integer("scheme_id").references(() => products.id).notNull(),
  schemeName: text("scheme_name").notNull(),
  amount: integer("amount").notNull(),
  frequency: text("frequency").notNull(), // Daily, Weekly, Monthly, Quarterly
  triggerType: text("trigger_type").notNull(), // Date, Goal Progress, Portfolio Drift, Market Condition
  triggerConfig: jsonb("trigger_config").default({}), // JSON configuration
  goalId: text("goal_id").references(() => goals.id),
  goalName: text("goal_name"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  nextExecutionDate: date("next_execution_date"),
  status: text("status").default("Active"), // Active, Paused, Cancelled, Completed
  isEnabled: boolean("is_enabled").default(true),
  maxTotalAmount: integer("max_total_amount"),
  maxPerExecution: integer("max_per_execution"),
  minBalanceRequired: integer("min_balance_required"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  executionCount: integer("execution_count").default(0),
  lastExecutionDate: timestamp("last_execution_date"),
  lastExecutionStatus: text("last_execution_status"), // Success, Failed
  lastExecutionError: text("last_execution_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertAutoInvestRuleSchema = createInsertSchema(autoInvestRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AutoInvestRuleDB = typeof autoInvestRules.$inferSelect;
export type InsertAutoInvestRule = z.infer<typeof insertAutoInvestRuleSchema>;

// Rebalancing Rules table
export const rebalancingRules = pgTable("rebalancing_rules", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  strategy: text("strategy").notNull(), // Threshold-Based, Time-Based, Drift-Based, Hybrid
  targetAllocation: jsonb("target_allocation").notNull(), // JSON object with allocation percentages
  thresholdPercent: doublePrecision("threshold_percent").notNull(),
  rebalanceAmount: integer("rebalance_amount"),
  frequency: text("frequency"), // Daily, Weekly, Monthly, Quarterly
  dayOfMonth: integer("day_of_month"),
  dayOfWeek: integer("day_of_week"),
  triggerOnDrift: boolean("trigger_on_drift").default(true),
  triggerOnSchedule: boolean("trigger_on_schedule").default(false),
  minDriftPercent: doublePrecision("min_drift_percent"),
  executeAutomatically: boolean("execute_automatically").default(false),
  requireConfirmation: boolean("require_confirmation").default(true),
  status: text("status").default("Active"), // Active, Paused, Completed
  isEnabled: boolean("is_enabled").default(true),
  lastRebalancedDate: date("last_rebalanced_date"),
  nextRebalancingDate: date("next_rebalancing_date"),
  executionCount: integer("execution_count").default(0),
  lastExecutionStatus: text("last_execution_status"), // Success, Failed, Skipped
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertRebalancingRuleSchema = createInsertSchema(rebalancingRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RebalancingRuleDB = typeof rebalancingRules.$inferSelect;
export type InsertRebalancingRule = z.infer<typeof insertRebalancingRuleSchema>;

// Rebalancing Executions table
export const rebalancingExecutions = pgTable("rebalancing_executions", {
  id: text("id").primaryKey(),
  ruleId: text("rule_id").references(() => rebalancingRules.id).notNull(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  executionDate: date("execution_date").notNull(),
  status: text("status").notNull(), // Pending, Executed, Failed, Cancelled
  currentAllocation: jsonb("current_allocation").notNull(),
  targetAllocation: jsonb("target_allocation").notNull(),
  driftPercent: doublePrecision("drift_percent").notNull(),
  actions: jsonb("actions").default([]), // Array of rebalancing actions
  executedAt: timestamp("executed_at"),
  executedBy: integer("executed_by").references(() => users.id),
  orderIds: jsonb("order_ids").default([]), // Array of order IDs created
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRebalancingExecutionSchema = createInsertSchema(rebalancingExecutions).omit({
  id: true,
  createdAt: true,
});

export type RebalancingExecutionDB = typeof rebalancingExecutions.$inferSelect;
export type InsertRebalancingExecution = z.infer<typeof insertRebalancingExecutionSchema>;

// Trigger Orders table
export const triggerOrders = pgTable("trigger_orders", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // Price, NAV, Portfolio Value, Goal Progress, Date, Custom
  triggerCondition: text("trigger_condition").notNull(), // Greater Than, Less Than, Equals, Crosses Above, Crosses Below
  triggerValue: doublePrecision("trigger_value").notNull(),
  triggerField: text("trigger_field"), // e.g., 'nav', 'portfolioValue', 'goalProgress'
  orderType: text("order_type").notNull(), // Purchase, Redemption, Switch
  schemeId: integer("scheme_id").references(() => products.id).notNull(),
  schemeName: text("scheme_name").notNull(),
  amount: integer("amount"),
  units: doublePrecision("units"),
  targetSchemeId: integer("target_scheme_id").references(() => products.id),
  targetSchemeName: text("target_scheme_name"),
  goalId: text("goal_id").references(() => goals.id),
  goalName: text("goal_name"),
  validFrom: date("valid_from").notNull(),
  validUntil: date("valid_until"),
  status: text("status").default("Active"), // Active, Triggered, Executed, Cancelled, Expired
  isEnabled: boolean("is_enabled").default(true),
  triggeredAt: timestamp("triggered_at"),
  executedAt: timestamp("executed_at"),
  executedOrderId: text("executed_order_id"),
  executionStatus: text("execution_status"), // Success, Failed
  executionError: text("execution_error"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
});

export const insertTriggerOrderSchema = createInsertSchema(triggerOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TriggerOrderDB = typeof triggerOrders.$inferSelect;
export type InsertTriggerOrder = z.infer<typeof insertTriggerOrderSchema>;

// Notification Preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: integer("user_id").references(() => users.id), // Optional: user-level preferences
  event: text("event").notNull(), // Order Submitted, Order Executed, etc.
  channels: jsonb("channels").notNull().default([]), // Array of channels: Email, SMS, Push, In-App
  enabled: boolean("enabled").default(true),
  quietHours: jsonb("quiet_hours"), // { start: "22:00", end: "08:00" }
  minAmount: integer("min_amount"), // Only notify if amount >= this
  schemes: jsonb("schemes").default([]), // Array of scheme IDs to filter
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NotificationPreferenceDB = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// Notification Logs table
export const notificationLogs = pgTable("notification_logs", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  event: text("event").notNull(),
  channel: text("channel").notNull(), // Email, SMS, Push, In-App
  status: text("status").notNull(), // Sent, Failed, Pending
  sentAt: timestamp("sent_at"),
  error: text("error"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNotificationLogSchema = createInsertSchema(notificationLogs).omit({
  id: true,
  createdAt: true,
});

export type NotificationLogDB = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = z.infer<typeof insertNotificationLogSchema>;

// In-App Notifications table
export const inAppNotifications = pgTable("in_app_notifications", {
  id: text("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  event: text("event").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  metadata: jsonb("metadata").default({}),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertInAppNotificationSchema = createInsertSchema(inAppNotifications).omit({
  id: true,
  createdAt: true,
});

export type InAppNotificationDB = typeof inAppNotifications.$inferSelect;
export type InsertInAppNotification = z.infer<typeof insertInAppNotificationSchema>;

// Automation Execution Logs table
export const automationExecutionLogs = pgTable("automation_execution_logs", {
  id: text("id").primaryKey(),
  automationType: text("automation_type").notNull(), // AutoInvest, Rebalancing, TriggerOrder
  automationId: text("automation_id").notNull(), // ID of the rule/order
  clientId: integer("client_id").references(() => clients.id).notNull(),
  executionDate: date("execution_date").notNull(),
  status: text("status").notNull(), // Success, Failed, Skipped
  orderId: text("order_id"), // Order ID if order was created
  error: text("error"),
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAutomationExecutionLogSchema = createInsertSchema(automationExecutionLogs).omit({
  id: true,
  createdAt: true,
});

export type AutomationExecutionLogDB = typeof automationExecutionLogs.$inferSelect;
export type InsertAutomationExecutionLog = z.infer<typeof insertAutomationExecutionLogSchema>;