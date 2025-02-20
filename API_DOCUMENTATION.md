# AutoTest API 文档

## 核心功能模块 (core)

### Executor 类 (`core/executor.py`)

测试用例执行器，负责执行自动化测试脚本。

```python
class Executor:
    async def start_session() -> bool
    """初始化测试会话，启动浏览器实例"""
    
    async def close_session() -> bool
    """关闭测试会话，清理浏览器实例"""
    
    async def execute_test_case(project_id: str, test_case_id: str) -> dict
    """执行单个测试用例，返回执行结果"""
    
    def execute_step(step: dict) -> dict
    """执行单个测试步骤，返回执行结果和截图"""
    
    def _parse_error(error: Exception) -> dict
    """解析错误信息，返回用户友好的错误描述"""
```

### Recorder 类 (`core/recorder.py`)

测试用例录制器，负责录制用户操作并生成测试脚本。

```python
class Recorder:
    async def start_recording(url: str, project_id: str, test_case_id: str) -> bool
    """开始录制测试用例"""
    
    async def stop_recording() -> bool
    """停止录制测试用例"""
    
    async def save_recording(project_id: str, test_case_id: str) -> bool
    """保存录制的测试用例"""
```

### ProjectManager 类 (`core/project_manager.py`)

项目管理器，负责项目的创建、查询和管理。

```python
class ProjectManager:
    def create_project(project_id: str, project_name: str, description: str) -> dict
    """创建新项目"""
    
    def get_project(project_id: str) -> dict
    """获取项目信息"""
    
    def list_projects() -> list
    """列出所有项目"""
```

## API 路由 (api/routers)

### 测试用例路由 (`api/routers/testcase.py`)

```python
@router.post("/execute/{project_id}/{test_case_id}")
async def execute_test_case(project_id: str, test_case_id: str)
"""执行单个测试用例"""

@router.get("/list/{project_id}")
async def list_testcases(project_id: str)
"""获取项目下的所有测试用例"""

@router.get("/script/{project_id}/{test_case_id}")
async def get_script(project_id: str, test_case_id: str)
"""获取测试用例脚本内容"""

@router.delete("/delete/{project_id}/{test_case_id}")
async def delete_testcase(project_id: str, test_case_id: str)
"""删除测试用例"""
```

### 项目路由 (`api/routers/project.py`)

```python
@router.post("/create")
async def create_project(project: ProjectCreate)
"""创建新项目"""

@router.get("/list")
async def list_projects()
"""获取所有项目列表"""
```

### 录制路由 (`api/routers/recorder.py`)

```python
@router.post("/start")
async def start_recording(recording_info: RecordingStart)
"""开始录制测试用例"""

@router.post("/stop")
async def stop_recording()
"""停止录制测试用例"""

@router.post("/save")
async def save_recording(recording_info: RecordingSave)
"""保存录制的测试用例"""
```

## 数据模型 (`api/schemas.py`)

```python
class TestCase(BaseModel):
    """测试用例数据模型"""
    test_case_id: str
    project_id: str
    steps: List[dict]
    recorded_at: datetime

class Project(BaseModel):
    """项目数据模型"""
    project_id: str
    project_name: str
    description: str

class ExecutionResult(BaseModel):
    """执行结果数据模型"""
    status: str
    message: str
    test_case_id: str
    execution_time: datetime
```

## 已实现的主要功能

1. **项目管理**
   - 创建新项目
   - 查看项目列表
   - 选择当前项目

2. **测试用例管理**
   - 录制新测试用例
   - 查看测试用例列表
   - 查看测试用例脚本
   - 删除测试用例

3. **测试执行**
   - 执行单个测试用例
   - 查看执行结果
   - 错误分析和提示

4. **录制功能**
   - 开始录制
   - 停止录制
   - 保存录制结果

## 文件结构

```
core/
  ├── executor.py   # 测试执行器
  ├── recorder.py   # 测试录制器
  └── project_manager.py  # 项目管理器

api/
  ├── routers/
  │   ├── testcase.py    # 测试用例相关API
  │   ├── project.py     # 项目相关API
  │   └── recorder.py    # 录制相关API
  └── schemas.py         # 数据模型定义
``` 