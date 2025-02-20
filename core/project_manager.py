import os
import json
from datetime import datetime
from loguru import logger
import shutil

class ProjectManager:
    def __init__(self, base_path="projects"):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
        
    def create_project(self, project_id, project_name, description=""):
        """创建新项目"""
        try:
            project_path = os.path.join(self.base_path, project_id)
            if os.path.exists(project_path):
                logger.error(f"项目已存在: {project_id}")
                return False
                
            os.makedirs(project_path)
            os.makedirs(os.path.join(project_path, "results"))
            
            project_info = {
                "project_id": project_id,
                "project_name": project_name,
                "description": description,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            with open(os.path.join(project_path, "project_info.json"), "w", encoding="utf-8") as f:
                json.dump(project_info, f, ensure_ascii=False, indent=2)
                
            logger.info(f"项目创建成功: {project_id}")
            return True
        except Exception as e:
            logger.error(f"创建项目失败: {str(e)}")
            return False
            
    def get_project(self, project_id):
        """获取项目信息"""
        try:
            project_path = os.path.join(self.base_path, project_id)
            if not os.path.exists(project_path):
                logger.error(f"项目不存在: {project_id}")
                return None
                
            with open(os.path.join(project_path, "project_info.json"), "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"获取项目信息失败: {str(e)}")
            return None
            
    def update_project(self, project_id, project_name=None, description=None):
        """更新项目信息"""
        try:
            project_info = self.get_project(project_id)
            if not project_info:
                return False
                
            if project_name:
                project_info["project_name"] = project_name
            if description:
                project_info["description"] = description
            project_info["updated_at"] = datetime.now().isoformat()
            
            project_path = os.path.join(self.base_path, project_id)
            with open(os.path.join(project_path, "project_info.json"), "w", encoding="utf-8") as f:
                json.dump(project_info, f, ensure_ascii=False, indent=2)
                
            logger.info(f"项目更新成功: {project_id}")
            return True
        except Exception as e:
            logger.error(f"更新项目失败: {str(e)}")
            return False
            
    def delete_project(self, project_id: str) -> bool:
        """删除项目"""
        try:
            # 读取现有项目列表
            projects = self._load_projects()
            
            # 找到并删除项目
            projects = [p for p in projects if p["project_id"] != project_id]
            
            # 保存更新后的项目列表
            with open(self.projects_file, 'w', encoding='utf-8') as f:
                json.dump(projects, f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            logger.error(f"删除项目失败: {str(e)}")
            return False
            
    def list_projects(self):
        """列出所有项目"""
        try:
            projects = []
            for project_id in os.listdir(self.base_path):
                project_info = self.get_project(project_id)
                if project_info:
                    projects.append(project_info)
            return projects
        except Exception as e:
            logger.error(f"列出项目失败: {str(e)}")
            return []
            
    def get_test_cases(self, project_id):
        """获取项目的测试用例列表"""
        try:
            project_path = os.path.join(self.base_path, project_id)
            test_cases = []
            for file_name in os.listdir(project_path):
                if file_name.endswith(".json") and file_name != "project_info.json":
                    with open(os.path.join(project_path, file_name), "r", encoding="utf-8") as f:
                        test_cases.append(json.load(f))
            return test_cases
        except Exception as e:
            logger.error(f"获取测试用例列表失败: {str(e)}")
            return [] 