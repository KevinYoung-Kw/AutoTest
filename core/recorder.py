import subprocess
from loguru import logger
import json
import os
from datetime import datetime
import asyncio

class Recorder:
    def __init__(self):
        self.recording_process = None
        self.current_test_case_id = None
        self.current_project_id = None
        
    async def start_recording(self, url, project_id, test_case_id):
        """启动录制会话"""
        try:
            if self.recording_process:
                logger.warning("已经在录制中")
                return False
                
            self.current_test_case_id = test_case_id
            self.current_project_id = project_id
            
            # 确保目录存在
            results_dir = f"projects/{project_id}/results"
            os.makedirs(results_dir, exist_ok=True)
            
            output_file = f"{results_dir}/{test_case_id}.py"
            
            logger.info(f"正在启动录制，目标URL: {url}")
            # 使用 playwright codegen 启动录制
            cmd = [
                "playwright",
                "codegen",
                "--target",
                "python",
                "-o",
                output_file,
                "-b",
                "chromium",
                url
            ]
            
            # 在异步环境中启动子进程
            self.recording_process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            logger.info("录制已成功启动")
            return True
        except Exception as e:
            logger.error(f"启动录制失败: {str(e)}")
            await self.cleanup()
            return False
            
    async def stop_recording(self):
        """停止录制会话"""
        try:
            if not self.recording_process:
                logger.warning("没有正在进行的录制")
                return []
            
            # 等待录制进程结束
            await self.recording_process.wait()
            
            # 读取生成的测试脚本
            output_file = f"projects/{self.current_project_id}/results/{self.current_test_case_id}.py"
            if os.path.exists(output_file):
                with open(output_file, 'r', encoding='utf-8') as f:
                    recorded_code = f.read()
                
                # 解析录制的步骤
                steps = self._parse_recorded_code(recorded_code)
                
                # 保存步骤到JSON文件
                await self.save_recording(self.current_project_id, self.current_test_case_id, steps, recorded_code)
                
                logger.info(f"录制已停止，共记录 {len(steps)} 个步骤")
                return steps
            else:
                logger.error("未找到录制的脚本文件")
                return []
                
        except Exception as e:
            logger.error(f"停止录制失败: {str(e)}")
            return []
        finally:
            await self.cleanup()
            
    async def cleanup(self):
        """清理资源"""
        try:
            if self.recording_process:
                try:
                    self.recording_process.terminate()
                except:
                    pass
                self.recording_process = None
            
            self.current_test_case_id = None
            self.current_project_id = None
                
        except Exception as e:
            logger.error(f"清理资源失败: {str(e)}")
            
    def _parse_recorded_code(self, code):
        """解析录制的代码，提取步骤"""
        steps = []
        try:
            # 按行分割代码
            lines = code.split('\n')
            for line in lines:
                line = line.strip()
                if not line or line.startswith(('def', 'import', '#', '@')) or line == "":
                    continue
                    
                # 解析每一行代码，转换为步骤
                if 'click' in line:
                    step = {
                        "type": "click",
                        "selector": self._extract_selector(line),
                        "timestamp": datetime.now().isoformat()
                    }
                    steps.append(step)
                elif 'fill' in line:
                    step = {
                        "type": "fill",
                        "selector": self._extract_selector(line),
                        "value": self._extract_value(line),
                        "timestamp": datetime.now().isoformat()
                    }
                    steps.append(step)
                elif 'goto' in line:
                    step = {
                        "type": "goto",
                        "url": self._extract_url(line),
                        "timestamp": datetime.now().isoformat()
                    }
                    steps.append(step)
                    
        except Exception as e:
            logger.error(f"解析录制代码失败: {str(e)}")
        return steps
        
    def _extract_selector(self, line):
        """从代码行中提取选择器"""
        if 'get_by_role' in line:
            return line.split('get_by_role')[1].strip('()').strip()
        elif 'get_by_placeholder' in line:
            return line.split('get_by_placeholder')[1].strip('()').strip()
        elif 'get_by_text' in line:
            return line.split('get_by_text')[1].strip('()').strip()
        return line
        
    def _extract_value(self, line):
        """从代码行中提取填充的值"""
        if 'fill' in line:
            return line.split('fill')[1].strip('()').strip().strip('"\'')
        return ""
        
    def _extract_url(self, line):
        """从代码行中提取URL"""
        if 'goto' in line:
            return line.split('goto')[1].strip('()').strip().strip('"\'')
        return ""
            
    async def save_recording(self, project_id, test_case_id, steps, raw_code):
        """保存录制的步骤"""
        try:
            recording_data = {
                "project_id": project_id,
                "test_case_id": test_case_id,
                "steps": steps,
                "recorded_at": datetime.now().isoformat(),
                "raw_code": raw_code
            }
            
            # 保存JSON格式的测试用例数据
            json_file = f"projects/{project_id}/{test_case_id}.json"
            with open(json_file, "w", encoding="utf-8") as f:
                json.dump(recording_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"录制数据已保存到: {json_file}")
            return True
        except Exception as e:
            logger.error(f"保存录制数据失败: {str(e)}")
            return False 