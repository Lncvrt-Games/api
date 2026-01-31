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
-- Database: `lncvrtgames`
--

-- --------------------------------------------------------

--
-- Table structure for table `games`
--

CREATE TABLE `games` (
  `id` bigint(20) NOT NULL,
  `name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `official` tinyint(1) NOT NULL DEFAULT 0,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `developer` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `categoryNames` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `launcherupdates`
--

CREATE TABLE `launcherupdates` (
  `id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `releaseDate` bigint(20) NOT NULL,
  `downloadUrls` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `platforms` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 1,
  `place` bigint(20) NOT NULL DEFAULT 0,
  `sha512sums` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `launcherversionmanifest`
--

CREATE TABLE `launcherversionmanifest` (
  `id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `displayName` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `releaseDate` bigint(20) NOT NULL,
  `downloadUrls` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `platforms` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `executables` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 1,
  `game` bigint(20) NOT NULL DEFAULT 0,
  `place` bigint(20) NOT NULL DEFAULT 0,
  `sha512sums` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]',
  `sizes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]',
  `changelog` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `category` int(11) NOT NULL DEFAULT -1,
  `lastRevision` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `loaderupdates`
--

CREATE TABLE `loaderupdates` (
  `id` varchar(24) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `releaseDate` bigint(20) NOT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 1,
  `place` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `resetcodes`
--

CREATE TABLE `resetcodes` (
  `id` bigint(20) NOT NULL,
  `code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `userId` bigint(20) NOT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `timestamp` bigint(20) NOT NULL,
  `usedTimestamp` bigint(20) NOT NULL DEFAULT 0,
  `type` int(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) NOT NULL,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `token` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `latest_ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `register_time` bigint(20) NOT NULL,
  `leaderboards_banned` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `verifycodes`
--

CREATE TABLE `verifycodes` (
  `id` bigint(20) NOT NULL,
  `code` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `timestamp` bigint(20) NOT NULL,
  `usedTimestamp` bigint(20) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `games`
--
ALTER TABLE `games`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `launcherupdates`
--
ALTER TABLE `launcherupdates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `launcherversionmanifest`
--
ALTER TABLE `launcherversionmanifest`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_game` (`game`);

--
-- Indexes for table `loaderupdates`
--
ALTER TABLE `loaderupdates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `resetcodes`
--
ALTER TABLE `resetcodes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `verifycodes`
--
ALTER TABLE `verifycodes`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `games`
--
ALTER TABLE `games`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resetcodes`
--
ALTER TABLE `resetcodes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `verifycodes`
--
ALTER TABLE `verifycodes`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `launcherversionmanifest`
--
ALTER TABLE `launcherversionmanifest`
  ADD CONSTRAINT `fk_category` FOREIGN KEY (`game`) REFERENCES `games` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
