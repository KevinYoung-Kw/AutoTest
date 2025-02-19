from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ProjectCreate(BaseModel):
    project_id: str
    project_name: str
    description: Optional[str] = ""

class ProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    description: Optional[str] = None

class ProjectInfo(BaseModel):
    project_id: str
    project_name: str
    description: str
    created_at: datetime
    updated_at: datetime

class TestStep(BaseModel):
    type: str
    selector: str
    value: Optional[str] = None
    timestamp: datetime

class TestCase(BaseModel):
    project_id: str
    test_case_id: str
    steps: List[TestStep]
    recorded_at: datetime

class StepResult(BaseModel):
    status: str
    screenshot: Optional[str] = None
    error: Optional[str] = None
    timestamp: datetime

class TestResult(BaseModel):
    step: TestStep
    result: StepResult

class ExecutionResult(BaseModel):
    project_id: str
    test_case_id: str
    execution_time: datetime
    status: str
    steps: List[TestResult] 