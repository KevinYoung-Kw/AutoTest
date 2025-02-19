from fastapi import APIRouter, HTTPException
from typing import List
from ..schemas import ProjectCreate, ProjectUpdate, ProjectInfo
from core.project_manager import ProjectManager

router = APIRouter()
project_manager = ProjectManager()

@router.post("/create", response_model=bool)
async def create_project(project: ProjectCreate):
    """创建新项目"""
    success = project_manager.create_project(
        project_id=project.project_id,
        project_name=project.project_name,
        description=project.description
    )
    if not success:
        raise HTTPException(status_code=400, detail="项目创建失败")
    return success

@router.get("/info/{project_id}", response_model=ProjectInfo)
async def get_project(project_id: str):
    """获取项目信息"""
    project_info = project_manager.get_project(project_id)
    if not project_info:
        raise HTTPException(status_code=404, detail="项目不存在")
    return project_info

@router.put("/update/{project_id}", response_model=bool)
async def update_project(project_id: str, project: ProjectUpdate):
    """更新项目信息"""
    success = project_manager.update_project(
        project_id=project_id,
        project_name=project.project_name,
        description=project.description
    )
    if not success:
        raise HTTPException(status_code=400, detail="项目更新失败")
    return success

@router.delete("/delete/{project_id}", response_model=bool)
async def delete_project(project_id: str):
    """删除项目"""
    success = project_manager.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=400, detail="项目删除失败")
    return success

@router.get("/list", response_model=List[ProjectInfo])
async def list_projects():
    """列出所有项目"""
    return project_manager.list_projects() 