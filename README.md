# Playwright自动化测试工具实现文档

## 1. 项目结构

```
playwright-test-tool/
├── api/                # API接口层
│   ├── routers/       # FastAPI路由
│   │   ├── project.py # 项目管理路由
│   │   └── testcase.py# 测试用例路由
│   └── schemas.py     # 数据模型
├── core/              # 核心功能模块
│   ├── recorder.py    # 操作录制控制
│   ├── executor.py    # 测试执行引擎
│   └── project_manager.py # 项目管理
├── static/            # 静态资源
│   ├── css/          # 样式文件
│   │   └── style.css # 主样式表
│   └── js/           # JavaScript文件
│       └── main.js   # 主逻辑脚本
├── templates/         # 模板文件
│   └── index.html    # 主页面模板
├── utils/            # 工具模块
│   └── logger.py     # 日志管理
├── main.py           # 应用入口
├── init.py           # 初始化脚本
└── requirements.txt   # 项目依赖
```

## 2. 依赖管理

```python
# requirements.txt
playwright>=1.40.0
fastapi>=0.104.1
uvicorn>=0.24.0
python-multipart>=0.0.6
pydantic>=2.5.2
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-dotenv>=1.0.0
loguru>=0.7.2
aiofiles>=23.2.1
jinja2>=3.1.2
```

## 3. 前端实现

### 3.1 主页面模板 (templates/index.html)

主页面使用Bootstrap 5构建，包含以下主要部分：
- 导航栏
- 项目列表
- 测试用例列表
- 执行结果显示
- 新建项目模态框
- 录制URL模态框

### 3.2 样式表 (static/css/style.css)

定义了自定义样式，包括：
- 卡片阴影效果
- 列表项交互效果
- 执行结果样式
- 截图显示样式
- 录制指示器动画

### 3.3 前端逻辑 (static/js/main.js)

实现了所有前端交互功能：
- 项目管理（创建、选择、列表）
- 测试用例管理（录制、执行、删除）
- 执行结果展示
- API调用处理
- 错误处理和用户提示

## 4. 后端实现

### 4.1 主应用 (main.py)

```python
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from api.routers import project, testcase
from loguru import logger
import os

# 配置日志
os.makedirs("logs", exist_ok=True)
logger.add("logs/operation.log", rotation="1 day", retention="7 days")
logger.add("logs/execution.log", rotation="1 day", retention="7 days")

app = FastAPI(
    title="Playwright自动化测试工具",
    description="基于Playwright框架的自动化测试解决方案",
    version="1.0.0"
)

# 配置静态文件和模板
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(project.router, prefix="/api/v1/project", tags=["项目管理"])
app.include_router(testcase.router, prefix="/api/v1/testcase", tags=["测试用例"])

@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})
```

### 4.2 初始化脚本 (init.py)

提供项目初始化功能：
- 创建必要的目录
- 安装项目依赖
- 配置环境

## 5. 功能说明

### 5.1 项目管理
- 创建新项目：支持设置项目ID、名称和描述
- 项目列表：显示所有项目及其基本信息
- 项目选择：切换当前操作的项目

### 5.2 测试用例管理
- 录制功能：
  - 支持输入目标URL
  - 实时录制用户操作
  - 自动保存录制步骤
- 执行功能：
  - 支持单个测试用例执行
  - 支持批量执行
  - 实时显示执行结果
- 删除功能：支持删除不需要的测试用例

### 5.3 执行结果
- 显示测试用例执行状态
- 显示每个步骤的详细信息
- 支持截图查看
- 显示错误信息（如果有）

## 6. 使用说明

1. 安装依赖：
```bash
python init.py
```

2. 启动应用：
```bash
python main.py
```

3. 访问应用：
```
http://localhost:8000
```

4. 使用流程：
   - 创建新项目
   - 选择项目
   - 录制测试用例
   - 执行测试
   - 查看结果

## 7. 注意事项

1. 环境要求：
   - Python 3.x
   - MacOS操作系统
   - 现代浏览器（支持ES6+）

2. 安全考虑：
   - 已配置CORS策略
   - 使用安全的API调用方式
   - 错误处理和日志记录

3. 维护建议：
   - 定期检查日志文件
   - 及时清理不需要的测试用例
   - 保持浏览器和依赖包更新 