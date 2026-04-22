-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resumes` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `raw_text` LONGTEXT NULL,
    `parsed_json` JSON NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `resumes_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `target_roles` JSON NOT NULL,
    `target_locations` JSON NOT NULL,
    `min_salary` INTEGER NULL,
    `max_salary` INTEGER NULL,
    `work_type` ENUM('REMOTE', 'HYBRID', 'ON_SITE') NULL,
    `preferred_tone` ENUM('FORMAL', 'FRIENDLY', 'CONFIDENT', 'CONCISE') NOT NULL DEFAULT 'CONFIDENT',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_preferences_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_offers` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `description` LONGTEXT NOT NULL,
    `requirements` LONGTEXT NULL,
    `salary_range` VARCHAR(191) NULL,
    `job_url` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `scraped_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `job_offers_job_url_key`(`job_url`),
    INDEX `job_offers_is_active_idx`(`is_active`),
    INDEX `job_offers_source_idx`(`source`),
    FULLTEXT INDEX `job_offers_title_company_description_idx`(`title`, `company`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_match_scores` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `job_offer_id` VARCHAR(191) NOT NULL,
    `resume_id` VARCHAR(191) NOT NULL,
    `score` DOUBLE NOT NULL,
    `match_details_json` JSON NOT NULL,
    `suggestions` JSON NULL,
    `computed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `job_match_scores_user_id_score_idx`(`user_id`, `score`),
    UNIQUE INDEX `job_match_scores_user_id_job_offer_id_resume_id_key`(`user_id`, `job_offer_id`, `resume_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `applications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `job_offer_id` VARCHAR(191) NOT NULL,
    `resume_id` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'APPLIED', 'IN_REVIEW', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'REJECTED', 'WITHDRAWN') NOT NULL DEFAULT 'DRAFT',
    `applied_at` DATETIME(3) NULL,
    `notes` TEXT NULL,

    INDEX `applications_user_id_status_idx`(`user_id`, `status`),
    INDEX `applications_job_offer_id_idx`(`job_offer_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generated_documents` (
    `id` VARCHAR(191) NOT NULL,
    `application_id` VARCHAR(191) NOT NULL,
    `resume_id` VARCHAR(191) NULL,
    `type` ENUM('COVER_LETTER', 'FORM_FILL_JSON') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `file_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `generated_documents_application_id_idx`(`application_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_events` (
    `id` VARCHAR(191) NOT NULL,
    `application_id` VARCHAR(191) NOT NULL,
    `event_type` ENUM('STATUS_CHANGED', 'DOCUMENT_GENERATED', 'NOTE_ADDED', 'INTERVIEW_SCHEDULED', 'OFFER_RECEIVED', 'REJECTED') NOT NULL,
    `details_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `application_events_application_id_created_at_idx`(`application_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resumes` ADD CONSTRAINT `resumes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_preferences` ADD CONSTRAINT `user_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_match_scores` ADD CONSTRAINT `job_match_scores_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_match_scores` ADD CONSTRAINT `job_match_scores_job_offer_id_fkey` FOREIGN KEY (`job_offer_id`) REFERENCES `job_offers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `job_match_scores` ADD CONSTRAINT `job_match_scores_resume_id_fkey` FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_job_offer_id_fkey` FOREIGN KEY (`job_offer_id`) REFERENCES `job_offers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `applications` ADD CONSTRAINT `applications_resume_id_fkey` FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `generated_documents_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `generated_documents_resume_id_fkey` FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `application_events` ADD CONSTRAINT `application_events_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
