from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas import TestCase, ExecutionResult
from core.executor import Executor
from core.project_manager import ProjectManager
from fastapi.responses import PlainTextResponse
import os
import json
from datetime import datetime

router = APIRouter()
executor = Executor()
project_manager = ProjectManager()

@router.post("/execute/{project_id}/{test_case_id}")
async def execute_test_case(project_id: str, test_case_id: str):
    """执行测试用例"""
    try:
        # 初始化测试会话
        if not await executor.start_session():
            raise HTTPException(status_code=500, detail="测试会话初始化失败")
            
        try:
            # 执行测试用例
            result = await executor.execute_test_case(project_id, test_case_id)
            if not result:
                raise HTTPException(status_code=400, detail="测试用例执行失败")
                
            return result
        finally:
            # 确保会话被关闭
            await executor.close_session()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list/{project_id}")
async def list_testcases(project_id: str):
    try:
        testcases = []
        project_dir = f"projects/{project_id}"
        results_dir = f"{project_dir}/results"
        
        # 记录目录信息
        print(f"正在检查目录: {project_dir}")
        print(f"结果目录: {results_dir}")
        
        # 确保目录存在
        if not os.path.exists(project_dir):
            print(f"项目目录不存在: {project_dir}")
            return []
            
        # 读取所有Python脚本文件
        if os.path.exists(results_dir):
            print(f"正在读取结果目录: {results_dir}")
            files = os.listdir(results_dir)
            print(f"目录中的所有文件: {files}")
            
            for filename in files:
                print(f"处理文件: {filename}")
                if filename.endswith('.py'):
                    file_path = os.path.join(results_dir, filename)
                    test_case_id = filename[:-3]  # 移除.py扩展名
                    
                    try:
                        file_stat = os.stat(file_path)
                        print(f"文件状态: 大小={file_stat.st_size}, 修改时间={datetime.fromtimestamp(file_stat.st_mtime)}")
                        
                        testcases.append({
                            "test_case_id": test_case_id,
                            "project_id": project_id,
                            "file_size": file_stat.st_size,
                            "steps": [],  # 由于是脚本文件，这里不包含具体步骤
                            "recorded_at": datetime.fromtimestamp(file_stat.st_mtime).isoformat()
                        })
                        print(f"成功添加测试用例: {test_case_id}")
                    except Exception as e:
                        print(f"处理文件 {filename} 时出错: {str(e)}")
                        continue
        else:
            print(f"结果目录不存在: {results_dir}")
            
        print(f"找到的测试用例数量: {len(testcases)}")
        return testcases
    except Exception as e:
        print(f"列出测试用例时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/script/{project_id}/{test_case_id}")
async def get_script(project_id: str, test_case_id: str):
    try:
        script_path = f"projects/{project_id}/results/{test_case_id}.py"
        if not os.path.exists(script_path):
            raise HTTPException(status_code=404, detail="脚本文件不存在")
            
        with open(script_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return PlainTextResponse(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 