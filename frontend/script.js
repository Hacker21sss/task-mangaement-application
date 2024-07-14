document.addEventListener('DOMContentLoaded', () => {
    const taskModal = document.getElementById('task-modal');
    const viewTaskModal = document.getElementById('view-task-modal');
    const addTaskBtn = document.getElementById('add-task-btn');
    const closeModal = document.getElementsByClassName('close')[0];
    const viewCloseModal = document.getElementById('view-close');
    const taskForm = document.getElementById('task-form');
    const messageContainer = document.getElementById('message-container');
    const tasksTableBody = document.querySelector('#tasks-table tbody');
    let isEditing = false;
    let editTaskId = null;
    let tasks = [];

    addTaskBtn.onclick = () => {
        resetForm();
        showForm();
        taskModal.style.display = 'block';
        isEditing = false;
    };

    closeModal.onclick = () => {
        taskModal.style.display = 'none';
    };

    viewCloseModal.onclick = () => {
        viewTaskModal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target == taskModal) {
            taskModal.style.display = 'none';
        } else if (event.target == viewTaskModal) {
            viewTaskModal.style.display = 'none';
        }
    };

    taskForm.onsubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(taskForm);

        const requestOptions = {
            method: isEditing ? 'PUT' : 'POST',
            body: formData,
        };

        const endpoint = isEditing ? `http://localhost:3000/tasks/${editTaskId}` : 'http://localhost:3000/tasks';

        try {
            const response = await fetch(endpoint, requestOptions);

            if (response.ok) {
                taskModal.style.display = 'none';
                await loadTasks();
                showMessage(isEditing ? 'Task updated successfully' : 'Task added successfully');
            } else {
                showMessage('Error: Unable to save task');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Error: Unable to save task');
        }
    };

    const loadTasks = async () => {
        const response = await fetch('http://localhost:3000/tasks');
        tasks = await response.json();
        displayTasks();
    };

    const displayTasks = () => {
        tasksTableBody.innerHTML = '';
        tasks.forEach(task => {
            const row = tasksTableBody.insertRow();
            const remainingTime = calculateRemainingTime(task.dueDate);
            const fileUrl = task.fileUrl ? `<a href="http://localhost:3000${task.fileUrl}" target="_blank">View File</a>` : 'No file';

            row.innerHTML = `
                <td data-label="Title">${task.title}</td>
                <td data-label="Description">${task.description}</td>
                <td data-label="Due Date">${new Date(task.dueDate).toLocaleDateString()}</td>
                <td data-label="Time Remaining" id="remaining-time-${task._id}">${remainingTime}</td>
                <td data-label="View File">${fileUrl}</td>
                <td data-label="Actions">
                    <button onclick="viewTask('${task._id}')">View</button>
                    <button onclick="editTask('${task._id}')">Edit</button>
                    <button onclick="deleteTask('${task._id}')">Delete</button>
                </td>
            `;
        });
    };

    const calculateRemainingTime = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const diff = due - now;

        if (diff <= 0) {
            return "Past due";
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    };

    window.viewTask = async (taskId) => {
        const response = await fetch(`http://localhost:3000/tasks/${taskId}`);
        const task = await response.json();

        document.getElementById('view-title').innerText = task.title;
        document.getElementById('view-description').innerText = task.description;
        document.getElementById('view-due-date').innerText = new Date(task.dueDate).toLocaleDateString();
        document.getElementById('view-file-url').innerHTML = task.fileUrl ? `<a href="http://localhost:3000${task.fileUrl}" target="_blank">View File</a>` : 'None';

        viewTaskModal.style.display = 'block';
    };

    window.editTask = async (taskId) => {
        const response = await fetch(`http://localhost:3000/tasks/${taskId}`);
        const task = await response.json();

        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('due-date').value = task.dueDate.split('T')[0];

        showForm();
        taskModal.style.display = 'block';
        isEditing = true;
        editTaskId = taskId;
    };

    window.deleteTask = async (taskId) => {
        const response = await fetch(`http://localhost:3000/tasks/${taskId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            await loadTasks();
            showMessage('Task deleted successfully');
        }
    };

    const showMessage = (message) => {
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 7000);
    };

    const resetForm = () => {
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('due-date').value = '';
        document.getElementById('file').value = '';
    };

    const showForm = () => {
        document.getElementById('task-form').style.display = 'block';
        document.getElementById('task-detail').style.display = 'none';
    };

    const showDetails = () => {
        document.getElementById('task-form').style.display = 'none';
        document.getElementById('task-detail').style.display = 'block';
    };

    setInterval(() => {
        tasks.forEach(task => {
            const remainingTime = calculateRemainingTime(task.dueDate);
            const remainingTimeElement = document.getElementById(`remaining-time-${task._id}`);
            if (remainingTimeElement) {
                remainingTimeElement.textContent = remainingTime;
            }
        });
    }, 1000);

    loadTasks();
});
