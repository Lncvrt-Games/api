-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 01, 2025 at 07:22 PM
-- Server version: 12.0.2-MariaDB
-- PHP Version: 8.4.14

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
-- Table structure for table `launchergames`
--

CREATE TABLE `launchergames` (
  `id` int(11) NOT NULL,
  `name` text NOT NULL,
  `official` tinyint(1) NOT NULL DEFAULT 0,
  `verified` tinyint(1) NOT NULL DEFAULT 0,
  `cutOff` int(11) NOT NULL DEFAULT -1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `launcherupdates`
--

CREATE TABLE `launcherupdates` (
  `id` varchar(24) NOT NULL,
  `releaseDate` bigint(20) NOT NULL,
  `downloadUrls` text NOT NULL,
  `platforms` text NOT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 1,
  `place` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

-- --------------------------------------------------------

--
-- Table structure for table `launcherversions`
--

CREATE TABLE `launcherversions` (
  `id` varchar(24) NOT NULL,
  `versionName` text NOT NULL,
  `releaseDate` bigint(20) NOT NULL,
  `downloadUrls` text NOT NULL,
  `platforms` text NOT NULL,
  `executables` text NOT NULL,
  `hidden` tinyint(1) NOT NULL DEFAULT 1,
  `game` int(11) NOT NULL DEFAULT 0,
  `place` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=COMPRESSED;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `launchergames`
--
ALTER TABLE `launchergames`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `launcherupdates`
--
ALTER TABLE `launcherupdates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `launcherversions`
--
ALTER TABLE `launcherversions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_game` (`game`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `launchergames`
--
ALTER TABLE `launchergames`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `launcherversions`
--
ALTER TABLE `launcherversions`
  ADD CONSTRAINT `fk_category` FOREIGN KEY (`game`) REFERENCES `launchergames` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
