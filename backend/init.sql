DROP TABLE IF EXISTS `review`;
DROP TABLE IF EXISTS `notice`;
DROP TABLE IF EXISTS `borrow_request`;
DROP TABLE IF EXISTS `borrow`;
DROP TABLE IF EXISTS `book`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `reader`;
DROP TABLE IF EXISTS `category`;

CREATE TABLE `category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(200) DEFAULT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `reader` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `student_id` varchar(20) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `register_date` date NOT NULL,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(100) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'READER',
  `reader_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `reader_id` (`reader_id`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `book` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `author` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `publisher` varchar(100) DEFAULT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `total_stock` int NOT NULL DEFAULT '1',
  `stock` int NOT NULL DEFAULT '1',
  `publish_date` date DEFAULT NULL,
  `description` text,
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `book_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `borrow` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `reader_id` int NOT NULL,
  `borrow_date` date NOT NULL,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'BORROWED',
  `fine` decimal(10,2) NOT NULL DEFAULT '0.00',
  `remark` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  KEY `reader_id` (`reader_id`),
  CONSTRAINT `borrow_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`),
  CONSTRAINT `borrow_ibfk_2` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `borrow_request` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `reader_id` int NOT NULL,
  `request_date` date NOT NULL,
  `due_days` int NOT NULL DEFAULT '30',
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `approve_date` date DEFAULT NULL,
  `admin_id` int DEFAULT NULL,
  `admin_remark` varchar(200) DEFAULT NULL,
  `reader_remark` varchar(200) DEFAULT NULL,
  `borrow_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  KEY `reader_id` (`reader_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `borrow_request_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`),
  CONSTRAINT `borrow_request_ibfk_2` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`),
  CONSTRAINT `borrow_request_ibfk_3` FOREIGN KEY (`admin_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `notice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'NOTICE',
  `status` varchar(20) NOT NULL DEFAULT 'PUBLISHED',
  `publisher_id` int DEFAULT NULL,
  `publish_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `pinned` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `publisher_id` (`publisher_id`),
  CONSTRAINT `notice_ibfk_1` FOREIGN KEY (`publisher_id`) REFERENCES `user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `review` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `reader_id` int NOT NULL,
  `rating` int NOT NULL,
  `content` varchar(500) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `book_id` (`book_id`),
  KEY `reader_id` (`reader_id`),
  CONSTRAINT `review_ibfk_1` FOREIGN KEY (`book_id`) REFERENCES `book` (`id`) ON DELETE CASCADE,
  CONSTRAINT `review_ibfk_2` FOREIGN KEY (`reader_id`) REFERENCES `reader` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `category` VALUES (1,'计算机科学','Computer Science','2026-07-04 13:41:31'),(2,'文学','Literature','2026-07-04 13:41:31'),(3,'历史','History','2026-07-04 13:41:31'),(4,'哲学','Philosophy','2026-07-04 13:41:31');

INSERT INTO `reader` VALUES (1,'张三','S2021001','13800138001','zhangsan@example.com','ACTIVE','2021-09-01','2026-07-04 13:41:31'),(2,'李四','S2021002','13800138002','lisi@example.com','ACTIVE','2021-09-01','2026-07-04 13:41:31'),(3,'王五','S2021003','13800138003','wangwu@example.com','SUSPENDED','2022-03-15','2026-07-04 13:41:31'),(4,'yy','49','911','1','ACTIVE','2026-06-30','2026-07-04 23:27:57'),(6,'YinH','2022234060602','','','ACTIVE','2026-07-09','2026-07-09 18:39:34');

INSERT INTO `user` VALUES (1,'admin','$2a$10$r9vMhKA06tMBJKx41PdiA..kEgzqePtWoxbAKJrtFM6gsN2dVcwXi','ADMIN',NULL,'ACTIVE','2026-07-04 15:04:28'),(2,'zhangsan','$2a$10$INVoVAZ3iX.OBcsDLtpJ7.i6JsrywfedNDLzaExuIJ2QbhuNl23qS','READER',1,'ACTIVE','2026-07-04 15:04:28'),(4,'wangwu','$2a$10$INVoVAZ3iX.OBcsDLtpJ7.i6JsrywfedNDLzaExuIJ2QbhuNl23qS','READER',3,'ACTIVE','2026-07-04 15:04:28'),(8,'yy','$2a$10$TdAewiAGGbbuXxyByifBlO0rySTNHzWF9Ue/r5UbTx.sFzQvCBhzS','READER',4,'ACTIVE','2026-07-06 11:19:52'),(11,'YinH','$2a$10$ch7FgDDHQvVR//FX0HwF..dgBWAvH6GE0T45l9ofzWDZ.AXEI3CD6','ADMIN',6,'ACTIVE','2026-07-09 22:31:25');

INSERT INTO `book` VALUES (1,'Java核心技术 卷I','Cay S. Horstmann',119.00,'机械工业出版社','9787111111111',1,3,3,'2020-01-01','Java入门经典','2026-07-04 13:41:31'),(2,'Spring实战','Craig Walls',99.00,'人民邮电出版社','9787111222222',1,2,1,'2019-06-01','Spring框架实战指南','2026-07-04 13:41:31'),(3,'深入理解Java虚拟机','周志明',129.00,'机械工业出版社','9787111333333',1,2,1,'2019-12-01','JVM深度剖析','2026-07-04 13:41:31'),(4,'Vue.js设计与实现','霍春阳',89.00,'人民邮电出版社','9787111444444',1,1,0,'2022-03-01','Vue3源码解析','2026-07-04 13:41:31'),(5,'MySQL必知必会','Ben Forta',39.00,'人民邮电出版社','9787111555555',1,2,0,'2020-09-01','SQL入门简明教程','2026-07-04 13:41:31'),(6,'百年孤独','加西亚·马尔克斯',59.00,'南海出版公司','9787544291170',2,2,1,'2017-06-01','魔幻现实主义代表作','2026-07-04 13:41:31'),(7,'人类简史','尤瓦尔·赫拉利',68.00,'中信出版社','9787508647357',3,2,1,'2014-11-01','从动物到上帝','2026-07-04 13:41:31'),(8,'西游记','吴承恩',100.00,'大明嘉靖出版社','123452354',2,3,2,'1640-07-04','一饮一啄 莫非前定','2026-07-04 15:23:09'),(9,'道德经','老子',0.00,'先秦诸子出版社','498234534985',4,1,1,'0001-01-01','道可道，非常道','2026-07-06 11:01:55');

INSERT INTO `borrow` VALUES (1,1,1,'2026-06-01','2026-06-30','2026-07-04','RETURNED',4.00,NULL),(2,3,2,'2026-05-15','2026-06-14',NULL,'OVERDUE',5.00,NULL),(3,4,1,'2026-05-01','2026-05-31','2026-05-20','RETURNED',0.00,NULL),(4,2,1,'2026-07-04','2026-08-03',NULL,'BORROWED',0.00,NULL),(5,6,2,'2026-07-04','2026-08-03',NULL,'BORROWED',0.00,NULL),(6,5,1,'2026-07-04','2026-08-03',NULL,'BORROWED',0.00,NULL),(7,9,4,'2026-07-06','2026-08-05','2026-07-06','RETURNED',0.00,NULL),(8,8,4,'2026-07-06','2026-08-05',NULL,'BORROWED',0.00,NULL),(9,5,4,'2026-07-09','2026-07-23',NULL,'BORROWED',0.00,NULL);

INSERT INTO `borrow_request` VALUES (1,5,1,'2026-07-04',30,'APPROVED','2026-07-04',1,'通过','??SQL??',6),(2,8,4,'2026-07-06',30,'APPROVED','2026-07-06',1,NULL,'',8),(3,9,4,'2026-07-06',30,'APPROVED','2026-07-06',1,NULL,'',7),(4,4,4,'2026-07-06',30,'REJECTED','2026-07-06',1,'库存不足,自动拒绝:','',NULL),(5,5,4,'2026-07-09',14,'APPROVED','2026-07-09',1,'同意','cnm',9),(6,1,4,'2026-07-09',14,'REJECTED','2026-07-09',11,'不给看\n',NULL,NULL);

INSERT INTO `notice` VALUES (1,'欢迎使用图书馆管理系统','欢迎使用 LIBRARY//OS v0.4!新版本已上线借阅申请、公告通知、图书评价等功能,欢迎体验。','ANNOUNCEMENT','PUBLISHED',1,'2026-07-04 09:00:00',1),(2,'借阅规则更新通知','自2026年7月起,每位读者最多可同时借阅5本图书,单本借期最长90天,逾期将产生每日1元罚款。','NOTICE','PUBLISHED',1,'2026-07-03 10:00:00',0),(3,'系统维护预告','本周日凌晨2:00-4:00 系统将进行例行维护,期间可能短暂无法访问,请提前安排。','MAINTENANCE','PUBLISHED',1,'2026-07-02 14:00:00',0),(4,'????','???????','NOTICE','PUBLISHED',1,'2026-07-04 23:20:34',0);

INSERT INTO `review` VALUES (1,1,1,5,'????????','2026-07-04 23:19:51'),(2,3,2,5,'JVM深度剖析,值得反复研读。','2026-07-04 23:19:51'),(3,4,1,4,'Vue3源码解析很深入,需要一定基础。','2026-07-04 23:19:51'),(5,9,4,5,'','2026-07-06 11:43:36');
