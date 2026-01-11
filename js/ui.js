// UI Rendering and DOM Manipulation
const UI = {
    // DOM element cache
    elements: {
        taskList: null,
        emptyState: null,
        modal: null,
        modalTitle: null,
        taskForm: null,
        notificationContainer: null,
        statTotal: null,
        statActive: null,
        statCompleted: null
    },

    // Initialize DOM element cache
    init() {
        this.elements.taskList = document.getElementById('task-list');
        this.elements.emptyState = document.getElementById('empty-state');
        this.elements.modal = document.getElementById('task-modal');
        this.elements.modalTitle = document.getElementById('modal-title');
        this.elements.taskForm = document.getElementById('task-form');
        this.elements.notificationContainer = document.getElementById('notification-container');
        this.elements.statTotal = document.getElementById('stat-total');
        this.elements.statActive = document.getElementById('stat-active');
        this.elements.statCompleted = document.getElementById('stat-completed');
    },

    // Render task list
    renderTaskList(tasks) {
        const taskList = this.elements.taskList;
        const emptyState = this.elements.emptyState;

        if (!tasks || tasks.length === 0) {
            emptyState.style.display = 'block';
            // Remove all task cards
            const existingCards = taskList.querySelectorAll('.task-card');
            existingCards.forEach(card => card.remove());
            return;
        }

        emptyState.style.display = 'none';

        // Clear existing tasks
        const existingCards = taskList.querySelectorAll('.task-card');
        existingCards.forEach(card => card.remove());

        // Render each task
        tasks.forEach(task => {
            const taskCard = this.createTaskCard(task);
            taskList.appendChild(taskCard);
        });
    },

    // Create task card HTML element
    createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-task-id', task.id);

        // Add completed class
        if (task.completed) {
            card.classList.add('completed');
        }

        // Add priority class
        card.classList.add(`priority-${task.priority}`);

        // Add overdue class
        if (Task.isPastDue(task)) {
            card.classList.add('overdue');
        }

        // Build task card HTML
        card.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}
                   data-task-id="${task.id}">
            <div class="task-content">
                <div class="task-header">
                    <div class="task-title" data-task-id="${task.id}">${this.escapeHtml(task.title)}</div>
                    <div class="task-actions">
                        <button class="btn-icon btn-edit" data-task-id="${task.id}" title="Edit task">
                            ✏️
                        </button>
                        <button class="btn-icon btn-delete" data-task-id="${task.id}" title="Delete task">
                            🗑️
                        </button>
                    </div>
                </div>
                ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span class="task-badge category-badge">${this.escapeHtml(task.category)}</span>
                    <span class="task-badge priority-badge ${task.priority}">${this.capitalizeFirst(task.priority)}</span>
                    ${this.renderDueDateBadge(task)}
                </div>
            </div>
        `;

        return card;
    },

    // Render due date badge
    renderDueDateBadge(task) {
        if (!task.dueDate) {
            return '';
        }

        const formattedDate = Task.formatDueDate(task.dueDate);
        const isOverdue = Task.isPastDue(task);
        const isDueToday = Task.isDueToday(task);

        let badgeClass = 'task-badge due-date-badge';
        if (isOverdue) {
            badgeClass += ' overdue';
        } else if (isDueToday) {
            badgeClass += ' due-today';
        }

        const icon = isOverdue ? '⚠️' : '📅';
        return `<span class="${badgeClass}">${icon} ${formattedDate}</span>`;
    },

    // Update single task card
    updateTaskCard(task) {
        const existingCard = document.querySelector(`[data-task-id="${task.id}"]`);
        if (existingCard && existingCard.classList.contains('task-card')) {
            const newCard = this.createTaskCard(task);
            existingCard.replaceWith(newCard);
        }
    },

    // Remove task card from DOM
    removeTaskCard(id) {
        const card = document.querySelector(`.task-card[data-task-id="${id}"]`);
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                card.remove();
                // Check if list is empty
                const remainingCards = document.querySelectorAll('.task-card');
                if (remainingCards.length === 0) {
                    this.elements.emptyState.style.display = 'block';
                }
            }, 300);
        }
    },

    // Render statistics
    renderStats(tasks) {
        const stats = Task.getStatistics(tasks);
        this.elements.statTotal.textContent = stats.total;
        this.elements.statActive.textContent = stats.active;
        this.elements.statCompleted.textContent = stats.completed;
    },

    // Show modal
    showModal(mode = 'add', taskData = null) {
        const modal = this.elements.modal;
        const modalTitle = this.elements.modalTitle;
        const form = this.elements.taskForm;
        const submitBtn = document.getElementById('btn-submit');

        // Set modal title and button text
        if (mode === 'edit' && taskData) {
            modalTitle.textContent = 'Edit Task';
            submitBtn.textContent = 'Update Task';
            this.populateForm(taskData);
            form.setAttribute('data-edit-id', taskData.id);
        } else {
            modalTitle.textContent = 'Add Task';
            submitBtn.textContent = 'Add Task';
            form.reset();
            form.removeAttribute('data-edit-id');
        }

        modal.classList.add('active');
        document.getElementById('task-title').focus();
    },

    // Hide modal
    hideModal() {
        const modal = this.elements.modal;
        const form = this.elements.taskForm;
        modal.classList.remove('active');
        form.reset();
        form.removeAttribute('data-edit-id');
    },

    // Populate form with task data
    populateForm(task) {
        document.getElementById('task-title').value = task.title || '';
        document.getElementById('task-description').value = task.description || '';
        document.getElementById('task-category').value = task.category || 'general';
        document.getElementById('task-priority').value = task.priority || 'medium';
        document.getElementById('task-due-date').value = task.dueDate || '';
    },

    // Get form data
    getFormData() {
        return {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            category: document.getElementById('task-category').value,
            priority: document.getElementById('task-priority').value,
            dueDate: document.getElementById('task-due-date').value || null
        };
    },

    // Render category options
    renderCategories() {
        const categories = Storage.getCategories();
        const categorySelects = [
            document.getElementById('task-category'),
            document.getElementById('filter-category')
        ];

        categorySelects.forEach((select, index) => {
            const currentValue = select.value;

            // Clear existing options (except "All Categories" for filter)
            select.innerHTML = '';

            // Add "All Categories" option for filter select only
            if (index === 1) {
                const allOption = document.createElement('option');
                allOption.value = 'all';
                allOption.textContent = 'All Categories';
                select.appendChild(allOption);
            }

            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = this.capitalizeFirst(category);
                select.appendChild(option);
            });

            // Restore previous value if it still exists
            if (currentValue && categories.includes(currentValue)) {
                select.value = currentValue;
            }
        });
    },

    // Show notification
    showNotification(message, type = 'info', duration = 3000) {
        const container = this.elements.notificationContainer;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;

        const icon = this.getNotificationIcon(type);
        notification.innerHTML = `
            <span>${icon}</span>
            <span>${this.escapeHtml(message)}</span>
        `;

        container.appendChild(notification);

        // Auto remove notification
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    },

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        return icons[type] || icons.info;
    },

    // Show confirmation dialog
    showConfirmDialog(message, onConfirm) {
        if (confirm(message)) {
            onConfirm();
        }
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Capitalize first letter
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    // Show loading state
    showLoading() {
        const taskList = this.elements.taskList;
        taskList.style.opacity = '0.5';
        taskList.style.pointerEvents = 'none';
    },

    // Hide loading state
    hideLoading() {
        const taskList = this.elements.taskList;
        taskList.style.opacity = '1';
        taskList.style.pointerEvents = 'auto';
    },

    // Highlight task (e.g., after adding/editing)
    highlightTask(taskId) {
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (card) {
            card.style.backgroundColor = '#e3f2fd';
            setTimeout(() => {
                card.style.backgroundColor = '';
            }, 1000);
        }
    },

    // Scroll to task
    scrollToTask(taskId) {
        const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    },

    // Update empty state message based on filters
    updateEmptyStateMessage(filters) {
        const emptyState = this.elements.emptyState;

        if (filters && filters.status !== 'all') {
            const messages = {
                active: 'No active tasks. Great job!',
                completed: 'No completed tasks yet.'
            };
            emptyState.innerHTML = `<p>${messages[filters.status] || 'No tasks found.'}</p>`;
        } else if (filters && filters.search) {
            emptyState.innerHTML = '<p>No tasks match your search.</p>';
        } else {
            emptyState.innerHTML = '<p>No tasks yet. Click "Add Task" to get started!</p>';
        }
    }
};
