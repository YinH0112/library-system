-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: library_system
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `book`
--

DROP TABLE IF EXISTS `book`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '图书ID',
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT '书名',
  `author` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '作者',
  `price` decimal(10,2) DEFAULT NULL COMMENT '价格',
  `publisher` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '出版社',
  `isbn` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'ISBN',
  `category_id` int DEFAULT NULL COMMENT '分类ID',
  `total_stock` int NOT NULL DEFAULT '1' COMMENT '总馆藏数',
  `stock` int NOT NULL DEFAULT '1' COMMENT '可借库存',
  `publish_date` date DEFAULT NULL COMMENT '出版日期',
  `description` text COLLATE utf8mb4_general_ci COMMENT '简介',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '入藏时间',
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='图书信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book`
--

LOCK TABLES `book` WRITE;
/*!40000 ALTER TABLE `book` DISABLE KEYS */;
INSERT INTO `book` VALUES (1,'Java核心技术 卷I','Cay S. Horstmann',119.00,'机械工业出版社','9787111111111',1,3,3,'2020-01-01','Java入门经典','2026-07-04 13:41:31'),(2,'Spring实战','Craig Walls',99.00,'人民邮电出版社','9787111222222',1,2,1,'2019-06-01','Spring框架实战指南','2026-07-04 13:41:31'),(3,'深入理解Java虚拟机','周志明',129.00,'机械工业出版社','9787111333333',1,2,1,'2019-12-01','JVM深度剖析','2026-07-04 13:41:31'),(4,'Vue.js设计与实现','霍春阳',89.00,'人民邮电出版社','9787111444444',1,1,0,'2022-03-01','Vue3源码解析','2026-07-04 13:41:31'),(5,'MySQL必知必会','Ben Forta',39.00,'人民邮电出版社','9787111555555',1,2,0,'2020-09-01','SQL入门简明教程','2026-07-04 13:41:31'),(6,'百年孤独','加西亚·马尔克斯',59.00,'南海出版公司','9787544291170',2,2,1,'2017-06-01','魔幻现实主义代表作','2026-07-04 13:41:31'),(7,'人类简史','尤瓦尔·赫拉利',68.00,'中信出版社','9787508647357',3,2,1,'2014-11-01','从动物到上帝','2026-07-04 13:41:31'),(8,'西游记','吴承恩',100.00,'大明嘉靖出版社','123452354',2,3,2,'1640-07-04','一饮一啄 莫非前定','2026-07-04 15:23:09'),(9,'道德经','老子',0.00,'先秦诸子出版社','498234534985',4,1,1,'0001-01-01','道可道，非常道','2026-07-06 11:01:55');
/*!40000 ALTER TABLE `book` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrow`
--

DROP TABLE IF EXISTS `borrow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrow` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '借阅ID',
  `book_id` int NOT NULL COMMENT '图书ID',
  `reader_id` int NOT NULL COMMENT '读者ID',
  `borrow_date` date NOT NULL COMMENT '借出日期',
  `due_date` date NOT NULL COMMENT '应还日期',
  `return_date` date DEFAULT NULL COMMENT '实际归还日期(NULL表示未还)',
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'BORROWED' COMMENT '状态: BORROWED/RETURNED/OVERDUE',
  `fine` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '罚款金额',
  `remark` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  KEY `reader_id` (`reader_id`),
  CONSTRAINT `borrow_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`),
  CONSTRAINT `borrow_ibfk_2` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='借阅记录表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow`
--

LOCK TABLES `borrow` WRITE;
/*!40000 ALTER TABLE `borrow` DISABLE KEYS */;
INSERT INTO `borrow` VALUES (1,1,1,'2026-06-01','2026-06-30','2026-07-04','RETURNED',4.00,NULL),(2,3,2,'2026-05-15','2026-06-14',NULL,'OVERDUE',5.00,NULL),(3,4,1,'2026-05-01','2026-05-31','2026-05-20','RETURNED',0.00,NULL),(4,2,1,'2026-07-04','2026-08-03',NULL,'BORROWED',0.00,NULL),(5,6,2,'2026-07-04','2026-08-03',NULL,'BORROWED',0.00,NULL),(6,5,1,'2026-07-04','2026-08-03',NULL,'BORROWED',0.00,NULL),(7,9,4,'2026-07-06','2026-08-05','2026-07-06','RETURNED',0.00,NULL),(8,8,4,'2026-07-06','2026-08-05',NULL,'BORROWED',0.00,NULL),(9,5,4,'2026-07-09','2026-07-23',NULL,'BORROWED',0.00,NULL);
/*!40000 ALTER TABLE `borrow` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `borrow_request`
--

DROP TABLE IF EXISTS `borrow_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrow_request` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '申请ID',
  `book_id` int NOT NULL COMMENT '图书ID',
  `reader_id` int NOT NULL COMMENT '读者ID',
  `request_date` date NOT NULL COMMENT '申请日期',
  `due_days` int NOT NULL DEFAULT '30' COMMENT '申请借阅天数',
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING/APPROVED/REJECTED/CANCELLED',
  `approve_date` date DEFAULT NULL COMMENT '审批日期',
  `admin_id` int DEFAULT NULL COMMENT '审批管理员ID',
  `admin_remark` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '管理员备注',
  `reader_remark` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '借阅者备注',
  `borrow_id` int DEFAULT NULL COMMENT '审批通过后生成的借阅记录ID',
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  KEY `reader_id` (`reader_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `borrow_request_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`),
  CONSTRAINT `borrow_request_ibfk_2` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`),
  CONSTRAINT `borrow_request_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='借阅申请表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `borrow_request`
--

LOCK TABLES `borrow_request` WRITE;
/*!40000 ALTER TABLE `borrow_request` DISABLE KEYS */;
INSERT INTO `borrow_request` VALUES (1,5,1,'2026-07-04',30,'APPROVED','2026-07-04',1,'通过','??SQL??',6),(2,8,4,'2026-07-06',30,'APPROVED','2026-07-06',1,NULL,'',8),(3,9,4,'2026-07-06',30,'APPROVED','2026-07-06',1,NULL,'',7),(4,4,4,'2026-07-06',30,'REJECTED','2026-07-06',1,'库存不足,自动拒绝:','',NULL),(5,5,4,'2026-07-09',14,'APPROVED','2026-07-09',1,'同意','cnm',9),(6,1,4,'2026-07-09',14,'REJECTED','2026-07-09',11,'不给看\n',NULL,NULL);
/*!40000 ALTER TABLE `borrow_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '分类名',
  `description` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '描述',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='图书分类表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'计算机科学','Computer Science','2026-07-04 13:41:31'),(2,'文学','Literature','2026-07-04 13:41:31'),(3,'历史','History','2026-07-04 13:41:31'),(4,'哲学','Philosophy','2026-07-04 13:41:31');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notice`
--

DROP TABLE IF EXISTS `notice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notice` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `title` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT '标题',
  `content` text COLLATE utf8mb4_general_ci NOT NULL COMMENT '正文',
  `type` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'NOTICE' COMMENT '类型: NOTICE/ANNOUNCEMENT/MAINTENANCE',
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'PUBLISHED' COMMENT '状态: DRAFT/PUBLISHED/ARCHIVED',
  `publisher_id` int DEFAULT NULL COMMENT '发布者(管理员)ID',
  `publish_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
  `pinned` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否置顶',
  PRIMARY KEY (`id`),
  KEY `publisher_id` (`publisher_id`),
  CONSTRAINT `notice_ibfk_1` FOREIGN KEY (`publisher_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='公告通知表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notice`
--

LOCK TABLES `notice` WRITE;
/*!40000 ALTER TABLE `notice` DISABLE KEYS */;
INSERT INTO `notice` VALUES (1,'欢迎使用图书馆管理系统','欢迎使用 LIBRARY//OS v0.4!新版本已上线借阅申请、公告通知、图书评价等功能,欢迎体验。','ANNOUNCEMENT','PUBLISHED',1,'2026-07-04 09:00:00',1),(2,'借阅规则更新通知','自2026年7月起,每位读者最多可同时借阅5本图书,单本借期最长90天,逾期将产生每日1元罚款。','NOTICE','PUBLISHED',1,'2026-07-03 10:00:00',0),(3,'系统维护预告','本周日凌晨2:00-4:00 系统将进行例行维护,期间可能短暂无法访问,请提前安排。','MAINTENANCE','PUBLISHED',1,'2026-07-02 14:00:00',0),(4,'????','???????','NOTICE','PUBLISHED',1,'2026-07-04 23:20:34',0);
/*!40000 ALTER TABLE `notice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reader`
--

DROP TABLE IF EXISTS `reader`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reader` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '读者ID',
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '姓名',
  `student_id` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '学号/工号',
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '电话',
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '邮箱',
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/SUSPENDED',
  `register_date` date NOT NULL COMMENT '注册日期',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='读者信息表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reader`
--

LOCK TABLES `reader` WRITE;
/*!40000 ALTER TABLE `reader` DISABLE KEYS */;
INSERT INTO `reader` VALUES (1,'张三','S2021001','13800138001','zhangsan@example.com','ACTIVE','2021-09-01','2026-07-04 13:41:31'),(2,'李四','S2021002','13800138002','lisi@example.com','ACTIVE','2021-09-01','2026-07-04 13:41:31'),(3,'王五','S2021003','13800138003','wangwu@example.com','SUSPENDED','2022-03-15','2026-07-04 13:41:31'),(4,'yy','49','911','1','ACTIVE','2026-06-30','2026-07-04 23:27:57'),(6,'YinH','2022234060602','','','ACTIVE','2026-07-09','2026-07-09 18:39:34');
/*!40000 ALTER TABLE `reader` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `book_id` int NOT NULL COMMENT '图书ID',
  `reader_id` int NOT NULL COMMENT '读者ID',
  `rating` int NOT NULL COMMENT '评分1-5',
  `content` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '评价内容',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  KEY `reader_id` (`reader_id`),
  CONSTRAINT `review_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`) ON DELETE CASCADE,
  CONSTRAINT `review_ibfk_2` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='图书评价表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review`
--

LOCK TABLES `review` WRITE;
/*!40000 ALTER TABLE `review` DISABLE KEYS */;
INSERT INTO `review` VALUES (1,1,1,5,'????????','2026-07-04 23:19:51'),(2,3,2,5,'JVM深度剖析,值得反复研读。','2026-07-04 23:19:51'),(3,4,1,4,'Vue3源码解析很深入,需要一定基础。','2026-07-04 23:19:51'),(5,9,4,5,'','2026-07-06 11:43:36');
/*!40000 ALTER TABLE `review` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '用户名',
  `password` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT '密码(BCrypt加密)',
  `role` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'READER' COMMENT '角色: ADMIN/READER',
  `reader_id` int DEFAULT NULL COMMENT '关联的读者ID(借阅者角色必填)',
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/DISABLED',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `reader_id` (`reader_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统用户表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'admin','$2a$10$r9vMhKA06tMBJKx41PdiA..kEgzqePtWoxbAKJrtFM6gsN2dVcwXi','ADMIN',NULL,'ACTIVE','2026-07-04 15:04:28'),(2,'zhangsan','$2a$10$INVoVAZ3iX.OBcsDLtpJ7.i6JsrywfedNDLzaExuIJ2QbhuNl23qS','READER',1,'ACTIVE','2026-07-04 15:04:28'),(4,'wangwu','$2a$10$INVoVAZ3iX.OBcsDLtpJ7.i6JsrywfedNDLzaExuIJ2QbhuNl23qS','READER',3,'ACTIVE','2026-07-04 15:04:28'),(8,'yy','$2a$10$TdAewiAGGbbuXxyByifBlO0rySTNHzWF9Ue/r5UbTx.sFzQvCBhzS','READER',4,'ACTIVE','2026-07-06 11:19:52'),(11,'YinH','$2a$10$ch7FgDDHQvVR//FX0HwF..dgBWAvH6GE0T45l9ofzWDZ.AXEI3CD6','ADMIN',6,'ACTIVE','2026-07-09 22:31:25');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'library_system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-09 23:20:25
