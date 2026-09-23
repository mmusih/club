CREATE TABLE `media_chunks` (
	`media_id` varchar(64) NOT NULL,
	`sequence` int NOT NULL,
	`body` mediumblob NOT NULL,
	CONSTRAINT `media_chunks_media_id_sequence_pk` PRIMARY KEY(`media_id`,`sequence`)
);
--> statement-breakpoint
ALTER TABLE `media_chunks` ADD CONSTRAINT `media_chunks_media_id_media_id_fk` FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON DELETE cascade ON UPDATE no action;