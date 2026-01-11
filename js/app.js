// Main Application Controller
const App = {
    // Current filter state
    currentFilters: {
        status: 'all',
        category: 'all',
        priority: 'all',
        search: '',
        sortBy: 'created',
        sortOrder: 'desc'
    },

    // Initialize application
    init() {
        console.log('Initializing TODO App...');

        // Initialize UI
        UI.init();

        // Render categories
        UI.renderCategories();

        // Setup event listeners
        this.setupEventListeners();

        // Initial render
        this.refreshUI();

        console.log('TODO App initialized successfully!');
    },

    // Setup all event listeners
    setupEventListeners() {
        // Add task button
        document.getElementById('btn-add-task').addEventListener('click', () => {
            UI.showModal('add');
        });

        // Modal close button
        document.getElementById('modal-close').addEventListener('click', () => {
            UI.hideModal();
        });

        // Cancel button
        document.getElementById('btn-cancel').addEventListener('click', () => {
            UI.hideModal();
        });

        // Close modal on background click
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                UI.hideModal();
            }
        });

        // Task form submit
        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskFormSubmit();
        });

        // Add category button
        document.getElementById('btn-add-category').addEventListener('click', () => {
            this.handleAddCategory();
        });

        // Filter buttons (status)
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleStatusFilter(e.target);
            });
        });

        // Category filter
        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.refreshUI();
        });

        // Priority filter
        document.getElementById('filter-priority').addEventListener('change', (e) => {
            this.currentFilters.priority = e.target.value;
            this.refreshUI();
        });

        // Sort select
        document.getElementById('sort-by').addEventListener('change', (e) => {
            this.currentFilters.sortBy = e.target.value;
            this.refreshUI();
        });

        // Search input (with debounce)
        let searchTimeout;
        document.getElementById('search-input').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value;
                this.refreshUI();
            }, 300);
        });

        // Task list event delegation
        document.getElementById('task-list').addEventListener('click', (e) => {
            this.handleTaskListClick(e);
        });

        // Export button
        document.getElementById('btn-export').addEventListener('click', () => {
            this.handleExport();
        });

        // Import button
        document.getElementById('btn-import').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        // Import file input
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleImport(e);
        });

        // Clear completed button
        document.getElementById('btn-clear-completed').addEventListener('click', () => {
            this.handleClearCompleted();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    },

    // Handle task list clicks (event delegation)
    handleTaskListClick(e) {
        const target = e.target;

        // Checkbox toggle
        if (target.classList.contains('task-checkbox')) {
            const taskId = target.getAttribute('data-task-id');
            this.handleToggleComplete(taskId);
        }

        // Edit button
        if (target.classList.contains('btn-edit')) {
            const taskId = target.getAttribute('data-task-id');
            this.handleEditTask(taskId);
        }

        // Delete button
        if (target.classList.contains('btn-delete')) {
            const taskId = target.getAttribute('data-task-id');
            this.handleDeleteTask(taskId);
        }

        // Task title (edit)
        if (target.classList.contains('task-title')) {
            const taskId = target.getAttribute('data-task-id');
            this.handleEditTask(taskId);
        }
    },

    // Handle task form submit (add or edit)
    handleTaskFormSubmit() {
        const form = document.getElementById('task-form');
        const formData = UI.getFormData();
        const editId = form.getAttribute('data-edit-id');

        if (editId) {
            // Update existing task
            const updatedTask = Task.updateTask(editId, formData);
            if (updatedTask) {
                UI.hideModal();
                this.refreshUI();
                UI.showNotification('Task updated successfully', 'success');
                setTimeout(() => {
                    UI.highlightTask(editId);
                    UI.scrollToTask(editId);
                }, 100);
            } else {
                UI.showNotification('Failed to update task', 'error');
            }
        } else {
            // Create new task
            const newTask = Task.createTask(formData);
            if (newTask) {
                UI.hideModal();
                this.refreshUI();
                UI.showNotification('Task added successfully', 'success');
                setTimeout(() => {
                    UI.highlightTask(newTask.id);
                    UI.scrollToTask(newTask.id);
                }, 100);
            } else {
                UI.showNotification('Failed to add task', 'error');
            }
        }
    },

    // Handle edit task
    handleEditTask(taskId) {
        const task = Storage.getTaskById(taskId);
        if (task) {
            UI.showModal('edit', task);
        } else {
            UI.showNotification('Task not found', 'error');
        }
    },

    // Handle delete task
    handleDeleteTask(taskId) {
        const task = Storage.getTaskById(taskId);
        if (!task) {
            UI.showNotification('Task not found', 'error');
            return;
        }

        UI.showConfirmDialog(
            `Are you sure you want to delete "${task.title}"?`,
            () => {
                if (Task.deleteTask(taskId)) {
                    UI.removeTaskCard(taskId);
                    this.refreshUI();
                    UI.showNotification('Task deleted successfully', 'success');
                } else {
                    UI.showNotification('Failed to delete task', 'error');
                }
            }
        );
    },

    // Handle toggle task completion
    handleToggleComplete(taskId) {
        const updatedTask = Task.toggleComplete(taskId);
        if (updatedTask) {
            UI.updateTaskCard(updatedTask);
            this.updateStats();
            const message = updatedTask.completed ?
                'Task completed!' : 'Task marked as active';
            UI.showNotification(message, 'success', 2000);
        } else {
            UI.showNotification('Failed to update task', 'error');
        }
    },

    // Handle status filter
    handleStatusFilter(button) {
        // Remove active class from all buttons
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');

        // Update filter and refresh
        this.currentFilters.status = button.getAttribute('data-filter');
        this.refreshUI();
    },

    // Handle add category
    handleAddCategory() {
        const categoryName = prompt('Enter new category name:');
        if (categoryName && categoryName.trim()) {
            const trimmedName = categoryName.trim().toLowerCase();

            if (Storage.addCategory(trimmedName)) {
                UI.renderCategories();
                UI.showNotification(`Category "${trimmedName}" added`, 'success');

                // Select the new category
                document.getElementById('task-category').value = trimmedName;
            } else {
                UI.showNotification('Category already exists or invalid', 'error');
            }
        }
    },

    // Handle export
    handleExport() {
        const jsonData = Storage.exportData();
        if (jsonData) {
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            UI.showNotification('Data exported successfully', 'success');
        } else {
            UI.showNotification('Failed to export data', 'error');
        }
    },

    // Handle import
    handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonString = e.target.result;
            if (Storage.importData(jsonString)) {
                UI.renderCategories();
                this.refreshUI();
                UI.showNotification('Data imported successfully', 'success');
            } else {
                UI.showNotification('Failed to import data', 'error');
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    },

    // Handle clear completed tasks
    handleClearCompleted() {
        const completedTasks = Task.getCompletedTasks();
        if (completedTasks.length === 0) {
            UI.showNotification('No completed tasks to clear', 'info');
            return;
        }

        UI.showConfirmDialog(
            `Are you sure you want to delete all ${completedTasks.length} completed tasks?`,
            () => {
                if (Storage.clearCompleted()) {
                    this.refreshUI();
                    UI.showNotification(`${completedTasks.length} completed tasks cleared`, 'success');
                } else {
                    UI.showNotification('Failed to clear completed tasks', 'error');
                }
            }
        );
    },

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: New task
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            UI.showModal('add');
        }

        // Escape: Close modal
        if (e.key === 'Escape') {
            UI.hideModal();
        }

        // Ctrl/Cmd + F: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            document.getElementById('search-input').focus();
        }
    },

    // Refresh UI
    refreshUI() {
        // Get all tasks
        const allTasks = Storage.getAllTasks();

        // Apply filters
        const filteredTasks = Filters.combineFilters(allTasks, this.currentFilters);

        // Render task list
        UI.renderTaskList(filteredTasks);

        // Update statistics
        this.updateStats();

        // Update empty state message
        UI.updateEmptyStateMessage(this.currentFilters);
    },

    // Update statistics
    updateStats() {
        const allTasks = Storage.getAllTasks();
        UI.renderStats(allTasks);
    },

    // Get filtered tasks
    getFilteredTasks() {
        const allTasks = Storage.getAllTasks();
        return Filters.combineFilters(allTasks, this.currentFilters);
    },

    // Reset filters
    resetFilters() {
        this.currentFilters = {
            status: 'all',
            category: 'all',
            priority: 'all',
            search: '',
            sortBy: 'created',
            sortOrder: 'desc'
        };

        // Reset UI
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === 'all') {
                btn.classList.add('active');
            }
        });

        document.getElementById('filter-category').value = 'all';
        document.getElementById('filter-priority').value = 'all';
        document.getElementById('sort-by').value = 'created';
        document.getElementById('search-input').value = '';

        this.refreshUI();
        UI.showNotification('Filters reset', 'info');
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}

// Make App available globally for debugging
window.TodoApp = App;
