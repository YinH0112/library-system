# Bibliotheca · 部署指南

本文档指导你将图书馆管理系统部署到公网,让任何人通过网址访问。

## 架构总览

```
用户浏览器
    ↓ https
Vercel(前端静态托管,免费)
    ↓ https api 请求
云服务器 / Railway(后端 Spring Boot + MySQL)
```

- **前端**:React 静态文件,部署到 Vercel(免费、自动 HTTPS、全球 CDN)
- **后端**:Spring Boot + MySQL,部署到公网服务器

---

## 第一部分:部署后端

后端必须先部署,因为前端需要知道后端的公网地址。

### 方案 A:Railway(最简单,推荐新手)

Railway 提供免费额度,支持 Spring Boot + MySQL,无需自己管服务器。

1. 注册 [Railway](https://railway.app)(用 GitHub 登录)
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择你的仓库,Root Directory 填 `backend`
4. 添加 MySQL:**New** → **Database** → **Add MySQL**
5. 在后端服务的 **Variables** 中添加:
   ```
   SPRING_DATASOURCE_URL=<Railway 提供的 MySQL 连接串>
   SPRING_DATASOURCE_USERNAME=<Railway 提供的用户名>
   SPRING_DATASOURCE_PASSWORD=<Railway 提供的密码>
   ```
6. Railway 会自动检测 Dockerfile 并构建
7. 部署成功后,后端会得到一个公网地址,如 `https://library-backend.up.railway.app`

> **注意**:首次部署需手动初始化数据库,连接 MySQL 后执行 `init.sql`

### 方案 B:云服务器(阿里云/腾讯云/Vultr)

1. 购买一台云服务器(推荐 Ubuntu 22.04,2核4G 起步)
2. 安装 Docker:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. 将 `backend/` 目录上传到服务器
4. 修改 `docker-compose.yml` 中的数据库密码
5. 启动:
   ```bash
   cd backend
   docker-compose up -d --build
   ```
6. 配置防火墙开放 8080 端口
7. (推荐)用 Nginx 反代 + Let's Encrypt 配置 HTTPS 和域名

### 方案 C:本地内网穿透(仅测试用)

如果只是想临时让朋友访问,可以用内网穿透:
- **ngrok**: `ngrok http 8080`
- **cpolar**: 国内友好
- 会得到一个临时公网地址,如 `https://xxx.ngrok.io`

---

## 第二部分:部署前端到 Vercel

### 1. 推送代码到 GitHub

如果还没推送:
```bash
cd "d:\Learn\Springboot+Vue\Library System"
git init
git add .
git commit -m "init: library system"
git remote add origin https://github.com/你的用户名/library-system.git
git push -u origin main
```

### 2. 在 Vercel 导入项目

1. 访问 [vercel.com](https://vercel.com),用 GitHub 登录
2. 点击 **Add New** → **Project**
3. 选择你的 `library-system` 仓库
4. 配置:
   - **Root Directory**: `frontend-react`
   - **Framework Preset**: Vite(自动识别)
   - **Build Command**: `npm run build`(已预设)
   - **Output Directory**: `dist`(已预设)
5. **关键**:展开 **Environment Variables**,添加:
   ```
   VITE_API_BASE_URL = https://你的后端公网地址/api
   ```
   例如:
   ```
   VITE_API_BASE_URL = https://library-backend.up.railway.app/api
   ```
6. 点击 **Deploy**

### 3. 等待构建完成

Vercel 会自动 `npm install` + `npm run build`,约 1-2 分钟。
部署成功后你会得到一个地址:`https://library-system.vercel.app`

### 4. (可选)绑定自定义域名

在 Vercel 项目 **Settings** → **Domains** 中添加你的域名,按提示配置 DNS。

---

## 第三部分:验证部署

1. 打开 Vercel 给的前端地址
2. 应该能看到登录页
3. 用 `admin / admin123` 登录测试
4. 如果登录失败,检查:
   - 浏览器 F12 → Network 看请求是否到了后端
   - 后端地址是否正确(注意要带 `/api`)
   - 后端是否正常运行(直接访问后端 `/api/auth/current` 应返回 401)

---

## 常见问题

### Q: 登录提示 "Network Error" / CORS 错误
**A**: 后端 CORS 已配置允许所有来源。检查后端是否正常运行,以及 `VITE_API_BASE_URL` 是否正确。

### Q: 登录成功但刷新后丢失登录状态
**A**: 这是 Session Cookie 跨域问题。需要:
1. 后端取消注释 `application.properties` 中的 cookie 配置:
   ```properties
   server.servlet.session.cookie.same-site=none
   server.servlet.session.cookie.secure=true
   ```
2. 后端必须用 HTTPS(Railway/Vercel 默认都是 HTTPS)

### Q: Vercel 刷新页面 404
**A**: 已通过 `vercel.json` 的 rewrites 规则解决,SPA 所有路由都会回退到 `index.html`。

### Q: 如何更新部署?
**A**: 只需 `git push`,Vercel 会自动重新构建部署。

---

## 部署清单(对照检查)

- [ ] 后端已部署到公网(Railway/云服务器)
- [ ] 后端 `https://后端地址/api/auth/current` 可访问(返回 401 表示正常)
- [ ] 代码已推送到 GitHub
- [ ] Vercel 项目已创建,Root Directory 设为 `frontend-react`
- [ ] Vercel 环境变量 `VITE_API_BASE_URL` 已设置为后端地址 + `/api`
- [ ] 前端访问正常,登录功能可用
- [ ] (生产环境)后端取消注释 cookie 配置
