CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`department` text NOT NULL,
	`patient_id` text,
	`patient_name` text,
	`description` text NOT NULL,
	`timestamp` integer
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`patient_name` text NOT NULL,
	`department` text NOT NULL,
	`doctor_id` text,
	`doctor_name` text,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`created_at` integer,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text,
	`reporter_name` text NOT NULL,
	`department` text NOT NULL,
	`severity` text NOT NULL,
	`description` text NOT NULL,
	`action_taken` text,
	`status` text NOT NULL,
	`created_at` integer,
	`reviewed_at` integer,
	`reviewed_by` text
);
--> statement-breakpoint
CREATE TABLE `lab_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`test_name` text NOT NULL,
	`test_type` text,
	`status` text NOT NULL,
	`ordered_by` text,
	`date` text,
	`results` text,
	`attachments` text,
	`created_at` integer,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`stock` integer NOT NULL,
	`unit` text NOT NULL,
	`classification` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`age` integer,
	`gender` text,
	`dob` text,
	`phone` text,
	`address` text,
	`email` text,
	`blood_type` text,
	`emergency_contact` text,
	`emergency_phone` text,
	`allergies` text,
	`chief_complaint` text,
	`diagnosis` text,
	`status` text,
	`department` text,
	`triage_status` text,
	`workflow_status` text,
	`admission_date` text,
	`registration_status` text,
	`has_patient_account` integer,
	`username` text,
	`password` text,
	`religion` text,
	`civil_status` text,
	`medical_conditions` text,
	`current_medications` text,
	`past_surgeries` text,
	`smoking` text,
	`alcohol_use` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`medication` text NOT NULL,
	`dosage` text,
	`frequency` text,
	`route` text,
	`duration` text,
	`instructions` text,
	`prescribed_by` text,
	`status` text,
	`date` text,
	`created_at` integer,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` text PRIMARY KEY NOT NULL,
	`nurse_id` text NOT NULL,
	`nurse_name` text NOT NULL,
	`department` text NOT NULL,
	`date` text NOT NULL,
	`shift` text NOT NULL,
	`status` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `staff` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`department` text,
	`username` text,
	`password` text,
	`email` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_username_unique` ON `staff` (`username`);