# Bibliotheca · React + TypeScript 前端

学院图书馆管理系统前端,采用当下公司主流技术栈构建。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| TypeScript | 7 | 类型安全 |
| Vite | 5.4 | 构建工具 + 开发服务器 |
| React Router | 7 | 路由管理(带权限守卫) |
| TanStack Query | 5 | 数据获取/缓存/失效 |
| Zustand | 5 | 轻量状态管理(auth + ui) |
| Axios | 1.18 | HTTP 客户端(withCredentials) |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器(端口 5174,自动代理 /api → localhost:8080)
npm run dev

# 类型检查
npm run typecheck

# 生产构建
npm run build

# 预览构建产物
npm run preview
```

> 后端需运行在 `http://localhost:8080`(Spring Boot)

## 项目结构

```
src/
├── main.tsx              # 入口 · QueryClientProvider
├── App.tsx               # 根组件 · 会话恢复 + 路由挂载
├── router.tsx            # 路由配置 · 权限守卫
├── api/index.ts          # axios 实例 + 10 个 API 模块(全类型化)
├── types/index.ts        # 实体/DTO/响应类型定义
├── store/
│   ├── authStore.ts      # 认证状态(Zustand)
│   └── uiStore.ts        # Toast + ConfirmDialog(Zustand)
├── lib/queryClient.ts    # TanStack Query 配置
├── components/
│   ├── Layout.tsx        # 主布局 · 侧边栏 + 顶栏 + Outlet
│   ├── SidebarNav.tsx    # 侧边栏导航
│   ├── Toast.tsx         # 全局 Toast
│   └── ConfirmDialog.tsx # 确认对话框
└── views/
    ├── LoginView.tsx     # 登录/注册
    ├── ProfileView.tsx   # 个人信息
    ├── admin/            # 管理员 8 个视图
    └── reader/           # 借阅者 6 个视图
```

## 部署到 Vercel

### 方式一:通过 Vercel Dashboard

1. 将项目推送到 GitHub
2. 登录 [Vercel](https://vercel.com),点击 "New Project"
3. 导入 GitHub 仓库,选择 `frontend-react` 目录
4. Vercel 会自动识别 Vite 项目,配置如下(已在 `vercel.json` 中预设):
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - SPA 重定向:所有路径 → `/`
5. 在 Environment Variables 中设置:
   ```
   VITE_API_BASE_URL = https://你的后端地址/api
   ```
6. 点击 Deploy

### 方式二:通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在 frontend-react 目录下
vercel

# 首次部署会询问配置,按提示操作
# 部署完成后设置环境变量
vercel env add VITE_API_BASE_URL
# 输入你的后端公网地址,如 https://api.example.com/api

# 重新部署使环境变量生效
vercel --prod
```

### 后端 CORS 配置

部署后端到云服务器后,需在 Spring Boot 中允许前端域名跨域:

```java
@CrossOrigin(origins = "https://你的项目.vercel.app", allowCredentials = "true")
```

## 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 借阅者 | zhangsan | reader123 |
