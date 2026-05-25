-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: May 07, 2026 at 10:59 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `prof_sale`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `businesses`
--

CREATE TABLE `businesses` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `business_name` varchar(255) NOT NULL,
  `business_type` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'UGX',
  `timezone` varchar(50) DEFAULT 'Africa/Kampala',
  `tax_rate` decimal(5,4) DEFAULT 0.1800,
  `logo_url` varchar(255) DEFAULT NULL,
  `receipt_footer` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `businesses`
--

INSERT INTO `businesses` (`id`, `owner_id`, `business_name`, `business_type`, `description`, `phone`, `email`, `address`, `currency`, `timezone`, `tax_rate`, `logo_url`, `receipt_footer`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 2, 'Future Pack Traders', 'Retail Shop', NULL, NULL, NULL, NULL, 'UGX', 'Africa/Kampala', 0.1800, NULL, NULL, 1, '2026-04-26 15:52:22', '2026-04-26 15:52:22');

-- --------------------------------------------------------

--
-- Table structure for table `business_settings`
--

CREATE TABLE `business_settings` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_subscriptions`
--

CREATE TABLE `business_subscriptions` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `status` enum('trial','active','past_due','cancelled','expired') DEFAULT 'trial',
  `trial_ends_at` datetime DEFAULT NULL,
  `current_period_start` datetime DEFAULT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `auto_renew` tinyint(1) DEFAULT 1,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_subscriptions`
--

INSERT INTO `business_subscriptions` (`id`, `business_id`, `plan_id`, `status`, `trial_ends_at`, `current_period_start`, `current_period_end`, `auto_renew`, `cancelled_at`, `created_at`, `updated_at`) VALUES
(2, 2, 1, 'trial', '2026-06-25 18:52:22', '2026-04-26 18:52:22', '2026-06-25 18:52:22', 0, NULL, '2026-04-26 15:52:22', '2026-04-26 15:52:22');

-- --------------------------------------------------------

--
-- Table structure for table `business_users`
--

CREATE TABLE `business_users` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('owner','manager','employee') NOT NULL DEFAULT 'employee',
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `is_active` tinyint(1) DEFAULT 1,
  `invited_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `joined_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `business_users`
--

INSERT INTO `business_users` (`id`, `business_id`, `user_id`, `role`, `permissions`, `is_active`, `invited_at`, `joined_at`, `created_at`, `updated_at`) VALUES
(2, 2, 2, 'owner', '{\"canViewReports\":true,\"canManageInventory\":true,\"canManageEmployees\":true,\"canManageSettings\":true}', 1, '2026-04-26 15:52:22', '2026-04-26 15:52:22', '2026-04-26 15:52:22', '2026-04-26 15:52:22');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `customer_type` enum('regular','vip','wholesale') DEFAULT 'regular',
  `total_purchases` decimal(12,2) DEFAULT 0.00,
  `total_orders` int(11) DEFAULT 0,
  `last_purchase_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `business_id`, `name`, `phone`, `email`, `address`, `customer_type`, `total_purchases`, `total_orders`, `last_purchase_date`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 'Salongo', NULL, NULL, NULL, 'regular', 41800.00, 2, '2026-04-26 16:42:05', 1, '2026-04-26 16:41:04', '2026-04-26 16:42:05'),
(2, 2, 'Musiram', NULL, NULL, NULL, 'regular', 0.00, 0, NULL, 1, '2026-04-26 18:22:48', '2026-04-26 18:22:48'),
(3, 2, 'Nalongo', NULL, NULL, NULL, 'regular', 0.00, 0, NULL, 1, '2026-05-01 06:59:58', '2026-05-01 06:59:58');

-- --------------------------------------------------------

--
-- Stand-in structure for view `daily_sales_summary`
-- (See below for the actual view)
--
CREATE TABLE `daily_sales_summary` (
`business_id` int(11)
,`sale_date` date
,`transaction_count` bigint(21)
,`total_revenue` decimal(34,2)
,`avg_transaction_value` decimal(16,6)
,`unique_customers` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `category` varchar(100) NOT NULL,
  `expense_date` date NOT NULL,
  `payment_method` enum('cash','mobile_money','bank_transfer','cheque') DEFAULT 'cash',
  `payment_reference` varchar(100) DEFAULT NULL,
  `receipt_url` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`id`, `business_id`, `description`, `amount`, `category`, `expense_date`, `payment_method`, `payment_reference`, `receipt_url`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, 'Restock: Kaswa', 75000.00, 'Inventory', '2026-05-01', 'cash', NULL, NULL, 'Restocking', 2, '2026-05-01 06:37:03', '2026-05-01 06:37:03'),
(2, 2, 'Restock: Sunday', 86000.00, 'Inventory', '2026-04-30', 'cash', NULL, NULL, 'Restocked 12 units of Sunday', 2, '2026-05-01 06:38:48', '2026-05-01 13:14:41'),
(3, 2, 'Restock: Kaswa', 75000.00, 'Inventory', '2026-04-30', 'cash', NULL, NULL, 'Restocked 12 units of Kaswa', 2, '2026-05-01 10:10:36', '2026-05-01 13:15:03'),
(4, 2, 'Restock: Water small', 5000.00, 'Inventory', '2026-04-30', 'cash', NULL, NULL, 'Restocked 12 units of Water small', 2, '2026-05-01 10:10:56', '2026-05-01 13:15:16'),
(5, 2, 'Restock: Kaswa', 75000.00, 'Inventory', '2026-05-01', 'cash', NULL, NULL, 'Restocked 12 units of Kaswa', 2, '2026-05-01 13:28:36', '2026-05-01 13:28:36'),
(6, 2, 'Transport', 10000.00, 'Transportation', '2026-04-30', 'cash', NULL, NULL, NULL, 2, '2026-05-01 13:33:48', '2026-05-01 13:34:20'),
(7, 2, 'Restock: Kaswa', 75000.00, 'Inventory', '2026-05-01', 'cash', NULL, NULL, 'Restock', 2, '2026-05-01 18:40:58', '2026-05-01 18:40:58'),
(8, 2, 'Restock: Candles', 30048.00, 'Inventory', '2026-05-06', 'cash', NULL, NULL, 'Restocked 96 units of Candles', 2, '2026-05-06 12:39:04', '2026-05-06 12:39:04'),
(9, 2, 'Restock: Gnuts', 30000.00, 'Inventory', '2026-05-06', 'cash', NULL, NULL, 'Restocked 5 units of Gnuts', 2, '2026-05-06 12:39:17', '2026-05-06 12:39:17'),
(10, 2, 'Restock: Jesa Milk', 22008.00, 'Inventory', '2026-05-06', 'cash', NULL, NULL, 'Restocked 12 units of Jesa Milk', 2, '2026-05-06 12:39:36', '2026-05-06 12:39:36'),
(11, 2, 'Restock: Sugar', 79000.00, 'Inventory', '2026-05-06', 'cash', NULL, NULL, 'Restocked 25 units of Sugar', 2, '2026-05-06 12:40:44', '2026-05-06 12:40:44'),
(12, 2, 'Restock: Sunday', 86004.00, 'Inventory', '2026-05-06', 'cash', NULL, NULL, 'Restocked 12 units of Sunday', 2, '2026-05-06 18:04:33', '2026-05-06 18:04:33'),
(13, 2, 'Restock: Kaswa', 75000.00, 'Inventory', '2026-05-06', 'cash', NULL, NULL, 'Restocked 12 units of Kaswa', 2, '2026-05-06 18:33:39', '2026-05-06 18:33:39');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_movements`
--

CREATE TABLE `inventory_movements` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `movement_type` enum('sale','purchase','adjustment','return','damage','transfer') NOT NULL,
  `quantity_change` decimal(10,2) NOT NULL,
  `stock_before` decimal(10,2) NOT NULL,
  `stock_after` decimal(10,2) NOT NULL,
  `reference_id` int(11) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `movement_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_movements`
--

INSERT INTO `inventory_movements` (`id`, `business_id`, `product_id`, `movement_type`, `quantity_change`, `stock_before`, `stock_after`, `reference_id`, `reference_type`, `notes`, `movement_date`, `created_by`) VALUES
(1, 2, 7, 'sale', -2.00, 8.00, 4.00, 1, 'sale', NULL, '2026-04-26 16:28:36', 2),
(2, 2, 7, 'sale', -2.00, 4.00, 4.00, 1, NULL, 'Sale #PS220260426192836', '2026-04-26 16:28:36', 2),
(3, 2, 1, 'sale', -3.00, 12.00, 6.00, 2, 'sale', NULL, '2026-04-26 16:41:04', 2),
(4, 2, 1, 'sale', -3.00, 6.00, 6.00, 2, NULL, 'Sale #PS220260426194104', '2026-04-26 16:41:04', 2),
(5, 2, 2, 'sale', -1.00, 6.50, 4.50, 2, 'sale', NULL, '2026-04-26 16:41:04', 2),
(6, 2, 2, 'sale', -1.00, 4.50, 4.50, 2, NULL, 'Sale #PS220260426194104', '2026-04-26 16:41:04', 2),
(7, 2, 1, 'sale', -2.00, 6.00, 2.00, 3, 'sale', NULL, '2026-04-26 16:42:05', 2),
(8, 2, 1, 'sale', -2.00, 2.00, 2.00, 3, NULL, 'Sale #PS220260426194205', '2026-04-26 16:42:05', 2),
(9, 2, 2, 'sale', -1.00, 4.50, 2.50, 3, 'sale', NULL, '2026-04-26 16:42:05', 2),
(10, 2, 2, 'sale', -1.00, 2.50, 2.50, 3, NULL, 'Sale #PS220260426194205', '2026-04-26 16:42:05', 2),
(11, 2, 16, 'sale', -1.00, 14.00, 12.00, 4, 'sale', NULL, '2026-04-26 16:42:39', 2),
(12, 2, 16, 'sale', -1.00, 12.00, 12.00, 4, NULL, 'Sale #PS220260426194239', '2026-04-26 16:42:39', 2),
(15, 2, 1, 'sale', -0.25, 2.00, 1.50, 7, 'sale', NULL, '2026-04-26 18:06:40', 2),
(16, 2, 1, 'sale', -0.25, 1.75, 1.50, 7, NULL, 'Sale #PS220260426210640', '2026-04-26 18:06:40', 2),
(17, 2, 15, 'sale', -1.00, 12.00, 10.00, 8, 'sale', NULL, '2026-04-26 18:15:20', 2),
(18, 2, 15, 'sale', -1.00, 11.00, 10.00, 8, NULL, 'Sale #PS220260426211520', '2026-04-26 18:15:20', 2),
(19, 2, 11, 'sale', -1.00, 3.00, 1.00, 9, 'sale', NULL, '2026-04-26 18:22:48', 2),
(20, 2, 11, 'sale', -1.00, 2.00, 1.00, 9, NULL, 'Sale #PS220260426212248', '2026-04-26 18:22:48', 2),
(21, 2, 10, 'sale', -1.00, 56.00, 54.00, 10, 'sale', NULL, '2026-04-26 18:41:28', 2),
(22, 2, 10, 'sale', -1.00, 55.00, 54.00, 10, NULL, 'Sale #PS220260426214128', '2026-04-26 18:41:28', 2),
(23, 2, 10, 'sale', -1.00, 54.00, 52.00, 11, 'sale', NULL, '2026-04-26 18:42:48', 2),
(24, 2, 10, 'sale', -1.00, 53.00, 52.00, 11, NULL, 'Sale #PS220260426214248', '2026-04-26 18:42:48', 2),
(25, 2, 10, 'sale', -1.00, 54.00, 52.00, 12, 'sale', NULL, '2026-04-26 18:50:48', 2),
(26, 2, 10, 'sale', -1.00, 53.00, 51.00, 13, 'sale', NULL, '2026-04-26 18:51:10', 2),
(27, 2, 10, 'sale', -1.00, 52.00, 50.00, 14, 'sale', NULL, '2026-04-26 18:51:37', 2),
(28, 2, 11, 'return', 1.00, 2.00, 3.00, 9, 'refund', NULL, '2026-04-26 18:52:57', 2),
(29, 2, 11, 'sale', -1.00, 3.00, 1.00, 15, 'sale', NULL, '2026-04-26 18:56:54', 2),
(30, 2, 1, 'sale', -0.25, 6.75, 6.25, 16, 'sale', NULL, '2026-04-27 06:50:17', 2),
(31, 2, 1, 'return', 0.25, 6.75, 7.00, 16, 'refund', NULL, '2026-04-27 07:24:40', 2),
(32, 2, 1, 'sale', -0.25, 6.75, 6.25, 17, 'sale', NULL, '2026-04-27 07:27:14', 2),
(33, 2, 1, 'return', 0.25, 6.75, 7.00, 17, 'refund', NULL, '2026-04-27 07:28:23', 2),
(34, 2, 1, 'return', 0.25, 7.00, 7.25, 7, 'refund', NULL, '2026-04-27 07:28:52', 2),
(35, 2, 1, 'sale', -6.00, 7.00, -5.00, 18, 'sale', NULL, '2026-04-27 07:47:06', 2),
(36, 2, 1, 'sale', -0.25, 1.00, 0.50, 19, 'sale', NULL, '2026-04-27 07:48:32', 2),
(37, 2, 2, 'sale', -2.50, 2.50, -2.50, 20, 'sale', NULL, '2026-04-27 08:01:30', 2),
(38, 2, 1, 'sale', -3.00, 12.75, 6.75, 21, 'sale', NULL, '2026-04-27 18:42:34', 2),
(39, 2, 1, 'sale', -6.00, 9.75, -2.25, 22, 'sale', NULL, '2026-04-27 18:47:51', 2),
(40, 2, 2, 'sale', -2.00, 12.00, 8.00, 22, 'sale', NULL, '2026-04-27 18:47:51', 2),
(41, 2, 3, 'sale', -0.25, 26.00, 25.50, 22, 'sale', NULL, '2026-04-27 18:47:51', 2),
(42, 2, 19, 'sale', -1.00, 3.00, 1.00, 22, 'sale', NULL, '2026-04-27 18:47:51', 2),
(43, 2, 2, 'sale', -3.50, 10.00, 3.00, 23, 'sale', NULL, '2026-04-27 18:53:49', 2),
(44, 2, 4, 'sale', -0.75, 5.00, 3.50, 24, 'sale', NULL, '2026-04-27 18:55:24', 2),
(45, 2, 3, 'sale', -1.00, 25.75, 23.75, 25, 'sale', NULL, '2026-04-27 18:59:08', 2),
(46, 2, 3, 'sale', -4.50, 24.75, 15.75, 26, 'sale', NULL, '2026-04-27 19:00:41', 2),
(47, 2, 20, 'sale', -1.00, 12.00, 10.00, 27, 'sale', NULL, '2026-04-27 19:04:19', 2),
(48, 2, 10, 'sale', -1.00, 63.00, 61.00, 28, 'sale', NULL, '2026-04-27 19:05:52', 2),
(49, 2, 1, 'sale', -3.00, 3.75, -2.25, 29, 'sale', NULL, '2026-05-01 05:37:21', 2),
(50, 2, 1, 'sale', -0.75, 0.75, -0.75, 30, 'sale', NULL, '2026-05-01 05:40:11', 2),
(51, 2, 2, 'sale', -6.50, 6.50, -6.50, 31, 'sale', NULL, '2026-05-01 05:45:15', 2),
(52, 2, 4, 'sale', -2.25, 4.25, -0.25, 32, 'sale', NULL, '2026-05-01 05:46:03', 2),
(53, 2, 3, 'sale', -1.00, 20.25, 18.25, 33, 'sale', NULL, '2026-05-01 06:59:58', 2),
(54, 2, 21, 'sale', -4.00, 12.00, 4.00, 34, 'sale', NULL, '2026-05-01 07:35:42', 2),
(55, 2, 22, 'sale', -1.00, 15.00, 13.00, 35, 'sale', NULL, '2026-05-01 07:47:09', 2),
(56, 2, 22, 'sale', -1.00, 14.00, 12.00, 36, 'sale', NULL, '2026-05-01 07:49:39', 2),
(57, 2, 2, 'sale', -5.50, 12.00, 1.00, 37, 'sale', NULL, '2026-05-01 08:48:14', 2),
(58, 2, 21, 'sale', -1.00, 8.00, 6.00, 38, 'sale', NULL, '2026-05-01 09:14:27', 2),
(59, 2, 10, 'sale', -1.00, 62.00, 60.00, 39, 'sale', NULL, '2026-05-01 09:22:48', 2),
(60, 2, 21, 'sale', -1.00, 7.00, 5.00, 40, 'sale', NULL, '2026-05-01 09:28:37', 2),
(61, 2, 1, 'sale', -2.00, 12.00, 8.00, 41, 'sale', NULL, '2026-05-01 09:32:57', 2),
(62, 2, 1, 'sale', -7.00, 10.00, -4.00, 42, 'sale', NULL, '2026-05-01 09:39:46', 2),
(63, 2, 20, 'sale', -1.00, 11.00, 9.00, 43, 'sale', NULL, '2026-05-01 09:43:49', 2),
(64, 2, 20, 'sale', -1.00, 10.00, 8.00, 44, 'sale', NULL, '2026-05-01 09:45:26', 2),
(65, 2, 1, 'sale', -3.00, 3.00, -3.00, 45, 'sale', NULL, '2026-05-01 09:54:16', 2),
(66, 2, 2, 'sale', -1.00, 6.50, 4.50, 45, 'sale', NULL, '2026-05-01 09:54:16', 2),
(67, 2, 3, 'sale', -0.25, 19.25, 18.75, 46, 'sale', NULL, '2026-05-01 09:56:20', 2),
(68, 2, 3, 'sale', -0.25, 19.00, 18.50, 47, 'sale', NULL, '2026-05-01 10:03:30', 2),
(69, 2, 1, 'sale', -2.00, 12.00, 8.00, 48, 'sale', NULL, '2026-05-01 12:44:19', 2),
(70, 2, 2, 'sale', -0.50, 5.50, 4.50, 48, 'sale', NULL, '2026-05-01 12:44:19', 2),
(71, 2, 1, 'sale', -3.00, 10.00, 4.00, 49, 'sale', NULL, '2026-05-01 17:13:08', 2),
(72, 2, 2, 'sale', -0.50, 5.00, 4.00, 49, 'sale', NULL, '2026-05-01 17:13:08', 2),
(73, 2, 1, 'sale', -6.00, 19.00, 7.00, 50, 'sale', NULL, '2026-05-01 18:44:09', 2),
(74, 2, 3, 'sale', -0.25, 18.75, 18.25, 50, 'sale', NULL, '2026-05-01 18:44:09', 2),
(75, 2, 2, 'sale', -2.00, 4.50, 0.50, 50, 'sale', NULL, '2026-05-01 18:44:09', 2),
(76, 2, 19, 'sale', -1.00, 2.00, 0.00, 50, 'sale', NULL, '2026-05-01 18:44:09', 2),
(77, 2, 2, 'sale', -0.50, 2.50, 1.50, 51, 'sale', NULL, '2026-05-01 18:49:23', 2),
(78, 2, 3, 'sale', -18.50, 18.50, -18.50, 52, 'sale', NULL, '2026-05-06 12:17:12', 2),
(79, 2, 2, 'sale', -2.00, 2.00, -2.00, 53, 'sale', NULL, '2026-05-06 17:58:23', 2),
(80, 2, 2, 'sale', -3.50, 12.00, 5.00, 54, 'sale', NULL, '2026-05-06 18:15:37', 2),
(81, 2, 1, 'sale', -8.00, 13.00, -3.00, 54, 'sale', NULL, '2026-05-06 18:15:37', 2),
(82, 2, 1, 'sale', -3.50, 5.00, -2.00, 55, 'sale', NULL, '2026-05-06 18:18:30', 2),
(83, 2, 1, 'sale', -1.00, 1.50, -0.50, 56, 'sale', NULL, '2026-05-06 18:32:11', 2),
(84, 2, 1, 'sale', -6.00, 12.50, 0.50, 57, 'sale', NULL, '2026-05-06 18:42:02', 2),
(85, 2, 4, 'sale', -2.00, 2.00, -2.00, 58, 'sale', NULL, '2026-05-06 18:51:10', 2),
(86, 2, 2, 'sale', -5.50, 8.50, -2.50, 59, 'sale', NULL, '2026-05-06 19:16:03', 2),
(87, 2, 20, 'sale', -2.00, 21.00, 17.00, 60, 'sale', NULL, '2026-05-06 19:23:55', 2),
(88, 2, 5, 'sale', -1.50, 15.00, 12.00, 61, 'sale', NULL, '2026-05-06 19:25:14', 2),
(89, 2, 3, 'sale', -3.25, 25.00, 18.50, 62, 'sale', NULL, '2026-05-06 19:25:48', 2),
(90, 2, 1, 'sale', -2.00, 6.50, 2.50, 63, 'sale', NULL, '2026-05-06 19:28:07', 2),
(91, 2, 2, 'sale', -0.50, 3.00, 2.00, 63, 'sale', NULL, '2026-05-06 19:28:07', 2),
(92, 2, 10, 'sale', -10.00, 61.00, 41.00, 64, 'sale', NULL, '2026-05-06 19:32:34', 2),
(93, 2, 19, 'sale', -1.00, 1.00, -1.00, 65, 'sale', NULL, '2026-05-06 19:33:33', 2),
(94, 2, 20, 'sale', -2.00, 19.00, 15.00, 66, 'sale', NULL, '2026-05-06 19:34:39', 2),
(95, 2, 7, 'sale', -4.00, 10.00, 2.00, 67, 'sale', NULL, '2026-05-06 19:35:28', 2),
(96, 2, 22, 'sale', -7.00, 25.00, 11.00, 68, 'sale', NULL, '2026-05-06 19:38:14', 2),
(97, 2, 11, 'sale', -1.00, 14.00, 12.00, 68, 'sale', NULL, '2026-05-06 19:38:14', 2),
(98, 2, 14, 'sale', -2.00, 12.00, 8.00, 68, 'sale', NULL, '2026-05-06 19:38:14', 2);

-- --------------------------------------------------------

--
-- Stand-in structure for view `monthly_business_metrics`
-- (See below for the actual view)
--
CREATE TABLE `monthly_business_metrics` (
`business_id` int(11)
,`year` int(4)
,`month` int(2)
,`total_sales` bigint(21)
,`total_revenue` decimal(34,2)
,`net_revenue` decimal(36,2)
,`unique_customers` bigint(21)
,`avg_order_value` decimal(16,6)
);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reset_code` varchar(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_records`
--

CREATE TABLE `payment_records` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('cash','mobile_money','card','bank_transfer') DEFAULT 'cash',
  `recorded_by` int(11) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payment_records`
--

INSERT INTO `payment_records` (`id`, `business_id`, `sale_id`, `amount`, `payment_method`, `recorded_by`, `notes`, `created_at`, `updated_at`) VALUES
(4, 2, 15, 2500.00, 'cash', 2, NULL, '2026-04-26 19:20:37', '2026-04-26 19:20:37'),
(5, 2, 15, 2500.00, 'cash', 2, NULL, '2026-04-26 19:25:59', '2026-04-26 19:25:59'),
(6, 2, 15, 2500.00, 'cash', 2, NULL, '2026-04-26 19:28:23', '2026-04-26 19:28:23'),
(7, 2, 15, 2500.00, 'cash', 2, NULL, '2026-04-26 19:31:36', '2026-04-26 19:31:36'),
(8, 2, 47, 1000.00, 'cash', 2, NULL, '2026-05-01 10:27:58', '2026-05-01 10:27:58'),
(9, 2, 34, 1000.00, 'cash', 2, NULL, '2026-05-01 10:33:03', '2026-05-01 10:33:03'),
(10, 2, 33, 2000.00, 'cash', 2, NULL, '2026-05-01 10:33:22', '2026-05-01 10:33:22'),
(11, 2, 36, 500.00, 'cash', 2, NULL, '2026-05-01 10:33:46', '2026-05-01 10:33:46');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `buying_price` decimal(12,2) NOT NULL,
  `selling_price` decimal(12,2) NOT NULL,
  `current_stock` decimal(10,2) DEFAULT 0.00,
  `min_stock_level` decimal(10,2) DEFAULT 5.00,
  `max_stock_level` decimal(10,2) DEFAULT NULL,
  `unit` varchar(20) DEFAULT 'pieces',
  `product_image` varchar(255) DEFAULT NULL,
  `tax_rate` decimal(5,4) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `business_id`, `category_id`, `name`, `description`, `barcode`, `buying_price`, `selling_price`, `current_stock`, `min_stock_level`, `max_stock_level`, `unit`, `product_image`, `tax_rate`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 2, NULL, 'Kaswa', 'Wheat flour', NULL, 6250.00, 6700.00, 4.50, 2.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 15:58:06', '2026-05-06 19:28:07'),
(2, 2, NULL, 'Sunday', 'Cooking oil', NULL, 7167.00, 7500.00, 2.50, 2.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:00:51', '2026-05-06 19:28:07'),
(3, 2, NULL, 'Sugar', 'Normal sugar', NULL, 3080.00, 4000.00, 21.75, 5.00, NULL, 'Kg', NULL, NULL, 1, 2, '2026-04-26 16:03:58', '2026-05-06 19:25:48'),
(4, 2, NULL, 'Soap', 'Bar soap', NULL, 3400.00, 4000.00, 0.00, 2.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:05:01', '2026-05-06 18:51:10'),
(5, 2, NULL, 'Rice', 'Low price rice', NULL, 3500.00, 4000.00, 13.50, 5.00, NULL, 'Kg', NULL, NULL, 1, 2, '2026-04-26 16:06:17', '2026-05-06 19:25:14'),
(6, 2, NULL, 'Rice Super', 'Super Rice', NULL, 3800.00, 4500.00, 20.00, 5.00, NULL, 'Kg', NULL, NULL, 1, 2, '2026-04-26 16:07:09', '2026-04-26 16:07:09'),
(7, 2, NULL, 'West Lake big', 'Big water', NULL, 834.00, 1000.00, 6.00, 2.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:08:45', '2026-05-06 19:35:28'),
(9, 2, NULL, 'Lucky', 'Lucy juice', NULL, 1500.00, 2000.00, 5.00, 2.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:14:11', '2026-04-26 16:14:11'),
(10, 2, NULL, 'Soda', 'Soda small', NULL, 834.00, 1000.00, 51.00, 15.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:15:52', '2026-05-06 19:32:34'),
(11, 2, NULL, 'Oner', 'Oner Juice', NULL, 2084.00, 2500.00, 13.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:17:04', '2026-05-06 19:38:14'),
(12, 2, NULL, 'Sting', 'Sting energy drink', NULL, 1500.00, 2000.00, 7.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:19:01', '2026-04-26 16:19:25'),
(13, 2, NULL, 'Tamarid', 'Tamarid drink', NULL, 834.00, 1000.00, 7.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:21:09', '2026-04-26 16:21:09'),
(14, 2, NULL, 'Jema Bushera', 'bushera', NULL, 834.00, 1000.00, 10.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:22:21', '2026-05-06 19:38:14'),
(15, 2, NULL, 'Clever', 'Clever drink', NULL, 417.00, 500.00, 10.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:23:45', '2026-04-26 18:15:20'),
(16, 2, NULL, 'UFresh', 'ufresh drink', NULL, 417.00, 500.00, 12.00, 5.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:24:48', '2026-04-26 16:42:39'),
(17, 2, NULL, 'Oner m', 'Oner medium', NULL, 1300.00, 1500.00, 1.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:25:34', '2026-04-26 16:25:34'),
(18, 2, NULL, 'Oner small', 'oner small', NULL, 834.00, 1000.00, 6.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-26 16:26:19', '2026-04-26 16:26:19'),
(19, 2, NULL, 'Salt', 'Normal salt', NULL, 725.00, 1000.00, 0.00, 5.00, NULL, 'Pieces', 'file:///Users/tracecorp/Library/Developer/CoreSimulator/Devices/48DFEFB7-8683-49D2-B9B7-E6E6AB781B0B/data/Containers/Data/Application/13BC1B0B-CD00-474C-A63F-11658769BEBB/tmp/1CE74D30-DA78-4B51-BE2E-BDBB779F5941.jpg', NULL, 1, 2, '2026-04-27 18:45:26', '2026-05-06 19:33:33'),
(20, 2, NULL, 'Jesa Milk', 'Jess milk', NULL, 1834.00, 2000.00, 17.00, 5.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-04-27 19:03:54', '2026-05-06 19:34:39'),
(21, 2, NULL, 'Bread', 'Small bread', NULL, 417.00, 500.00, 6.00, 5.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-01 07:34:42', '2026-05-01 09:28:37'),
(22, 2, NULL, 'Water small', 'Small water', NULL, 417.00, 500.00, 18.00, 10.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-01 07:43:54', '2026-05-06 19:38:14'),
(23, 2, NULL, 'Wipes', 'Baby wipes', NULL, 4500.00, 5000.00, 6.00, 2.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:08:02', '2026-05-06 12:08:02'),
(24, 2, NULL, 'Kakira Sugar', 'Kakira packet sugar', NULL, 4000.00, 5000.00, 14.00, 5.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:11:20', '2026-05-06 12:11:20'),
(25, 2, NULL, 'Magic 500g', 'Magic 500g', NULL, 5500.00, 6000.00, 3.00, 1.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:12:38', '2026-05-06 12:12:38'),
(26, 2, NULL, 'Ariel 1kg', 'Ariel 1kg', NULL, 11000.00, 12000.00, 2.00, 1.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:14:08', '2026-05-06 12:14:08'),
(27, 2, NULL, 'Tomato source', NULL, NULL, 1200.00, 1500.00, 20.00, 5.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:15:54', '2026-05-06 12:15:54'),
(28, 2, NULL, 'White start soap', 'White start bar soap', NULL, 5500.00, 6000.00, 10.00, 3.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:19:12', '2026-05-06 12:19:12'),
(29, 2, NULL, 'Gnuts', 'Ground nuts', NULL, 6000.00, 8000.00, 5.00, 2.00, NULL, 'Kg', NULL, NULL, 1, 2, '2026-05-06 12:20:29', '2026-05-06 12:39:17'),
(30, 2, NULL, 'Candles', 'Candles', NULL, 313.00, 500.00, 96.00, 5.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:24:18', '2026-05-06 12:39:04'),
(31, 2, NULL, 'Rwenzori Tea Leaves', 'Rwenzori Tea Leaves', NULL, 87.00, 200.00, 0.00, 12.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 12:34:46', '2026-05-06 12:38:46'),
(32, 2, NULL, 'Royco', 'Royco medium', NULL, 833.30, 1000.00, 70.00, 5.00, NULL, 'pieces', NULL, NULL, 1, 2, '2026-05-06 19:03:52', '2026-05-06 19:03:52');

-- --------------------------------------------------------

--
-- Stand-in structure for view `product_stock_status`
-- (See below for the actual view)
--
CREATE TABLE `product_stock_status` (
`id` int(11)
,`business_id` int(11)
,`name` varchar(255)
,`current_stock` decimal(10,2)
,`min_stock_level` decimal(10,2)
,`stock_status` varchar(12)
,`profit_margin` decimal(19,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `receipt_templates`
--

CREATE TABLE `receipt_templates` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `template_name` varchar(100) NOT NULL,
  `header_text` text DEFAULT NULL,
  `footer_text` text DEFAULT NULL,
  `show_business_info` tinyint(1) DEFAULT 1,
  `show_tax_info` tinyint(1) DEFAULT 1,
  `show_barcode` tinyint(1) DEFAULT 0,
  `custom_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`custom_fields`)),
  `is_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `refunds`
--

CREATE TABLE `refunds` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `refund_number` varchar(50) NOT NULL,
  `refund_amount` decimal(12,2) NOT NULL,
  `refund_reason` text DEFAULT NULL,
  `refund_method` enum('cash','credit','store_credit') DEFAULT 'cash',
  `refunded_by` int(11) NOT NULL,
  `refund_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `refunds`
--

INSERT INTO `refunds` (`id`, `business_id`, `sale_id`, `refund_number`, `refund_amount`, `refund_reason`, `refund_method`, `refunded_by`, `refund_date`, `notes`, `created_at`, `updated_at`) VALUES
(1, 2, 9, 'RF220260426215257', 2500.00, 'No reason provided', 'cash', 2, '2026-04-26 18:52:57', NULL, '2026-04-26 18:52:57', '2026-04-26 18:52:57'),
(2, 2, 16, 'RF220260427102440', 1000.00, 'No reason provided', 'cash', 2, '2026-04-27 07:24:40', NULL, '2026-04-27 07:24:40', '2026-04-27 07:24:40'),
(3, 2, 17, 'RF220260427102823', 1000.00, 'No reason provided', 'cash', 2, '2026-04-27 07:28:23', NULL, '2026-04-27 07:28:23', '2026-04-27 07:28:23'),
(4, 2, 7, 'RF220260427102852', 1000.00, 'No reason provided', 'cash', 2, '2026-04-27 07:28:52', NULL, '2026-04-27 07:28:52', '2026-04-27 07:28:52');

-- --------------------------------------------------------

--
-- Table structure for table `sales`
--

CREATE TABLE `sales` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `sale_number` varchar(50) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(15) DEFAULT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `tax_amount` decimal(12,2) DEFAULT 0.00,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL,
  `amount_paid` decimal(12,2) DEFAULT 0.00,
  `balance_due` decimal(12,2) GENERATED ALWAYS AS (`total_amount` - `amount_paid`) STORED,
  `change_amount` decimal(12,2) DEFAULT 0.00,
  `payment_method` enum('cash','credit') DEFAULT 'cash',
  `payment_status` enum('paid','partial','unpaid') DEFAULT 'paid',
  `payment_reference` varchar(100) DEFAULT NULL,
  `status` enum('pending','completed','cancelled','refunded') DEFAULT 'completed',
  `notes` text DEFAULT NULL,
  `sale_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_opening_balance` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sales`
--

INSERT INTO `sales` (`id`, `business_id`, `employee_id`, `customer_id`, `sale_number`, `customer_name`, `customer_phone`, `subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `amount_paid`, `change_amount`, `payment_method`, `payment_status`, `payment_reference`, `status`, `notes`, `sale_date`, `cancelled_at`, `cancellation_reason`, `created_at`, `updated_at`, `is_opening_balance`, `created_by`) VALUES
(1, 2, 2, NULL, 'PS220260426192836', NULL, NULL, 2000.00, 0.00, 0.00, 2000.00, 2000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 16:28:36', NULL, NULL, '2026-04-26 16:28:36', '2026-04-26 16:28:36', 0, NULL),
(2, 2, 2, NULL, 'PS220260426194104', 'Salongo', NULL, 27600.00, 0.00, 0.00, 27600.00, 27600.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 16:41:04', NULL, NULL, '2026-04-26 16:41:04', '2026-04-26 16:41:04', 0, NULL),
(3, 2, 2, 1, 'PS220260426194205', 'Salongo', NULL, 20900.00, 0.00, 0.00, 20900.00, 20900.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 16:42:05', NULL, NULL, '2026-04-26 16:42:05', '2026-04-26 16:42:05', 0, NULL),
(4, 2, 2, NULL, 'PS220260426194239', NULL, NULL, 500.00, 0.00, 0.00, 500.00, 500.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 16:42:39', NULL, NULL, '2026-04-26 16:42:39', '2026-04-26 16:42:39', 0, NULL),
(7, 2, 2, NULL, 'PS220260426210640', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'refunded', NULL, '2026-04-26 18:06:40', '2026-04-27 07:28:52', 'Sale refunded', '2026-04-26 18:06:40', '2026-04-27 07:28:52', 0, NULL),
(8, 2, 2, NULL, 'PS220260426211520', NULL, NULL, 500.00, 0.00, 0.00, 500.00, 500.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 18:15:20', NULL, NULL, '2026-04-26 18:15:20', '2026-04-26 18:15:20', 0, NULL),
(9, 2, 2, NULL, 'PS220260426212248', 'Musiram', NULL, 2500.00, 0.00, 0.00, 2500.00, 2500.00, 0.00, 'credit', 'paid', NULL, 'refunded', NULL, '2026-04-26 18:22:48', '2026-04-26 18:52:57', 'Sale refunded', '2026-04-26 18:22:48', '2026-04-26 18:52:57', 0, NULL),
(10, 2, 2, NULL, 'PS220260426214128', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 18:41:28', NULL, NULL, '2026-04-26 18:41:28', '2026-04-26 18:41:28', 0, NULL),
(11, 2, 2, NULL, 'PS220260426214248', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 18:42:48', NULL, NULL, '2026-04-26 18:42:48', '2026-04-26 18:42:48', 0, NULL),
(12, 2, 2, NULL, 'PS220260426215048', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 18:50:48', NULL, NULL, '2026-04-26 18:50:48', '2026-04-26 18:50:48', 0, NULL),
(13, 2, 2, NULL, 'PS220260426215110', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 18:51:10', NULL, NULL, '2026-04-26 18:51:10', '2026-04-26 18:51:10', 0, NULL),
(14, 2, 2, NULL, 'PS220260426215137', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-26 18:51:37', NULL, NULL, '2026-04-26 18:51:37', '2026-04-26 18:51:37', 0, NULL),
(15, 2, 2, NULL, 'PS220260426215654', 'Musiram', NULL, 2500.00, 0.00, 0.00, 2500.00, 2500.00, 0.00, 'credit', 'partial', NULL, 'completed', NULL, '2026-04-26 18:56:54', NULL, NULL, '2026-04-26 18:56:54', '2026-04-26 19:31:36', 0, NULL),
(16, 2, 2, NULL, 'PS220260427095017', 'Salongo', NULL, 1675.00, 0.00, 675.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'refunded', NULL, '2026-04-27 06:50:17', '2026-04-27 07:24:40', 'Sale refunded', '2026-04-27 06:50:17', '2026-04-27 07:24:40', 0, NULL),
(17, 2, 2, NULL, 'PS220260427102714', 'Salongo', NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'refunded', NULL, '2026-04-27 07:27:14', '2026-04-27 07:28:23', 'Sale refunded', '2026-04-27 07:27:14', '2026-04-27 07:28:23', 0, NULL),
(18, 2, 2, NULL, 'PS220260427104706', 'Salongo', NULL, 40200.00, 0.00, 0.00, 40200.00, 40200.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 07:47:06', NULL, NULL, '2026-04-27 07:47:06', '2026-04-27 07:47:06', 0, NULL),
(19, 2, 2, NULL, 'PS220260427104832', 'Salongo', NULL, 2000.00, 0.00, 0.00, 2000.00, 2000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 07:48:32', NULL, NULL, '2026-04-27 07:48:32', '2026-04-27 07:48:32', 0, NULL),
(20, 2, 2, NULL, 'PS220260427110130', 'Salongo', NULL, 18750.00, 0.00, 0.00, 18750.00, 18750.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 08:01:30', NULL, NULL, '2026-04-27 08:01:30', '2026-04-27 08:01:30', 0, NULL),
(21, 2, 2, NULL, 'PS220260427214234', 'Salongo', NULL, 20100.00, 0.00, 0.00, 20100.00, 20100.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 18:42:34', NULL, NULL, '2026-04-27 18:42:34', '2026-04-27 18:42:34', 0, NULL),
(22, 2, 2, 1, 'PS220260427214751', 'Salongo', NULL, 57200.00, 0.00, 0.00, 57200.00, 0.00, 0.00, 'credit', 'paid', NULL, 'pending', NULL, '2026-04-27 18:47:51', NULL, NULL, '2026-04-27 18:47:51', '2026-05-01 12:08:12', 0, NULL),
(23, 2, 2, NULL, 'PS220260427215349', NULL, NULL, 26250.00, 0.00, 0.00, 26250.00, 26250.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 18:53:49', NULL, NULL, '2026-04-27 18:53:49', '2026-04-27 18:53:49', 0, NULL),
(24, 2, 2, NULL, 'PS220260427215524', NULL, NULL, 3000.00, 0.00, 0.00, 3000.00, 3000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 18:55:24', NULL, NULL, '2026-04-27 18:55:24', '2026-04-27 18:55:24', 0, NULL),
(25, 2, 2, NULL, 'PS220260427215908', NULL, NULL, 4000.00, 0.00, 0.00, 4000.00, 4000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 18:59:08', NULL, NULL, '2026-04-27 18:59:08', '2026-04-27 18:59:08', 0, NULL),
(26, 2, 2, NULL, 'PS220260427220041', NULL, NULL, 18000.00, 0.00, 0.00, 18000.00, 18000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 19:00:41', NULL, NULL, '2026-04-27 19:00:41', '2026-04-27 19:00:41', 0, NULL),
(27, 2, 2, NULL, 'PS220260427220419', NULL, NULL, 2000.00, 0.00, 0.00, 2000.00, 2000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 19:04:19', NULL, NULL, '2026-04-27 19:04:19', '2026-04-27 19:04:19', 0, NULL),
(28, 2, 2, NULL, 'PS220260427220552', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-04-27 19:05:52', NULL, NULL, '2026-04-27 19:05:52', '2026-04-27 19:05:52', 0, NULL),
(29, 2, 2, NULL, 'PS220260501083721', NULL, NULL, 20100.00, 0.00, 0.00, 20100.00, 20100.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 05:37:21', NULL, NULL, '2026-05-01 05:37:21', '2026-05-01 05:37:21', 0, NULL),
(30, 2, 2, NULL, 'PS220260501084011', NULL, NULL, 6000.00, 0.00, 0.00, 6000.00, 6000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 05:40:11', NULL, NULL, '2026-05-01 05:40:11', '2026-05-01 05:40:11', 0, NULL),
(31, 2, 2, NULL, 'PS220260501084515', NULL, NULL, 48750.00, 0.00, 0.00, 48750.00, 48750.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 05:45:15', NULL, NULL, '2026-05-01 05:45:15', '2026-05-01 05:45:15', 0, NULL),
(32, 2, 2, NULL, 'PS220260501084603', NULL, NULL, 9000.00, 0.00, 0.00, 9000.00, 9000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 05:46:03', NULL, NULL, '2026-05-01 05:46:03', '2026-05-01 05:46:03', 0, NULL),
(33, 2, 2, NULL, 'PS220260501095958', 'Nalongo', NULL, 4000.00, 0.00, 0.00, 4000.00, 4000.00, 0.00, 'credit', 'paid', NULL, 'completed', NULL, '2026-05-01 06:59:58', NULL, NULL, '2026-05-01 06:59:58', '2026-05-01 10:33:22', 0, NULL),
(34, 2, 2, NULL, 'PS220260501103542', 'Nalongo', NULL, 2000.00, 0.00, 0.00, 2000.00, 2000.00, 0.00, 'credit', 'paid', NULL, 'completed', NULL, '2026-05-01 07:35:42', NULL, NULL, '2026-05-01 07:35:42', '2026-05-01 10:33:03', 0, NULL),
(35, 2, 2, NULL, 'PS220260501104709', NULL, NULL, 500.00, 0.00, 0.00, 500.00, 500.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 07:47:09', NULL, NULL, '2026-05-01 07:47:09', '2026-05-01 07:47:09', 0, NULL),
(36, 2, 2, NULL, 'PS220260501104939', 'Nalongo', NULL, 500.00, 0.00, 0.00, 500.00, 500.00, 0.00, 'credit', 'paid', NULL, 'completed', NULL, '2026-05-01 07:49:39', NULL, NULL, '2026-05-01 07:49:39', '2026-05-01 10:33:46', 0, NULL),
(37, 2, 2, NULL, 'PS220260501114814', NULL, NULL, 41250.00, 0.00, 0.00, 41250.00, 41250.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 08:48:14', NULL, NULL, '2026-05-01 08:48:14', '2026-05-01 08:48:14', 0, NULL),
(38, 2, 2, NULL, 'PS220260501121427', NULL, NULL, 500.00, 0.00, 0.00, 500.00, 500.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:14:27', NULL, NULL, '2026-05-01 09:14:27', '2026-05-01 09:14:27', 0, NULL),
(39, 2, 2, NULL, 'PS220260501122248', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:22:48', NULL, NULL, '2026-05-01 09:22:48', '2026-05-01 09:22:48', 0, NULL),
(40, 2, 2, NULL, 'PS220260501122837', NULL, NULL, 500.00, 0.00, 0.00, 500.00, 500.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:28:37', NULL, NULL, '2026-05-01 09:28:37', '2026-05-01 09:28:37', 0, NULL),
(41, 2, 2, NULL, 'PS220260501123257', 'Musiram', NULL, 13400.00, 0.00, 0.00, 13400.00, 13400.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:32:57', NULL, NULL, '2026-05-01 09:32:57', '2026-05-01 09:32:57', 0, NULL),
(42, 2, 2, NULL, 'PS220260501123946', NULL, NULL, 46900.00, 0.00, 0.00, 46900.00, 46900.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:39:46', NULL, NULL, '2026-05-01 09:39:46', '2026-05-01 09:39:46', 0, NULL),
(43, 2, 2, NULL, 'PS220260501124349', NULL, NULL, 2000.00, 0.00, 0.00, 2000.00, 2000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:43:49', NULL, NULL, '2026-05-01 09:43:49', '2026-05-01 09:43:49', 0, NULL),
(44, 2, 2, NULL, 'PS220260501124526', NULL, NULL, 2000.00, 0.00, 0.00, 2000.00, 2000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:45:26', NULL, NULL, '2026-05-01 09:45:26', '2026-05-01 09:45:26', 0, NULL),
(45, 2, 2, NULL, 'PS220260501125416', 'Salongo', NULL, 27600.00, 0.00, 0.00, 27600.00, 27600.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:54:16', NULL, NULL, '2026-05-01 09:54:16', '2026-05-01 09:54:16', 0, NULL),
(46, 2, 2, NULL, 'PS220260501125620', 'Salongo', NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 09:56:20', NULL, NULL, '2026-05-01 09:56:20', '2026-05-01 09:56:20', 0, NULL),
(47, 2, 2, NULL, 'PS220260501130330', 'Salongo', NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'credit', 'paid', NULL, 'completed', NULL, '2026-05-01 10:03:30', NULL, NULL, '2026-05-01 10:03:30', '2026-05-01 10:27:58', 0, NULL),
(48, 2, 2, NULL, 'PS220260501154419', 'Musiram', NULL, 17150.00, 0.00, 0.00, 17150.00, 17150.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 12:44:19', NULL, NULL, '2026-05-01 12:44:19', '2026-05-01 12:44:19', 0, NULL),
(49, 2, 2, NULL, 'PS220260501201308', 'Salongo', NULL, 23850.00, 0.00, 0.00, 23850.00, 23850.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 17:13:08', NULL, NULL, '2026-05-01 17:13:08', '2026-05-01 17:13:08', 0, NULL),
(50, 2, 2, NULL, 'PS220260501214409', 'Salongo', NULL, 57200.00, 0.00, 0.00, 57200.00, 0.00, 0.00, 'credit', 'paid', NULL, 'pending', NULL, '2026-05-01 18:44:09', NULL, NULL, '2026-05-01 18:44:09', '2026-05-01 18:44:09', 0, NULL),
(51, 2, 2, NULL, 'PS220260501214923', 'Salongo', NULL, 3750.00, 0.00, 0.00, 3750.00, 3750.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-01 18:49:23', NULL, NULL, '2026-05-01 18:49:23', '2026-05-01 18:49:23', 0, NULL),
(52, 2, 2, NULL, 'PS220260506151712', NULL, NULL, 74000.00, 0.00, 0.00, 74000.00, 74000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 12:17:12', NULL, NULL, '2026-05-06 12:17:12', '2026-05-06 12:17:12', 0, NULL),
(53, 2, 2, NULL, 'PS220260506205823', NULL, NULL, 15000.00, 0.00, 0.00, 15000.00, 15000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 17:58:23', NULL, NULL, '2026-05-06 17:58:23', '2026-05-06 17:58:23', 0, NULL),
(54, 2, 2, NULL, 'PS220260506211537', NULL, NULL, 79850.00, 0.00, 0.00, 79850.00, 79850.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 18:15:37', NULL, NULL, '2026-05-06 18:15:37', '2026-05-06 18:15:37', 0, NULL),
(55, 2, 2, NULL, 'PS220260506211830', NULL, NULL, 24150.00, 0.00, 0.00, 24150.00, 24150.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 18:18:30', NULL, NULL, '2026-05-06 18:18:30', '2026-05-06 18:18:30', 0, NULL),
(56, 2, 2, NULL, 'PS220260506213211', NULL, NULL, 6700.00, 0.00, 0.00, 6700.00, 6700.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 18:32:11', NULL, NULL, '2026-05-06 18:32:11', '2026-05-06 18:32:11', 0, NULL),
(57, 2, 2, NULL, 'PS220260506214202', NULL, NULL, 40200.00, 0.00, 0.00, 40200.00, 40200.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 18:42:02', NULL, NULL, '2026-05-06 18:42:02', '2026-05-06 18:42:02', 0, NULL),
(58, 2, 2, NULL, 'PS220260506215110', NULL, NULL, 8000.00, 0.00, 0.00, 8000.00, 8000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 18:51:10', NULL, NULL, '2026-05-06 18:51:10', '2026-05-06 18:51:10', 0, NULL),
(59, 2, 2, NULL, 'PS220260506221603', NULL, NULL, 41250.00, 0.00, 0.00, 41300.00, 41300.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:16:03', NULL, NULL, '2026-05-06 19:16:03', '2026-05-06 19:16:03', 0, NULL),
(60, 2, 2, NULL, 'PS220260506222355', NULL, NULL, 4000.00, 0.00, 0.00, 4000.00, 4000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:23:55', NULL, NULL, '2026-05-06 19:23:55', '2026-05-06 19:23:55', 0, NULL),
(61, 2, 2, NULL, 'PS220260506222514', NULL, NULL, 6000.00, 0.00, 0.00, 6000.00, 6000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:25:14', NULL, NULL, '2026-05-06 19:25:14', '2026-05-06 19:25:14', 0, NULL),
(62, 2, 2, NULL, 'PS220260506222548', NULL, NULL, 13000.00, 0.00, 0.00, 13000.00, 13000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:25:48', NULL, NULL, '2026-05-06 19:25:48', '2026-05-06 19:25:48', 0, NULL),
(63, 2, 2, NULL, 'PS220260506222807', 'Salongo', NULL, 17150.00, 0.00, 0.00, 17200.00, 17200.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:28:07', NULL, NULL, '2026-05-06 19:28:07', '2026-05-06 19:28:07', 0, NULL),
(64, 2, 2, NULL, 'PS220260506223234', NULL, NULL, 10000.00, 0.00, 0.00, 10000.00, 10000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:32:34', NULL, NULL, '2026-05-06 19:32:34', '2026-05-06 19:32:34', 0, NULL),
(65, 2, 2, NULL, 'PS220260506223333', NULL, NULL, 1000.00, 0.00, 0.00, 1000.00, 1000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:33:33', NULL, NULL, '2026-05-06 19:33:33', '2026-05-06 19:33:33', 0, NULL),
(66, 2, 2, NULL, 'PS220260506223439', NULL, NULL, 4000.00, 0.00, 0.00, 4000.00, 4000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:34:39', NULL, NULL, '2026-05-06 19:34:39', '2026-05-06 19:34:39', 0, NULL),
(67, 2, 2, NULL, 'PS220260506223528', NULL, NULL, 4000.00, 0.00, 0.00, 4000.00, 4000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:35:28', NULL, NULL, '2026-05-06 19:35:28', '2026-05-06 19:35:28', 0, NULL),
(68, 2, 2, NULL, 'PS220260506223814', NULL, NULL, 8000.00, 0.00, 0.00, 8000.00, 8000.00, 0.00, 'cash', 'paid', NULL, 'completed', NULL, '2026-05-06 19:38:14', NULL, NULL, '2026-05-06 19:38:14', '2026-05-06 19:38:14', 0, NULL);

--
-- Triggers `sales`
--
DELIMITER $$
CREATE TRIGGER `update_customer_totals_after_sale` AFTER INSERT ON `sales` FOR EACH ROW BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
        UPDATE customers 
        SET total_purchases = total_purchases + NEW.total_amount,
            total_orders = total_orders + 1,
            last_purchase_date = NEW.sale_date,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.customer_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `sale_items`
--

CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL,
  `sale_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_barcode` varchar(100) DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `cost_price` decimal(12,2) DEFAULT NULL,
  `tax_rate` decimal(5,4) DEFAULT 0.0000,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sale_items`
--

INSERT INTO `sale_items` (`id`, `sale_id`, `product_id`, `product_name`, `product_barcode`, `quantity`, `unit_price`, `total_price`, `cost_price`, `tax_rate`, `discount_amount`, `created_at`) VALUES
(1, 1, 7, 'West Lake big', NULL, 2.00, 1000.00, 2000.00, 834.00, 0.0000, 0.00, '2026-04-26 16:28:36'),
(2, 2, 1, 'Kaswa', NULL, 3.00, 6700.00, 20100.00, 6250.00, 0.0000, 0.00, '2026-04-26 16:41:04'),
(3, 2, 2, 'Sunday', NULL, 1.00, 7500.00, 7500.00, 7084.00, 0.0000, 0.00, '2026-04-26 16:41:04'),
(4, 3, 1, 'Kaswa', NULL, 2.00, 6700.00, 13400.00, 6250.00, 0.0000, 0.00, '2026-04-26 16:42:05'),
(5, 3, 2, 'Sunday', NULL, 1.00, 7500.00, 7500.00, 7084.00, 0.0000, 0.00, '2026-04-26 16:42:05'),
(6, 4, 16, 'UFresh', NULL, 1.00, 500.00, 500.00, 417.00, 0.0000, 0.00, '2026-04-26 16:42:39'),
(9, 7, 1, 'Kaswa', NULL, 0.25, 4000.00, 1000.00, 6250.00, 0.0000, 0.00, '2026-04-26 18:06:40'),
(10, 8, 15, 'Clever', NULL, 1.00, 500.00, 500.00, 417.00, 0.0000, 0.00, '2026-04-26 18:15:20'),
(11, 9, 11, 'Oner', NULL, 1.00, 2500.00, 2500.00, 2084.00, 0.0000, 0.00, '2026-04-26 18:22:48'),
(12, 10, 10, 'Soda', NULL, 1.00, 1000.00, 1000.00, 834.00, 0.0000, 0.00, '2026-04-26 18:41:28'),
(13, 11, 10, 'Soda', NULL, 1.00, 1000.00, 1000.00, 834.00, 0.0000, 0.00, '2026-04-26 18:42:48'),
(14, 12, 10, 'Soda', NULL, 1.00, 1000.00, 1000.00, 834.00, 0.0000, 0.00, '2026-04-26 18:50:48'),
(15, 13, 10, 'Soda', NULL, 1.00, 1000.00, 1000.00, 834.00, 0.0000, 0.00, '2026-04-26 18:51:10'),
(16, 14, 10, 'Soda', NULL, 1.00, 1000.00, 1000.00, 834.00, 0.0000, 0.00, '2026-04-26 18:51:37'),
(17, 15, 11, 'Oner', NULL, 1.00, 2500.00, 2500.00, 2084.00, 0.0000, 0.00, '2026-04-26 18:56:54'),
(18, 16, 1, 'Kaswa', NULL, 0.25, 6700.00, 1675.00, 6250.00, 0.0000, 0.00, '2026-04-27 06:50:17'),
(19, 17, 1, 'Kaswa', NULL, 0.25, 4000.00, 1000.00, 6250.00, 0.0000, 0.00, '2026-04-27 07:27:14'),
(20, 18, 1, 'Kaswa', NULL, 6.00, 6700.00, 40200.00, 6250.00, 0.0000, 0.00, '2026-04-27 07:47:06'),
(21, 19, 1, 'Kaswa', NULL, 0.25, 8000.00, 2000.00, 6250.00, 0.0000, 0.00, '2026-04-27 07:48:32'),
(22, 20, 2, 'Sunday', NULL, 2.50, 7500.00, 18750.00, 7084.00, 0.0000, 0.00, '2026-04-27 08:01:30'),
(23, 21, 1, 'Kaswa', NULL, 3.00, 6700.00, 20100.00, 6250.00, 0.0000, 0.00, '2026-04-27 18:42:34'),
(24, 22, 1, 'Kaswa', NULL, 6.00, 6700.00, 40200.00, 6250.00, 0.0000, 0.00, '2026-04-27 18:47:51'),
(25, 22, 2, 'Sunday', NULL, 2.00, 7500.00, 15000.00, 7084.00, 0.0000, 0.00, '2026-04-27 18:47:51'),
(26, 22, 3, 'Sugar', NULL, 0.25, 4000.00, 1000.00, 3160.00, 0.0000, 0.00, '2026-04-27 18:47:51'),
(27, 22, 19, 'Salt', NULL, 1.00, 1000.00, 1000.00, 725.00, 0.0000, 0.00, '2026-04-27 18:47:51'),
(28, 23, 2, 'Sunday', NULL, 3.50, 7500.00, 26250.00, 7084.00, 0.0000, 0.00, '2026-04-27 18:53:49'),
(29, 24, 4, 'Soap', NULL, 0.75, 4000.00, 3000.00, 3400.00, 0.0000, 0.00, '2026-04-27 18:55:24'),
(30, 25, 3, 'Sugar', NULL, 1.00, 4000.00, 4000.00, 3160.00, 0.0000, 0.00, '2026-04-27 18:59:08'),
(31, 26, 3, 'Sugar', NULL, 4.50, 4000.00, 18000.00, 3160.00, 0.0000, 0.00, '2026-04-27 19:00:41'),
(32, 27, 20, 'Jesa Milk', NULL, 1.00, 2000.00, 2000.00, 1834.00, 0.0000, 0.00, '2026-04-27 19:04:19'),
(33, 28, 10, 'Soda', NULL, 1.00, 1000.00, 1000.00, 834.00, 0.0000, 0.00, '2026-04-27 19:05:52'),
(34, 29, 1, 'Kaswa', NULL, 3.00, 6700.00, 20100.00, 6250.00, 0.0000, 0.00, '2026-05-01 05:37:21'),
(35, 30, 1, 'Kaswa', NULL, 0.75, 8000.00, 6000.00, 6250.00, 0.0000, 0.00, '2026-05-01 05:40:11'),
(36, 31, 2, 'Sunday', NULL, 6.50, 7500.00, 48750.00, 7084.00, 0.0000, 0.00, '2026-05-01 05:45:15'),
(37, 32, 4, 'Soap', NULL, 2.25, 4000.00, 9000.00, 3400.00, 0.0000, 0.00, '2026-05-01 05:46:03'),
(38, 33, 3, 'Sugar', NULL, 1.00, 4000.00, 4000.00, 3160.00, 0.0000, 0.00, '2026-05-01 06:59:58'),
(39, 34, 21, 'Bread', NULL, 4.00, 500.00, 2000.00, 417.00, 0.0000, 0.00, '2026-05-01 07:35:42'),
(40, 35, 22, 'Water small', NULL, 1.00, 500.00, 500.00, 417.00, 0.0000, 0.00, '2026-05-01 07:47:09'),
(41, 36, 22, 'Water small', NULL, 1.00, 500.00, 500.00, 417.00, 0.0000, 0.00, '2026-05-01 07:49:39'),
(42, 37, 2, 'Sunday', NULL, 5.50, 7500.00, 41250.00, 7167.00, 0.0000, 0.00, '2026-05-01 08:48:14'),
(43, 38, 21, 'Bread', NULL, 1.00, 500.00, 500.00, 417.00, 0.0000, 0.00, '2026-05-01 09:14:27'),
(44, 39, 10, 'Soda', NULL, 1.00, 1000.00, 1000.00, 834.00, 0.0000, 0.00, '2026-05-01 09:22:48'),
(45, 40, 21, 'Bread', NULL, 1.00, 500.00, 500.00, 417.00, 0.0000, 0.00, '2026-05-01 09:28:37'),
(46, 41, 1, 'Kaswa', NULL, 2.00, 6700.00, 13400.00, 6292.00, 0.0000, 0.00, '2026-05-01 09:32:57'),
(47, 42, 1, 'Kaswa', NULL, 7.00, 6700.00, 46900.00, 6292.00, 0.0000, 0.00, '2026-05-01 09:39:46'),
(48, 43, 20, 'Jesa Milk', NULL, 1.00, 2000.00, 2000.00, 1834.00, 0.0000, 0.00, '2026-05-01 09:43:49'),
(49, 44, 20, 'Jesa Milk', NULL, 1.00, 2000.00, 2000.00, 1834.00, 0.0000, 0.00, '2026-05-01 09:45:26'),
(50, 45, 1, 'Kaswa', NULL, 3.00, 6700.00, 20100.00, 6292.00, 0.0000, 0.00, '2026-05-01 09:54:16'),
(51, 45, 2, 'Sunday', NULL, 1.00, 7500.00, 7500.00, 7167.00, 0.0000, 0.00, '2026-05-01 09:54:16'),
(52, 46, 3, 'Sugar', NULL, 0.25, 4000.00, 1000.00, 3160.00, 0.0000, 0.00, '2026-05-01 09:56:20'),
(53, 47, 3, 'Sugar', NULL, 0.25, 4000.00, 1000.00, 3160.00, 0.0000, 0.00, '2026-05-01 10:03:30'),
(54, 48, 1, 'Kaswa', NULL, 2.00, 6700.00, 13400.00, 6250.00, 0.0000, 0.00, '2026-05-01 12:44:19'),
(55, 48, 2, 'Sunday', NULL, 0.50, 7500.00, 3750.00, 7167.00, 0.0000, 0.00, '2026-05-01 12:44:19'),
(56, 49, 1, 'Kaswa', NULL, 3.00, 6700.00, 20100.00, 6250.00, 0.0000, 0.00, '2026-05-01 17:13:08'),
(57, 49, 2, 'Sunday', NULL, 0.50, 7500.00, 3750.00, 7167.00, 0.0000, 0.00, '2026-05-01 17:13:08'),
(58, 50, 1, 'Kaswa', NULL, 6.00, 6700.00, 40200.00, 6250.00, 0.0000, 0.00, '2026-05-01 18:44:09'),
(59, 50, 3, 'Sugar', NULL, 0.25, 4000.00, 1000.00, 3160.00, 0.0000, 0.00, '2026-05-01 18:44:09'),
(60, 50, 2, 'Sunday', NULL, 2.00, 7500.00, 15000.00, 7167.00, 0.0000, 0.00, '2026-05-01 18:44:09'),
(61, 50, 19, 'Salt', NULL, 1.00, 1000.00, 1000.00, 725.00, 0.0000, 0.00, '2026-05-01 18:44:09'),
(62, 51, 2, 'Sunday', NULL, 0.50, 7500.00, 3750.00, 7167.00, 0.0000, 0.00, '2026-05-01 18:49:23'),
(63, 52, 3, 'Sugar', NULL, 18.50, 4000.00, 74000.00, 3160.00, 0.0000, 0.00, '2026-05-06 12:17:12'),
(64, 53, 2, 'Sunday', NULL, 2.00, 7500.00, 15000.00, 7167.00, 0.0000, 0.00, '2026-05-06 17:58:23'),
(65, 54, 2, 'Sunday', NULL, 3.50, 7500.00, 26250.00, 7167.00, 0.0000, 0.00, '2026-05-06 18:15:37'),
(66, 54, 1, 'Kaswa', NULL, 8.00, 6700.00, 53600.00, 6250.00, 0.0000, 0.00, '2026-05-06 18:15:37'),
(67, 55, 1, 'Kaswa', NULL, 3.50, 6900.00, 24150.00, 6250.00, 0.0000, 0.00, '2026-05-06 18:18:30'),
(68, 56, 1, 'Kaswa', NULL, 1.00, 6700.00, 6700.00, 6250.00, 0.0000, 0.00, '2026-05-06 18:32:11'),
(69, 57, 1, 'Kaswa', NULL, 6.00, 6700.00, 40200.00, 6250.00, 0.0000, 0.00, '2026-05-06 18:42:02'),
(70, 58, 4, 'Soap', NULL, 2.00, 4000.00, 8000.00, 3400.00, 0.0000, 0.00, '2026-05-06 18:51:10'),
(71, 59, 2, 'Sunday', NULL, 5.50, 7500.00, 41250.00, 7167.00, 0.0000, 0.00, '2026-05-06 19:16:03'),
(72, 60, 20, 'Jesa Milk', NULL, 2.00, 2000.00, 4000.00, 1834.00, 0.0000, 0.00, '2026-05-06 19:23:55'),
(73, 61, 5, 'Rice', NULL, 1.50, 4000.00, 6000.00, 3500.00, 0.0000, 0.00, '2026-05-06 19:25:14'),
(74, 62, 3, 'Sugar', NULL, 3.25, 4000.00, 13000.00, 3080.00, 0.0000, 0.00, '2026-05-06 19:25:48'),
(75, 63, 1, 'Kaswa', NULL, 2.00, 6700.00, 13400.00, 6250.00, 0.0000, 0.00, '2026-05-06 19:28:07'),
(76, 63, 2, 'Sunday', NULL, 0.50, 7500.00, 3750.00, 7167.00, 0.0000, 0.00, '2026-05-06 19:28:07'),
(77, 64, 10, 'Soda', NULL, 10.00, 1000.00, 10000.00, 834.00, 0.0000, 0.00, '2026-05-06 19:32:34'),
(78, 65, 19, 'Salt', NULL, 1.00, 1000.00, 1000.00, 725.00, 0.0000, 0.00, '2026-05-06 19:33:33'),
(79, 66, 20, 'Jesa Milk', NULL, 2.00, 2000.00, 4000.00, 1834.00, 0.0000, 0.00, '2026-05-06 19:34:39'),
(80, 67, 7, 'West Lake big', NULL, 4.00, 1000.00, 4000.00, 834.00, 0.0000, 0.00, '2026-05-06 19:35:28'),
(81, 68, 22, 'Water small', NULL, 7.00, 500.00, 3500.00, 417.00, 0.0000, 0.00, '2026-05-06 19:38:14'),
(82, 68, 11, 'Oner', NULL, 1.00, 2500.00, 2500.00, 2084.00, 0.0000, 0.00, '2026-05-06 19:38:14'),
(83, 68, 14, 'Jema Bushera', NULL, 2.00, 1000.00, 2000.00, 834.00, 0.0000, 0.00, '2026-05-06 19:38:14');

--
-- Triggers `sale_items`
--
DELIMITER $$
CREATE TRIGGER `update_product_stock_after_sale` AFTER INSERT ON `sale_items` FOR EACH ROW BEGIN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.product_id;
    
    -- Insert inventory movement record
    INSERT INTO inventory_movements (
        business_id, product_id, movement_type, quantity_change, 
        stock_before, stock_after, reference_id, reference_type, created_by
    )
    SELECT 
        p.business_id, NEW.product_id, 'sale', -NEW.quantity,
        p.current_stock + NEW.quantity, p.current_stock - NEW.quantity,
        (SELECT sale_id FROM sale_items WHERE id = NEW.id),
        'sale',
        (SELECT employee_id FROM sales WHERE id = (SELECT sale_id FROM sale_items WHERE id = NEW.id))
    FROM products p WHERE p.id = NEW.product_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `staff_members`
--

CREATE TABLE `staff_members` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('cashier','manager','admin') DEFAULT 'cashier',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Triggers `staff_members`
--
DELIMITER $$
CREATE TRIGGER `seed_default_staff_permissions` AFTER INSERT ON `staff_members` FOR EACH ROW BEGIN
    -- Cashier permissions
    IF NEW.role = 'cashier' THEN
        INSERT INTO staff_permissions (staff_id, permission_name, is_granted)
        VALUES 
        (NEW.id, 'canManageInventory', 1),
        (NEW.id, 'canViewReports', 0),
        (NEW.id, 'canManageEmployees', 0),
        (NEW.id, 'canManageSettings', 0),
        (NEW.id, 'canUseAPI', 0),
        (NEW.id, 'prioritySupport', 0);
    -- Manager permissions
    ELSEIF NEW.role = 'manager' THEN
        INSERT INTO staff_permissions (staff_id, permission_name, is_granted)
        VALUES 
        (NEW.id, 'canManageInventory', 1),
        (NEW.id, 'canViewReports', 1),
        (NEW.id, 'canManageEmployees', 1),
        (NEW.id, 'canManageSettings', 0),
        (NEW.id, 'canUseAPI', 0),
        (NEW.id, 'prioritySupport', 0);
    -- Admin permissions
    ELSEIF NEW.role = 'admin' THEN
        INSERT INTO staff_permissions (staff_id, permission_name, is_granted)
        VALUES 
        (NEW.id, 'canManageInventory', 1),
        (NEW.id, 'canViewReports', 1),
        (NEW.id, 'canManageEmployees', 1),
        (NEW.id, 'canManageSettings', 1),
        (NEW.id, 'canUseAPI', 1),
        (NEW.id, 'prioritySupport', 0);
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `staff_permissions`
--

CREATE TABLE `staff_permissions` (
  `id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `permission_name` varchar(50) NOT NULL,
  `is_granted` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_records`
--

CREATE TABLE `stock_records` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity_change` decimal(10,2) NOT NULL,
  `previous_quantity` decimal(10,2) NOT NULL,
  `new_quantity` decimal(10,2) NOT NULL,
  `change_type` enum('restock','sale','adjustment','return','damage','expiry') NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `performed_by` int(11) NOT NULL,
  `reference_id` int(11) DEFAULT NULL COMMENT 'Reference to sale_id or other related record',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `stock_records`
--

INSERT INTO `stock_records` (`id`, `business_id`, `product_id`, `quantity_change`, `previous_quantity`, `new_quantity`, `change_type`, `reason`, `performed_by`, `reference_id`, `created_at`) VALUES
(1, 2, 1, 12.00, 0.75, 12.75, 'restock', 'Restock', 2, NULL, '2026-04-27 18:32:39'),
(2, 2, 11, 12.00, 2.00, 14.00, 'restock', 'Onner apple', 2, NULL, '2026-04-27 18:33:11'),
(3, 2, 3, 25.00, 1.00, 26.00, 'restock', 'Mayuuge sugar', 2, NULL, '2026-04-27 18:34:25'),
(4, 2, 2, 12.00, 0.00, 12.00, 'restock', 'Sunday oil', 2, NULL, '2026-04-27 18:38:56'),
(5, 2, 10, 12.00, 51.00, 63.00, 'restock', 'Soda mountain due', 2, NULL, '2026-04-27 18:39:37'),
(6, 2, 7, 6.00, 4.00, 10.00, 'restock', 'Restock water', 2, NULL, '2026-04-27 18:40:18'),
(7, 2, 1, 12.00, 0.00, 12.00, 'restock', 'Restocking', 2, NULL, '2026-05-01 06:37:03'),
(8, 2, 2, 12.00, 0.00, 12.00, 'restock', NULL, 2, NULL, '2026-05-01 06:38:48'),
(9, 2, 1, 12.00, 0.00, 12.00, 'restock', NULL, 2, NULL, '2026-05-01 10:10:36'),
(10, 2, 22, 12.00, 13.00, 25.00, 'restock', NULL, 2, NULL, '2026-05-01 10:10:56'),
(11, 2, 1, 12.00, 10.00, 22.00, 'restock', NULL, 2, NULL, '2026-05-01 13:28:36'),
(12, 2, 1, 12.00, 7.00, 19.00, 'restock', 'Restock', 2, NULL, '2026-05-01 18:40:58'),
(13, 2, 30, 96.00, 0.00, 96.00, 'restock', NULL, 2, NULL, '2026-05-06 12:39:04'),
(14, 2, 29, 5.00, 0.00, 5.00, 'restock', NULL, 2, NULL, '2026-05-06 12:39:17'),
(15, 2, 20, 12.00, 9.00, 21.00, 'restock', NULL, 2, NULL, '2026-05-06 12:39:36'),
(16, 2, 3, 25.00, 0.00, 25.00, 'restock', NULL, 2, NULL, '2026-05-06 12:40:44'),
(17, 2, 2, 12.00, 0.00, 12.00, 'restock', NULL, 2, NULL, '2026-05-06 18:04:33'),
(18, 2, 1, 12.00, 0.50, 12.50, 'restock', NULL, 2, NULL, '2026-05-06 18:33:39');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `plan_id` varchar(50) NOT NULL,
  `status` enum('active','cancelled','expired','suspended') DEFAULT 'active',
  `started_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `auto_renew` tinyint(1) DEFAULT 1,
  `payment_method` varchar(50) DEFAULT NULL,
  `last_payment_date` timestamp NULL DEFAULT NULL,
  `next_payment_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_payments`
--

CREATE TABLE `subscription_payments` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'UGX',
  `payment_method` enum('mobile_money','card','bank_transfer','cash') DEFAULT 'mobile_money',
  `payment_status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `transaction_id` varchar(100) DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` int(11) NOT NULL,
  `plan_name` varchar(100) NOT NULL,
  `plan_code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'UGX',
  `billing_cycle` enum('monthly','yearly') DEFAULT 'monthly',
  `trial_days` int(11) DEFAULT 0,
  `max_users` int(11) DEFAULT 1,
  `max_products` int(11) DEFAULT 100,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `plan_name`, `plan_code`, `description`, `price`, `currency`, `billing_cycle`, `trial_days`, `max_users`, `max_products`, `features`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Free Trial', 'free_trial', 'Try ProfSale for free', 0.00, 'UGX', 'monthly', 60, -1, 50, '{\"canViewReports\": true, \"canManageInventory\": true, \"canManageEmployees\": false, \"canManageSettings\": false}', 1, '2026-04-26 14:22:32', '2026-04-26 14:22:32'),
(2, 'Basic', 'basic', '50 items plan', 5000.00, 'UGX', 'monthly', 0, -1, 50, '{\"canViewReports\": true, \"canManageInventory\": true, \"canManageEmployees\": false, \"canManageSettings\": false}', 1, '2026-04-26 14:22:32', '2026-04-26 14:22:32'),
(3, 'Standard', 'standard', '80 items plan', 7500.00, 'UGX', 'monthly', 0, -1, 80, '{\"canViewReports\": true, \"canManageInventory\": true, \"canManageEmployees\": true, \"canManageSettings\": true}', 1, '2026-04-26 14:22:32', '2026-04-26 14:22:32'),
(4, 'Premium', 'premium', '120 items plan', 10000.00, 'UGX', 'monthly', 0, -1, 120, '{\"canViewReports\": true, \"canManageInventory\": true, \"canManageEmployees\": true, \"canManageSettings\": true, \"canUseAPI\": true}', 1, '2026-04-26 14:22:32', '2026-04-26 14:22:32'),
(5, 'Enterprise', 'enterprise', '200 items plan', 15000.00, 'UGX', 'monthly', 0, -1, 200, '{\"canViewReports\": true, \"canManageInventory\": true, \"canManageEmployees\": true, \"canManageSettings\": true, \"canUseAPI\": true, \"prioritySupport\": true}', 1, '2026-04-26 14:22:32', '2026-04-26 14:22:32');

-- --------------------------------------------------------

--
-- Table structure for table `sync_conflicts`
--

CREATE TABLE `sync_conflicts` (
  `id` int(11) NOT NULL,
  `conflict_id` varchar(255) NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `entity_type` varchar(50) NOT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `resolution` enum('pending','resolved','ignored') DEFAULT 'pending',
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_devices`
--

CREATE TABLE `sync_devices` (
  `id` int(11) NOT NULL,
  `device_id` varchar(255) NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `device_name` varchar(255) DEFAULT NULL,
  `device_type` varchar(50) DEFAULT NULL,
  `last_sync` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_logs`
--

CREATE TABLE `sync_logs` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `table_name` varchar(100) NOT NULL,
  `operation` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `local_id` varchar(100) DEFAULT NULL,
  `server_id` int(11) DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `status` enum('pending','synced','conflict','failed') DEFAULT 'pending',
  `conflict_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`conflict_data`)),
  `error_message` text DEFAULT NULL,
  `sync_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tax_configurations`
--

CREATE TABLE `tax_configurations` (
  `id` int(11) NOT NULL,
  `business_id` int(11) NOT NULL,
  `tax_name` varchar(100) NOT NULL,
  `tax_rate` decimal(5,2) NOT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `phone`, `email`, `first_name`, `last_name`, `password_hash`, `profile_image`, `is_verified`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(2, '0709481515', 'kgeorgewilliam60@gmail.com', 'Mukera', 'Reachal', '$2b$10$WJGwNATpkuFtBQruYfTEjuZ4qrz4vlLEHh/YJmmC54aUb8TR07n2O', NULL, 0, 1, NULL, '2026-04-26 15:52:22', '2026-05-06 17:57:14');

-- --------------------------------------------------------

--
-- Structure for view `daily_sales_summary`
--
DROP TABLE IF EXISTS `daily_sales_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `daily_sales_summary`  AS SELECT `sales`.`business_id` AS `business_id`, cast(`sales`.`sale_date` as date) AS `sale_date`, count(0) AS `transaction_count`, sum(`sales`.`total_amount`) AS `total_revenue`, avg(`sales`.`total_amount`) AS `avg_transaction_value`, count(distinct `sales`.`customer_id`) AS `unique_customers` FROM `sales` WHERE `sales`.`status` = 'completed' GROUP BY `sales`.`business_id`, cast(`sales`.`sale_date` as date) ;

-- --------------------------------------------------------

--
-- Structure for view `monthly_business_metrics`
--
DROP TABLE IF EXISTS `monthly_business_metrics`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `monthly_business_metrics`  AS SELECT `s`.`business_id` AS `business_id`, year(`s`.`sale_date`) AS `year`, month(`s`.`sale_date`) AS `month`, count(0) AS `total_sales`, sum(`s`.`total_amount`) AS `total_revenue`, sum(`s`.`total_amount` - `s`.`tax_amount` - `s`.`discount_amount`) AS `net_revenue`, count(distinct `s`.`customer_id`) AS `unique_customers`, avg(`s`.`total_amount`) AS `avg_order_value` FROM `sales` AS `s` WHERE `s`.`status` = 'completed' GROUP BY `s`.`business_id`, year(`s`.`sale_date`), month(`s`.`sale_date`) ;

-- --------------------------------------------------------

--
-- Structure for view `product_stock_status`
--
DROP TABLE IF EXISTS `product_stock_status`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `product_stock_status`  AS SELECT `p`.`id` AS `id`, `p`.`business_id` AS `business_id`, `p`.`name` AS `name`, `p`.`current_stock` AS `current_stock`, `p`.`min_stock_level` AS `min_stock_level`, CASE WHEN `p`.`current_stock` <= 0 THEN 'out_of_stock' WHEN `p`.`current_stock` <= `p`.`min_stock_level` THEN 'low_stock' ELSE 'normal' END AS `stock_status`, round((`p`.`selling_price` - `p`.`buying_price`) / `p`.`buying_price` * 100,2) AS `profit_margin` FROM `products` AS `p` WHERE `p`.`is_active` = 1 ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_staff_id` (`staff_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `businesses`
--
ALTER TABLE `businesses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_businesses_owner` (`owner_id`),
  ADD KEY `idx_businesses_active` (`is_active`);

--
-- Indexes for table `business_settings`
--
ALTER TABLE `business_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_business_setting` (`business_id`,`setting_key`),
  ADD KEY `idx_business_id` (`business_id`);

--
-- Indexes for table `business_subscriptions`
--
ALTER TABLE `business_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_business_subscription` (`business_id`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_plan_id` (`plan_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_trial_ends_at` (`trial_ends_at`),
  ADD KEY `idx_current_period_end` (`current_period_end`);

--
-- Indexes for table `business_users`
--
ALTER TABLE `business_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_business_user` (`business_id`,`user_id`),
  ADD KEY `idx_business_users_business` (`business_id`),
  ADD KEY `idx_business_users_user` (`user_id`),
  ADD KEY `idx_business_users_role` (`role`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_categories_business` (`business_id`),
  ADD KEY `idx_categories_parent` (`parent_id`),
  ADD KEY `idx_categories_active` (`is_active`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customers_business` (`business_id`),
  ADD KEY `idx_customers_phone` (`phone`),
  ADD KEY `idx_customers_email` (`email`),
  ADD KEY `idx_customers_type` (`customer_type`);
ALTER TABLE `customers` ADD FULLTEXT KEY `idx_customers_search` (`name`,`phone`,`email`);

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_expenses_business_date` (`business_id`,`expense_date`),
  ADD KEY `idx_expenses_category` (`category`),
  ADD KEY `idx_expenses_payment_method` (`payment_method`);

--
-- Indexes for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_inventory_movements_product_date` (`product_id`,`movement_date`),
  ADD KEY `idx_inventory_movements_business` (`business_id`),
  ADD KEY `idx_inventory_movements_type` (`movement_type`),
  ADD KEY `idx_inventory_movements_reference` (`reference_type`,`reference_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_notifications_business_user` (`business_id`,`user_id`),
  ADD KEY `idx_notifications_type` (`type`),
  ADD KEY `idx_notifications_read` (`is_read`),
  ADD KEY `idx_notifications_created` (`created_at`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_reset` (`user_id`),
  ADD KEY `idx_reset_code` (`reset_code`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Indexes for table `payment_records`
--
ALTER TABLE `payment_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_sale_id` (`sale_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `idx_products_business_active` (`business_id`,`is_active`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_barcode` (`barcode`),
  ADD KEY `idx_products_name` (`name`),
  ADD KEY `idx_products_stock_level` (`current_stock`,`min_stock_level`);
ALTER TABLE `products` ADD FULLTEXT KEY `idx_products_search` (`name`,`description`);

--
-- Indexes for table `receipt_templates`
--
ALTER TABLE `receipt_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_receipt_templates_business` (`business_id`);

--
-- Indexes for table `refunds`
--
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `refund_number` (`refund_number`),
  ADD KEY `refunded_by` (`refunded_by`),
  ADD KEY `idx_refunds_business` (`business_id`),
  ADD KEY `idx_refunds_sale` (`sale_id`),
  ADD KEY `idx_refunds_date` (`refund_date`),
  ADD KEY `idx_refunds_number` (`refund_number`);

--
-- Indexes for table `sales`
--
ALTER TABLE `sales`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sale_number` (`sale_number`),
  ADD KEY `idx_sales_business_date` (`business_id`,`sale_date`),
  ADD KEY `idx_sales_employee` (`employee_id`),
  ADD KEY `idx_sales_customer` (`customer_id`),
  ADD KEY `idx_sales_status` (`status`),
  ADD KEY `idx_sales_payment_method` (`payment_method`),
  ADD KEY `idx_sales_payment_status` (`payment_status`),
  ADD KEY `idx_sales_number` (`sale_number`),
  ADD KEY `idx_sales_opening_balance` (`is_opening_balance`);

--
-- Indexes for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale_items_sale` (`sale_id`),
  ADD KEY `idx_sale_items_product` (`product_id`);

--
-- Indexes for table `staff_members`
--
ALTER TABLE `staff_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `staff_permissions`
--
ALTER TABLE `staff_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_staff_permission` (`staff_id`,`permission_name`),
  ADD KEY `idx_staff_id` (`staff_id`);

--
-- Indexes for table `stock_records`
--
ALTER TABLE `stock_records`
  ADD PRIMARY KEY (`id`),
  ADD KEY `performed_by` (`performed_by`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_product_id` (`product_id`),
  ADD KEY `idx_change_type` (`change_type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subscriptions_business` (`business_id`),
  ADD KEY `idx_subscriptions_status` (`status`),
  ADD KEY `idx_subscriptions_expires` (`expires_at`);

--
-- Indexes for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_subscription_id` (`subscription_id`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_payment_date` (`payment_date`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plan_code` (`plan_code`),
  ADD KEY `idx_plan_code` (`plan_code`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `sync_conflicts`
--
ALTER TABLE `sync_conflicts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_resolution` (`resolution`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `sync_devices`
--
ALTER TABLE `sync_devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_device` (`device_id`,`business_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_last_sync` (`last_sync`);

--
-- Indexes for table `sync_logs`
--
ALTER TABLE `sync_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_logs_business_status` (`business_id`,`status`),
  ADD KEY `idx_sync_logs_user` (`user_id`),
  ADD KEY `idx_sync_logs_table` (`table_name`),
  ADD KEY `idx_sync_logs_timestamp` (`sync_timestamp`);

--
-- Indexes for table `tax_configurations`
--
ALTER TABLE `tax_configurations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_business_id` (`business_id`),
  ADD KEY `idx_is_default` (`is_default`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_phone` (`phone`),
  ADD KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `businesses`
--
ALTER TABLE `businesses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `business_settings`
--
ALTER TABLE `business_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `business_subscriptions`
--
ALTER TABLE `business_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `business_users`
--
ALTER TABLE `business_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=99;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_records`
--
ALTER TABLE `payment_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `receipt_templates`
--
ALTER TABLE `receipt_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `refunds`
--
ALTER TABLE `refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `sales`
--
ALTER TABLE `sales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `sale_items`
--
ALTER TABLE `sale_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT for table `staff_members`
--
ALTER TABLE `staff_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `staff_permissions`
--
ALTER TABLE `staff_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_records`
--
ALTER TABLE `stock_records`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sync_conflicts`
--
ALTER TABLE `sync_conflicts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_devices`
--
ALTER TABLE `sync_devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_logs`
--
ALTER TABLE `sync_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tax_configurations`
--
ALTER TABLE `tax_configurations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `staff_members` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `businesses`
--
ALTER TABLE `businesses`
  ADD CONSTRAINT `businesses_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `business_settings`
--
ALTER TABLE `business_settings`
  ADD CONSTRAINT `business_settings_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `business_subscriptions`
--
ALTER TABLE `business_subscriptions`
  ADD CONSTRAINT `business_subscriptions_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `business_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`);

--
-- Constraints for table `business_users`
--
ALTER TABLE `business_users`
  ADD CONSTRAINT `business_users_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `business_users_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `categories_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `customers`
--
ALTER TABLE `customers`
  ADD CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `expenses`
--
ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expenses_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `inventory_movements`
--
ALTER TABLE `inventory_movements`
  ADD CONSTRAINT `inventory_movements_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_movements_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_movements_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payment_records`
--
ALTER TABLE `payment_records`
  ADD CONSTRAINT `payment_records_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_records_ibfk_2` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `payment_records_ibfk_3` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `products_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `products_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `receipt_templates`
--
ALTER TABLE `receipt_templates`
  ADD CONSTRAINT `receipt_templates_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `refunds`
--
ALTER TABLE `refunds`
  ADD CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_2` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `refunds_ibfk_3` FOREIGN KEY (`refunded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `sales`
--
ALTER TABLE `sales`
  ADD CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sales_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `sales_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sale_items`
--
ALTER TABLE `sale_items`
  ADD CONSTRAINT `sale_items_ibfk_1` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sale_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `staff_members`
--
ALTER TABLE `staff_members`
  ADD CONSTRAINT `staff_members_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff_permissions`
--
ALTER TABLE `staff_permissions`
  ADD CONSTRAINT `staff_permissions_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff_members` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_records`
--
ALTER TABLE `stock_records`
  ADD CONSTRAINT `stock_records_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_records_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_records_ibfk_3` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `subscription_payments`
--
ALTER TABLE `subscription_payments`
  ADD CONSTRAINT `subscription_payments_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payments_ibfk_2` FOREIGN KEY (`subscription_id`) REFERENCES `business_subscriptions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `subscription_payments_ibfk_3` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`);

--
-- Constraints for table `sync_conflicts`
--
ALTER TABLE `sync_conflicts`
  ADD CONSTRAINT `sync_conflicts_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sync_conflicts_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sync_devices`
--
ALTER TABLE `sync_devices`
  ADD CONSTRAINT `sync_devices_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sync_devices_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `sync_logs`
--
ALTER TABLE `sync_logs`
  ADD CONSTRAINT `sync_logs_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sync_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tax_configurations`
--
ALTER TABLE `tax_configurations`
  ADD CONSTRAINT `tax_configurations_ibfk_1` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
