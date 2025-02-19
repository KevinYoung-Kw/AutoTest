// 全局变量
let currentProjectId = null;
let isRecording = false;
let currentTestCaseId = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    // 重置录制按钮状态
    const recordButton = document.getElementById('recordButton');
    recordButton.innerHTML = '开始录制';
    recordButton.disabled = false;
    recordButton.onclick = showRecordUrlModal;
    isRecording = false;
});

// 加载项目列表
async function loadProjects() {
    try {
        const response = await fetch('/api/v1/project/list');
        const projects = await response.json();
        
        const projectList = document.getElementById('projectList');
        projectList.innerHTML = '';
        
        projects.forEach(project => {
            const item = document.createElement('a');
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${project.project_name}</h6>
                    <small class="text-muted">${project.project_id}</small>
                </div>
                <small class="text-muted">${project.description || '无描述'}</small>
            `;
            item.onclick = () => selectProject(project.project_id);
            projectList.appendChild(item);
        });
    } catch (error) {
        console.error('加载项目列表失败:', error);
        alert('加载项目列表失败');
    }
}

// 选择项目
async function selectProject(projectId) {
    currentProjectId = projectId;
    document.querySelectorAll('#projectList .list-group-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector('small').textContent === projectId) {
            item.classList.add('active');
        }
    });
    
    await loadTestCases(projectId);
}

// 加载测试用例
async function loadTestCases(projectId) {
    try {
        const response = await fetch(`/api/v1/testcase/list/${projectId}`);
        if (!response.ok) {
            throw new Error('加载测试用例失败');
        }
        
        const testCases = await response.json();
        console.log('加载到的测试用例:', testCases); // 添加调试日志
        
        const testCaseList = document.getElementById('testCaseList');
        testCaseList.innerHTML = '';
        
        if (!testCases || testCases.length === 0) {
            testCaseList.innerHTML = '<div class="list-group-item text-center text-muted">暂无测试用例</div>';
            return;
        }
        
        testCases.forEach(testCase => {
            const recordedDate = new Date(testCase.recorded_at);
            const item = document.createElement('div');
            item.className = 'list-group-item';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${testCase.test_case_id}</h6>
                        <small class="text-muted">
                            录制时间: ${recordedDate.toLocaleString()}<br>
                            文件大小: ${(testCase.file_size / 1024).toFixed(2)} KB
                        </small>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-info me-2" onclick="viewScript('${testCase.test_case_id}')">查看脚本</button>
                        <button class="btn btn-sm btn-primary me-2" onclick="executeTestCase('${testCase.test_case_id}')">执行</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteTestCase('${testCase.test_case_id}')">删除</button>
                    </div>
                </div>
            `;
            testCaseList.appendChild(item);
        });
    } catch (error) {
        console.error('加载测试用例失败:', error);
        alert('加载测试用例失败: ' + error.message);
    }
}

// 显示新建项目模态框
function showNewProjectModal() {
    const modal = new bootstrap.Modal(document.getElementById('newProjectModal'));
    modal.show();
}

// 创建新项目
async function createProject() {
    const projectId = document.getElementById('projectId').value;
    const projectName = document.getElementById('projectName').value;
    const description = document.getElementById('projectDescription').value;
    
    try {
        const response = await fetch('/api/v1/project/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project_id: projectId,
                project_name: projectName,
                description: description
            })
        });
        
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('newProjectModal')).hide();
            await loadProjects();
            document.getElementById('newProjectForm').reset();
        } else {
            throw new Error('创建项目失败');
        }
    } catch (error) {
        console.error('创建项目失败:', error);
        alert('创建项目失败');
    }
}

// 显示录制URL输入模态框
function showRecordUrlModal() {
    if (!currentProjectId) {
        alert('请先选择一个项目');
        return;
    }
    const modal = new bootstrap.Modal(document.getElementById('recordUrlModal'));
    modal.show();
}

// 处理录制说明模态框关闭
function handleRecordingInstructionsClose() {
    // 关闭模态框
    bootstrap.Modal.getInstance(document.getElementById('recordingInstructionsModal')).hide();
    
    // 恢复录制按钮状态
    const recordButton = document.getElementById('recordButton');
    recordButton.innerHTML = '开始录制';
    recordButton.disabled = false;
    recordButton.onclick = showRecordUrlModal;
    isRecording = false;
    
    // 刷新测试用例列表
    if (currentProjectId) {
        loadTestCases(currentProjectId);
    }
}

// 修改开始录制会话函数
async function startRecordingSession() {
    const url = document.getElementById('recordUrl').value;
    const testCaseId = document.getElementById('testCaseId').value;
    
    if (!url) {
        alert('请输入有效的URL');
        return;
    }
    if (!testCaseId) {
        alert('请输入测试案例编号');
        return;
    }

    currentTestCaseId = testCaseId;

    const recordButton = document.getElementById('recordButton');
    recordButton.disabled = true;
    recordButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 正在启动...';

    try {
        const response = await fetch('/api/v1/recorder/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                project_id: currentProjectId,
                test_case_id: testCaseId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || '启动录制失败');
        }

        isRecording = true;
        bootstrap.Modal.getInstance(document.getElementById('recordUrlModal')).hide();
        
        // 显示录制说明
        const instructionsModal = new bootstrap.Modal(document.getElementById('recordingInstructionsModal'));
        instructionsModal.show();
        
        // 不在这里修改录制按钮状态，而是等待用户点击"我知道了"
    } catch (error) {
        console.error('启动录制失败:', error);
        alert('启动录制失败: ' + error.message);
        recordButton.innerHTML = '开始录制';
        recordButton.disabled = false;
    }
}

// 停止录制
async function stopRecording() {
    const recordButton = document.getElementById('recordButton');
    recordButton.disabled = true;
    recordButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 正在停止...';

    try {
        const response = await fetch('/api/v1/recorder/stop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || '停止录制失败');
        }

        // 保存录制结果
        await saveRecording(currentTestCaseId);

        isRecording = false;
        recordButton.innerHTML = '开始录制';
        recordButton.onclick = showRecordUrlModal;
        recordButton.disabled = false;
        
        // 重新加载测试用例列表
        await loadTestCases(currentProjectId);
        alert('录制已完成并保存');
    } catch (error) {
        console.error('停止录制失败:', error);
        alert('停止录制失败: ' + error.message);
        recordButton.disabled = false;
        recordButton.innerHTML = '录制中... <span class="recording-indicator">●</span>';
    }
}

// 保存录制数据
async function saveRecording(testCaseId, steps) {
    try {
        const response = await fetch('/api/v1/recorder/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                project_id: currentProjectId,
                test_case_id: testCaseId
            })
        });
        
        if (!response.ok) {
            throw new Error('保存录制数据失败');
        }

        // 重新加载测试用例列表
        await loadTestCases(currentProjectId);
    } catch (error) {
        console.error('保存录制数据失败:', error);
        alert('保存录制数据失败');
    }
}

// 执行测试用例
async function executeTestCase(testCaseId) {
    const executeButton = document.querySelector(`button[onclick="executeTestCase('${testCaseId}')"]`);
    const originalText = executeButton.innerHTML;
    executeButton.disabled = true;
    executeButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 执行中...';

    try {
        const response = await fetch(`/api/v1/testcase/execute/${currentProjectId}/${testCaseId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || '执行测试用例失败');
        }

        const result = await response.json();
        displayExecutionResult(result);
        
        // 根据执行结果更新按钮状态
        if (result.status === 'success') {
            executeButton.classList.remove('btn-primary');
            executeButton.classList.add('btn-success');
            executeButton.innerHTML = '执行成功';
            setTimeout(() => {
                executeButton.classList.remove('btn-success');
                executeButton.classList.add('btn-primary');
                executeButton.innerHTML = originalText;
                executeButton.disabled = false;
            }, 3000);
        } else {
            executeButton.classList.remove('btn-primary');
            executeButton.classList.add('btn-danger');
            executeButton.innerHTML = '执行失败';
            setTimeout(() => {
                executeButton.classList.remove('btn-danger');
                executeButton.classList.add('btn-primary');
                executeButton.innerHTML = originalText;
                executeButton.disabled = false;
            }, 3000);
        }
    } catch (error) {
        console.error('执行测试用例失败:', error);
        alert('执行测试用例失败: ' + error.message);
        executeButton.classList.remove('btn-primary');
        executeButton.classList.add('btn-danger');
        executeButton.innerHTML = '执行失败';
        setTimeout(() => {
            executeButton.classList.remove('btn-danger');
            executeButton.classList.add('btn-primary');
            executeButton.innerHTML = originalText;
            executeButton.disabled = false;
        }, 3000);
    }
}

// 执行所有测试
async function executeAllTests() {
    if (!currentProjectId) {
        alert('请先选择一个项目');
        return;
    }
    
    try {
        const response = await fetch(`/api/v1/testcase/execute_all/${currentProjectId}`, {
            method: 'POST'
        });
        
        const results = await response.json();
        results.forEach(result => displayExecutionResult(result));
    } catch (error) {
        console.error('执行测试失败:', error);
        alert('执行测试失败');
    }
}

// 显示执行结果
function displayExecutionResult(result) {
    const resultsContainer = document.getElementById('executionResults');
    
    const resultElement = document.createElement('div');
    resultElement.className = `alert alert-${result.status === 'success' ? 'success' : 'danger'} mb-3`;
    
    resultElement.innerHTML = `
        <h6 class="alert-heading">测试用例: ${result.test_case_id}</h6>
        <div class="mb-2">执行时间: ${new Date(result.execution_time).toLocaleString()}</div>
        <div>状态: ${result.status === 'success' ? '成功' : '失败'}</div>
        ${result.message ? `<div class="mt-2">消息: ${result.message}</div>` : ''}
    `;
    
    // 将新的结果插入到容器的顶部
    resultsContainer.insertBefore(resultElement, resultsContainer.firstChild);
    
    // 如果结果太多，移除旧的结果
    while (resultsContainer.children.length > 10) {
        resultsContainer.removeChild(resultsContainer.lastChild);
    }
}

// 删除测试用例
async function deleteTestCase(testCaseId) {
    if (!confirm('确定要删除这个测试用例吗？')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/v1/testcase/delete/${currentProjectId}/${testCaseId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadTestCases(currentProjectId);
        } else {
            throw new Error('删除测试用例失败');
        }
    } catch (error) {
        console.error('删除测试用例失败:', error);
        alert('删除测试用例失败');
    }
}

// 查看脚本内容
async function viewScript(testCaseId) {
    try {
        const response = await fetch(`/api/v1/testcase/script/${currentProjectId}/${testCaseId}`);
        if (!response.ok) {
            throw new Error('获取脚本内容失败');
        }
        
        const content = await response.text();
        document.getElementById('scriptContent').textContent = content;
        const modal = new bootstrap.Modal(document.getElementById('viewScriptModal'));
        modal.show();
    } catch (error) {
        console.error('获取脚本内容失败:', error);
        alert('获取脚本内容失败');
    }
} 