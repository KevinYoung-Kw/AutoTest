import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from api.routers import project, testcase, recorder
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
app.include_router(recorder.router, prefix="/api/v1/recorder", tags=["录制功能"])

@app.get("/")
async def root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True) 