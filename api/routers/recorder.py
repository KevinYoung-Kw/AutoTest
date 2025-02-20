from fastapi import APIRouter, HTTPException
from core.recorder import Recorder
from pydantic import BaseModel
from typing import Optional
import json
import os

router = APIRouter()
recorder = Recorder()

class RecordingRequest(BaseModel):
    url: str
    project_id: str
    test_case_id: str

class SaveRecordingRequest(BaseModel):
    project_id: str
    test_case_id: str

class RecordingResponse(BaseModel):
    status: str
    message: str
    steps: Optional[list] = None

@router.post("/start")
async def start_recording(request: RecordingRequest):
    try:
        # 确保项目目录存在
        project_dir = f"projects/{request.project_id}"
        os.makedirs(project_dir, exist_ok=True)
        
        success = await recorder.start_recording(request.url, request.project_id, request.test_case_id)
        if success:
            return RecordingResponse(status="success", message="录制已开始")
        else:
            raise HTTPException(status_code=500, detail="启动录制失败")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_recording():
    try:
        steps = await recorder.stop_recording()
        if steps is not None:
            return RecordingResponse(
                status="success",
                message="录制已停止",
                steps=steps
            )
        else:
            raise HTTPException(status_code=500, detail="停止录制失败")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save")
async def save_recording(request: SaveRecordingRequest):
    try:
        success = await recorder.save_recording(request.project_id, request.test_case_id)
        if success:
            return RecordingResponse(status="success", message="录制数据已保存")
        else:
            raise HTTPException(status_code=500, detail="保存录制数据失败")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 