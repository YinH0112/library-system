# 图书管理系统 (Library Management System) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack library management system supporting book list display, add, edit, delete, and name-based fuzzy search, with a Spring Boot + MyBatis backend and a Vue3 + axios frontend.

**Architecture:** Layered MVC backend (Controller → Service → Mapper → MySQL) exposing a RESTful API under `/api/books` with a unified `Result<T>` response wrapper. Frontend is a standalone Vue3 SPA (CDN-based, no build step) using Element Plus for UI and axios for HTTP. Backend WebConfig enables CORS so the frontend can run independently.

**Tech Stack:** Spring Boot 4.0.7, MyBatis Spring Boot Starter 4.0.1, MySQL Connector/J, JDK 17, Maven, Vue3, axios, Element Plus, Apipost (API testing).

---

## File Structure

### Backend (Java)

```
src/main/java/org/example/library_system/
├── LibrarySystemApplication.java        # Modify: add @MapperScan
├── entity/
│   └── Book.java                        # Create: Book POJO (id, name, author, price, publisher)
├── common/
│   └── Result.java                      # Create: unified API response wrapper
├── mapper/
│   └── BookMapper.java                  # Create: MyBatis mapper interface (CRUD + search)
├── service/
│   ├── BookService.java                 # Create: service interface
│   └── impl/
│       └── BookServiceImpl.java         # Create: service implementation
├── controller/
│   └── BookController.java              # Create: REST controller (/api/books)
└── config/
    └── WebConfig.java                   # Create: CORS config (allow frontend origin)
```

### Backend (Resources)

```
src/main/resources/
├── application.properties               # Modify: add DB + MyBatis config
└── mapper/
    └── BookMapper.xml                   # Create: MyBatis SQL mappings
```

### Database

```
src/main/resources/db/
└── schema.sql                           # Create: database + table DDL + sample data
```

### Frontend

```
frontend/
├── index.html                           # Create: Vue3 app shell + Element Plus + axios CDN
├── css/
│   └── style.css                        # Create: page styles
└── js/
    ├── api.js                           # Create: axios API service module
    └── app.js                           # Create: Vue app (list, form modal, search)
```

---

## Task 1: Database Schema Setup

**Files:**
- Create: `src/main/resources/db/schema.sql`

- [ ] **Step 1: Create the schema.sql file with database, table, and sample data**

Create `src/main/resources/db/schema.sql`:

```sql
CREATE DATABASE IF NOT EXISTS library_system
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_general_ci;

USE library_system;

DROP TABLE IF EXISTS book;

CREATE TABLE book (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '图书ID',
    name VARCHAR(100) NOT NULL COMMENT '书名',
    author VARCHAR(50) COMMENT '作者',
    price DECIMAL(10, 2) COMMENT '价格',
    publisher VARCHAR(100) COMMENT '出版社'
) COMMENT '图书信息表';

INSERT INTO book (name, author, price, publisher) VALUES
    ('Java核心技术 卷I', 'Cay S. Horstmann', 119.00, '机械工业出版社'),
    ('Spring实战', 'Craig Walls', 99.00, '人民邮电出版社'),
    ('深入理解Java虚拟机', '周志明', 129.00, '机械工业出版社'),
    ('Vue.js设计与实现', '霍春阳', 89.00, '人民邮电出版社'),
    ('MySQL必知必会', 'Ben Forta', 39.00, '人民邮电出版社');
```

- [ ] **Step 2: Apply the schema to MySQL**

Run in a terminal (replace `root` / password with your local MySQL credentials):

```bash
mysql -u root -p < src/main/resources/db/schema.sql
```

Expected: no errors. Verify with:

```bash
mysql -u root -p -e "USE library_system; SELECT * FROM book;"
```

Expected output: 5 rows of book data.

- [ ] **Step 3: Commit**

```bash
git add src/main/resources/db/schema.sql
git commit -m "feat(db): add library_system schema and sample book data"
```

---

## Task 2: Configure application.properties

**Files:**
- Modify: `src/main/resources/application.properties`

- [ ] **Step 1: Replace application.properties content**

Overwrite `src/main/resources/application.properties` with:

```properties
spring.application.name=Library System

# Server
server.port=8080

# MySQL DataSource
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.datasource.url=jdbc:mysql://localhost:3306/library_system?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf-8&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=root

# MyBatis
mybatis.mapper-locations=classpath:mapper/*.xml
mybatis.type-aliases-package=org.example.library_system.entity
mybatis.configuration.map-underscore-to-camel-case=true

# Logging
logging.level.org.example.library_system.mapper=DEBUG
```

> **Note:** If your local MySQL password is different, update `spring.datasource.password` accordingly before running the app.

- [ ] **Step 2: Commit**

```bash
git add src/main/resources/application.properties
git commit -m "feat(config): add MySQL datasource and MyBatis configuration"
```

---

## Task 3: Create Book Entity

**Files:**
- Create: `src/main/java/org/example/library_system/entity/Book.java`

- [ ] **Step 1: Create the Book entity class**

Create `src/main/java/org/example/library_system/entity/Book.java`:

```java
package org.example.library_system.entity;

import java.math.BigDecimal;

public class Book {
    private Integer id;
    private String name;
    private String author;
    private BigDecimal price;
    private String publisher;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
    }

    @Override
    public String toString() {
        return "Book{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", author='" + author + '\'' +
                ", price=" + price +
                ", publisher='" + publisher + '\'' +
                '}';
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/entity/Book.java
git commit -m "feat(entity): add Book entity class"
```

---

## Task 4: Create Result Response Wrapper

**Files:**
- Create: `src/main/java/org/example/library_system/common/Result.java`

- [ ] **Step 1: Create the Result wrapper class for unified API responses**

Create `src/main/java/org/example/library_system/common/Result.java`:

```java
package org.example.library_system.common;

public class Result<T> {
    private Integer code;
    private String message;
    private T data;

    public Result() {
    }

    public Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }

    public static <T> Result<T> error(String message) {
        return new Result<>(500, message, null);
    }

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/common/Result.java
git commit -m "feat(common): add unified Result response wrapper"
```

---

## Task 5: Create BookMapper Interface

**Files:**
- Create: `src/main/java/org/example/library_system/mapper/BookMapper.java`

- [ ] **Step 1: Create the BookMapper interface**

Create `src/main/java/org/example/library_system/mapper/BookMapper.java`:

```java
package org.example.library_system.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.example.library_system.entity.Book;

import java.util.List;

@Mapper
public interface BookMapper {

    /**
     * Query all books. If name is not null/blank, filter by name (fuzzy).
     */
    List<Book> findAll(String name);

    /**
     * Query a single book by id.
     */
    Book findById(Integer id);

    /**
     * Insert a new book.
     */
    int insert(Book book);

    /**
     * Update an existing book.
     */
    int update(Book book);

    /**
     * Delete a book by id.
     */
    int deleteById(Integer id);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/mapper/BookMapper.java
git commit -m "feat(mapper): add BookMapper interface with CRUD methods"
```

---

## Task 6: Create BookMapper XML

**Files:**
- Create: `src/main/resources/mapper/BookMapper.xml`

- [ ] **Step 1: Create the MyBatis SQL mapping file**

Create `src/main/resources/mapper/BookMapper.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.example.library_system.mapper.BookMapper">

    <resultMap id="bookResultMap" type="org.example.library_system.entity.Book">
        <id property="id" column="id"/>
        <result property="name" column="name"/>
        <result property="author" column="author"/>
        <result property="price" column="price"/>
        <result property="publisher" column="publisher"/>
    </resultMap>

    <select id="findAll" resultMap="bookResultMap">
        SELECT id, name, author, price, publisher
        FROM book
        <where>
            <if test="name != null and name != ''">
                AND name LIKE CONCAT('%', #{name}, '%')
            </if>
        </where>
        ORDER BY id DESC
    </select>

    <select id="findById" resultMap="bookResultMap">
        SELECT id, name, author, price, publisher
        FROM book
        WHERE id = #{id}
    </select>

    <insert id="insert" parameterType="org.example.library_system.entity.Book" useGeneratedKeys="true" keyProperty="id">
        INSERT INTO book (name, author, price, publisher)
        VALUES (#{name}, #{author}, #{price}, #{publisher})
    </insert>

    <update id="update" parameterType="org.example.library_system.entity.Book">
        UPDATE book
        <set>
            <if test="name != null">name = #{name},</if>
            <if test="author != null">author = #{author},</if>
            <if test="price != null">price = #{price},</if>
            <if test="publisher != null">publisher = #{publisher},</if>
        </set>
        WHERE id = #{id}
    </update>

    <delete id="deleteById">
        DELETE FROM book WHERE id = #{id}
    </delete>

</mapper>
```

- [ ] **Step 2: Commit**

```bash
git add src/main/resources/mapper/BookMapper.xml
git commit -m "feat(mapper): add BookMapper XML with dynamic SQL for search"
```

---

## Task 7: Create BookService Interface

**Files:**
- Create: `src/main/java/org/example/library_system/service/BookService.java`

- [ ] **Step 1: Create the BookService interface**

Create `src/main/java/org/example/library_system/service/BookService.java`:

```java
package org.example.library_system.service;

import org.example.library_system.entity.Book;

import java.util.List;

public interface BookService {

    List<Book> list(String name);

    Book getById(Integer id);

    boolean save(Book book);

    boolean update(Book book);

    boolean removeById(Integer id);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/service/BookService.java
git commit -m "feat(service): add BookService interface"
```

---

## Task 8: Create BookServiceImpl

**Files:**
- Create: `src/main/java/org/example/library_system/service/impl/BookServiceImpl.java`

- [ ] **Step 1: Create the BookServiceImpl class**

Create `src/main/java/org/example/library_system/service/impl/BookServiceImpl.java`:

```java
package org.example.library_system.service.impl;

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
    public Book getById(Integer id) {
        return bookMapper.findById(id);
    }

    @Override
    public boolean save(Book book) {
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

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/service/impl/BookServiceImpl.java
git commit -m "feat(service): add BookServiceImpl with CRUD operations"
```

---

## Task 9: Create BookController

**Files:**
- Create: `src/main/java/org/example/library_system/controller/BookController.java`

- [ ] **Step 1: Create the REST controller**

Create `src/main/java/org/example/library_system/controller/BookController.java`:

```java
package org.example.library_system.controller;

import org.example.library_system.common.Result;
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

    /**
     * Feature 1 & 5: List all books, or fuzzy-search by name when `name` param is present.
     * GET /api/books         -> all books
     * GET /api/books?name=xx -> books whose name contains xx
     */
    @GetMapping
    public Result<List<Book>> list(@RequestParam(required = false) String name) {
        List<Book> books = bookService.list(name);
        return Result.success(books);
    }

    /**
     * Get a single book by id. Used by the edit form to load existing data.
     */
    @GetMapping("/{id}")
    public Result<Book> getById(@PathVariable Integer id) {
        Book book = bookService.getById(id);
        if (book == null) {
            return Result.error("图书不存在");
        }
        return Result.success(book);
    }

    /**
     * Feature 2: Add a new book.
     */
    @PostMapping
    public Result<Void> save(@RequestBody Book book) {
        boolean ok = bookService.save(book);
        return ok ? Result.success() : Result.error("新增失败");
    }

    /**
     * Feature 3: Edit (update) an existing book.
     */
    @PutMapping
    public Result<Void> update(@RequestBody Book book) {
        boolean ok = bookService.update(book);
        return ok ? Result.success() : Result.error("修改失败");
    }

    /**
     * Feature 4: Delete a book by id.
     */
    @DeleteMapping("/{id}")
    public Result<Void> remove(@PathVariable Integer id) {
        boolean ok = bookService.removeById(id);
        return ok ? Result.success() : Result.error("删除失败");
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/controller/BookController.java
git commit -m "feat(controller): add BookController with REST CRUD endpoints"
```

---

## Task 10: Create WebConfig (CORS)

**Files:**
- Create: `src/main/java/org/example/library_system/config/WebConfig.java`

- [ ] **Step 1: Create the CORS configuration**

Create `src/main/java/org/example/library_system/config/WebConfig.java`:

```java
package org.example.library_system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/config/WebConfig.java
git commit -m "feat(config): add WebConfig with CORS support for frontend"
```

---

## Task 11: Update LibrarySystemApplication

**Files:**
- Modify: `src/main/java/org/example/library_system/LibrarySystemApplication.java`

- [ ] **Step 1: Add @MapperScan annotation**

Replace `src/main/java/org/example/library_system/LibrarySystemApplication.java` with:

```java
package org.example.library_system;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@MapperScan("org.example.library_system.mapper")
public class LibrarySystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibrarySystemApplication.class, args);
    }

}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/java/org/example/library_system/LibrarySystemApplication.java
git commit -m "feat(app): add @MapperScan to LibrarySystemApplication"
```

---

## Task 12: Build and Start Backend, Verify with Apipost/curl

**Files:**
- No new files.

- [ ] **Step 1: Build the project**

Run from the project root:

```bash
./mvnw.cmd clean compile
```

Expected: `BUILD SUCCESS`. If it fails, fix compile errors before proceeding.

- [ ] **Step 2: Start the application**

Run:

```bash
./mvnw.cmd spring-boot:run
```

Expected: log ends with `Started LibrarySystemApplication in ... seconds`. The server listens on `http://localhost:8080`.

Leave this terminal running. Open a new terminal for the verification calls below.

- [ ] **Step 3: Verify Feature 1 (list all books)**

```bash
curl http://localhost:8080/api/books
```

Expected JSON response containing `code: 200` and a `data` array with the 5 sample books.

- [ ] **Step 4: Verify Feature 5 (search by name)**

```bash
curl "http://localhost:8080/api/books?name=Java"
```

Expected: `data` array containing books whose name includes "Java" (e.g. "Java核心技术 卷I", "深入理解Java虚拟机").

- [ ] **Step 5: Verify Feature 2 (add a book)**

```bash
curl -X POST http://localhost:8080/api/books -H "Content-Type: application/json" -d "{\"name\":\"测试新书\",\"author\":\"张三\",\"price\":50.00,\"publisher\":\"测试出版社\"}"
```

Expected: `code: 200, message: "success"`. Confirm by re-running `curl http://localhost:8080/api/books` — the new book should appear.

- [ ] **Step 6: Verify Feature 3 (edit a book)**

First, get the id of the book you just added (from Step 5's verification). Assuming its id is `6`:

```bash
curl -X PUT http://localhost:8080/api/books -H "Content-Type: application/json" -d "{\"id\":6,\"name\":\"修改后的书名\",\"author\":\"李四\",\"price\":66.00,\"publisher\":\"新出版社\"}"
```

Expected: `code: 200`. Confirm by `curl http://localhost:8080/api/books/6`.

- [ ] **Step 7: Verify Feature 4 (delete a book)**

```bash
curl -X DELETE http://localhost:8080/api/books/6
```

Expected: `code: 200`. Confirm by `curl http://localhost:8080/api/books` — id 6 should be gone.

- [ ] **Step 8: Import into Apipost (per spec)**

In Apipost, create a new project "图书管理系统" and add these 5 requests:

| Method | URL | Body |
|--------|-----|------|
| GET | `http://localhost:8080/api/books` | — |
| GET | `http://localhost:8080/api/books?name=Java` | — |
| POST | `http://localhost:8080/api/books` | JSON: `{"name":"...","author":"...","price":0,"publisher":"..."}` |
| PUT | `http://localhost:8080/api/books` | JSON: `{"id":1,"name":"...","author":"...","price":0,"publisher":"..."}` |
| DELETE | `http://localhost:8080/api/books/1` | — |

Run each and confirm `code: 200`.

- [ ] **Step 9: Stop the backend (optional)**

Stop the running Spring Boot process (Ctrl+C in its terminal) before moving on, or leave it running for frontend integration.

---

## Task 13: Create Frontend HTML Shell

**Files:**
- Create: `frontend/index.html`

- [ ] **Step 1: Create the frontend directory and index.html**

Create `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>图书管理系统</title>
    <!-- Element Plus CSS -->
    <link rel="stylesheet" href="https://unpkg.com/element-plus/dist/index.css">
    <!-- Vue 3 -->
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <!-- Element Plus -->
    <script src="https://unpkg.com/element-plus"></script>
    <!-- Element Plus Icons -->
    <script src="https://unpkg.com/@element-plus/icons-vue"></script>
    <!-- axios -->
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="app">
        <el-container>
            <el-header class="page-header">
                <h1>图书管理系统</h1>
            </el-header>
            <el-main>
                <!-- Toolbar: search + add -->
                <div class="toolbar">
                    <el-input
                        v-model="searchKeyword"
                        placeholder="请输入书名关键词搜索"
                        clearable
                        style="width: 300px"
                        @keyup.enter="handleSearch"
                        @clear="handleSearch">
                        <template #append>
                            <el-button :icon="Search" @click="handleSearch">搜索</el-button>
                        </template>
                    </el-input>
                    <el-button type="primary" :icon="Plus" @click="openAddDialog">新增图书</el-button>
                </div>

                <!-- Book table -->
                <el-table :data="books" border style="width: 100%" v-loading="loading">
                    <el-table-column prop="id" label="ID" width="80" />
                    <el-table-column prop="name" label="书名" />
                    <el-table-column prop="author" label="作者" width="150" />
                    <el-table-column prop="price" label="价格(元)" width="120">
                        <template #default="scope">
                            {{ scope.row.price != null ? Number(scope.row.price).toFixed(2) : '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="publisher" label="出版社" width="180" />
                    <el-table-column label="操作" width="180" fixed="right">
                        <template #default="scope">
                            <el-button size="small" type="primary" @click="openEditDialog(scope.row)">编辑</el-button>
                            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-main>
        </el-container>

        <!-- Add/Edit dialog -->
        <el-dialog
            v-model="dialogVisible"
            :title="dialogTitle"
            width="500px"
            @closed="resetForm">
            <el-form :model="form" label-width="80px" ref="formRef" :rules="formRules">
                <el-form-item label="书名" prop="name">
                    <el-input v-model="form.name" placeholder="请输入书名" />
                </el-form-item>
                <el-form-item label="作者" prop="author">
                    <el-input v-model="form.author" placeholder="请输入作者" />
                </el-form-item>
                <el-form-item label="价格" prop="price">
                    <el-input-number v-model="form.price" :min="0" :precision="2" :step="1" />
                </el-form-item>
                <el-form-item label="出版社" prop="publisher">
                    <el-input v-model="form.publisher" placeholder="请输入出版社" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
            </template>
        </el-dialog>
    </div>

    <script src="js/api.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "feat(frontend): add Vue3 HTML shell with Element Plus layout"
```

---

## Task 14: Create Frontend Styles

**Files:**
- Create: `frontend/css/style.css`

- [ ] **Step 1: Create the stylesheet**

Create `frontend/css/style.css`:

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: "Microsoft YaHei", Arial, sans-serif;
    background-color: #f5f7fa;
    color: #303133;
}

.page-header {
    background-color: #409eff;
    color: #fff;
    display: flex;
    align-items: center;
    height: 60px;
}

.page-header h1 {
    font-size: 22px;
    font-weight: 500;
}

.el-main {
    padding: 20px;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/style.css
git commit -m "feat(frontend): add page styles"
```

---

## Task 15: Create Frontend API Service

**Files:**
- Create: `frontend/js/api.js`

- [ ] **Step 1: Create the axios-based API service module**

Create `frontend/js/api.js`:

```javascript
// API service module - wraps axios calls to the backend REST API.
// Base URL points to the Spring Boot backend.
const API = (function () {
    const client = axios.create({
        baseURL: 'http://localhost:8080/api/books',
        timeout: 10000
    });

    return {
        // Feature 1 & 5: list all, or search by name
        list(name) {
            const params = {};
            if (name) {
                params.name = name;
            }
            return client.get('', { params });
        },
        // Get one book by id (used by edit form)
        getById(id) {
            return client.get('/' + id);
        },
        // Feature 2: add a new book
        add(book) {
            return client.post('', book);
        },
        // Feature 3: update an existing book
        update(book) {
            return client.put('', book);
        },
        // Feature 4: delete a book by id
        remove(id) {
            return client.delete('/' + id);
        }
    };
})();
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/api.js
git commit -m "feat(frontend): add axios API service module"
```

---

## Task 16: Create Frontend Vue App Logic

**Files:**
- Create: `frontend/js/app.js`

- [ ] **Step 1: Create the Vue application logic**

Create `frontend/js/app.js`:

```javascript
const { createApp, ref, reactive, onMounted } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;
const { Search, Plus } = ElementPlusIconsVue;   // icon components for buttons

const app = createApp({
    setup() {
        // --- State ---
        const books = ref([]);              // book list for the table
        const loading = ref(false);         // table loading flag
        const searchKeyword = ref('');      // search box value

        const dialogVisible = ref(false);   // add/edit dialog visibility
        const dialogTitle = ref('');        // dialog title
        const submitting = ref(false);      // submit button loading flag
        const formRef = ref(null);          // form ref for validation/reset

        const form = reactive({
            id: null,
            name: '',
            author: '',
            price: 0,
            publisher: ''
        });

        const formRules = {
            name: [{ required: true, message: '请输入书名', trigger: 'blur' }]
        };

        // --- API calls ---
        async function loadBooks() {
            loading.value = true;
            try {
                const res = await API.list(searchKeyword.value);
                if (res.data.code === 200) {
                    books.value = res.data.data;
                } else {
                    ElMessage.error(res.data.message || '加载失败');
                }
            } catch (err) {
                ElMessage.error('网络错误，加载图书失败');
                console.error(err);
            } finally {
                loading.value = false;
            }
        }

        // Feature 5: search by name
        function handleSearch() {
            loadBooks();
        }

        // Feature 2: open add dialog
        function openAddDialog() {
            dialogTitle.value = '新增图书';
            form.id = null;
            form.name = '';
            form.author = '';
            form.price = 0;
            form.publisher = '';
            dialogVisible.value = true;
        }

        // Feature 3: open edit dialog (pre-fill from row)
        function openEditDialog(row) {
            dialogTitle.value = '编辑图书';
            form.id = row.id;
            form.name = row.name;
            form.author = row.author;
            form.price = Number(row.price) || 0;
            form.publisher = row.publisher;
            dialogVisible.value = true;
        }

        // Submit handler (add or update based on whether id exists)
        async function handleSubmit() {
            if (!formRef.value) return;
            try {
                await formRef.value.validate();
            } catch (e) {
                return; // validation failed
            }
            submitting.value = true;
            try {
                const payload = {
                    id: form.id,
                    name: form.name,
                    author: form.author,
                    price: form.price,
                    publisher: form.publisher
                };
                let res;
                if (form.id == null) {
                    res = await API.add(payload);
                } else {
                    res = await API.update(payload);
                }
                if (res.data.code === 200) {
                    ElMessage.success(form.id == null ? '新增成功' : '修改成功');
                    dialogVisible.value = false;
                    await loadBooks();
                } else {
                    ElMessage.error(res.data.message || '操作失败');
                }
            } catch (err) {
                ElMessage.error('网络错误，操作失败');
                console.error(err);
            } finally {
                submitting.value = false;
            }
        }

        // Feature 4: delete with confirmation
        async function handleDelete(row) {
            try {
                await ElMessageBox.confirm(
                    '确定要删除《' + row.name + '》吗？',
                    '提示',
                    { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
                );
            } catch (e) {
                return; // user cancelled
            }
            try {
                const res = await API.remove(row.id);
                if (res.data.code === 200) {
                    ElMessage.success('删除成功');
                    await loadBooks();
                } else {
                    ElMessage.error(res.data.message || '删除失败');
                }
            } catch (err) {
                ElMessage.error('网络错误，删除失败');
                console.error(err);
            }
        }

        // Reset form when dialog closes
        function resetForm() {
            if (formRef.value) {
                formRef.value.resetFields();
            }
        }

        // Feature 1: auto-load books on page mount
        onMounted(() => {
            loadBooks();
        });

        return {
            books, loading, searchKeyword,
            dialogVisible, dialogTitle, submitting, formRef, form, formRules,
            handleSearch, openAddDialog, openEditDialog, handleSubmit, handleDelete, resetForm,
            Search, Plus   // expose icon components for :icon bindings in template
        };
    }
});

// Register Element Plus + icons
app.use(ElementPlus);
for (const [key, comp] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, comp);
}
app.mount('#app');
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/app.js
git commit -m "feat(frontend): add Vue app logic with list/add/edit/delete/search"
```

---

## Task 17: End-to-End Integration Verification

**Files:**
- No new files.

- [ ] **Step 1: Ensure the backend is running**

In a terminal at the project root:

```bash
./mvnw.cmd spring-boot:run
```

Wait for `Started LibrarySystemApplication`.

- [ ] **Step 2: Open the frontend**

Open `frontend/index.html` directly in a browser (double-click the file, or serve it). A simple way to serve it:

```bash
cd frontend
python -m http.server 5500
```

Then open `http://localhost:5500/` in the browser.

- [ ] **Step 3: Verify Feature 1 (auto list on load)**

On page open, the table should display the 5 sample books.

- [ ] **Step 4: Verify Feature 2 (add)**

Click "新增图书", fill in the form (书名 required), click "确定". A success toast appears and the new book shows in the table.

- [ ] **Step 5: Verify Feature 3 (edit)**

Click "编辑" on any row. The dialog opens with pre-filled data. Change a field, click "确定". The table updates with the new values.

- [ ] **Step 6: Verify Feature 4 (delete)**

Click "删除" on any row. A confirmation dialog appears. Click "确定". The book disappears from the table.

- [ ] **Step 7: Verify Feature 5 (search)**

Type a keyword (e.g. "Java") in the search box and press Enter or click "搜索". The table shows only matching books. Clear the box and search again to restore the full list.

- [ ] **Step 8: Final commit (if any tweaks were made)**

```bash
git add -A
git commit -m "chore: complete library management system end-to-end"
```

---

## Summary of API Endpoints

| Feature | Method | URL | Body / Params |
|---------|--------|-----|---------------|
| 1. 图书列表展示 | GET | `/api/books` | — |
| 5. 按名称搜索 | GET | `/api/books?name=关键词` | query: `name` |
| (edit preload) | GET | `/api/books/{id}` | path: `id` |
| 2. 新增图书 | POST | `/api/books` | JSON body |
| 3. 编辑图书 | PUT | `/api/books` | JSON body (with `id`) |
| 4. 删除图书 | DELETE | `/api/books/{id}` | path: `id` |

## Notes

- **MySQL credentials**: The default `application.properties` uses `root` / `root`. Adjust to your local setup.
- **Spring Boot version**: The pom uses `4.0.7` with `spring-boot-starter-webmvc` (not the legacy `spring-boot-starter-web`). The plan uses `WebMvcConfigurer` which is compatible.
- **Frontend CDN**: Requires internet access on first load to fetch Vue3, Element Plus, and axios from unpkg.
- **No build step for frontend**: The frontend runs directly from static files via a simple HTTP server or file:// URL.
