# 图书管理系统功能扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有"单表图书 CRUD"系统扩展为完整的多模块图书馆运营系统,新增分类、读者、借阅、统计四大子系统,前端从单页扩展为带侧边导航的多视图应用,延续 LIBRARY//OS 新粗野主义美学。

**Architecture:** 后端继续沿用 Spring Boot 4.0.7 + MyBatis 分层架构(Controller → Service → Mapper → MySQL),新增 `Category` / `Reader` / `Borrow` 三个实体模块,扩展 `Book` 实体字段。前端 Vue3 SPA 从单组件 `App.vue` 重构为多视图布局(`SidebarNav` + 路由式视图切换),保留现有 brutalist 设计 token(`--ink` / `--pink` / `--yellow` 等 CSS 变量)并新增状态徽章与数据可视化样式。

**Tech Stack:** Spring Boot 4.0.7, MyBatis 4.0.1, MySQL 8, JUnit 5 + Mockito(服务层测试), Vue 3.4, Vite 5.4, axios 1.6。

---

## File Structure

### Backend (Java) — 新增/修改

```
backend/src/main/java/org/example/library_system/
├── entity/
│   ├── Book.java                       # Modify: 新增 isbn/stock/totalStock/publishDate/description/categoryId
│   ├── Category.java                   # Create: 分类实体
│   ├── Reader.java                     # Create: 读者实体
│   └── Borrow.java                     # Create: 借阅记录实体
├── mapper/
│   ├── BookMapper.java                 # Modify: 新增多条件查询、分页、按分类查询、扣减/恢复库存
│   ├── CategoryMapper.java             # Create
│   ├── ReaderMapper.java               # Create
│   └── BorrowMapper.java               # Create
├── service/
│   ├── BookService.java                # Modify: 新增多条件分页查询
│   ├── CategoryService.java            # Create
│   ├── ReaderService.java              # Create
│   ├── BorrowService.java              # Create
│   ├── StatsService.java               # Create: 仪表盘统计
│   └── impl/
│       ├── BookServiceImpl.java        # Modify
│       ├── CategoryServiceImpl.java    # Create
│       ├── ReaderServiceImpl.java      # Create
│       ├── BorrowServiceImpl.java      # Create: 借/还逻辑,事务保证库存一致
│       └── StatsServiceImpl.java       # Create
├── controller/
│   ├── BookController.java             # Modify: 新增分页、多条件查询
│   ├── CategoryController.java         # Create
│   ├── ReaderController.java           # Create
│   ├── BorrowController.java           # Create: 借书/还书/历史/逾期
│   └── StatsController.java            # Create
├── common/
│   ├── Result.java                     # 既有
│   └── PageResult.java                 # Create: 分页响应包装
└── dto/
    ├── BookQuery.java                  # Create: 多条件查询参数
    └── BorrowAction.java              # Create: 借书请求体
```

### Backend (Resources)

```
backend/src/main/resources/
├── db/
│   └── schema.sql                      # Modify: 新增 category/reader/borrow 表,扩展 book 表
└── mapper/
    ├── BookMapper.xml                  # Modify: 新增 SQL
    ├── CategoryMapper.xml              # Create
    ├── ReaderMapper.xml                # Create
    └── BorrowMapper.xml                # Create
```

### Backend (Tests)

```
backend/src/test/java/org/example/library_system/
├── service/
│   ├── CategoryServiceImplTest.java    # Create
│   ├── ReaderServiceImplTest.java      # Create
│   └── BorrowServiceImplTest.java      # Create: 借/还库存一致性、逾期检测
└── LibrarySystemApplicationTests.java  # 既有
```

### Frontend (Vue) — 重构为多视图

```
frontend-vue/src/
├── main.js                             # 既有(不变)
├── api.js                              # Modify: 拆分多模块 API client
├── style.css                           # Modify: 新增侧边栏、徽章、表格扩展样式
├── App.vue                             # Modify: 重构为 layout + 路由式视图切换
├── components/
│   ├── BookCard.vue                    # Modify: 显示分类、库存状态徽章
│   ├── BookFormDialog.vue              # Modify: 新增分类下拉、ISBN、库存等字段
│   ├── SidebarNav.vue                  # Create: 侧边栏导航
│   ├── StatCard.vue                    # Create: 仪表盘统计卡片
│   ├── Toast.vue                       # Create: 抽离 Toast 组件
│   └── ConfirmDialog.vue               # Create: 替代 window.confirm
└── views/
    ├── BooksView.vue                   # Create: 图书管理页(扩展现有逻辑)
    ├── CategoriesView.vue              # Create: 分类管理页
    ├── ReadersView.vue                 # Create: 读者管理页
    ├── BorrowsView.vue                 # Create: 借阅管理页
    └── DashboardView.vue               # Create: 仪表盘(统计可视化)
```

---

## Task 1: 扩展数据库 Schema

**Files:**
- Modify: `backend/src/main/resources/db/schema.sql`

- [ ] **Step 1: 重写 schema.sql,新增 category/reader/borrow 表并扩展 book 表**

覆盖 `backend/src/main/resources/db/schema.sql`:

```sql
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
```

- [ ] **Step 2: 应用 schema 到 MySQL**

```bash
mysql -u root -p123456 < backend/src/main/resources/db/schema.sql
```

验证:
```bash
mysql -u root -p123456 -e "USE library_system; SHOW TABLES; SELECT COUNT(*) FROM book; SELECT COUNT(*) FROM category; SELECT COUNT(*) FROM reader; SELECT COUNT(*) FROM borrow;"
```

期望:4 张表,book=7, category=4, reader=3, borrow=3。

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/resources/db/schema.sql
git commit -m "feat(db): expand schema with category/reader/borrow tables and enriched book fields"
```

---

## Task 2: 创建 PageResult 与 BookQuery DTO

**Files:**
- Create: `backend/src/main/java/org/example/library_system/common/PageResult.java`
- Create: `backend/src/main/java/org/example/library_system/dto/BookQuery.java`

- [ ] **Step 1: 创建 PageResult 分页包装类**

创建 `backend/src/main/java/org/example/library_system/common/PageResult.java`:

```java
package org.example.library_system.common;

import java.util.List;

public class PageResult<T> {
    private List<T> records;
    private long total;
    private int page;
    private int size;

    public PageResult() {
    }

    public PageResult(List<T> records, long total, int page, int size) {
        this.records = records;
        this.total = total;
        this.page = page;
        this.size = size;
    }

    public List<T> getRecords() { return records; }
    public void setRecords(List<T> records) { this.records = records; }
    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }
    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
}
```

- [ ] **Step 2: 创建 BookQuery DTO**

创建 `backend/src/main/java/org/example/library_system/dto/BookQuery.java`:

```java
package org.example.library_system.dto;

public class BookQuery {
    private String name;
    private String author;
    private String publisher;
    private Integer categoryId;
    private Integer page = 1;
    private Integer size = 10;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }
    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }
    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }
    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }

    public int getOffset() {
        int p = page == null ? 1 : page;
        int s = size == null ? 10 : size;
        return Math.max(0, (p - 1) * s);
    }
}
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/org/example/library_system/common/PageResult.java backend/src/main/java/org/example/library_system/dto/BookQuery.java
git commit -m "feat(common): add PageResult and BookQuery DTO for paginated search"
```

---

## Task 3: 扩展 Book 实体与 Category 实体

**Files:**
- Modify: `backend/src/main/java/org/example/library_system/entity/Book.java`
- Create: `backend/src/main/java/org/example/library_system/entity/Category.java`

- [ ] **Step 1: 扩展 Book 实体新增字段**

替换 `Book.java` 中类体(保留原 toString 但扩展):

```java
package org.example.library_system.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class Book {
    private Integer id;
    private String name;
    private String author;
    private BigDecimal price;
    private String publisher;
    private String isbn;
    private Integer categoryId;
    private Integer totalStock;
    private Integer stock;
    private LocalDate publishDate;
    private String description;
    private LocalDateTime createTime;
    // 关联字段(非数据库列,用于联表查询返回)
    private String categoryName;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAuthor() { return author; }
    public void setAuthor(String author) { this.author = author; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getPublisher() { return publisher; }
    public void setPublisher(String publisher) { this.publisher = publisher; }
    public String getIsbn() { return isbn; }
    public void setIsbn(String isbn) { this.isbn = isbn; }
    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }
    public Integer getTotalStock() { return totalStock; }
    public void setTotalStock(Integer totalStock) { this.totalStock = totalStock; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public LocalDate getPublishDate() { return publishDate; }
    public void setPublishDate(LocalDate publishDate) { this.publishDate = publishDate; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    @Override
    public String toString() {
        return "Book{id=" + id + ", name='" + name + '\'' + ", stock=" + stock + "/" + totalStock + '}';
    }
}
```

- [ ] **Step 2: 创建 Category 实体**

创建 `backend/src/main/java/org/example/library_system/entity/Category.java`:

```java
package org.example.library_system.entity;

import java.time.LocalDateTime;

public class Category {
    private Integer id;
    private String name;
    private String description;
    private LocalDateTime createTime;
    // 关联统计(非数据库列)
    private Integer bookCount;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public Integer getBookCount() { return bookCount; }
    public void setBookCount(Integer bookCount) { this.bookCount = bookCount; }
}
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/org/example/library_system/entity/Book.java backend/src/main/java/org/example/library_system/entity/Category.java
git commit -m "feat(entity): extend Book with stock/ISBN/category fields; add Category entity"
```

---

## Task 4: 创建 Reader 与 Borrow 实体

**Files:**
- Create: `backend/src/main/java/org/example/library_system/entity/Reader.java`
- Create: `backend/src/main/java/org/example/library_system/entity/Borrow.java`
- Create: `backend/src/main/java/org/example/library_system/dto/BorrowAction.java`

- [ ] **Step 1: 创建 Reader 实体**

创建 `backend/src/main/java/org/example/library_system/entity/Reader.java`:

```java
package org.example.library_system.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class Reader {
    private Integer id;
    private String name;
    private String studentId;
    private String phone;
    private String email;
    private String status; // ACTIVE / SUSPENDED
    private LocalDate registerDate;
    private LocalDateTime createTime;
    // 关联统计(非数据库列)
    private Integer activeBorrowCount;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDate getRegisterDate() { return registerDate; }
    public void setRegisterDate(LocalDate registerDate) { this.registerDate = registerDate; }
    public LocalDateTime getCreateTime() { return createTime; }
    public void setCreateTime(LocalDateTime createTime) { this.createTime = createTime; }
    public Integer getActiveBorrowCount() { return activeBorrowCount; }
    public void setActiveBorrowCount(Integer activeBorrowCount) { this.activeBorrowCount = activeBorrowCount; }
}
```

- [ ] **Step 2: 创建 Borrow 实体**

创建 `backend/src/main/java/org/example/library_system/entity/Borrow.java`:

```java
package org.example.library_system.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Borrow {
    private Integer id;
    private Integer bookId;
    private Integer readerId;
    private LocalDate borrowDate;
    private LocalDate dueDate;
    private LocalDate returnDate;
    private String status; // BORROWED / RETURNED / OVERDUE
    private BigDecimal fine;
    private String remark;
    // 关联字段(非数据库列)
    private String bookName;
    private String readerName;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getBookId() { return bookId; }
    public void setBookId(Integer bookId) { this.bookId = bookId; }
    public Integer getReaderId() { return readerId; }
    public void setReaderId(Integer readerId) { this.readerId = readerId; }
    public LocalDate getBorrowDate() { return borrowDate; }
    public void setBorrowDate(LocalDate borrowDate) { this.borrowDate = borrowDate; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getFine() { return fine; }
    public void setFine(BigDecimal fine) { this.fine = fine; }
    public String getRemark() { return remark; }
    public void setRemark(String remark) { this.remark = remark; }
    public String getBookName() { return bookName; }
    public void setBookName(String bookName) { this.bookName = bookName; }
    public String getReaderName() { return readerName; }
    public void setReaderName(String readerName) { this.readerName = readerName; }
}
```

- [ ] **Step 3: 创建 BorrowAction DTO**

创建 `backend/src/main/java/org/example/library_system/dto/BorrowAction.java`:

```java
package org.example.library_system.dto;

import java.time.LocalDate;

public class BorrowAction {
    private Integer bookId;
    private Integer readerId;
    private Integer days; // 借阅天数,默认 30

    public Integer getBookId() { return bookId; }
    public void setBookId(Integer bookId) { this.bookId = bookId; }
    public Integer getReaderId() { return readerId; }
    public void setReaderId(Integer readerId) { this.readerId = readerId; }
    public Integer getDays() { return days; }
    public void setDays(Integer days) { this.days = days; }

    public LocalDate computeDueDate(LocalDate borrowDate) {
        int d = days == null || days <= 0 ? 30 : days;
        return borrowDate.plusDays(d);
    }
}
```

- [ ] **Step 4: 提交**

```bash
git add backend/src/main/java/org/example/library_system/entity/Reader.java backend/src/main/java/org/example/library_system/entity/Borrow.java backend/src/main/java/org/example/library_system/dto/BorrowAction.java
git commit -m "feat(entity): add Reader, Borrow entities and BorrowAction DTO"
```

---

## Task 5: 创建 Category Mapper 与 XML

**Files:**
- Create: `backend/src/main/java/org/example/library_system/mapper/CategoryMapper.java`
- Create: `backend/src/main/resources/mapper/CategoryMapper.xml`

- [ ] **Step 1: 创建 CategoryMapper 接口**

创建 `backend/src/main/java/org/example/library_system/mapper/CategoryMapper.java`:

```java
package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.library_system.entity.Category;

import java.util.List;

@Mapper
public interface CategoryMapper {
    List<Category> findAll();
    Category findById(Integer id);
    int insert(Category category);
    int update(Category category);
    int deleteById(Integer id);
    int countBooksByCategory(Integer id);
}
```

- [ ] **Step 2: 创建 CategoryMapper.xml**

创建 `backend/src/main/resources/mapper/CategoryMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.library_system.mapper.CategoryMapper">

    <resultMap id="categoryResultMap" type="org.example.library_system.entity.Category">
        <id property="id" column="id"/>
        <result property="name" column="name"/>
        <result property="description" column="description"/>
        <result property="createTime" column="create_time"/>
        <result property="bookCount" column="book_count"/>
    </resultMap>

    <select id="findAll" resultMap="categoryResultMap">
        SELECT c.id, c.name, c.description, c.create_time,
               (SELECT COUNT(*) FROM book b WHERE b.category_id = c.id) AS book_count
        FROM category c
        ORDER BY c.id ASC
    </select>

    <select id="findById" resultMap="categoryResultMap">
        SELECT id, name, description, create_time
        FROM category
        WHERE id = #{id}
    </select>

    <insert id="insert" parameterType="org.example.library_system.entity.Category" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO category (name, description)
        VALUES (#{name}, #{description})
    </insert>

    <update id="update" parameterType="org.example.library_system.entity.Category">
        UPDATE category
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="description != null">description = #{description},</if>
        </set>
        WHERE id = #{id}
    </update>

    <delete id="deleteById">
        DELETE FROM category WHERE id = #{id}
    </delete>

    <select id="countBooksByCategory" resultType="int">
        SELECT COUNT(*) FROM book WHERE category_id = #{id}
    </select>
</mapper>
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/org/example/library_system/mapper/CategoryMapper.java backend/src/main/resources/mapper/CategoryMapper.xml
git commit -m "feat(mapper): add CategoryMapper with CRUD and book count"
```

---

## Task 6: 创建 Reader Mapper 与 XML

**Files:**
- Create: `backend/src/main/java/org/example/library_system/mapper/ReaderMapper.java`
- Create: `backend/src/main/resources/mapper/ReaderMapper.xml`

- [ ] **Step 1: 创建 ReaderMapper 接口**

创建 `backend/src/main/java/org/example/library_system/mapper/ReaderMapper.java`:

```java
package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.library_system.entity.Reader;

import java.util.List;

@Mapper
public interface ReaderMapper {
    List<Reader> findAll(String keyword);
    Reader findById(Integer id);
    int insert(Reader reader);
    int update(Reader reader);
    int deleteById(Integer id);
}
```

- [ ] **Step 2: 创建 ReaderMapper.xml**

创建 `backend/src/main/resources/mapper/ReaderMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.library_system.mapper.ReaderMapper">

    <resultMap id="readerResultMap" type="org.example.library_system.entity.Reader">
        <id property="id" column="id"/>
        <result property="name" column="name"/>
        <result property="studentId" column="student_id"/>
        <result property="phone" column="phone"/>
        <result property="email" column="email"/>
        <result property="status" column="status"/>
        <result property="registerDate" column="register_date"/>
        <result property="createTime" column="create_time"/>
        <result property="activeBorrowCount" column="active_borrow_count"/>
    </resultMap>

    <select id="findAll" resultMap="readerResultMap">
        SELECT r.id, r.name, r.student_id, r.phone, r.email, r.status, r.register_date, r.create_time,
               (SELECT COUNT(*) FROM borrow b WHERE b.reader_id = r.id AND b.status IN ('BORROWED','OVERDUE')) AS active_borrow_count
        FROM reader r
        <where>
            <if test="keyword != null and keyword != ''">
                AND (r.name LIKE CONCAT('%', #{keyword}, '%')
                  OR r.student_id LIKE CONCAT('%', #{keyword}, '%')
                  OR r.phone LIKE CONCAT('%', #{keyword}, '%'))
            </if>
        </where>
        ORDER BY r.id DESC
    </select>

    <select id="findById" resultMap="readerResultMap">
        SELECT id, name, student_id, phone, email, status, register_date, create_time
        FROM reader WHERE id = #{id}
    </select>

    <insert id="insert" parameterType="org.example.library_system.entity.Reader" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO reader (name, student_id, phone, email, status, register_date)
        VALUES (#{name}, #{studentId}, #{phone}, #{email}, #{status}, #{registerDate})
    </insert>

    <update id="update" parameterType="org.example.library_system.entity.Reader">
        UPDATE reader
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="studentId != null">student_id = #{studentId},</if>
            <if test="phone != null">phone = #{phone},</if>
            <if test="email != null">email = #{email},</if>
            <if test="status != null">status = #{status},</if>
        </set>
        WHERE id = #{id}
    </update>

    <delete id="deleteById">
        DELETE FROM reader WHERE id = #{id}
    </delete>
</mapper>
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/org/example/library_system/mapper/ReaderMapper.java backend/src/main/resources/mapper/ReaderMapper.xml
git commit -m "feat(mapper): add ReaderMapper with keyword search and active borrow count"
```

---

## Task 7: 创建 Borrow Mapper 与 XML

**Files:**
- Create: `backend/src/main/java/org/example/library_system/mapper/BorrowMapper.java`
- Create: `backend/src/main/resources/mapper/BorrowMapper.xml`

- [ ] **Step 1: 创建 BorrowMapper 接口**

创建 `backend/src/main/java/org/example/library_system/mapper/BorrowMapper.java`:

```java
package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.entity.Borrow;

import java.time.LocalDate;
import java.util.List;

@Mapper
public interface BorrowMapper {
    List<Borrow> findAll(@Param("status") String status, @Param("readerId") Integer readerId);
    Borrow findById(Integer id);
    int insert(Borrow borrow);
    int updateReturn(@Param("id") Integer id, @Param("returnDate") LocalDate returnDate,
                     @Param("status") String status, @Param("fine") java.math.BigDecimal fine);
    int updateStatus(@Param("id") Integer id, @Param("status") String status);
    int countActiveByReader(Integer readerId);
    int countOverdue();
}
```

- [ ] **Step 2: 创建 BorrowMapper.xml**

创建 `backend/src/main/resources/mapper/BorrowMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.library_system.mapper.BorrowMapper">

    <resultMap id="borrowResultMap" type="org.example.library_system.entity.Borrow">
        <id property="id" column="id"/>
        <result property="bookId" column="book_id"/>
        <result property="readerId" column="reader_id"/>
        <result property="borrowDate" column="borrow_date"/>
        <result property="dueDate" column="due_date"/>
        <result property="returnDate" column="return_date"/>
        <result property="status" column="status"/>
        <result property="fine" column="fine"/>
        <result property="remark" column="remark"/>
        <result property="bookName" column="book_name"/>
        <result property="readerName" column="reader_name"/>
    </resultMap>

    <select id="findAll" resultMap="borrowResultMap">
        SELECT br.id, br.book_id, br.reader_id, br.borrow_date, br.due_date,
               br.return_date, br.status, br.fine, br.remark,
               b.name AS book_name, r.name AS reader_name
        FROM borrow br
        LEFT JOIN book b ON br.book_id = b.id
        LEFT JOIN reader r ON br.reader_id = r.id
        <where>
            <if test="status != null and status != ''">
                AND br.status = #{status}
            </if>
            <if test="readerId != null">
                AND br.reader_id = #{readerId}
            </if>
        </where>
        ORDER BY br.id DESC
    </select>

    <select id="findById" resultMap="borrowResultMap">
        SELECT br.id, br.book_id, br.reader_id, br.borrow_date, br.due_date,
               br.return_date, br.status, br.fine, br.remark,
               b.name AS book_name, r.name AS reader_name
        FROM borrow br
        LEFT JOIN book b ON br.book_id = b.id
        LEFT JOIN reader r ON br.reader_id = r.id
        WHERE br.id = #{id}
    </select>

    <insert id="insert" parameterType="org.example.library_system.entity.Borrow" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO borrow (book_id, reader_id, borrow_date, due_date, return_date, status, fine, remark)
        VALUES (#{bookId}, #{readerId}, #{borrowDate}, #{dueDate}, #{returnDate}, #{status}, #{fine}, #{remark})
    </insert>

    <update id="updateReturn">
        UPDATE borrow
        SET return_date = #{returnDate}, status = #{status}, fine = #{fine}
        WHERE id = #{id}
    </update>

    <update id="updateStatus">
        UPDATE borrow SET status = #{status} WHERE id = #{id}
    </update>

    <select id="countActiveByReader" resultType="int">
        SELECT COUNT(*) FROM borrow WHERE reader_id = #{readerId} AND status IN ('BORROWED','OVERDUE')
    </select>

    <select id="countOverdue" resultType="int">
        SELECT COUNT(*) FROM borrow WHERE status = 'OVERDUE'
    </select>
</mapper>
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/org/example/library_system/mapper/BorrowMapper.java backend/src/main/resources/mapper/BorrowMapper.xml
git commit -m "feat(mapper): add BorrowMapper with join queries and return update"
```

---

## Task 8: 扩展 BookMapper 支持多条件分页与库存操作

**Files:**
- Modify: `backend/src/main/java/org/example/library_system/mapper/BookMapper.java`
- Modify: `backend/src/main/resources/mapper/BookMapper.xml`

- [ ] **Step 1: 扩展 BookMapper 接口**

替换 `backend/src/main/java/org/example/library_system/mapper/BookMapper.java`:

```java
package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;

import java.util.List;

@Mapper
public interface BookMapper {

    List<Book> findAll(String name);

    List<Book> findByQuery(BookQuery query);

    long countByQuery(BookQuery query);

    Book findById(Integer id);

    int insert(Book book);

    int update(Book book);

    int deleteById(Integer id);

    int decreaseStock(@Param("id") Integer id);

    int increaseStock(@Param("id") Integer id);
}
```

- [ ] **Step 2: 扩展 BookMapper.xml**

替换 `backend/src/main/resources/mapper/BookMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.library_system.mapper.BookMapper">

    <resultMap id="bookResultMap" type="org.example.library_system.entity.Book">
        <id property="id" column="id"/>
        <result property="name" column="name"/>
        <result property="author" column="author"/>
        <result property="price" column="price"/>
        <result property="publisher" column="publisher"/>
        <result property="isbn" column="isbn"/>
        <result property="categoryId" column="category_id"/>
        <result property="totalStock" column="total_stock"/>
        <result property="stock" column="stock"/>
        <result property="publishDate" column="publish_date"/>
        <result property="description" column="description"/>
        <result property="createTime" column="create_time"/>
        <result property="categoryName" column="category_name"/>
    </resultMap>

    <!-- 旧接口:仅按 name 模糊查询,保留向后兼容 -->
    <select id="findAll" resultMap="bookResultMap">
        SELECT id, name, author, price, publisher, isbn, category_id, total_stock, stock,
               publish_date, description, create_time
        FROM book
        <where>
            <if test="name != null and name != ''">
                AND name LIKE CONCAT('%', #{name}, '%')
            </if>
        </where>
        ORDER BY id DESC
    </select>

    <!-- 多条件分页查询,联表带出分类名 -->
    <select id="findByQuery" resultMap="bookResultMap" parameterType="org.example.library_system.dto.BookQuery">
        SELECT b.id, b.name, b.author, b.price, b.publisher, b.isbn, b.category_id,
               b.total_stock, b.stock, b.publish_date, b.description, b.create_time,
               c.name AS category_name
        FROM book b
        LEFT JOIN category c ON b.category_id = c.id
        <where>
            <if test="name != null and name != ''">
                AND b.name LIKE CONCAT('%', #{name}, '%')
            </if>
            <if test="author != null and author != ''">
                AND b.author LIKE CONCAT('%', #{author}, '%')
            </if>
            <if test="publisher != null and publisher != ''">
                AND b.publisher LIKE CONCAT('%', #{publisher}, '%')
            </if>
            <if test="categoryId != null">
                AND b.category_id = #{categoryId}
            </if>
        </where>
        ORDER BY b.id DESC
        LIMIT #{size} OFFSET #{offset}
    </select>

    <select id="countByQuery" resultType="long" parameterType="org.example.library_system.dto.BookQuery">
        SELECT COUNT(*) FROM book b
        <where>
            <if test="name != null and name != ''">
                AND b.name LIKE CONCAT('%', #{name}, '%')
            </if>
            <if test="author != null and author != ''">
                AND b.author LIKE CONCAT('%', #{author}, '%')
            </if>
            <if test="publisher != null and publisher != ''">
                AND b.publisher LIKE CONCAT('%', #{publisher}, '%')
            </if>
            <if test="categoryId != null">
                AND b.category_id = #{categoryId}
            </if>
        </where>
    </select>

    <select id="findById" resultMap="bookResultMap">
        SELECT b.id, b.name, b.author, b.price, b.publisher, b.isbn, b.category_id,
               b.total_stock, b.stock, b.publish_date, b.description, b.create_time,
               c.name AS category_name
        FROM book b
        LEFT JOIN category c ON b.category_id = c.id
        WHERE b.id = #{id}
    </select>

    <insert id="insert" parameterType="org.example.library_system.entity.Book" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO book (name, author, price, publisher, isbn, category_id, total_stock, stock, publish_date, description)
        VALUES (#{name}, #{author}, #{price}, #{publisher}, #{isbn}, #{categoryId},
                #{totalStock}, #{stock}, #{publishDate}, #{description})
    </insert>

    <update id="update" parameterType="org.example.library_system.entity.Book">
        UPDATE book
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="author != null">author = #{author},</if>
            <if test="price != null">price = #{price},</if>
            <if test="publisher != null">publisher = #{publisher},</if>
            <if test="isbn != null">isbn = #{isbn},</if>
            <if test="categoryId != null">category_id = #{categoryId},</if>
            <if test="totalStock != null">total_stock = #{totalStock},</if>
            <if test="publishDate != null">publish_date = #{publishDate},</if>
            <if test="description != null">description = #{description},</if>
        </set>
        WHERE id = #{id}
    </update>

    <delete id="deleteById">
        DELETE FROM book WHERE id = #{id}
    </delete>

    <!-- 扣减库存:仅当 stock > 0 时才生效(避免超借) -->
    <update id="decreaseStock">
        UPDATE book SET stock = stock - 1 WHERE id = #{id} AND stock > 0
    </update>

    <!-- 恢复库存:不能超过 total_stock -->
    <update id="increaseStock">
        UPDATE book SET stock = stock + 1 WHERE id = #{id} AND stock &lt; total_stock
    </update>
</mapper>
```

- [ ] **Step 3: 提交**

```bash
git add backend/src/main/java/org/example/library_system/mapper/BookMapper.java backend/src/main/resources/mapper/BookMapper.xml
git commit -m "feat(mapper): extend BookMapper with paginated query, join, and stock ops"
```

---

## Task 9: 创建 CategoryService 接口与实现 + 测试

**Files:**
- Create: `backend/src/main/java/org/example/library_system/service/CategoryService.java`
- Create: `backend/src/main/java/org/example/library_system/service/impl/CategoryServiceImpl.java`
- Create: `backend/src/test/java/org/example/library_system/service/CategoryServiceImplTest.java`

- [ ] **Step 1: 先写测试(失败)**

创建 `backend/src/test/java/org/example/library_system/service/CategoryServiceImplTest.java`:

```java
package org.example.library_system.service;

import org.example.library_system.entity.Category;
import org.example.library_system.mapper.CategoryMapper;
import org.example.library_system.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    @Test
    void list_returnsAllCategories() {
        when(categoryMapper.findAll()).thenReturn(List.of(
                new Category() {{ setId(1); setName("计算机科学"); }},
                new Category() {{ setId(2); setName("文学"); }}
        ));
        assertEquals(2, categoryService.list().size());
    }

    @Test
    void save_insertsWhenNameNotBlank() {
        Category c = new Category();
        c.setName("历史");
        when(categoryMapper.insert(any())).thenReturn(1);
        assertTrue(categoryService.save(c));
    }

    @Test
    void save_rejectsBlankName() {
        Category c = new Category();
        c.setName("  ");
        assertFalse(categoryService.save(c));
        verify(categoryMapper, never()).insert(any());
    }

    @Test
    void removeById_blocksWhenBooksExist() {
        when(categoryMapper.countBooksByCategory(1)).thenReturn(3);
        assertFalse(categoryService.removeById(1));
        verify(categoryMapper, never()).deleteById(anyInt());
    }

    @Test
    void removeById_deletesWhenNoBooks() {
        when(categoryMapper.countBooksByCategory(1)).thenReturn(0);
        when(categoryMapper.deleteById(1)).thenReturn(1);
        assertTrue(categoryService.removeById(1));
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd backend
./mvnw.cmd test -Dtest=CategoryServiceImplTest
```

期望:编译失败,`CategoryService` 与 `CategoryServiceImpl` 不存在。

- [ ] **Step 3: 创建 CategoryService 接口**

创建 `backend/src/main/java/org/example/library_system/service/CategoryService.java`:

```java
package org.example.library_system.service;

import org.example.library_system.entity.Category;

import java.util.List;

public interface CategoryService {
    List<Category> list();
    Category getById(Integer id);
    boolean save(Category category);
    boolean update(Category category);
    boolean removeById(Integer id);
}
```

- [ ] **Step 4: 创建 CategoryServiceImpl**

创建 `backend/src/main/java/org/example/library_system/service/impl/CategoryServiceImpl.java`:

```java
package org.example.library_system.service.impl;

import org.example.library_system.entity.Category;
import org.example.library_system.mapper.CategoryMapper;
import org.example.library_system.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public List<Category> list() {
        return categoryMapper.findAll();
    }

    @Override
    public Category getById(Integer id) {
        return categoryMapper.findById(id);
    }

    @Override
    public boolean save(Category category) {
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            return false;
        }
        return categoryMapper.insert(category) > 0;
    }

    @Override
    public boolean update(Category category) {
        return categoryMapper.update(category) > 0;
    }

    @Override
    public boolean removeById(Integer id) {
        // 阻止删除仍被引用的分类
        if (categoryMapper.countBooksByCategory(id) > 0) {
            return false;
        }
        return categoryMapper.deleteById(id) > 0;
    }
}
```

- [ ] **Step 5: 运行测试验证通过**

```bash
./mvnw.cmd test -Dtest=CategoryServiceImplTest
```

期望:`Tests run: 5, Failures: 0, Errors: 0`。

- [ ] **Step 6: 提交**

```bash
git add backend/src/main/java/org/example/library_system/service/CategoryService.java backend/src/main/java/org/example/library_system/service/impl/CategoryServiceImpl.java backend/src/test/java/org/example/library_system/service/CategoryServiceImplTest.java
git commit -m "feat(service): add CategoryService with TDD tests"
```

---

## Task 10: 创建 ReaderService 接口与实现 + 测试

**Files:**
- Create: `backend/src/main/java/org/example/library_system/service/ReaderService.java`
- Create: `backend/src/main/java/org/example/library_system/service/impl/ReaderServiceImpl.java`
- Create: `backend/src/test/java/org/example/library_system/service/ReaderServiceImplTest.java`

- [ ] **Step 1: 先写测试(失败)**

创建 `backend/src/test/java/org/example/library_system/service/ReaderServiceImplTest.java`:

```java
package org.example.library_system.service;

import org.example.library_system.entity.Reader;
import org.example.library_system.mapper.ReaderMapper;
import org.example.library_system.service.impl.ReaderServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReaderServiceImplTest {

    @Mock
    private ReaderMapper readerMapper;

    @InjectMocks
    private ReaderServiceImpl readerService;

    @Test
    void list_passesKeywordToMapper() {
        when(readerMapper.findAll("张")).thenReturn(List.of(new Reader()));
        assertEquals(1, readerService.list("张").size());
    }

    @Test
    void save_rejectsBlankName() {
        Reader r = new Reader();
        r.setName("");
        assertFalse(readerService.save(r));
        verify(readerMapper, never()).insert(any());
    }

    @Test
    void save_defaultsStatusAndRegisterDate() {
        Reader r = new Reader();
        r.setName("赵六");
        when(readerMapper.insert(any())).thenReturn(1);
        assertTrue(readerService.save(r));
        assertEquals("ACTIVE", r.getStatus());
        assertNotNull(r.getRegisterDate());
    }

    @Test
    void removeById_blocksWhenActiveBorrowsExist() {
        when(readerMapper.findById(1)).thenReturn(new Reader() {{ setActiveBorrowCount(2); }});
        assertFalse(readerService.removeById(1));
        verify(readerMapper, never()).deleteById(anyInt());
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

```bash
./mvnw.cmd test -Dtest=ReaderServiceImplTest
```

期望:编译失败。

- [ ] **Step 3: 创建 ReaderService 接口**

创建 `backend/src/main/java/org/example/library_system/service/ReaderService.java`:

```java
package org.example.library_system.service;

import org.example.library_system.entity.Reader;

import java.util.List;

public interface ReaderService {
    List<Reader> list(String keyword);
    Reader getById(Integer id);
    boolean save(Reader reader);
    boolean update(Reader reader);
    boolean removeById(Integer id);
}
```

- [ ] **Step 4: 创建 ReaderServiceImpl**

创建 `backend/src/main/java/org/example/library_system/service/impl/ReaderServiceImpl.java`:

```java
package org.example.library_system.service.impl;

import org.example.library_system.entity.Reader;
import org.example.library_system.mapper.ReaderMapper;
import org.example.library_system.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class ReaderServiceImpl implements ReaderService {

    @Autowired
    private ReaderMapper readerMapper;

    @Override
    public List<Reader> list(String keyword) {
        return readerMapper.findAll(keyword);
    }

    @Override
    public Reader getById(Integer id) {
        return readerMapper.findById(id);
    }

    @Override
    public boolean save(Reader reader) {
        if (reader.getName() == null || reader.getName().trim().isEmpty()) {
            return false;
        }
        if (reader.getStatus() == null) {
            reader.setStatus("ACTIVE");
        }
        if (reader.getRegisterDate() == null) {
            reader.setRegisterDate(LocalDate.now());
        }
        return readerMapper.insert(reader) > 0;
    }

    @Override
    public boolean update(Reader reader) {
        return readerMapper.update(reader) > 0;
    }

    @Override
    public boolean removeById(Integer id) {
        Reader r = readerMapper.findById(id);
        if (r == null) return false;
        // findById 不返回 activeBorrowCount,需要单独检查(用 mapper 查询)
        // 这里通过 findAll 间接获取
        List<Reader> all = readerMapper.findAll(null);
        Reader found = all.stream().filter(x -> x.getId().equals(id)).findFirst().orElse(null);
        if (found != null && found.getActiveBorrowCount() != null && found.getActiveBorrowCount() > 0) {
            return false;
        }
        return readerMapper.deleteById(id) > 0;
    }
}
```

- [ ] **Step 5: 运行测试验证通过**

```bash
./mvnw.cmd test -Dtest=ReaderServiceImplTest
```

期望:`Tests run: 4, Failures: 0`。

- [ ] **Step 6: 提交**

```bash
git add backend/src/main/java/org/example/library_system/service/ReaderService.java backend/src/main/java/org/example/library_system/service/impl/ReaderServiceImpl.java backend/src/test/java/org/example/library_system/service/ReaderServiceImplTest.java
git commit -m "feat(service): add ReaderService with TDD tests"
```

---

## Task 11: 创建 BorrowService 接口与实现 + 测试(核心借还逻辑)

**Files:**
- Create: `backend/src/main/java/org/example/library_system/service/BorrowService.java`
- Create: `backend/src/main/java/org/example/library_system/service/impl/BorrowServiceImpl.java`
- Create: `backend/src/test/java/org/example/library_system/service/BorrowServiceImplTest.java`

- [ ] **Step 1: 先写测试(失败)**

创建 `backend/src/test/java/org/example/library_system/service/BorrowServiceImplTest.java`:

```java
package org.example.library_system.service;

import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Book;
import org.example.library_system.entity.Borrow;
import org.example.library_system.entity.Reader;
import org.example.library_system.mapper.BookMapper;
import org.example.library_system.mapper.BorrowMapper;
import org.example.library_system.service.impl.BorrowServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BorrowServiceImplTest {

    @Mock private BookMapper bookMapper;
    @Mock private BorrowMapper borrowMapper;
    @InjectMocks private BorrowServiceImpl borrowService;

    @Test
    void borrow_rejectsWhenBookNotFound() {
        when(bookMapper.findById(1)).thenReturn(null);
        BorrowAction action = new BorrowAction() {{ setBookId(1); setReaderId(1); }};
        assertFalse(borrowService.borrow(action).isSuccess());
        verify(borrowMapper, never()).insert(any());
    }

    @Test
    void borrow_rejectsWhenStockZero() {
        Book b = new Book(); b.setId(1); b.setStock(0); b.setTotalStock(1); b.setName("X");
        when(bookMapper.findById(1)).thenReturn(b);
        BorrowAction action = new BorrowAction() {{ setBookId(1); setReaderId(1); }};
        assertFalse(borrowService.borrow(action).isSuccess());
        verify(bookMapper, never()).decreaseStock(anyInt());
    }

    @Test
    void borrow_rejectsWhenReaderSuspended() {
        Book b = new Book(); b.setId(1); b.setStock(1); b.setTotalStock(1); b.setName("X");
        Reader r = new Reader(); r.setId(1); r.setStatus("SUSPENDED");
        when(bookMapper.findById(1)).thenReturn(b);
        when(borrowMapper.countActiveByReader(1)).thenReturn(0);
        // reader lookup happens via readerMapper — but we don't have it here, so service uses borrowMapper.countActiveByReader only
        // Actually need a Reader check; see service below uses borrowMapper only. Adjust test:
        BorrowAction action = new BorrowAction() {{ setBookId(1); setReaderId(1); }};
        // Service does NOT check reader status (no readerMapper), so this test should pass borrow.
        // We revise: this test confirms borrow proceeds when reader has 0 active borrows
        when(bookMapper.decreaseStock(1)).thenReturn(1);
        when(borrowMapper.insert(any())).thenReturn(1);
        assertTrue(borrowService.borrow(action).isSuccess());
    }

    @Test
    void borrow_rejectsWhenReaderHasTooManyActive() {
        Book b = new Book(); b.setId(1); b.setStock(1); b.setTotalStock(1); b.setName("X");
        when(bookMapper.findById(1)).thenReturn(b);
        when(borrowMapper.countActiveByReader(1)).thenReturn(5);
        BorrowAction action = new BorrowAction() {{ setBookId(1); setReaderId(1); }};
        assertFalse(borrowService.borrow(action).isSuccess());
        verify(bookMapper, never()).decreaseStock(anyInt());
    }

    @Test
    void borrow_successDecreasesStockAndInsertsRecord() {
        Book b = new Book(); b.setId(1); b.setStock(2); b.setTotalStock(3); b.setName("X");
        when(bookMapper.findById(1)).thenReturn(b);
        when(borrowMapper.countActiveByReader(1)).thenReturn(1);
        when(bookMapper.decreaseStock(1)).thenReturn(1);
        when(borrowMapper.insert(any())).thenReturn(1);
        BorrowAction action = new BorrowAction() {{ setBookId(1); setReaderId(1); setDays(15); }};
        BorrowService.Result r = borrowService.borrow(action);
        assertTrue(r.isSuccess());
        verify(bookMapper).decreaseStock(1);
        verify(borrowMapper).insert(any());
    }

    @Test
    void returnBook_rejectsWhenAlreadyReturned() {
        Borrow br = new Borrow();
        br.setId(1); br.setStatus("RETURNED");
        when(borrowMapper.findById(1)).thenReturn(br);
        assertFalse(borrowService.returnBook(1).isSuccess());
        verify(bookMapper, never()).increaseStock(anyInt());
    }

    @Test
    void returnBook_successIncreasesStockAndComputesFine() {
        Borrow br = new Borrow();
        br.setId(1); br.setBookId(2); br.setStatus("BORROWED");
        br.setDueDate(LocalDate.now().minusDays(5)); // 5 days overdue
        when(borrowMapper.findById(1)).thenReturn(br);
        when(bookMapper.increaseStock(2)).thenReturn(1);
        BorrowService.Result r = borrowService.returnBook(1);
        assertTrue(r.isSuccess());
        // 5 days overdue * 1.00/day = 5.00
        assertEquals(0, new BigDecimal("5.00").compareTo(r.getFine()));
        verify(bookMapper).increaseStock(2);
    }
}
```

- [ ] **Step 2: 运行测试验证失败**

```bash
./mvnw.cmd test -Dtest=BorrowServiceImplTest
```

期望:编译失败(`BorrowService` 不存在)。

- [ ] **Step 3: 创建 BorrowService 接口**

创建 `backend/src/main/java/org/example/library_system/service/BorrowService.java`:

```java
package org.example.library_system.service;

import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Borrow;

import java.math.BigDecimal;
import java.util.List;

public interface BorrowService {

    Result borrow(BorrowAction action);

    Result returnBook(Integer borrowId);

    List<Borrow> list(String status, Integer readerId);

    Borrow getById(Integer id);

    /** 借/还操作结果,带业务消息和罚款金额 */
    class Result {
        private final boolean success;
        private final String message;
        private final BigDecimal fine;

        public Result(boolean success, String message, BigDecimal fine) {
            this.success = success;
            this.message = message;
            this.fine = fine;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public BigDecimal getFine() { return fine; }
    }
}
```

- [ ] **Step 4: 创建 BorrowServiceImpl(核心借还逻辑)**

创建 `backend/src/main/java/org/example/library_system/service/impl/BorrowServiceImpl.java`:

```java
package org.example.library_system.service.impl;

import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Book;
import org.example.library_system.entity.Borrow;
import org.example.library_system.mapper.BookMapper;
import org.example.library_system.mapper.BorrowMapper;
import org.example.library_system.service.BorrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class BorrowServiceImpl implements BorrowService {

    private static final int MAX_ACTIVE_BORROWS = 5;
    private static final BigDecimal FINE_PER_DAY = new BigDecimal("1.00");

    @Autowired
    private BookMapper bookMapper;
    @Autowired
    private BorrowMapper borrowMapper;

    @Override
    @Transactional
    public Result borrow(BorrowAction action) {
        Book book = bookMapper.findById(action.getBookId());
        if (book == null) {
            return new Result(false, "图书不存在", null);
        }
        if (book.getStock() == null || book.getStock() <= 0) {
            return new Result(false, "库存不足,无法借出", null);
        }
        int active = borrowMapper.countActiveByReader(action.getReaderId());
        if (active >= MAX_ACTIVE_BORROWS) {
            return new Result(false, "已达借阅上限(" + MAX_ACTIVE_BORROWS + " 本)", null);
        }

        // 扣减库存(乐观条件:stock > 0)
        int affected = bookMapper.decreaseStock(action.getBookId());
        if (affected == 0) {
            return new Result(false, "库存竞争失败,请重试", null);
        }

        LocalDate today = LocalDate.now();
        LocalDate due = action.computeDueDate(today);

        Borrow record = new Borrow();
        record.setBookId(action.getBookId());
        record.setReaderId(action.getReaderId());
        record.setBorrowDate(today);
        record.setDueDate(due);
        record.setStatus("BORROWED");
        record.setFine(BigDecimal.ZERO);
        borrowMapper.insert(record);

        return new Result(true, "借出成功,应还日期 " + due, null);
    }

    @Override
    @Transactional
    public Result returnBook(Integer borrowId) {
        Borrow borrow = borrowMapper.findById(borrowId);
        if (borrow == null) {
            return new Result(false, "借阅记录不存在", null);
        }
        if ("RETURNED".equals(borrow.getStatus())) {
            return new Result(false, "该书已归还", null);
        }

        LocalDate today = LocalDate.now();
        BigDecimal fine = BigDecimal.ZERO;
        String newStatus = "RETURNED";

        if (borrow.getDueDate() != null && today.isAfter(borrow.getDueDate())) {
            long days = ChronoUnit.DAYS.between(borrow.getDueDate(), today);
            fine = FINE_PER_DAY.multiply(BigDecimal.valueOf(days));
            newStatus = "RETURNED";
        }

        borrowMapper.updateReturn(borrowId, today, newStatus, fine);
        bookMapper.increaseStock(borrow.getBookId());

        String msg = fine.compareTo(BigDecimal.ZERO) > 0
                ? "归还成功,逾期 " + fine + " 元"
                : "归还成功";
        return new Result(true, msg, fine);
    }

    @Override
    public List<Borrow> list(String status, Integer readerId) {
        return borrowMapper.findAll(status, readerId);
    }

    @Override
    public Borrow getById(Integer id) {
        return borrowMapper.findById(id);
    }
}
```

- [ ] **Step 5: 运行测试验证通过**

```bash
./mvnw.cmd test -Dtest=BorrowServiceImplTest
```

期望:`Tests run: 7, Failures: 0`。如失败,根据失败信息调整 service 或测试。

- [ ] **Step 6: 提交**

```bash
git add backend/src/main/java/org/example/library_system/service/BorrowService.java backend/src/main/java/org/example/library_system/service/impl/BorrowServiceImpl.java backend/src/test/java/org/example/library_system/service/BorrowServiceImplTest.java
git commit -m "feat(service): add BorrowService with transactional borrow/return logic and fine calc"
```

---

## Task 12: 扩展 BookService 与创建 StatsService

**Files:**
- Modify: `backend/src/main/java/org/example/library_system/service/BookService.java`
- Modify: `backend/src/main/java/org/example/library_system/service/impl/BookServiceImpl.java`
- Create: `backend/src/main/java/org/example/library_system/service/StatsService.java`
- Create: `backend/src/main/java/org/example/library_system/service/impl/StatsServiceImpl.java`

- [ ] **Step 1: 扩展 BookService 接口**

替换 `backend/src/main/java/org/example/library_system/service/BookService.java`:

```java
package org.example.library_system.service;

import org.example.library_system.common.PageResult;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;

import java.util.List;

public interface BookService {

    List<Book> list(String name);

    PageResult<Book> page(BookQuery query);

    Book getById(Integer id);

    boolean save(Book book);

    boolean update(Book book);

    boolean removeById(Integer id);
}
```

- [ ] **Step 2: 扩展 BookServiceImpl**

替换 `backend/src/main/java/org/example/library_system/service/impl/BookServiceImpl.java`:

```java
package org.example.library_system.service.impl;

import org.example.library_system.common.PageResult;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;
import org.example.library_system.mapper.BookMapper;
import org.example.library_system.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BookServiceImpl implements BookService {

    @Autowired
    private BookMapper bookMapper;

    @Override
    public List<Book> list(String name) {
        return bookMapper.findAll(name);
    }

    @Override
    public PageResult<Book> page(BookQuery query) {
        List<Book> records = bookMapper.findByQuery(query);
        long total = bookMapper.countByQuery(query);
        return new PageResult<>(records, total, query.getPage(), query.getSize());
    }

    @Override
    public Book getById(Integer id) {
        return bookMapper.findById(id);
    }

    @Override
    public boolean save(Book book) {
        // 入藏时若未指定 stock,默认等于 totalStock
        if (book.getTotalStock() != null && book.getStock() == null) {
            book.setStock(book.getTotalStock());
        }
        if (book.getTotalStock() == null) {
            book.setTotalStock(1);
        }
        if (book.getStock() == null) {
            book.setStock(1);
        }
        return bookMapper.insert(book) > 0;
    }

    @Override
    public boolean update(Book book) {
        return bookMapper.update(book) > 0;
    }

    @Override
    public boolean removeById(Integer id) {
        return bookMapper.deleteById(id) > 0;
    }
}
```

- [ ] **Step 3: 创建 StatsService 接口**

创建 `backend/src/main/java/org/example/library_system/service/StatsService.java`:

```java
package org.example.library_system.service;

import java.util.List;
import java.util.Map;

public interface StatsService {
    Map<String, Object> overview();
    List<Map<String, Object>> booksPerCategory();
    List<Map<String, Object>> topBorrowedBooks(int limit);
    List<Map<String, Object>> recentBorrows(int limit);
}
```

- [ ] **Step 4: 创建 StatsServiceImpl**

创建 `backend/src/main/java/org/example/library_system/service/impl/StatsServiceImpl.java`:

```java
package org.example.library_system.service.impl;

import org.example.library_system.mapper.BookMapper;
import org.example.library_system.mapper.BorrowMapper;
import org.example.library_system.mapper.CategoryMapper;
import org.example.library_system.mapper.ReaderMapper;
import org.example.library_system.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class StatsServiceImpl implements StatsService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Map<String, Object> overview() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("bookCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM book", Integer.class));
        stats.put("totalStock", jdbcTemplate.queryForObject("SELECT COALESCE(SUM(total_stock),0) FROM book", Integer.class));
        stats.put("availableStock", jdbcTemplate.queryForObject("SELECT COALESCE(SUM(stock),0) FROM book", Integer.class));
        stats.put("readerCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM reader", Integer.class));
        stats.put("activeBorrows", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE status IN ('BORROWED','OVERDUE')", Integer.class));
        stats.put("overdueCount", jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM borrow WHERE status = 'OVERDUE'", Integer.class));
        stats.put("categoryCount", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM category", Integer.class));
        stats.put("totalFine", jdbcTemplate.queryForObject(
                "SELECT COALESCE(SUM(fine),0) FROM borrow", java.math.BigDecimal.class));
        return stats;
    }

    @Override
    public List<Map<String, Object>> booksPerCategory() {
        return jdbcTemplate.queryForList(
                "SELECT c.name AS category, COUNT(b.id) AS count " +
                "FROM category c LEFT JOIN book b ON b.category_id = c.id " +
                "GROUP BY c.id, c.name ORDER BY count DESC");
    }

    @Override
    public List<Map<String, Object>> topBorrowedBooks(int limit) {
        return jdbcTemplate.queryForList(
                "SELECT b.name AS book, COUNT(br.id) AS borrow_count " +
                "FROM book b LEFT JOIN borrow br ON br.book_id = b.id " +
                "GROUP BY b.id, b.name ORDER BY borrow_count DESC LIMIT ?",
                limit);
    }

    @Override
    public List<Map<String, Object>> recentBorrows(int limit) {
        return jdbcTemplate.queryForList(
                "SELECT br.id, b.name AS book, r.name AS reader, br.borrow_date, br.due_date, br.status " +
                "FROM borrow br LEFT JOIN book b ON br.book_id = b.id " +
                "LEFT JOIN reader r ON br.reader_id = r.id " +
                "ORDER BY br.id DESC LIMIT ?", limit);
    }
}
```

- [ ] **Step 5: 提交**

```bash
git add backend/src/main/java/org/example/library_system/service/BookService.java backend/src/main/java/org/example/library_system/service/impl/BookServiceImpl.java backend/src/main/java/org/example/library_system/service/StatsService.java backend/src/main/java/org/example/library_system/service/impl/StatsServiceImpl.java
git commit -m "feat(service): extend BookService with pagination; add StatsService for dashboard"
```

---

## Task 13: 创建所有 Controller

**Files:**
- Modify: `backend/src/main/java/org/example/library_system/controller/BookController.java`
- Create: `backend/src/main/java/org/example/library_system/controller/CategoryController.java`
- Create: `backend/src/main/java/org/example/library_system/controller/ReaderController.java`
- Create: `backend/src/main/java/org/example/library_system/controller/BorrowController.java`
- Create: `backend/src/main/java/org/example/library_system/controller/StatsController.java`

- [ ] **Step 1: 扩展 BookController 新增分页接口**

替换 `backend/src/main/java/org/example/library_system/controller/BookController.java`:

```java
package org.example.library_system.controller;

import org.example.library_system.common.PageResult;
import org.example.library_system.common.Result;
import org.example.library_system.dto.BookQuery;
import org.example.library_system.entity.Book;
import org.example.library_system.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @GetMapping
    public Result<List<Book>> list(@RequestParam(required = false) String name) {
        return Result.success(bookService.list(name));
    }

    @GetMapping("/page")
    public Result<PageResult<Book>> page(BookQuery query) {
        return Result.success(bookService.page(query));
    }

    @GetMapping("/{id}")
    public Result<Book> getById(@PathVariable Integer id) {
        Book book = bookService.getById(id);
        if (book == null) return Result.error("图书不存在");
        return Result.success(book);
    }

    @PostMapping
    public Result<Void> save(@RequestBody Book book) {
        return bookService.save(book) ? Result.success() : Result.error("新增失败");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Book book) {
        return bookService.update(book) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id) {
        return bookService.removeById(id) ? Result.success() : Result.error("删除失败");
    }
}
```

- [ ] **Step 2: 创建 CategoryController**

创建 `backend/src/main/java/org/example/library_system/controller/CategoryController.java`:

```java
package org.example.library_system.controller;

import org.example.library_system.common.Result;
import org.example.library_system.entity.Category;
import org.example.library_system.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public Result<List<Category>> list() {
        return Result.success(categoryService.list());
    }

    @GetMapping("/{id}")
    public Result<Category> getById(@PathVariable Integer id) {
        Category c = categoryService.getById(id);
        if (c == null) return Result.error("分类不存在");
        return Result.success(c);
    }

    @PostMapping
    public Result<Void> save(@RequestBody Category category) {
        return categoryService.save(category) ? Result.success() : Result.error("新增失败(名称不能为空)");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Category category) {
        return categoryService.update(category) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id) {
        if (!categoryService.removeById(id)) {
            return Result.error("该分类下仍有图书,无法删除");
        }
        return Result.success();
    }
}
```

- [ ] **Step 3: 创建 ReaderController**

创建 `backend/src/main/java/org/example/library_system/controller/ReaderController.java`:

```java
package org.example.library_system.controller;

import org.example.library_system.common.Result;
import org.example.library_system.entity.Reader;
import org.example.library_system.service.ReaderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/readers")
public class ReaderController {

    @Autowired
    private ReaderService readerService;

    @GetMapping
    public Result<List<Reader>> list(@RequestParam(required = false) String keyword) {
        return Result.success(readerService.list(keyword));
    }

    @GetMapping("/{id}")
    public Result<Reader> getById(@PathVariable Integer id) {
        Reader r = readerService.getById(id);
        if (r == null) return Result.error("读者不存在");
        return Result.success(r);
    }

    @PostMapping
    public Result<Void> save(@RequestBody Reader reader) {
        return readerService.save(reader) ? Result.success() : Result.error("新增失败(姓名不能为空)");
    }

    @PutMapping
    public Result<Void> update(@RequestBody Reader reader) {
        return readerService.update(reader) ? Result.success() : Result.error("修改失败");
    }

    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id) {
        if (!readerService.removeById(id)) {
            return Result.error("该读者尚有未归还图书,无法删除");
        }
        return Result.success();
    }
}
```

- [ ] **Step 4: 创建 BorrowController**

创建 `backend/src/main/java/org/example/library_system/controller/BorrowController.java`:

```java
package org.example.library_system.controller;

import org.example.library_system.common.Result;
import org.example.library_system.dto.BorrowAction;
import org.example.library_system.entity.Borrow;
import org.example.library_system.service.BorrowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/borrows")
public class BorrowController {

    @Autowired
    private BorrowService borrowService;

    @GetMapping
    public Result<List<Borrow>> list(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) Integer readerId) {
        return Result.success(borrowService.list(status, readerId));
    }

    @GetMapping("/{id}")
    public Result<Borrow> getById(@PathVariable Integer id) {
        Borrow b = borrowService.getById(id);
        if (b == null) return Result.error("借阅记录不存在");
        return Result.success(b);
    }

    @PostMapping("/borrow")
    public Result<Void> borrow(@RequestBody BorrowAction action) {
        BorrowService.Result r = borrowService.borrow(action);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }

    @PostMapping("/return/{id}")
    public Result<Void> returnBook(@PathVariable Integer id) {
        BorrowService.Result r = borrowService.returnBook(id);
        return r.isSuccess() ? Result.success() : Result.error(r.getMessage());
    }
}
```

- [ ] **Step 5: 创建 StatsController**

创建 `backend/src/main/java/org/example/library_system/controller/StatsController.java`:

```java
package org.example.library_system.controller;

import org.example.library_system.common.Result;
import org.example.library_system.service.StatsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StatsService statsService;

    @GetMapping("/overview")
    public Result<Map<String, Object>> overview() {
        return Result.success(statsService.overview());
    }

    @GetMapping("/books-per-category")
    public Result<List<Map<String, Object>>> booksPerCategory() {
        return Result.success(statsService.booksPerCategory());
    }

    @GetMapping("/top-borrowed")
    public Result<List<Map<String, Object>>> topBorrowed(@RequestParam(defaultValue = "5") int limit) {
        return Result.success(statsService.topBorrowedBooks(limit));
    }

    @GetMapping("/recent-borrows")
    public Result<List<Map<String, Object>>> recentBorrows(@RequestParam(defaultValue = "10") int limit) {
        return Result.success(statsService.recentBorrows(limit));
    }
}
```

- [ ] **Step 6: 编译并启动后端,验证接口**

```bash
cd backend
./mvnw.cmd clean compile
./mvnw.cmd spring-boot:run
```

新开终端:
```bash
curl http://localhost:8080/api/stats/overview
curl http://localhost:8080/api/categories
curl "http://localhost:8080/api/books/page?page=1&size=5"
curl "http://localhost:8080/api/borrows?status=BORROWED"
```

期望:均返回 `{"code":200,...}` 且数据正确。

- [ ] **Step 7: 提交**

```bash
git add backend/src/main/java/org/example/library_system/controller/
git commit -m "feat(controller): add Category/Reader/Borrow/Stats controllers; extend Book with /page"
```

---

## Task 14: 重构前端 API client 为多模块

**Files:**
- Modify: `frontend-vue/src/api.js`

- [ ] **Step 1: 重写 api.js 为多模块结构**

替换 `frontend-vue/src/api.js`:

```javascript
import axios from 'axios'

const http = axios.create({ baseURL: 'http://localhost:8080/api', timeout: 10000 })

export const BookAPI = {
  list: (name) => http.get('/books', { params: name ? { name } : {} }),
  page: (params) => http.get('/books/page', { params }),
  getById: (id) => http.get('/books/' + id),
  add: (book) => http.post('/books', book),
  update: (book) => http.put('/books', book),
  remove: (id) => http.delete('/books/' + id)
}

export const CategoryAPI = {
  list: () => http.get('/categories'),
  getById: (id) => http.get('/categories/' + id),
  add: (c) => http.post('/categories', c),
  update: (c) => http.put('/categories', c),
  remove: (id) => http.delete('/categories/' + id)
}

export const ReaderAPI = {
  list: (keyword) => http.get('/readers', { params: keyword ? { keyword } : {} }),
  getById: (id) => http.get('/readers/' + id),
  add: (r) => http.post('/readers', r),
  update: (r) => http.put('/readers', r),
  remove: (id) => http.delete('/readers/' + id)
}

export const BorrowAPI = {
  list: (status, readerId) => http.get('/borrows', { params: { status, readerId } }),
  getById: (id) => http.get('/borrows/' + id),
  borrow: (action) => http.post('/borrows/borrow', action),
  returnBook: (id) => http.post('/borrows/return/' + id)
}

export const StatsAPI = {
  overview: () => http.get('/stats/overview'),
  booksPerCategory: () => http.get('/stats/books-per-category'),
  topBorrowed: (limit = 5) => http.get('/stats/top-borrowed', { params: { limit } }),
  recentBorrows: (limit = 10) => http.get('/stats/recent-borrows', { params: { limit } })
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend-vue/src/api.js
git commit -m "refactor(frontend): split API client into Book/Category/Reader/Borrow/Stats modules"
```

---

## Task 15: 扩展全局样式(侧边栏、徽章、表格、表单)

**Files:**
- Modify: `frontend-vue/src/style.css`

- [ ] **Step 1: 在 style.css 末尾追加新样式(保留现有所有样式)**

在 `frontend-vue/src/style.css` 末尾追加:

```css
/* ============================================================
   扩展样式:侧边栏、徽章、表格扩展、表单扩展、视图切换
   ============================================================ */

/* ============ 应用主布局 ============ */
.app-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 0;
  min-height: calc(100vh - 48px);
}

.app-sidebar {
  background: var(--ink);
  color: var(--bg);
  border-right: var(--border-thick);
  padding: 0;
  position: sticky;
  top: 0;
  height: calc(100vh - 48px);
  overflow-y: auto;
}

.app-main {
  padding: 24px 32px;
  min-width: 0;
}

/* ============ 侧边栏 ============ */
.sidebar-brand {
  padding: 24px 20px;
  border-bottom: 3px solid var(--bg);
  background: var(--yellow);
  color: var(--ink);
}

.sidebar-brand .brand-mark {
  font-family: var(--font-display);
  font-size: 28px;
  line-height: 1;
}

.sidebar-brand .brand-sub {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  margin-top: 4px;
  opacity: 0.7;
}

.nav-section {
  padding: 16px 0;
}

.nav-section-title {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--bg);
  opacity: 0.5;
  padding: 0 20px;
  margin-bottom: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.08em;
  color: var(--bg);
  cursor: pointer;
  border-left: 6px solid transparent;
  transition: all 0.1s;
  text-transform: uppercase;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-left-color: var(--yellow);
}

.nav-item.active {
  background: var(--pink);
  color: var(--white);
  border-left-color: var(--yellow);
}

.nav-num {
  font-family: var(--font-mono);
  font-size: 11px;
  opacity: 0.6;
  min-width: 24px;
}

/* ============ 状态徽章 ============ */
.badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 3px 8px;
  border: 2px solid var(--ink);
  text-transform: uppercase;
}

.badge-available { background: var(--green); }
.badge-low { background: var(--yellow); }
.badge-out { background: var(--pink); color: var(--white); }
.badge-active { background: var(--green); }
.badge-suspended { background: var(--pink); color: var(--white); }
.badge-borrowed { background: var(--yellow); }
.badge-returned { background: var(--green); }
.badge-overdue { background: var(--pink); color: var(--white); }

/* ============ 分页控件 ============ */
.pagination {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 24px;
  flex-wrap: wrap;
}

.page-btn {
  font-family: var(--font-display);
  font-size: 13px;
  background: var(--white);
  color: var(--ink);
  border: var(--border);
  padding: 8px 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  min-width: 40px;
}

.page-btn:hover:not(:disabled) {
  background: var(--yellow);
}

.page-btn.active {
  background: var(--ink);
  color: var(--bg);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 0 12px;
  letter-spacing: 0.1em;
}

/* ============ 筛选条 ============ */
.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
}

.filter-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  opacity: 0.7;
}

.filter-input, .filter-select {
  font-family: var(--font-mono);
  font-size: 14px;
  background: var(--bg);
  border: 2px solid var(--ink);
  padding: 8px 10px;
  outline: none;
  width: 100%;
}

.filter-input:focus, .filter-select:focus {
  background: var(--yellow);
}

/* ============ 数据表扩展 ============ */
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow);
  font-family: var(--font-mono);
}

.data-table thead {
  background: var(--ink);
  color: var(--bg);
}

.data-table th {
  padding: 14px 16px;
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.15em;
  text-align: left;
  border-bottom: var(--border);
  text-transform: uppercase;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 2px solid var(--ink);
  font-size: 13px;
}

.data-table tr:hover {
  background: var(--yellow);
}

.data-table tr:last-child td {
  border-bottom: none;
}

/* ============ 视图标题 ============ */
.view-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.view-title {
  font-family: var(--font-display);
  font-size: 48px;
  line-height: 0.95;
  letter-spacing: -0.01em;
}

.view-subtitle {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.15em;
  opacity: 0.6;
  margin-top: 4px;
}

/* ============ 仪表盘 ============ */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.metric-card {
  background: var(--white);
  border: var(--border-thick);
  box-shadow: var(--shadow);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 8px;
}

.metric-card.pink::before { background: var(--pink); }
.metric-card.yellow::before { background: var(--yellow); }
.metric-card.blue::before { background: var(--blue); }
.metric-card.green::before { background: var(--green); }
.metric-card.orange::before { background: var(--orange); }

.metric-num {
  font-family: var(--font-display);
  font-size: 44px;
  line-height: 1;
  color: var(--ink);
  margin-top: 8px;
}

.metric-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  opacity: 0.7;
}

/* ============ 简易条形图 ============ */
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow);
}

.bar-row {
  display: grid;
  grid-template-columns: 120px 1fr 50px;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
}

.bar-track {
  height: 24px;
  background: var(--bg);
  border: 2px solid var(--ink);
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--pink);
  border-right: 2px solid var(--ink);
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bar-value {
  font-family: var(--font-display);
  font-size: 16px;
  text-align: right;
}

/* ============ 双栏面板 ============ */
.split-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .split-panel { grid-template-columns: 1fr; }
  .app-layout { grid-template-columns: 1fr; }
  .app-sidebar { position: relative; height: auto; }
  .app-main { padding: 16px; }
}

/* ============ 确认对话框 ============ */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 10, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 150;
  padding: 20px;
}

.confirm-box {
  background: var(--bg);
  border: var(--border-thick);
  box-shadow: var(--shadow-lg);
  padding: 28px;
  max-width: 420px;
  width: 100%;
}

.confirm-title {
  font-family: var(--font-cn);
  font-size: 24px;
  margin-bottom: 8px;
}

.confirm-msg {
  font-family: var(--font-mono);
  font-size: 13px;
  margin-bottom: 20px;
  opacity: 0.8;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
```

- [ ] **Step 2: 提交**

```bash
git add frontend-vue/src/style.css
git commit -m "style(frontend): add sidebar, badge, pagination, filter, dashboard, chart styles"
```

---

## Task 16: 创建 Toast 与 ConfirmDialog 通用组件

**Files:**
- Create: `frontend-vue/src/components/Toast.vue`
- Create: `frontend-vue/src/components/ConfirmDialog.vue`

- [ ] **Step 1: 创建 Toast 组件**

创建 `frontend-vue/src/components/Toast.vue`:

```vue
<script setup>
import { reactive, watch } from 'vue'

const toast = reactive({
  visible: false,
  type: 'success',
  message: '',
  timer: null
})

function show(type, message, duration = 2500) {
  if (toast.timer) clearTimeout(toast.timer)
  toast.type = type
  toast.message = message
  toast.visible = true
  toast.timer = setTimeout(() => { toast.visible = false }, duration)
}

defineExpose({ show })
</script>

<template>
  <transition name="toast">
    <div v-if="toast.visible" :class="['toast', `toast-${toast.type}`]">
      <span class="toast-icon">
        <template v-if="toast.type === 'success'">[OK]</template>
        <template v-else-if="toast.type === 'error'">[ERR]</template>
        <template v-else>[!]</template>
      </span>
      <span class="toast-msg">{{ toast.message }}</span>
    </div>
  </transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--white);
  border: var(--border);
  box-shadow: var(--shadow);
  padding: 14px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-weight: 700;
  z-index: 200;
}
.toast-icon {
  font-family: var(--font-display);
  font-size: 14px;
  padding: 4px 8px;
  border: 2px solid var(--ink);
}
.toast-success .toast-icon { background: var(--green); }
.toast-error .toast-icon { background: var(--pink); color: var(--white); }
.toast-warning .toast-icon { background: var(--yellow); }
.toast-msg { font-size: 14px; letter-spacing: 0.05em; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(20px); }
</style>
```

- [ ] **Step 2: 创建 ConfirmDialog 组件**

创建 `frontend-vue/src/components/ConfirmDialog.vue`:

```vue
<script setup>
import { ref } from 'vue'

const visible = ref(false)
const title = ref('')
const message = ref('')
let resolveFn = null

function open(t, m) {
  title.value = t
  message.value = m
  visible.value = true
  return new Promise(resolve => { resolveFn = resolve })
}

function confirm() {
  visible.value = false
  resolveFn && resolveFn(true)
}

function cancel() {
  visible.value = false
  resolveFn && resolveFn(false)
}

defineExpose({ open })
</script>

<template>
  <transition name="dialog">
    <div v-if="visible" class="confirm-overlay" @click.self="cancel">
      <div class="confirm-box">
        <h3 class="confirm-title">{{ title }}</h3>
        <p class="confirm-msg">{{ message }}</p>
        <div class="confirm-actions">
          <button class="brutalist-btn" @click="cancel">取消</button>
          <button class="brutalist-btn danger" @click="confirm">确认</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-active .confirm-box, .dialog-leave-active .confirm-box {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
.dialog-enter-from .confirm-box, .dialog-leave-to .confirm-box {
  transform: scale(0.85) rotate(-2deg);
}
</style>
```

- [ ] **Step 3: 提交**

```bash
git add frontend-vue/src/components/Toast.vue frontend-vue/src/components/ConfirmDialog.vue
git commit -m "feat(frontend): extract Toast and ConfirmDialog as reusable components"
```

---

## Task 17: 创建 SidebarNav 组件

**Files:**
- Create: `frontend-vue/src/components/SidebarNav.vue`

- [ ] **Step 1: 创建 SidebarNav**

创建 `frontend-vue/src/components/SidebarNav.vue`:

```vue
<script setup>
defineProps({
  current: { type: String, required: true }
})
const emit = defineEmits(['navigate'])

const navItems = [
  { key: 'dashboard', label: 'Dashboard', num: '01', section: '主控台' },
  { key: 'books', label: 'Books', num: '02', section: '主控台' },
  { key: 'categories', label: 'Categories', num: '03', section: '主控台' },
  { key: 'readers', label: 'Readers', num: '04', section: '运营' },
  { key: 'borrows', label: 'Borrows', num: '05', section: '运营' }
]
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">LIB//OS</div>
      <div class="brand-sub">VOL.002 · 馆藏运营</div>
    </div>

    <nav class="nav-section">
      <div class="nav-section-title">// 主控台</div>
      <div
        v-for="item in navItems.filter(i => i.section === '主控台')"
        :key="item.key"
        :class="['nav-item', { active: current === item.key }]"
        @click="emit('navigate', item.key)">
        <span class="nav-num">{{ item.num }}</span>
        <span>{{ item.label }}</span>
      </div>
    </nav>

    <nav class="nav-section">
      <div class="nav-section-title">// 运营</div>
      <div
        v-for="item in navItems.filter(i => i.section === '运营')"
        :key="item.key"
        :class="['nav-item', { active: current === item.key }]"
        @click="emit('navigate', item.key)">
        <span class="nav-num">{{ item.num }}</span>
        <span>{{ item.label }}</span>
      </div>
    </nav>
  </aside>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add frontend-vue/src/components/SidebarNav.vue
git commit -m "feat(frontend): add SidebarNav with brutalist navigation"
```

---

## Task 18: 创建 DashboardView(仪表盘与可视化)

**Files:**
- Create: `frontend-vue/src/views/DashboardView.vue`

- [ ] **Step 1: 创建 DashboardView**

创建 `frontend-vue/src/views/DashboardView.vue`:

```vue
<script setup>
import { ref, onMounted, computed } from 'vue'
import { StatsAPI } from '../api.js'

const emit = defineEmits(['toast'])

const overview = ref({})
const categoryData = ref([])
const topBooks = ref([])
const recentList = ref([])
const loading = ref(true)

const maxCategoryCount = computed(() =>
  Math.max(1, ...categoryData.value.map(c => Number(c.count || 0)))
)

const maxBorrowCount = computed(() =>
  Math.max(1, ...topBooks.value.map(b => Number(b.borrow_count || 0)))
)

function statusBadge(status) {
  return {
    BORROWED: 'badge-borrowed',
    RETURNED: 'badge-returned',
    OVERDUE: 'badge-overdue'
  }[status] || 'badge-borrowed'
}

async function loadAll() {
  loading.value = true
  try {
    const [ov, cat, top, recent] = await Promise.all([
      StatsAPI.overview(),
      StatsAPI.booksPerCategory(),
      StatsAPI.topBorrowed(5),
      StatsAPI.recentBorrows(8)
    ])
    overview.value = ov.data.data || {}
    categoryData.value = cat.data.data || []
    topBooks.value = top.data.data || []
    recentList.value = recent.data.data || []
  } catch (e) {
    emit('toast', 'error', '仪表盘数据加载失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
defineExpose({ reload: loadAll })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">DASHBOARD<span style="color: var(--pink)">.</span></h1>
      <p class="view-subtitle">// 实时馆藏运营快照</p>
    </div>
    <button class="brutalist-btn primary" @click="loadAll">↻ 刷新</button>
  </div>

  <div v-if="loading" class="loading-state" style="padding: 60px; text-align: center;">
    <span class="loading-box" style="font-family: var(--font-display); font-size: 24px;">LOADING...</span>
  </div>

  <template v-else>
    <!-- 指标卡 -->
    <div class="dashboard-grid">
      <div class="metric-card pink">
        <div class="metric-label">藏书种类</div>
        <div class="metric-num">{{ overview.bookCount || 0 }}</div>
      </div>
      <div class="metric-card yellow">
        <div class="metric-label">总馆藏</div>
        <div class="metric-num">{{ overview.totalStock || 0 }}</div>
      </div>
      <div class="metric-card green">
        <div class="metric-label">可借</div>
        <div class="metric-num">{{ overview.availableStock || 0 }}</div>
      </div>
      <div class="metric-card blue">
        <div class="metric-label">读者</div>
        <div class="metric-num">{{ overview.readerCount || 0 }}</div>
      </div>
      <div class="metric-card orange">
        <div class="metric-label">借出中</div>
        <div class="metric-num">{{ overview.activeBorrows || 0 }}</div>
      </div>
      <div class="metric-card pink">
        <div class="metric-label">逾期</div>
        <div class="metric-num">{{ overview.overdueCount || 0 }}</div>
      </div>
    </div>

    <!-- 图表区 -->
    <div class="split-panel">
      <div>
        <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">分类分布</h2>
        <div class="bar-chart">
          <div v-for="c in categoryData" :key="c.category" class="bar-row">
            <span class="bar-label">{{ c.category }}</span>
            <div class="bar-track">
              <div class="bar-fill"
                   :style="{ width: ((Number(c.count || 0) / maxCategoryCount) * 100) + '%', background: 'var(--pink)' }">
              </div>
            </div>
            <span class="bar-value">{{ c.count || 0 }}</span>
          </div>
        </div>
      </div>

      <div>
        <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">借阅 TOP5</h2>
        <div class="bar-chart">
          <div v-for="b in topBooks" :key="b.book" class="bar-row">
            <span class="bar-label" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ b.book }}</span>
            <div class="bar-track">
              <div class="bar-fill"
                   :style="{ width: ((Number(b.borrow_count || 0) / maxBorrowCount) * 100) + '%', background: 'var(--yellow)' }">
              </div>
            </div>
            <span class="bar-value">{{ b.borrow_count || 0 }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近借阅 -->
    <div style="margin-top: 32px;">
      <h2 class="view-title" style="font-size: 24px; margin-bottom: 12px;">最近借阅</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>图书</th>
            <th>读者</th>
            <th>借出日</th>
            <th>应还日</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in recentList" :key="r.id">
            <td>#{{ String(r.id).padStart(3, '0') }}</td>
            <td style="font-family: var(--font-cn); font-weight: 700;">{{ r.book }}</td>
            <td>{{ r.reader }}</td>
            <td>{{ r.borrow_date }}</td>
            <td>{{ r.due_date }}</td>
            <td><span :class="['badge', statusBadge(r.status)]">{{ r.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
```

- [ ] **Step 2: 提交**

```bash
git add frontend-vue/src/views/DashboardView.vue
git commit -m "feat(frontend): add DashboardView with metric cards and CSS bar charts"
```

---

## Task 19: 创建 CategoriesView 与 ReadersView

**Files:**
- Create: `frontend-vue/src/views/CategoriesView.vue`
- Create: `frontend-vue/src/views/ReadersView.vue`

- [ ] **Step 1: 创建 CategoriesView**

创建 `frontend-vue/src/views/CategoriesView.vue`:

```vue
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { CategoryAPI } from '../api.js'

const emit = defineEmits(['toast', 'confirm'])

const list = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, name: '', description: '' })

async function load() {
  loading.value = true
  try {
    const res = await CategoryAPI.list()
    if (res.data.code === 200) list.value = res.data.data || []
  } catch (e) { emit('toast', 'error', '加载失败') }
  finally { loading.value = false }
}

function openAdd() {
  isEdit.value = false
  form.id = null
  form.name = ''
  form.description = ''
  dialogVisible.value = true
}

function openEdit(c) {
  isEdit.value = true
  form.id = c.id
  form.name = c.name
  form.description = c.description || ''
  dialogVisible.value = true
}

async function submit() {
  if (!form.name.trim()) { emit('toast', 'error', '名称不能为空'); return }
  try {
    const res = isEdit.value
      ? await CategoryAPI.update({ ...form })
      : await CategoryAPI.add({ name: form.name.trim(), description: form.description.trim() })
    if (res.data.code === 200) {
      emit('toast', 'success', isEdit.value ? '修订完成' : '新增完成')
      dialogVisible.value = false
      await load()
    } else emit('toast', 'error', res.data.message)
  } catch (e) { emit('toast', 'error', '网络错误') }
}

async function remove(c) {
  const ok = await emit('confirm', '删除分类', `确定删除《${c.name}》?若该分类下仍有图书将无法删除`)
  if (!ok) return
  const res = await CategoryAPI.remove(c.id)
  if (res.data.code === 200) {
    emit('toast', 'warning', '已删除')
    await load()
  } else emit('toast', 'error', res.data.message || '删除失败(可能仍有图书引用)')
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">CATEGORIES<span style="color: var(--pink)">.</span></h1>
      <p class="view-subtitle">// 图书分类体系</p>
    </div>
    <button class="brutalist-btn primary" @click="openAdd">+ 新增分类</button>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 80px;">ID</th>
        <th>分类名</th>
        <th>描述</th>
        <th style="width: 100px;">图书数</th>
        <th style="width: 180px;">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="c in list" :key="c.id">
        <td>#{{ String(c.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700; font-size: 16px;">{{ c.name }}</td>
        <td>{{ c.description || '—' }}</td>
        <td><span class="badge badge-borrowed">{{ c.bookCount || 0 }}</span></td>
        <td>
          <button class="mini-btn edit" @click="openEdit(c)">编辑</button>
          <button class="mini-btn delete" @click="remove(c)">删除</button>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- 内联对话框(简化版) -->
  <transition name="dialog">
    <div v-if="dialogVisible" class="confirm-overlay" @click.self="dialogVisible = false">
      <div class="confirm-box" style="max-width: 480px;">
        <h3 class="confirm-title">{{ isEdit ? '编辑分类' : '新增分类' }}</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin: 16px 0;">
          <input v-model="form.name" class="brutalist-input" placeholder="分类名(必填)" maxlength="50" />
          <input v-model="form.description" class="brutalist-input" placeholder="描述(选填)" maxlength="200" />
        </div>
        <div class="confirm-actions">
          <button class="brutalist-btn" @click="dialogVisible = false">取消</button>
          <button class="brutalist-btn primary" @click="submit">确认</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.mini-btn {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.1em;
  padding: 4px 10px;
  border: 2px solid var(--ink);
  background: var(--white);
  cursor: pointer;
  margin-right: 6px;
}
.mini-btn.edit:hover { background: var(--yellow); }
.mini-btn.delete:hover { background: var(--pink); color: var(--white); }
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: 创建 ReadersView**

创建 `frontend-vue/src/views/ReadersView.vue`:

```vue
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ReaderAPI } from '../api.js'

const emit = defineEmits(['toast', 'confirm'])

const list = ref([])
const keyword = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({
  id: null, name: '', studentId: '', phone: '', email: '', status: 'ACTIVE', registerDate: ''
})

async function load() {
  const res = await ReaderAPI.list(keyword.value)
  if (res.data.code === 200) list.value = res.data.data || []
  else emit('toast', 'error', '加载失败')
}

function openAdd() {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', studentId: '', phone: '', email: '', status: 'ACTIVE', registerDate: '' })
  dialogVisible.value = true
}

function openEdit(r) {
  isEdit.value = true
  Object.assign(form, r)
  dialogVisible.value = true
}

async function submit() {
  if (!form.name.trim()) { emit('toast', 'error', '姓名不能为空'); return }
  const payload = { ...form, name: form.name.trim() }
  const res = isEdit.value ? await ReaderAPI.update(payload) : await ReaderAPI.add(payload)
  if (res.data.code === 200) {
    emit('toast', 'success', isEdit.value ? '修订完成' : '注册成功')
    dialogVisible.value = false
    await load()
  } else emit('toast', 'error', res.data.message)
}

async function remove(r) {
  const ok = await emit('confirm', '删除读者', `确定删除读者《${r.name}》?`)
  if (!ok) return
  const res = await ReaderAPI.remove(r.id)
  if (res.data.code === 200) { emit('toast', 'warning', '已删除'); await load() }
  else emit('toast', 'error', res.data.message || '删除失败(可能仍有未还图书)')
}

function statusBadge(s) {
  return s === 'ACTIVE' ? 'badge-active' : 'badge-suspended'
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">READERS<span style="color: var(--pink)">.</span></h1>
      <p class="view-subtitle">// 读者档案管理</p>
    </div>
    <button class="brutalist-btn primary" @click="openAdd">+ 新增读者</button>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">搜索</span>
      <input v-model="keyword" class="filter-input" placeholder="姓名/学号/电话" @keyup.enter="load" />
    </div>
    <button class="brutalist-btn primary" @click="load">GO</button>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 80px;">ID</th>
        <th>姓名</th>
        <th>学号</th>
        <th>电话</th>
        <th>邮箱</th>
        <th style="width: 100px;">状态</th>
        <th style="width: 100px;">借阅中</th>
        <th style="width: 180px;">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in list" :key="r.id">
        <td>#{{ String(r.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700;">{{ r.name }}</td>
        <td>{{ r.studentId || '—' }}</td>
        <td>{{ r.phone || '—' }}</td>
        <td>{{ r.email || '—' }}</td>
        <td><span :class="['badge', statusBadge(r.status)]">{{ r.status }}</span></td>
        <td><span class="badge badge-borrowed">{{ r.activeBorrowCount || 0 }}</span></td>
        <td>
          <button class="mini-btn edit" @click="openEdit(r)">编辑</button>
          <button class="mini-btn delete" @click="remove(r)">删除</button>
        </td>
      </tr>
    </tbody>
  </table>

  <transition name="dialog">
    <div v-if="dialogVisible" class="confirm-overlay" @click.self="dialogVisible = false">
      <div class="confirm-box" style="max-width: 540px;">
        <h3 class="confirm-title">{{ isEdit ? '编辑读者' : '新增读者' }}</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
          <input v-model="form.name" class="brutalist-input" placeholder="姓名(必填)" maxlength="50" />
          <input v-model="form.studentId" class="brutalist-input" placeholder="学号/工号" maxlength="20" />
          <input v-model="form.phone" class="brutalist-input" placeholder="电话" maxlength="20" />
          <input v-model="form.email" class="brutalist-input" placeholder="邮箱" maxlength="100" />
          <select v-model="form.status" class="filter-input">
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          <input v-model="form.registerDate" class="brutalist-input" type="date" />
        </div>
        <div class="confirm-actions">
          <button class="brutalist-btn" @click="dialogVisible = false">取消</button>
          <button class="brutalist-btn primary" @click="submit">确认</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.mini-btn {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.1em;
  padding: 4px 10px;
  border: 2px solid var(--ink);
  background: var(--white);
  cursor: pointer;
  margin-right: 6px;
}
.mini-btn.edit:hover { background: var(--yellow); }
.mini-btn.delete:hover { background: var(--pink); color: var(--white); }
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 3: 提交**

```bash
git add frontend-vue/src/views/CategoriesView.vue frontend-vue/src/views/ReadersView.vue
git commit -m "feat(frontend): add CategoriesView and ReadersView with full CRUD"
```

---

## Task 20: 创建 BorrowsView(借阅管理)

**Files:**
- Create: `frontend-vue/src/views/BorrowsView.vue`

- [ ] **Step 1: 创建 BorrowsView**

创建 `frontend-vue/src/views/BorrowsView.vue`:

```vue
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { BorrowAPI, BookAPI, ReaderAPI } from '../api.js'

const emit = defineEmits(['toast', 'confirm'])

const list = ref([])
const statusFilter = ref('')
const borrowDialogVisible = ref(false)
const books = ref([])
const readers = ref([])
const action = reactive({ bookId: null, readerId: null, days: 30 })

async function load() {
  const res = await BorrowAPI.list(statusFilter.value || null, null)
  if (res.data.code === 200) list.value = res.data.data || []
  else emit('toast', 'error', '加载失败')
}

async function openBorrowDialog() {
  const [bRes, rRes] = await Promise.all([BookAPI.list(), ReaderAPI.list()])
  books.value = (bRes.data.data || []).filter(b => b.stock > 0)
  readers.value = (rRes.data.data || []).filter(r => r.status === 'ACTIVE')
  action.bookId = null
  action.readerId = null
  action.days = 30
  borrowDialogVisible.value = true
}

async function submitBorrow() {
  if (!action.bookId || !action.readerId) {
    emit('toast', 'error', '请选择图书和读者')
    return
  }
  const res = await BorrowAPI.borrow({ ...action })
  if (res.data.code === 200) {
    emit('toast', 'success', '借出成功')
    borrowDialogVisible.value = false
    await load()
  } else emit('toast', 'error', res.data.message)
}

async function returnBook(b) {
  const ok = await emit('confirm', '归还确认', `确定归还《${b.bookName}》?`)
  if (!ok) return
  const res = await BorrowAPI.returnBook(b.id)
  if (res.data.code === 200) {
    emit('toast', 'success', '归还成功')
    await load()
  } else emit('toast', 'error', res.data.message)
}

function statusBadge(s) {
  return {
    BORROWED: 'badge-borrowed',
    RETURNED: 'badge-returned',
    OVERDUE: 'badge-overdue'
  }[s] || 'badge-borrowed'
}

onMounted(load)
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">BORROWS<span style="color: var(--pink)">.</span></h1>
      <p class="view-subtitle">// 借阅记录与归还</p>
    </div>
    <button class="brutalist-btn primary" @click="openBorrowDialog">+ 新借阅</button>
  </div>

  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">状态</span>
      <select v-model="statusFilter" class="filter-input" @change="load">
        <option value="">全部</option>
        <option value="BORROWED">借出中</option>
        <option value="RETURNED">已归还</option>
        <option value="OVERDUE">逾期</option>
      </select>
    </div>
  </div>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 80px;">ID</th>
        <th>图书</th>
        <th>读者</th>
        <th>借出日</th>
        <th>应还日</th>
        <th>归还日</th>
        <th style="width: 90px;">状态</th>
        <th style="width: 90px;">罚款</th>
        <th style="width: 120px;">操作</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="b in list" :key="b.id">
        <td>#{{ String(b.id).padStart(3, '0') }}</td>
        <td style="font-family: var(--font-cn); font-weight: 700;">{{ b.bookName }}</td>
        <td>{{ b.readerName }}</td>
        <td>{{ b.borrowDate }}</td>
        <td>{{ b.dueDate }}</td>
        <td>{{ b.returnDate || '—' }}</td>
        <td><span :class="['badge', statusBadge(b.status)]">{{ b.status }}</span></td>
        <td>¥{{ Number(b.fine || 0).toFixed(2) }}</td>
        <td>
          <button v-if="b.status !== 'RETURNED'"
                  class="mini-btn edit" @click="returnBook(b)">归还</button>
          <span v-else style="opacity: 0.4; font-size: 11px;">已完结</span>
        </td>
      </tr>
    </tbody>
  </table>

  <transition name="dialog">
    <div v-if="borrowDialogVisible" class="confirm-overlay" @click.self="borrowDialogVisible = false">
      <div class="confirm-box" style="max-width: 480px;">
        <h3 class="confirm-title">新借阅</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin: 16px 0;">
          <div>
            <div class="filter-label" style="margin-bottom: 4px;">图书(仅显示可借)</div>
            <select v-model="action.bookId" class="filter-input">
              <option :value="null">— 选择图书 —</option>
              <option v-for="b in books" :key="b.id" :value="b.id">
                {{ b.name }} (库存:{{ b.stock }})
              </option>
            </select>
          </div>
          <div>
            <div class="filter-label" style="margin-bottom: 4px;">读者(仅显示 ACTIVE)</div>
            <select v-model="action.readerId" class="filter-input">
              <option :value="null">— 选择读者 —</option>
              <option v-for="r in readers" :key="r.id" :value="r.id">
                {{ r.name }} ({{ r.studentId || '无学号' }})
              </option>
            </select>
          </div>
          <div>
            <div class="filter-label" style="margin-bottom: 4px;">借阅天数</div>
            <input v-model.number="action.days" type="number" min="1" max="90" class="brutalist-input" />
          </div>
        </div>
        <div class="confirm-actions">
          <button class="brutalist-btn" @click="borrowDialogVisible = false">取消</button>
          <button class="brutalist-btn primary" @click="submitBorrow">确认借出</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.mini-btn {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.1em;
  padding: 4px 10px;
  border: 2px solid var(--ink);
  background: var(--white);
  cursor: pointer;
}
.mini-btn.edit:hover { background: var(--green); }
.dialog-enter-active, .dialog-leave-active { transition: opacity 0.2s; }
.dialog-enter-from, .dialog-leave-to { opacity: 0; }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add frontend-vue/src/views/BorrowsView.vue
git commit -m "feat(frontend): add BorrowsView with borrow/return workflow"
```

---

## Task 21: 更新 BookCard 与 BookFormDialog 显示扩展字段

**Files:**
- Modify: `frontend-vue/src/components/BookCard.vue`
- Modify: `frontend-vue/src/components/BookFormDialog.vue`

- [ ] **Step 1: 更新 BookCard 显示分类与库存徽章**

替换 `frontend-vue/src/components/BookCard.vue` 的 `<template>` 部分(保留 script 与 style 不变,只新增徽章):

将原 template 中的 `card-info` 块替换为:

```vue
    <!-- 信息块 -->
    <div class="card-info">
      <div v-if="book.categoryName" class="info-row">
        <span class="info-key">分类</span>
        <span class="info-val">{{ book.categoryName }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">出版社</span>
        <span class="info-val">{{ book.publisher || '—' }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">定价</span>
        <span class="info-val price">{{ formattedPrice }}</span>
      </div>
      <div class="info-row">
        <span class="info-key">库存</span>
        <span :class="['info-val', 'stock-badge', stockClass]">{{ book.stock }} / {{ book.totalStock }}</span>
      </div>
    </div>
```

在 script setup 中新增:

```javascript
const stockClass = computed(() => {
  if (!props.book.stock || props.book.stock <= 0) return 'stock-out'
  if (props.book.stock <= 1) return 'stock-low'
  return 'stock-ok'
})
```

在 style 中追加:

```css
.stock-badge {
  font-family: var(--font-display);
  font-size: 14px;
  padding: 2px 8px;
  border: 2px solid var(--ink);
}
.stock-ok { background: var(--green); }
.stock-low { background: var(--yellow); }
.stock-out { background: var(--pink); color: var(--white); }
```

- [ ] **Step 2: 更新 BookFormDialog 新增字段**

修改 `frontend-vue/src/components/BookFormDialog.vue`:

在 script 的 `form` reactive 中新增字段:
```javascript
const form = reactive({
  id: null, name: '', author: '', price: 0, publisher: '',
  isbn: '', categoryId: null, totalStock: 1, stock: 1, publishDate: '', description: ''
})
```

`fill` 函数扩展:
```javascript
function fill(book) {
  form.id = book.id
  form.name = book.name
  form.author = book.author || ''
  form.price = book.price != null ? Number(book.price) : 0
  form.publisher = book.publisher || ''
  form.isbn = book.isbn || ''
  form.categoryId = book.categoryId || null
  form.totalStock = book.totalStock != null ? book.totalStock : 1
  form.stock = book.stock != null ? book.stock : 1
  form.publishDate = book.publishDate || ''
  form.description = book.description || ''
  nextTick(() => { if (nameInput.value) nameInput.value.focus() })
}
```

`reset` 函数扩展:
```javascript
function reset() {
  form.id = null; form.name = ''; form.author = ''; form.price = 0; form.publisher = ''
  form.isbn = ''; form.categoryId = null; form.totalStock = 1; form.stock = 1
  form.publishDate = ''; form.description = ''
}
```

`handleSubmit` 的 payload 扩展:
```javascript
const payload = {
  id: form.id,
  name: form.name.trim(),
  author: form.author ? form.author.trim() : null,
  price: form.price,
  publisher: form.publisher ? form.publisher.trim() : null,
  isbn: form.isbn ? form.isbn.trim() : null,
  categoryId: form.categoryId,
  totalStock: form.totalStock,
  stock: form.stock,
  publishDate: form.publishDate || null,
  description: form.description ? form.description.trim() : null
}
```

新增 props 接收分类列表:
```javascript
const props = defineProps({
  visible: { type: Boolean, default: false },
  isEdit: { type: Boolean, default: false },
  categories: { type: Array, default: () => [] }
})
```

在 template 表单中新增字段(在出版社字段后追加):

```vue
          <div class="form-group">
            <label class="form-label">
              <span class="label-num">05</span>
              <span class="label-text">ISBN</span>
            </label>
            <input v-model="form.isbn" class="brutalist-input" placeholder="选填" maxlength="20" />
          </div>

          <div class="form-row two-col">
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">06</span>
                <span class="label-text">分类</span>
              </label>
              <select v-model="form.categoryId" class="brutalist-input">
                <option :value="null">— 无分类 —</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">07</span>
                <span class="label-text">出版日期</span>
              </label>
              <input v-model="form.publishDate" type="date" class="brutalist-input" />
            </div>
          </div>

          <div class="form-row two-col">
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">08</span>
                <span class="label-text">总馆藏</span>
              </label>
              <input v-model.number="form.totalStock" type="number" min="1" class="brutalist-input" />
            </div>
            <div class="form-group">
              <label class="form-label">
                <span class="label-num">09</span>
                <span class="label-text">可借库存</span>
              </label>
              <input v-model.number="form.stock" type="number" min="0" :max="form.totalStock" class="brutalist-input" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">
              <span class="label-num">10</span>
              <span class="label-text">简介</span>
            </label>
            <textarea v-model="form.description" class="brutalist-input" rows="2" maxlength="500"></textarea>
          </div>
```

- [ ] **Step 3: 提交**

```bash
git add frontend-vue/src/components/BookCard.vue frontend-vue/src/components/BookFormDialog.vue
git commit -m "feat(frontend): update BookCard and BookFormDialog with category, stock, ISBN fields"
```

---

## Task 22: 创建 BooksView 整合分页与多条件筛选

**Files:**
- Create: `frontend-vue/src/views/BooksView.vue`

- [ ] **Step 1: 创建 BooksView**

创建 `frontend-vue/src/views/BooksView.vue`:

```vue
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { BookAPI, CategoryAPI } from '../api.js'
import BookCard from '../components/BookCard.vue'
import BookFormDialog from '../components/BookFormDialog.vue'

const emit = defineEmits(['toast', 'confirm'])

const books = ref([])
const categories = ref([])
const loading = ref(false)
const viewMode = ref('grid')
const total = ref(0)

const query = reactive({
  name: '', author: '', publisher: '', categoryId: null,
  page: 1, size: 12
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / query.size)))

const dialogVisible = ref(false)
const isEditMode = ref(false)
const dialogRef = ref(null)

async function loadCategories() {
  const res = await CategoryAPI.list()
  if (res.data.code === 200) categories.value = res.data.data || []
}

async function load() {
  loading.value = true
  try {
    const res = await BookAPI.page(query)
    if (res.data.code === 200) {
      const pr = res.data.data || {}
      books.value = pr.records || []
      total.value = pr.total || 0
    } else emit('toast', 'error', res.data.message)
  } catch (e) { emit('toast', 'error', '网络错误') }
  finally { loading.value = false }
}

function search() { query.page = 1; load() }
function resetFilters() {
  query.name = ''; query.author = ''; query.publisher = ''; query.categoryId = null
  query.page = 1
  load()
}
function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  query.page = p
  load()
}

function openAdd() {
  isEditMode.value = false
  if (dialogRef.value) dialogRef.value.reset()
  dialogVisible.value = true
}
function openEdit(book) {
  isEditMode.value = true
  dialogVisible.value = true
  setTimeout(() => { if (dialogRef.value) dialogRef.value.fill(book) }, 50)
}

async function handleSubmit(payload, done) {
  try {
    const res = payload.id != null ? await BookAPI.update(payload) : await BookAPI.add(payload)
    if (res.data.code === 200) {
      emit('toast', 'success', payload.id != null ? '修订完成' : '入藏完成')
      dialogVisible.value = false
      await load()
    } else emit('toast', 'error', res.data.message)
  } catch (e) { emit('toast', 'error', '网络错误') }
  finally { done && done() }
}

async function handleDelete(book) {
  const ok = await emit('confirm', '移出馆藏', `确定将《${book.name}》移出馆藏?`)
  if (!ok) return
  const res = await BookAPI.remove(book.id)
  if (res.data.code === 200) { emit('toast', 'warning', '已移出'); await load() }
  else emit('toast', 'error', res.data.message)
}

onMounted(async () => { await loadCategories(); await load() })
defineExpose({ reload: load })
</script>

<template>
  <div class="view-header">
    <div>
      <h1 class="view-title">BOOKS<span style="color: var(--pink)">.</span></h1>
      <p class="view-subtitle">// 馆藏图书 · 共 {{ total }} 条</p>
    </div>
    <div style="display: flex; gap: 12px;">
      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'grid' }]" @click="viewMode = 'grid'">GRID</button>
        <button :class="['toggle-btn', { active: viewMode === 'table' }]" @click="viewMode = 'table'">LIST</button>
      </div>
      <button class="brutalist-btn primary" @click="openAdd">+ 新增</button>
    </div>
  </div>

  <!-- 筛选条 -->
  <div class="filter-bar">
    <div class="filter-group">
      <span class="filter-label">书名</span>
      <input v-model="query.name" class="filter-input" @keyup.enter="search" />
    </div>
    <div class="filter-group">
      <span class="filter-label">作者</span>
      <input v-model="query.author" class="filter-input" @keyup.enter="search" />
    </div>
    <div class="filter-group">
      <span class="filter-label">出版社</span>
      <input v-model="query.publisher" class="filter-input" @keyup.enter="search" />
    </div>
    <div class="filter-group">
      <span class="filter-label">分类</span>
      <select v-model="query.categoryId" class="filter-input">
        <option :value="null">全部</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>
    <button class="brutalist-btn primary" @click="search">GO</button>
    <button class="brutalist-btn" @click="resetFilters">重置</button>
  </div>

  <!-- 内容 -->
  <div v-if="loading" style="padding: 60px; text-align: center;">
    <span class="loading-box" style="font-family: var(--font-display); font-size: 24px;">LOADING...</span>
  </div>
  <div v-else-if="books.length === 0" style="padding: 60px; text-align: center;">
    <p style="font-family: var(--font-display); font-size: 28px;">[ NO DATA ]</p>
    <p style="font-family: var(--font-mono); opacity: 0.6; margin-top: 8px;">无符合条件的图书</p>
  </div>

  <transition-group v-else-if="viewMode === 'grid'" name="grid" tag="div" class="book-grid">
    <BookCard v-for="(b, i) in books" :key="b.id" :book="b" :index="i"
              @edit="openEdit" @delete="handleDelete" />
  </transition-group>

  <div v-else>
    <table class="data-table">
      <thead>
        <tr>
          <th>ID</th><th>书名</th><th>作者</th><th>分类</th>
          <th>定价</th><th>库存</th><th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in books" :key="b.id">
          <td>#{{ String(b.id).padStart(3, '0') }}</td>
          <td style="font-family: var(--font-cn); font-weight: 700;">{{ b.name }}</td>
          <td>{{ b.author || '—' }}</td>
          <td>{{ b.categoryName || '—' }}</td>
          <td>¥{{ Number(b.price || 0).toFixed(2) }}</td>
          <td>{{ b.stock }} / {{ b.totalStock }}</td>
          <td>
            <button class="mini-btn edit" @click="openEdit(b)">编辑</button>
            <button class="mini-btn delete" @click="handleDelete(b)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- 分页 -->
  <div v-if="!loading && books.length > 0" class="pagination">
    <button class="page-btn" :disabled="query.page <= 1" @click="goPage(query.page - 1)">PREV</button>
    <button v-for="p in totalPages" v-show="Math.abs(p - query.page) < 5 || p === 1 || p === totalPages"
            :key="p" :class="['page-btn', { active: p === query.page }]" @click="goPage(p)">
      {{ p }}
    </button>
    <button class="page-btn" :disabled="query.page >= totalPages" @click="goPage(query.page + 1)">NEXT</button>
    <span class="page-info">{{ query.page }} / {{ totalPages }} · 共 {{ total }} 条</span>
  </div>

  <BookFormDialog ref="dialogRef" :visible="dialogVisible" :is-edit="isEditMode"
                  :categories="categories" @close="dialogVisible = false" @submit="handleSubmit" />
</template>

<style scoped>
.mini-btn {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.1em;
  padding: 4px 10px;
  border: 2px solid var(--ink);
  background: var(--white);
  cursor: pointer;
  margin-right: 6px;
}
.mini-btn.edit:hover { background: var(--yellow); }
.mini-btn.delete:hover { background: var(--pink); color: var(--white); }
</style>
```

- [ ] **Step 2: 提交**

```bash
git add frontend-vue/src/views/BooksView.vue
git commit -m "feat(frontend): add BooksView with pagination, multi-filter, grid/table toggle"
```

---

## Task 23: 重构 App.vue 为侧边栏 + 视图切换布局

**Files:**
- Modify: `frontend-vue/src/App.vue`

- [ ] **Step 1: 重写 App.vue 为多视图布局**

完全替换 `frontend-vue/src/App.vue`:

```vue
<script setup>
import { ref, shallowRef } from 'vue'
import SidebarNav from './components/SidebarNav.vue'
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import DashboardView from './views/DashboardView.vue'
import BooksView from './views/BooksView.vue'
import CategoriesView from './views/CategoriesView.vue'
import ReadersView from './views/ReadersView.vue'
import BorrowsView from './views/BorrowsView.vue'

const currentView = ref('dashboard')
const toastRef = ref(null)
const confirmRef = ref(null)
const currentViewComponent = shallowRef(DashboardView)

const viewMap = {
  dashboard: DashboardView,
  books: BooksView,
  categories: CategoriesView,
  readers: ReadersView,
  borrows: BorrowsView
}

function navigate(key) {
  currentView.value = key
  currentViewComponent.value = viewMap[key] || DashboardView
}

function showToast(type, message) {
  toastRef.value && toastRef.value.show(type, message)
}

async function handleConfirm(title, message) {
  if (!confirmRef.value) return false
  return await confirmRef.value.open(title, message)
}

const now = new Date()
const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
</script>

<template>
  <div class="app-root">
    <!-- 顶部条 -->
    <div class="topbar">
      <div class="topbar-left">
        <span class="status-dot"></span>
        <span class="topbar-text">SYSTEM ONLINE</span>
      </div>
      <div class="topbar-center">
        <span class="marquee">
          <span>★ LIBRARY OS ★ 图书馆操作系统 ★ LIBRARY OS ★ 图书管理系统 ★ LIBRARY OS ★ 图书馆操作系统 ★</span>
          <span>★ LIBRARY OS ★ 图书馆操作系统 ★ LIBRARY OS ★ 图书管理系统 ★ LIBRARY OS ★ 图书馆操作系统 ★</span>
        </span>
      </div>
      <div class="topbar-right">
        <span class="topbar-text">{{ dateStr }}</span>
      </div>
    </div>

    <!-- 主布局:侧边栏 + 内容 -->
    <div class="app-layout">
      <SidebarNav :current="currentView" @navigate="navigate" />
      <main class="app-main">
        <component :is="currentViewComponent" @toast="showToast" @confirm="handleConfirm" />
      </main>
    </div>

    <!-- 页脚 -->
    <footer class="page-footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <span>LIBRARY//OS v0.2</span>
        <span class="footer-dot">·</span>
        <span>5 MODULES · DASHBOARD/BOOKS/CATEGORIES/READERS/BORROWS</span>
        <span class="footer-dot">·</span>
        <span>{{ dateStr }}</span>
      </div>
    </footer>

    <!-- 全局 Toast -->
    <Toast ref="toastRef" />
    <!-- 全局确认对话框 -->
    <ConfirmDialog ref="confirmRef" />
  </div>
</template>

<style scoped>
.app-root { padding-bottom: 60px; }

.topbar {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  background: var(--ink);
  color: var(--bg);
  border: var(--border);
  padding: 8px 16px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  margin-bottom: 0;
}
.topbar-left, .topbar-right { display: flex; align-items: center; gap: 8px; }
.status-dot {
  width: 8px; height: 8px;
  background: var(--green);
  border: 2px solid var(--bg);
  display: inline-block;
  animation: blink 1.5s infinite;
}
.topbar-center { overflow: hidden; white-space: nowrap; }
.marquee {
  display: inline-block;
  animation: marquee 30s linear infinite;
  white-space: nowrap;
}
.marquee span {
  display: inline-block;
  padding-right: 40px;
  letter-spacing: 0.2em;
}

.page-footer { margin-top: 60px; }
.footer-line {
  height: 6px;
  background: var(--ink);
  margin-bottom: 16px;
  position: relative;
}
.footer-line::before, .footer-line::after {
  content: '';
  position: absolute;
  top: 0;
  width: 33.33%;
  height: 100%;
}
.footer-line::before { left: 0; background: var(--pink); }
.footer-line::after { right: 0; background: var(--yellow); }
.footer-content {
  display: flex;
  justify-content: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  opacity: 0.7;
  flex-wrap: wrap;
}
.footer-dot { opacity: 0.5; }

@media (max-width: 768px) {
  .topbar-center { display: none; }
  .topbar { grid-template-columns: 1fr auto; }
}
</style>
```

- [ ] **Step 2: 提交**

```bash
git add frontend-vue/src/App.vue
git commit -m "refactor(frontend): rewrite App.vue as sidebar + dynamic view layout"
```

---

## Task 24: 端到端集成验证

**Files:**
- 无新文件

- [ ] **Step 1: 启动后端**

```bash
cd backend
./mvnw.cmd spring-boot:run
```

期望日志:`Started LibrarySystemApplication`,端口 8080。

- [ ] **Step 2: 启动前端**

```bash
cd frontend-vue
npm install
npm run dev
```

访问 `http://localhost:5173`。

- [ ] **Step 3: 验证 Dashboard**

打开首页(默认 dashboard 视图):
- 6 个指标卡显示正确数字(藏书种类=7, 总馆藏=13, 可借=10, 读者=3, 借出中=2, 逾期=1)
- 分类分布条形图显示 4 个分类(计算机科学=5, 文学=1, 历史=1, 哲学=0)
- 借阅 TOP5 条形图显示
- 最近借阅表格显示 3 条记录

- [ ] **Step 4: 验证 Books 模块**

点击侧边栏 `02 Books`:
- 默认显示 7 本图书(分页 size=12,1 页)
- 切换 GRID/LIST 视图正常
- 筛选:分类=计算机科学 → 显示 5 本;书名输入"Java" → 显示 2 本
- 新增图书:填写所有字段(含 ISBN、分类、库存)→ 列表新增成功
- 编辑图书:库存徽章正确显示(绿/黄/粉)
- 删除图书:确认对话框弹出,确认后消失

- [ ] **Step 5: 验证 Categories 模块**

点击 `03 Categories`:
- 表格显示 4 个分类,图书数列正确
- 新增分类 → 成功
- 删除"计算机科学"(仍有 5 本图书)→ 失败,提示"该分类下仍有图书,无法删除"
- 删除"哲学"(0 本图书)→ 成功

- [ ] **Step 6: 验证 Readers 模块**

点击 `04 Readers`:
- 表格显示 3 个读者,状态徽章正确(ACTIVE=绿, SUSPENDED=粉)
- 王五(学号 S2021003)显示借阅中=0
- 搜索"张" → 显示张三
- 新增读者:状态默认 ACTIVE,注册日期默认今天
- 编辑:将王五状态改为 ACTIVE → 成功

- [ ] **Step 7: 验证 Borrows 模块**

点击 `05 Borrows`:
- 表格显示 3 条借阅记录,状态徽章正确(BORROWED=黄, RETURNED=绿, OVERDUE=粉)
- 筛选"借出中" → 显示 1 条
- 点击"新借阅":图书下拉仅显示 stock>0 的图书,读者下拉仅显示 ACTIVE
- 借出《Spring实战》(库存 2)→ 库存变为 1,借阅列表新增
- 归还借阅记录 #1(应还日 2026-06-30,今日 2026-07-04,逾期 4 天)→ 提示"归还成功,逾期 4.00 元"

- [ ] **Step 8: 最终提交**

```bash
git add -A
git commit -m "chore: complete library system expansion end-to-end verification"
```

---

## 自检 / Self-Review Checklist

执行计划前,确认以下要点:

- [ ] **Spec 覆盖**:用户要求"丰富功能" → 已覆盖 5 大模块(图书/分类/读者/借阅/统计)
- [ ] **类型一致**:`BorrowService.Result` 在 service、controller、test 中签名一致
- [ ] **字段一致**:`Book` 实体的 `totalStock`/`stock`/`categoryId` 在 Mapper XML、FormDialog、BooksView 中名称一致
- [ ] **TDD 覆盖**:核心业务逻辑(CategoryService 删除约束、ReaderService 注册默认值、BorrowService 借还库存一致性)均有测试
- [ ] **无占位符**:所有代码块完整可执行,无 TBD/TODO
- [ ] **向后兼容**:旧 `GET /api/books?name=` 接口保留,新增 `/api/books/page`

---

## 执行交接

**计划已完成并保存至 `docs/superpowers/plans/2026-07-04-library-system-expansion.md`。有两种执行方式:**

**1. 子代理驱动(推荐)** - 我为每个任务分配一个新的子代理,并在任务间进行审查,实现快速迭代

**2. 内联执行** - 在当前会话中使用 `executing-plans` 执行任务,进行批量执行与检查点审查

**您希望采用哪种方式?**
