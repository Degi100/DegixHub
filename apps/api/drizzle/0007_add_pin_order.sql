-- Add pin_order column to links, credentials, and notes for drag & drop sorting
ALTER TABLE `links` ADD `pin_order` integer DEFAULT 0;
ALTER TABLE `credentials` ADD `pin_order` integer DEFAULT 0;
ALTER TABLE `notes` ADD `pin_order` integer DEFAULT 0;
