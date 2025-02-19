# Playwright自动化测试工具

## 项目概述
基于Playwright框架构建的自动化测试解决方案，提供可视化操作界面和标准化API接口。支持在Windows Server 2012 R2环境下进行测试用例的录制、执行和管理，满足金融级测试用例编号规范要求。

## 功能特性
- 🎥 可视化操作录制（双屏模式）
- ⚡ 测试步骤/项目批量执行
- 📁 测试项目管理（CRUD）
- 📊 结构化测试结果输出
- 🔌 标准化API接口（FastAPI）
- 🕰️ 历史操作回放与调试

## 环境要求
| 组件                | 版本要求                     |
|---------------------|----------------------------|
| 操作系统             | MacOS    |
| Python              | 3.10 或更高版本            |
| Node.js             | 16.x 或更高版本            |
| Playwright          | 最新版本                    |
| Chromium浏览器       | 最新稳定版本                |

## 安装步骤

### 1. 克隆仓库
```bash
git clone https://github.com/your-repo/playwright-test-tool.git
cd playwright-test-tool
```

### 2. 安装Python依赖
```bash
# 使用32位Python解释器
pip install -r requirements.txt
```

### 3. 配置Node.js环境
```bash
nvm install 14.21.3
nvm use 14.21.3
```

### 4. 安装Playwright浏览器
```bash
playwright install chromium@90.0.4430.212
```

## 使用指南

### 图形界面操作
1. 启动应用程序：
```bash
python main.py
```

2. 创建新项目：
```
项目名称格式：test project <project_name>
测试案例编号：C-FSTD-CCVCB29-001
测试要点编号：TKP-C-FSTD-CCVCB-001
```

3. 录制操作步骤：
   - 点击【新建操作】输入目标URL
   - 左侧浏览器进行操作
   - 右侧Inspector生成脚本
   - 点击【终止录制】保存步骤

4. 执行测试：
   - 单个步骤执行（右键步骤→执行）
   - 批量项目执行（项目→执行全部）

### API接口文档
基础URL：`http://localhost:8000/api/v1`

| 端点                | 方法   | 参数示例                             |
|---------------------|--------|------------------------------------|
| /project/create     | POST   | { "project_id": "C-FSTD-..." }     |
| /testcase/execute   | POST   | { "step_id": "TKP-C-FSTD-..." }    |
| /results/{project}  | GET    |                                    |

**请求示例**：
```bash
curl -X POST "http://localhost:8000/api/v1/testcase/execute" \
-H "Content-Type: application/json" \
-d '{"project_id": "C-FSTD-CCVCB29-001", "step_id": "TKP-C-FSTD-CCVCB-001"}'
```

**响应结构**：
```json
{
    "project_id": "C-FSTD-CCVCB29-001",
    "status": "success",
    "execution_time": 12.34,
    "steps": [
        {
            "step_id": "TKP-C-FSTD-CCVCB-001",
            "status": "success",
            "screenshot": "base64_image_data",
            "timestamp": "2023-08-20T15:32:45Z"
        }
    ]
}
```

## 项目结构
```
playwright-test-tool/
├── core/               # 核心功能模块
│   ├── recorder.py     # 操作录制控制
│   ├── executor.py     # 测试执行引擎
│   └── project_manager.py # 项目管理
├── api/                # API接口层
│   ├── routers/        # FastAPI路由
│   └── schemas.py      # 数据模型
├── projects/           # 项目存储目录
├── utils/              # 工具模块
│   ├── win_utils.py    # Windows专用功能
│   └── logger.py       # 日志管理
└── config.ini          # 配置文件
```

## 注意事项
1. **版本强制校验**：必须严格使用指定版本组件
2. **内存管理**：建议分配至少4GB内存给Python进程
3. **日志管理**：
   - 操作日志：/logs/operation.log
   - 执行日志：/logs/execution.log
4. **故障恢复**：异常中断后使用`--recover`参数启动程序恢复会话

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
