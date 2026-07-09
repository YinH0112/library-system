CREATE DATABASE IF NOT EXISTS library_system
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_general_ci;

USE library_system;

-- ============ 分类表 ============
DROP TABLE IF EXISTS category;
CREATE TABLE category (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '分类ID',
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '分类名',
    description VARCHAR(200) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT '图书分类表';

-- ============ 图书表(扩展) ============
DROP TABLE IF EXISTS book;
CREATE TABLE book (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '图书ID',
    name VARCHAR(100) NOT NULL COMMENT '书名',
    author VARCHAR(50) COMMENT '作者',
    price DECIMAL(10, 2) COMMENT '价格',
    publisher VARCHAR(100) COMMENT '出版社',
    isbn VARCHAR(20) COMMENT 'ISBN',
    category_id INT COMMENT '分类ID',
    total_stock INT NOT NULL DEFAULT 1 COMMENT '总馆藏数',
    stock INT NOT NULL DEFAULT 1 COMMENT '可借库存',
    publish_date DATE COMMENT '出版日期',
    description TEXT COMMENT '简介',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '入藏时间',
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
) COMMENT '图书信息表';

-- ============ 读者表 ============
DROP TABLE IF EXISTS reader;
CREATE TABLE reader (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '读者ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    student_id VARCHAR(20) UNIQUE COMMENT '学号/工号',
    phone VARCHAR(20) COMMENT '电话',
    email VARCHAR(100) COMMENT '邮箱',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/SUSPENDED',
    register_date DATE NOT NULL COMMENT '注册日期',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT '读者信息表';

-- ============ 借阅记录表 ============
DROP TABLE IF EXISTS borrow;
CREATE TABLE borrow (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '借阅ID',
    book_id INT NOT NULL COMMENT '图书ID',
    reader_id INT NOT NULL COMMENT '读者ID',
    borrow_date DATE NOT NULL COMMENT '借出日期',
    due_date DATE NOT NULL COMMENT '应还日期',
    return_date DATE COMMENT '实际归还日期(NULL表示未还)',
    status VARCHAR(20) NOT NULL DEFAULT 'BORROWED' COMMENT '状态: BORROWED/RETURNED/OVERDUE',
    fine DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '罚款金额',
    remark VARCHAR(200) COMMENT '备注',
    FOREIGN KEY (book_id) REFERENCES book(id),
    FOREIGN KEY (reader_id) REFERENCES reader(id)
) COMMENT '借阅记录表';

-- ============ 初始数据 ============
INSERT INTO category (name, description) VALUES
    ('计算机科学', 'Computer Science'),
    ('文学', 'Literature'),
    ('历史', 'History'),
    ('哲学', 'Philosophy');

INSERT INTO book (name, author, price, publisher, isbn, category_id, total_stock, stock, publish_date, description) VALUES
    ('Java核心技术 卷I', 'Cay S. Horstmann', 119.00, '机械工业出版社', '9787111111111', 1, 3, 2, '2020-01-01', 'Java入门经典'),
    ('Spring实战', 'Craig Walls', 99.00, '人民邮电出版社', '9787111222222', 1, 2, 2, '2019-06-01', 'Spring框架实战指南'),
    ('深入理解Java虚拟机', '周志明', 129.00, '机械工业出版社', '9787111333333', 1, 2, 1, '2019-12-01', 'JVM深度剖析'),
    ('Vue.js设计与实现', '霍春阳', 89.00, '人民邮电出版社', '9787111444444', 1, 1, 0, '2022-03-01', 'Vue3源码解析'),
    ('MySQL必知必会', 'Ben Forta', 39.00, '人民邮电出版社', '9787111555555', 1, 2, 2, '2020-09-01', 'SQL入门简明教程'),
    ('百年孤独', '加西亚·马尔克斯', 59.00, '南海出版公司', '9787544291170', 2, 2, 2, '2017-06-01', '魔幻现实主义代表作'),
    ('人类简史', '尤瓦尔·赫拉利', 68.00, '中信出版社', '9787508647357', 3, 2, 1, '2014-11-01', '从动物到上帝');

INSERT INTO reader (name, student_id, phone, email, status, register_date) VALUES
    ('张三', 'S2021001', '13800138001', 'zhangsan@example.com', 'ACTIVE', '2021-09-01'),
    ('李四', 'S2021002', '13800138002', 'lisi@example.com', 'ACTIVE', '2021-09-01'),
    ('王五', 'S2021003', '13800138003', 'wangwu@example.com', 'SUSPENDED', '2022-03-15');

INSERT INTO borrow (book_id, reader_id, borrow_date, due_date, return_date, status, fine) VALUES
    (1, 1, '2026-06-01', '2026-06-30', NULL, 'BORROWED', 0),
    (3, 2, '2026-05-15', '2026-06-14', NULL, 'OVERDUE', 5.00),
    (4, 1, '2026-05-01', '2026-05-31', '2026-05-20', 'RETURNED', 0);

-- ============ 用户表 ============
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码(BCrypt加密)',
    role VARCHAR(20) NOT NULL DEFAULT 'READER' COMMENT '角色: ADMIN/READER',
    reader_id INT COMMENT '关联的读者ID(借阅者角色必填)',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE/DISABLED',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reader_id) REFERENCES reader(id) ON DELETE SET NULL
) COMMENT '系统用户表';

-- 默认管理员账号(密码 admin123 的 BCrypt 加密值)
INSERT INTO `user` (username, password, role, status) VALUES
    ('admin', '$2a$10$r9vMhKA06tMBJKx41PdiA..kEgzqePtWoxbAKJrtFM6gsN2dVcwXi', 'ADMIN', 'ACTIVE');

-- 为现有 3 个读者创建借阅者账号(密码均为 reader123)
INSERT INTO `user` (username, password, role, reader_id, status) VALUES
    ('zhangsan', '$2a$10$INVoVAZ3iX.OBcsDLtpJ7.i6JsrywfedNDLzaExuIJ2QbhuNl23qS', 'READER', 1, 'ACTIVE'),
    ('lisi', '$2a$10$INVoVAZ3iX.OBcsDLtpJ7.i6JsrywfedNDLzaExuIJ2QbhuNl23qS', 'READER', 2, 'ACTIVE'),
    ('wangwu', '$2a$10$INVoVAZ3iX.OBcsDLtpJ7.i6JsrywfedNDLzaExuIJ2QbhuNl23qS', 'READER', 3, 'ACTIVE');

-- ============ 借阅申请表 ============
DROP TABLE IF EXISTS borrow_request;
CREATE TABLE borrow_request (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '申请ID',
    book_id INT NOT NULL COMMENT '图书ID',
    reader_id INT NOT NULL COMMENT '读者ID',
    request_date DATE NOT NULL COMMENT '申请日期',
    due_days INT NOT NULL DEFAULT 30 COMMENT '申请借阅天数',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING/APPROVED/REJECTED/CANCELLED',
    approve_date DATE COMMENT '审批日期',
    admin_id INT COMMENT '审批管理员ID',
    admin_remark VARCHAR(200) COMMENT '管理员备注',
    reader_remark VARCHAR(200) COMMENT '借阅者备注',
    borrow_id INT COMMENT '审批通过后生成的借阅记录ID',
    FOREIGN KEY (book_id) REFERENCES book(id),
    FOREIGN KEY (reader_id) REFERENCES reader(id),
    FOREIGN KEY (admin_id) REFERENCES `user`(id) ON DELETE SET NULL
) COMMENT '借阅申请表';

-- ============ 公告通知表 ============
DROP TABLE IF EXISTS notice;
CREATE TABLE notice (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '公告ID',
    title VARCHAR(100) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '正文',
    type VARCHAR(20) NOT NULL DEFAULT 'NOTICE' COMMENT '类型: NOTICE/ANNOUNCEMENT/MAINTENANCE',
    status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' COMMENT '状态: DRAFT/PUBLISHED/ARCHIVED',
    publisher_id INT COMMENT '发布者(管理员)ID',
    publish_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    pinned TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否置顶',
    FOREIGN KEY (publisher_id) REFERENCES `user`(id) ON DELETE SET NULL
) COMMENT '公告通知表';

INSERT INTO notice (title, content, type, status, publisher_id, publish_date, pinned) VALUES
    ('欢迎使用图书馆管理系统', '欢迎使用 LIBRARY//OS v0.4!新版本已上线借阅申请、公告通知、图书评价等功能,欢迎体验。', 'ANNOUNCEMENT', 'PUBLISHED', 1, '2026-07-04 09:00:00', 1),
    ('借阅规则更新通知', '自2026年7月起,每位读者最多可同时借阅5本图书,单本借期最长90天,逾期将产生每日1元罚款。', 'NOTICE', 'PUBLISHED', 1, '2026-07-03 10:00:00', 0),
    ('系统维护预告', '本周日凌晨2:00-4:00 系统将进行例行维护,期间可能短暂无法访问,请提前安排。', 'MAINTENANCE', 'PUBLISHED', 1, '2026-07-02 14:00:00', 0);

-- ============ 图书评价表 ============
DROP TABLE IF EXISTS review;
CREATE TABLE review (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '评价ID',
    book_id INT NOT NULL COMMENT '图书ID',
    reader_id INT NOT NULL COMMENT '读者ID',
    rating INT NOT NULL COMMENT '评分1-5',
    content VARCHAR(500) COMMENT '评价内容',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES book(id) ON DELETE CASCADE,
    FOREIGN KEY (reader_id) REFERENCES reader(id) ON DELETE CASCADE
) COMMENT '图书评价表';

-- 初始评价数据(借阅者对已读书目的评价)
INSERT INTO review (book_id, reader_id, rating, content) VALUES
    (1, 1, 5, 'Java入门经典,讲解清晰,适合初学者。'),
    (3, 2, 5, 'JVM深度剖析,值得反复研读。'),
    (4, 1, 4, 'Vue3源码解析很深入,需要一定基础。');
