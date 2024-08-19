CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` char(255) not null,
  `last_name` char(255) not null,
  `year_group` char(255) not null,
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

CREATE TABLE `projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` char(255) not null,
  `description` text NOT NULL,
  `uploaded_date` DATETIME NOT NULL,
  `date_start` DATE NOT NULL,
  /*`date_end` DATETIME NOT NULL,*/
  `location_JSON` text not null, /*Stored AS JSON?*/
  `max_participant_count` char(255) not null,
  `years` set('ALL','Y9','Y10','Y11','Y12','Y13') not NULL,

  PRIMARY KEY (`id`)
);

CREATE TABLE `projects_pinned` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `projects_particpants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
);