CREATE TABLE `project_credentials` (
	`project_id` text NOT NULL,
	`credential_id` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`credential_id`) REFERENCES `credentials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_links` (
	`project_id` text NOT NULL,
	`link_id` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`link_id`) REFERENCES `links`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`db_type` text DEFAULT 'none' NOT NULL,
	`db_type_other` text,
	`db_path` text,
	`encrypted_db_connection` text,
	`db_connection_iv` text,
	`db_connection_auth_tag` text,
	`containers` text,
	`volumes` text,
	`domains` text,
	`git_repo` text,
	`tech_stack` text,
	`pending_migrations` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
