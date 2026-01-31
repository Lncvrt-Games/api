-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jan 31, 2026 at 08:57 PM
-- Server version: 12.1.2-MariaDB
-- PHP Version: 8.5.2

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `berrydashdatabase`
--

-- --------------------------------------------------------

--
-- Table structure for table `chatroom_reports`
--

CREATE TABLE `chatroom_reports` (
  `id` bigint(20) NOT NULL,
  `chatId` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `timestamp` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `chats`
--

CREATE TABLE `chats` (
  `id` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `deleted_at` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `marketplaceicons`
--

CREATE TABLE `marketplaceicons` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `userId` bigint(20) NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `hash` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 0,
  `price` bigint(20) NOT NULL DEFAULT 0,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `place` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `splashtexts`
--

CREATE TABLE `splashtexts` (
  `id` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `content` varchar(72) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `state` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `userdata`
--

CREATE TABLE `userdata` (
  `id` bigint(20) NOT NULL,
  `save_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}',
  `legacy_high_score` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `userposts`
--

CREATE TABLE `userposts` (
  `id` bigint(20) NOT NULL,
  `userId` bigint(20) NOT NULL,
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `deleted_at` bigint(20) NOT NULL DEFAULT 0,
  `votes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chatroom_reports`
--
ALTER TABLE `chatroom_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chatId` (`chatId`);

--
-- Indexes for table `chats`
--
ALTER TABLE `chats`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `marketplaceicons`
--
ALTER TABLE `marketplaceicons`
  ADD PRIMARY KEY (`place`);

--
-- Indexes for table `splashtexts`
--
ALTER TABLE `splashtexts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `userdata`
--
ALTER TABLE `userdata`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `userposts`
--
ALTER TABLE `userposts`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chatroom_reports`
--
ALTER TABLE `chatroom_reports`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chats`
--
ALTER TABLE `chats`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `marketplaceicons`
--
ALTER TABLE `marketplaceicons`
  MODIFY `place` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `splashtexts`
--
ALTER TABLE `splashtexts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `userdata`
--
ALTER TABLE `userdata`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `userposts`
--
ALTER TABLE `userposts`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chatroom_reports`
--
ALTER TABLE `chatroom_reports`
  ADD CONSTRAINT `chatId` FOREIGN KEY (`chatId`) REFERENCES `chats` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
