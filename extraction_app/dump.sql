CREATE DATABASE IF NOT EXISTS `extraction_app` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `extraction_app`;
-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: extraction_app
-- ------------------------------------------------------
-- Server version	8.0.19

/*!40101 SET @OLD_CHARACTER_SET_CLIENT = @@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS = @@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION = @@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE = @@TIME_ZONE */;
/*!40103 SET TIME_ZONE = '+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS = @@UNIQUE_CHECKS, UNIQUE_CHECKS = 0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS = 0 */;
/*!40101 SET @OLD_SQL_MODE = @@SQL_MODE, SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES = @@SQL_NOTES, SQL_NOTES = 0 */;

--
-- Table structure for table `pdf_tables`
--

DROP TABLE IF EXISTS `pdf_tables`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pdf_tables`
(
    `uuid`           varchar(36) NOT NULL,
    `fileId`         int         NOT NULL,
    `page`           int         NOT NULL,
    `pageWidth`      int         NOT NULL,
    `pageHeight`     int         NOT NULL,
    `x1`             int         NOT NULL,
    `y1`             int         NOT NULL,
    `x2`             int         NOT NULL,
    `y2`             int         NOT NULL,
    `result`         varchar(45) DEFAULT NULL,
    `tableTitle`     mediumtext  NOT NULL,
    `continuationOf` varchar(36) DEFAULT NULL,
    `pdfWidth`       int         DEFAULT NULL,
    `pdfHeight`      int         DEFAULT NULL,
    `pdfX1`          int         DEFAULT NULL,
    `pdfX2`          int         DEFAULT NULL,
    `pdfY1`          int         DEFAULT NULL,
    `pdfY2`          int         DEFAULT NULL,
    PRIMARY KEY (`uuid`),
    UNIQUE KEY `uuid_UNIQUE` (`uuid`),
    KEY `table_is_continuation_of_other_table_idx` (`continuationOf`),
    KEY `by_pdf_id_and_page` (`fileId`, `page`),
    CONSTRAINT `table_is_continuation_of_other_table` FOREIGN KEY (`continuationOf`) REFERENCES `pdf_tables` (`uuid`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `x_csvs`
--

DROP TABLE IF EXISTS `x_csvs`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `x_csvs`
(
    `csvName`     varchar(255) NOT NULL,
    `tableName`   varchar(255) NOT NULL,
    `page`        int          NOT NULL,
    `fileId`      int          NOT NULL,
    `tableNumber` int          NOT NULL,
    `project`     text         NOT NULL,
    `result`      varchar(255) DEFAULT NULL,
    PRIMARY KEY (`csvName`),
    UNIQUE KEY `csvName_UNIQUE` (`csvName`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `x_pdfs`
--

DROP TABLE IF EXISTS `x_pdfs`;
/*!40101 SET @saved_cs_client = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `x_pdfs`
(
    `fileId`                  int NOT NULL,
    `totalPages`              int         DEFAULT NULL,
    `pagesWithWordTable`      json        DEFAULT NULL,
    `totalPagesWithWordTable` int         DEFAULT NULL,
    `extractedImages`         int         DEFAULT NULL,
    `x_pdfscol`               varchar(45) DEFAULT NULL,
    PRIMARY KEY (`fileId`),
    UNIQUE KEY `fileId_UNIQUE` (`fileId`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE = @OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE = @OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS = @OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT = @OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS = @OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION = @OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES = @OLD_SQL_NOTES */;

-- Dump completed on 2020-03-09 20:11:21
