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
from playwright._impl._errors import TimeoutError, Error as PlaywrightError

class Executor:
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        
    def _parse_error(self, error):
        """解析错误信息，返回用户友好的错误描述"""
        error_str = str(error)
        
        # 元素定位错误
        if "waiting for locator" in error_str:
            return {
                "type": "元素定位失败",
                "reason": "无法在页面上找到目标元素",
                "suggestions": [
                    "请确认目标点击元素是否存在还是已经下线",
                    "检查页面是否发生了变化",
                    "建议重新录制测试脚本",
                ]
            }
            
        # 元素点击错误
        if "click" in error_str and ("failed" in error_str or "timeout" in error_str):
            return {
                "type": "元素交互失败",
                "reason": "无法与页面元素进行交互",
                "suggestions": [
                    "检查元素是否被其他元素遮挡",
                    "确认元素是否处于可点击状态",
                    "页面可能需要滚动到目标元素位置",
                    "建议重新录制测试脚本"
                ]
            }
            
        # 页面加载错误
        if "page.goto" in error_str:
            return {
                "type": "页面加载失败",
                "reason": "无法正确加载目标页面",
                "suggestions": [
                    "检查网页地址是否正确",
                    "确认网页是否需要登录",
                    "检查网络连接是否正常",
                    "如果使用代理，请检查代理设置"
                ]
            }
            
        # 网络错误
        if "net::" in error_str:
            return {
                "type": "网络连接错误",
                "reason": "网络连接出现问题",
                "suggestions": [
                    "检查网络连接是否正常",
                    "确认目标网站是否可访问",
                    "如果使用代理，尝试关闭代理",
                    "检查是否有防火墙限制"
                ]
            }
            
        # 元素内容错误
        if "fill" in error_str or "type" in error_str:
            return {
                "type": "输入操作失败",
                "reason": "无法在表单中输入内容",
                "suggestions": [
                    "检查输入框是否存在",
                    "确认输入框是否处于可编辑状态",
                    "检查输入内容格式是否正确",
                    "建议重新录制测试脚本"
                ]
            }
            
        # 选择器错误
        if "selector" in error_str:
            return {
                "type": "选择器匹配失败",
                "reason": "无法通过选择器找到元素",
                "suggestions": [
                    "页面结构可能已经发生变化",
                    "检查元素是否在iframe中",
                    "确认元素是否需要特定条件才能显示",
                    "建议重新录制测试脚本"
                ]
            }
            
        # 超时错误
        if "timeout" in error_str:
            return {
                "type": "操作超时",
                "reason": "操作执行时间超过了预设时间",
                "suggestions": [
                    "检查网络速度是否正常",
                    "页面加载可能较慢，需要增加等待时间",
                    "确认目标元素是否需要特定条件才能出现",
                    "如果使用代理，检查代理速度"
                ]
            }
            
        # 脚本语法错误
        if "SyntaxError" in error_str:
            return {
                "type": "脚本语法错误",
                "reason": "测试脚本中存在语法错误",
                "suggestions": [
                    "检查脚本代码是否完整",
                    "确认是否缺少必要的导入语句",
                    "建议重新录制测试脚本",
                    "检查脚本的缩进是否正确"
                ]
            }
            
        # 默认错误处理
        return {
            "type": "未知错误",
            "reason": "执行过程中遇到未知错误",
            "suggestions": [
                "检查测试环境是否正常",
                "确认网页是否可以正常访问",
                "建议重新录制测试脚本",
                "查看详细错误日志以获取更多信息"
            ]
        }
            
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
                # 解析错误信息
                error_info = self._parse_error(stderr)
                error_message = f"""
错误类型: {error_info['type']}
错误原因: {error_info['reason']}
修复建议:
{chr(10).join('- ' + s for s in error_info['suggestions'])}
                """
                
                result = {
                    "status": "error",
                    "test_case_id": test_case_id,
                    "execution_time": datetime.now().isoformat(),
                    "message": error_message.strip(),
                    "output": stdout,
                    "error_details": error_info
                }
            
            logger.info(f"测试用例执行完成: {test_case_id}")
            return result
            
        except Exception as e:
            error_info = self._parse_error(e)
            error_message = f"""
错误类型: {error_info['type']}
错误原因: {error_info['reason']}
修复建议:
{chr(10).join('- ' + s for s in error_info['suggestions'])}
            """
            
            return {
                "status": "error",
                "test_case_id": test_case_id,
                "execution_time": datetime.now().isoformat(),
                "message": error_message.strip(),
                "error_details": error_info
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