-- casphere.active_sessions definition

CREATE TABLE `active_sessions` (
  `token` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `start_date` datetime NOT NULL,
  `expire_date` datetime NOT NULL,
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- casphere.projects definition

CREATE TABLE `projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` char(255) NOT NULL,
  `strand` enum('Creativity','Activity','Service') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text NOT NULL,
  `uploaded_date` datetime NOT NULL,
  `date_start` date NOT NULL,
  `date_end` datetime NOT NULL,
  `location` char(128) NOT NULL,
  `max_participant_count` char(255) NOT NULL,
  `years` set('Y9','Y10','Y11','Y12','Y13') NOT NULL,
  `approved_by_id` bigint unsigned DEFAULT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `image` varchar(64) NOT NULL,
  `deleted` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=95 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- casphere.projects_participants definition

CREATE TABLE `projects_participants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=637 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- casphere.projects_pinned definition

CREATE TABLE `projects_pinned` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- casphere.schools definition

CREATE TABLE `schools` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `school_name` char(255) NOT NULL,
  `email_domain` char(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- casphere.users definition

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` char(255) NOT NULL,
  `last_name` char(255) NOT NULL,
  `year_group` char(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `email` char(255) NOT NULL,
  `access_level` enum('admin','student') NOT NULL,
  `email_permitted` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;