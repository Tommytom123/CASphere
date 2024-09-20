CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` char(255) not null,
  `last_name` char(255) not null,
  `year_group` char(255) default null,
  `email` char(255) not null,
  `access_level` enum('admin','student') not null,
  PRIMARY KEY (`id`)
);

CREATE TABLE `schools` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_name` char(255) not null,
  `email_domain` char(255) not null,
  PRIMARY KEY (`id`)
);

drop table `projects`;

CREATE TABLE `projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` char(255) not null,
  `strand` enum('Creativity','Activity','Service'),
  `description` text NOT NULL,
  `uploaded_date` DATETIME NOT NULL,
  `date_start` DATE NOT NULL,
  `date_end` DATETIME NOT NULL,
  `location` char(128) NOT NULL, /*Stored AS JSON?*/
  `max_participant_count` char(255) not null,
  `years` set('Y9','Y10','Y11','Y12','Y13') not NULL,
  `approved_by_id` bigint unsigned default null,
  `owner_id` bigint unsigned NOT null,
  PRIMARY KEY (`id`)
);

CREATE TABLE `projects_pinned` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `projects_participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `active_sessions` (
  `unique_key` char(128) NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `start_date` datetime NOT NULL,
  `expire_date` datetime NOT NULL,
  PRIMARY KEY (`unique_key`)
);