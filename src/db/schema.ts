import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const patients = sqliteTable("patients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender", { enum: ["Male", "Female"] }),
  dob: text("dob"),
  phone: text("phone"),
  address: text("address"),
  email: text("email"),
  bloodType: text("blood_type"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  allergies: text("allergies", { mode: "json" }).$type<string[]>(),
  chiefComplaint: text("chief_complaint"),
  diagnosis: text("diagnosis"),
  status: text("status", { enum: ["waiting", "in-treatment", "admitted", "discharged", "pending_admission", "pending_transfer", "active"] }),
  department: text("department", { enum: ["triage", "opd", "er", "ward", "pharmacy", "lab", "ward"] }),
  triageStatus: text("triage_status", { enum: ["pending", "in-progress", "completed"] }),
  workflowStatus: text("workflow_status", { enum: ["registered", "nurse-pending", "nurse-completed", "doctor-pending", "doctor-completed"] }),
  admissionDate: text("admission_date"),
  registrationStatus: text("registration_status", { enum: ["pending", "confirmed"] }),
  hasPatientAccount: integer("has_patient_account", { mode: "boolean" }),
  username: text("username"),
  password: text("password"),
  religion: text("religion"),
  civilStatus: text("civil_status"),
  medicalConditions: text("medical_conditions", { mode: "json" }).$type<string[]>(),
  currentMedications: text("current_medications"),
  pastSurgeries: text("past_surgeries"),
  smoking: text("smoking"),
  alcoholUse: text("alcohol_use"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const staff = sqliteTable("staff", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: ["doctor", "nurse", "charge-nurse", "staff-nurse", "admin", "radiologic-technologist"] }).notNull(),
  department: text("department"),
  username: text("username").unique(),
  password: text("password"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const medications = sqliteTable("medications", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  stock: integer("stock").notNull(),
  unit: text("unit").notNull(),
  classification: text("classification"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const labOrders = sqliteTable("lab_orders", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  testName: text("test_name").notNull(),
  testType: text("test_type", { enum: ["blood", "urine", "imaging", "pathology", "stool", "microbiology", "serology", "special"] }),
  status: text("status", { enum: ["pending", "in-progress", "completed"] }).notNull(),
  orderedBy: text("ordered_by"),
  date: text("date"),
  results: text("results"),
  attachments: text("attachments", { mode: "json" }).$type<string[]>(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const prescriptions = sqliteTable("prescriptions", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  medication: text("medication").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  route: text("route"),
  duration: text("duration"),
  instructions: text("instructions"),
  prescribedBy: text("prescribed_by"),
  status: text("status", { enum: ["pending", "dispensed", "cancelled"] }),
  date: text("date"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const appointments = sqliteTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  patientName: text("patient_name").notNull(),
  department: text("department").notNull(),
  doctorId: text("doctor_id"),
  doctorName: text("doctor_name"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  department: text("department").notNull(),
  patientId: text("patient_id"),
  patientName: text("patient_name"),
  description: text("description").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const incidents = sqliteTable("incidents", {
  id: text("id").primaryKey(),
  reporterId: text("reporter_id"),
  reporterName: text("reporter_name").notNull(),
  department: text("department").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  description: text("description").notNull(),
  actionTaken: text("action_taken"),
  status: text("status", { enum: ["open", "reviewed", "closed"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  reviewedBy: text("reviewed_by"),
});

export const shifts = sqliteTable("shifts", {
  id: text("id").primaryKey(),
  nurseId: text("nurse_id").notNull(),
  nurseName: text("nurse_name").notNull(),
  department: text("department").notNull(),
  date: text("date").notNull(),
  shift: text("shift").notNull(),
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});