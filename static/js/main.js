// 全局变量
let currentProjectId = null;
let isRecording = false;
let currentTestCaseId = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    
    // 绑定录制按钮事件
    const recordButton = document.getElementById('recordButton');
    recordButton.innerHTML = '开始录制';
    recordButton.disabled = false;
    recordButton.addEventListener('click', showRecordUrlModal);
    
    // 绑定项目测试按钮事件
    const executeButton = document.getElementById('executeButton');
    executeButton.addEventListener('click', () => {
        if (currentProjectId) {
            executeProject(currentProjectId);
        } else {
            alert('请先选择一个项目');
        }
    });
    
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
            const item = createProjectListItem(project);
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
    recordButton.addEventListener('click', showRecordUrlModal);
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
        recordButton.addEventListener('click', showRecordUrlModal);
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

// 执行单个测试用例
async function executeTestCase(testCaseId) {
    if (!currentProjectId) {
        alert('请先选择一个项目');
        return;
    }

    // 显示加载状态
    const executeButton = document.querySelector(`button[onclick="executeTestCase('${testCaseId}')"]`);
    const originalText = executeButton.innerHTML;
    executeButton.disabled = true;
    executeButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 执行中...';

    try {
        const response = await fetch(`/api/v1/testcase/execute/${currentProjectId}/${testCaseId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        const result = await response.json();
        
        // 显示执行结果
        const resultsContainer = document.getElementById('executionResults');
        const resultElement = document.createElement('div');
        resultElement.className = `alert alert-${result.status === 'success' ? 'success' : 'warning'} mb-3`;
        
        // 创建结果摘要
        resultElement.innerHTML = `
            <h6 class="alert-heading">测试用例执行结果</h6>
            <div class="mb-2">测试用例: ${testCaseId}</div>
            <div class="mb-2">状态: <span class="badge ${result.status === 'success' ? 'bg-success' : 'bg-danger'}">${result.status}</span></div>
            <div class="mb-2">执行时间: ${new Date(result.execution_time).toLocaleString()}</div>
            ${result.message ? `<div class="mt-2">消息: ${result.message}</div>` : ''}
            <hr>
            <div class="mt-2">
                <button class="btn btn-sm btn-info" onclick="toggleDetails(this)">显示详细信息</button>
                <div class="details mt-2" style="display: none;">
                    <div class="card">
                        <div class="card-body">
                            ${result.error_details ? `
                                <div class="error-section mb-3">
                                    <div class="fw-bold text-danger mb-1">错误类型:</div>
                                    <div class="ms-3">${result.error_details.type}</div>
                                </div>
                                <div class="error-section mb-3">
                                    <div class="fw-bold text-danger mb-1">错误原因:</div>
                                    <div class="ms-3">${result.error_details.reason}</div>
                                </div>
                                <div class="error-section">
                                    <div class="fw-bold text-danger mb-2">修复建议:</div>
                                    <ul class="suggestion-list mb-0">
                                        ${result.error_details.suggestions.map(s => `
                                            <li class="mb-1">${s}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                            ` : '执行成功，无错误信息'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 将新的结果插入到容器的顶部
        resultsContainer.insertBefore(resultElement, resultsContainer.firstChild);
        
        // 更新按钮状态
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

// 显示执行结果
function displayExecutionResult(result) {
    const resultsContainer = document.getElementById('executionResults');
    
    const resultElement = document.createElement('div');
    resultElement.className = `alert ${result.status === 'success' ? 'alert-success' : 'alert-danger'} mb-3`;
    
    if (result.status === 'success') {
        resultElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="alert-heading mb-2">测试用例: ${result.test_case_id}</h6>
                    <div class="mb-2">执行时间: ${new Date(result.execution_time).toLocaleString()}</div>
                    <div class="mb-2">状态: <span class="badge bg-success">成功</span></div>
                    ${result.message ? `<div class="mt-2">消息: ${result.message}</div>` : ''}
                </div>
            </div>
        `;
    } else {
        // 解析错误信息
        const errorInfo = result.error_details || parseErrorMessage(result.message);
        
        resultElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div style="width: 100%">
                    <div class="test-case-header mb-3">
                        <h6 class="alert-heading mb-2">测试用例: ${result.test_case_id}</h6>
                        <div class="mb-2">执行时间: ${new Date(result.execution_time).toLocaleString()}</div>
                        <div class="mb-2">状态: <span class="badge bg-danger">失败</span></div>
                    </div>
                    
                    <div class="error-details p-3 bg-light rounded">
                        <div class="error-section mb-3">
                            <div class="fw-bold text-danger mb-1">错误类型:</div>
                            <div class="ms-3">${errorInfo.type}</div>
                        </div>
                        
                        <div class="error-section mb-3">
                            <div class="fw-bold text-danger mb-1">错误原因:</div>
                            <div class="ms-3">${errorInfo.reason}</div>
                        </div>
                        
                        <div class="error-section">
                            <div class="fw-bold text-danger mb-2">修复建议:</div>
                            <ul class="suggestion-list mb-0">
                                ${errorInfo.suggestions.map(s => `
                                    <li class="mb-1">${s}</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加自定义样式
        const style = document.createElement('style');
        style.textContent = `
            .suggestion-list {
                list-style-type: none;
                padding-left: 1.5rem;
            }
            .suggestion-list li {
                position: relative;
            }
            .suggestion-list li:before {
                content: "•";
                position: absolute;
                left: -1.5rem;
                color: #dc3545;
            }
            .error-details {
                border-left: 4px solid #dc3545;
            }
        `;
        resultElement.appendChild(style);
    }
    
    // 将新的结果插入到容器的顶部
    resultsContainer.insertBefore(resultElement, resultsContainer.firstChild);
    
    // 如果结果太多，移除旧的结果
    while (resultsContainer.children.length > 10) {
        resultsContainer.removeChild(resultsContainer.lastChild);
    }
}

// 解析错误消息字符串为结构化数据
function parseErrorMessage(message) {
    try {
        const lines = message.split('\n').map(line => line.trim()).filter(line => line);
        const errorInfo = {
            type: '',
            reason: '',
            suggestions: []
        };
        
        for (const line of lines) {
            if (line.startsWith('错误类型:')) {
                errorInfo.type = line.replace('错误类型:', '').trim();
            } else if (line.startsWith('错误原因:')) {
                errorInfo.reason = line.replace('错误原因:', '').trim();
            } else if (line.startsWith('-')) {
                errorInfo.suggestions.push(line.substring(1).trim());
            }
        }
        
        return errorInfo;
    } catch (e) {
        return {
            type: '解析错误',
            reason: '无法解析错误信息',
            suggestions: ['请查看原始错误信息']
        };
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

// 执行项目中的所有测试用例
async function executeProject(projectId) {
    if (!projectId) {
        alert('请先选择一个项目');
        return;
    }

    // 显示加载状态
    const executeButton = document.getElementById('executeButton');
    executeButton.disabled = true;
    executeButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> 执行中...';

    try {
        // 获取项目名称
        const projectElement = document.querySelector(`[data-project-id="${projectId}"]`);
        const projectName = projectElement ? projectElement.querySelector('h6').textContent : projectId;

        const response = await fetch(`/api/v1/testcase/execute_project/${projectId}`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        const result = await response.json();
        
        // 显示执行结果
        const resultsContainer = document.getElementById('executionResults');
        const resultElement = document.createElement('div');
        resultElement.className = `alert alert-${result.failed === 0 ? 'success' : 'warning'} mb-3`;
        
        // 创建结果摘要
        resultElement.innerHTML = `
            <h6 class="alert-heading">项目测试结果 - ${projectName}</h6>
            <div class="mb-2">总计: ${result.total} 个测试用例</div>
            <div class="mb-2">成功: ${result.success} 个</div>
            <div class="mb-2">失败: ${result.failed} 个</div>
            <div class="mt-2">${result.message}</div>
            <hr>
            <div class="mt-2">
                <button class="btn btn-sm btn-info" onclick="toggleDetails(this)">显示详细结果</button>
                <div class="details mt-2" style="display: none;">
                    ${result.results.map(r => `
                        <div class="card mb-2">
                            <div class="card-body">
                                <h6 class="card-title">${r.test_case_id}</h6>
                                <p class="card-text">
                                    状态: <span class="badge ${r.status === 'success' ? 'bg-success' : 'bg-danger'}">${r.status}</span><br>
                                    执行时间: ${new Date(r.execution_time).toLocaleString()}<br>
                                    ${r.message ? `消息: ${r.message}` : ''}
                                </p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // 将新的结果插入到容器的顶部
        resultsContainer.insertBefore(resultElement, resultsContainer.firstChild);
        
    } catch (error) {
        console.error('执行项目失败:', error);
        alert('执行项目失败: ' + error.message);
    } finally {
        // 恢复按钮状态
        executeButton.disabled = false;
        executeButton.innerHTML = '项目测试';
    }
}

// 切换详细结果显示
function toggleDetails(button) {
    const detailsDiv = button.nextElementSibling;
    if (detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        button.textContent = '隐藏详细结果';
    } else {
        detailsDiv.style.display = 'none';
        button.textContent = '显示详细结果';
    }
}

// 在项目列表项中添加执行按钮
function createProjectListItem(project) {
    const item = document.createElement('a');
    item.className = 'list-group-item list-group-item-action';
    item.setAttribute('data-project-id', project.project_id);
    item.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-0">${project.project_name}</h6>
                <small class="text-muted">${project.project_id}</small>
            </div>
            <div class="btn-group">
                <button class="btn btn-sm btn-primary me-2" data-project-id="${project.project_id}">执行所有</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProject('${project.project_id}', '${project.project_name}')">删除</button>
            </div>
        </div>
        <small class="text-muted d-block mt-1">${project.description || '无描述'}</small>
    `;
    
    // 使用addEventListener绑定项目执行按钮事件
    const executeBtn = item.querySelector('button[data-project-id]');
    executeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        executeProject(project.project_id);
    });
    
    // 绑定项目选择事件
    item.onclick = () => selectProject(project.project_id);
    return item;
}

// 删除项目功能
async function deleteProject(projectId, projectName) {
    // 显示确认对话框
    if (!confirm(`确定要删除项目 "${projectName}" 吗？\n此操作将删除该项目下的所有测试用例，且不可恢复！`)) {
        return;
    }

    try {
        const response = await fetch(`/api/v1/project/delete/${projectId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        // 如果是当前选中的项目，清除选中状态
        if (currentProjectId === projectId) {
            currentProjectId = null;
            // 清空测试用例列表
            document.getElementById('testCaseList').innerHTML = '';
        }

        // 重新加载项目列表
        await loadProjects();
        alert('项目删除成功');

    } catch (error) {
        console.error('删除项目失败:', error);
        alert('删除项目失败: ' + error.message);
    }
}

// 确保所有需要的函数都可以在全局范围内访问
window.executeProject = executeProject;
window.toggleDetails = toggleDetails;
window.showNewProjectModal = showNewProjectModal;
window.createProject = createProject;
window.showRecordUrlModal = showRecordUrlModal;
window.handleRecordingInstructionsClose = handleRecordingInstructionsClose;
window.executeTestCase = executeTestCase;
window.deleteTestCase = deleteTestCase;
window.viewScript = viewScript;
window.deleteProject = deleteProject;