from playwright.async_api import async_playwright
from loguru import logger
import json
import os
import asyncio
import importlib.util
import sys
from datetime import datetime
import base64
import subprocess

class Executor:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        
    async def start_session(self):
        """初始化测试会话"""
        try:
            self.playwright = await async_playwright().start()
            self.browser = await self.playwright.chromium.launch(headless=False)
            self.context = await self.browser.new_context()
            self.page = await self.context.new_page()
            logger.info("测试会话已初始化")
            return True
        except Exception as e:
            logger.error(f"初始化测试会话失败: {str(e)}")
            return False
            
    async def close_session(self):
        """关闭测试会话"""
        try:
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
            self.browser = None
            self.playwright = None
            self.context = None
            self.page = None
            logger.info("测试会话已关闭")
            return True
        except Exception as e:
            logger.error(f"关闭测试会话失败: {str(e)}")
            return False
            
    async def execute_test_case(self, project_id: str, test_case_id: str):
        """执行测试用例"""
        try:
            # 检查脚本文件是否存在
            script_path = f"projects/{project_id}/results/{test_case_id}.py"
            if not os.path.exists(script_path):
                raise Exception("测试脚本文件不存在")
                
            logger.info(f"开始执行测试用例: {test_case_id}")
            
            # 在单独的进程中执行同步测试脚本
            # 执行Python脚本
            process = subprocess.Popen(
                [sys.executable, script_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # 获取输出和错误
            stdout, stderr = process.communicate()
            
            # 检查执行结果
            if process.returncode == 0:
                result = {
                    "status": "success",
                    "test_case_id": test_case_id,
                    "execution_time": datetime.now().isoformat(),
                    "message": "测试用例执行成功",
                    "output": stdout
                }
            else:
                result = {
                    "status": "error",
                    "test_case_id": test_case_id,
                    "execution_time": datetime.now().isoformat(),
                    "message": stderr or "测试用例执行失败",
                    "output": stdout
                }
            
            logger.info(f"测试用例执行完成: {test_case_id}")
            return result
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"执行测试用例失败: {error_message}")
            return {
                "status": "error",
                "test_case_id": test_case_id,
                "execution_time": datetime.now().isoformat(),
                "message": error_message
            }
            
    def _load_test_case(self, project_id: str, test_case_id: str):
        """加载测试用例数据"""
        try:
            file_path = f"projects/{project_id}/{test_case_id}.json"
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"加载测试用例失败: {str(e)}")
            return None
            
    def execute_step(self, step):
        """执行单个测试步骤"""
        try:
            if step["type"] == "click":
                self.page.click(step["selector"])
            elif step["type"] == "fill":
                self.page.fill(step["selector"], step["value"])
            
            # 捕获截图
            screenshot = self.page.screenshot()
            screenshot_base64 = base64.b64encode(screenshot).decode()
            
            result = {
                "status": "success",
                "screenshot": screenshot_base64,
                "timestamp": datetime.now().isoformat()
            }
            logger.info(f"步骤执行成功: {step['type']}")
            return result
        except Exception as e:
            logger.error(f"步骤执行失败: {str(e)}")
            return {
                "status": "failed",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            
    def execute_test_case_sync(self, project_id, test_case_id):
        """执行完整测试用例"""
        try:
            # 加载测试用例
            test_case = self._load_test_case(project_id, test_case_id)
            
            results = []
            for step in test_case["steps"]:
                result = self.execute_step(step)
                results.append({
                    "step": step,
                    "result": result
                })
            
            # 保存执行结果
            execution_result = {
                "project_id": project_id,
                "test_case_id": test_case_id,
                "execution_time": datetime.now().isoformat(),
                "status": "success" if all(r["result"]["status"] == "success" for r in results) else "failed",
                "steps": results
            }
            
            result_path = f"projects/{project_id}/results/{test_case_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            os.makedirs(os.path.dirname(result_path), exist_ok=True)
            
            with open(result_path, "w", encoding="utf-8") as f:
                json.dump(execution_result, f, ensure_ascii=False, indent=2)
            
            logger.info(f"测试用例执行完成，结果已保存到: {result_path}")
            return execution_result
        except Exception as e:
            logger.error(f"测试用例执行失败: {str(e)}")
            return None 