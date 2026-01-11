// Task Model and Operations
const Task = {
    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validate task data
    validateTask(taskData) {
        const errors = [];

        // Title is required
        if (!taskData.title || taskData.title.trim().length === 0) {
            errors.push('Title is required');
        }

        // Title length limit
        if (taskData.title && taskData.title.length > 200) {
            errors.push('Title must be 200 characters or less');
        }

        // Description length limit
        if (taskData.description && taskData.description.length > 500) {
            errors.push('Description must be 500 characters or less');
        }

        // Priority validation
        const validPriorities = ['low', 'medium', 'high'];
        if (taskData.priority && !validPriorities.includes(taskData.priority)) {
            errors.push('Invalid priority value');
        }

        // Due date validation
        if (taskData.dueDate && taskData.dueDate !== null) {
            const date = new Date(taskData.dueDate);
            if (isNaN(date.getTime())) {
                errors.push('Invalid due date');
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    },

    // Create new task
    createTask(taskData) {
        // Validate task data
        const validation = this.validateTask(taskData);
        if (!validation.isValid) {
            console.error('Task validation failed:', validation.errors);
            return null;
        }

        // Create task object
        const task = {
            id: this.generateId(),
            title: taskData.title.trim(),
            description: taskData.description ? taskData.description.trim() : '',
            category: taskData.category || 'general',
            priority: taskData.priority || 'medium',
            dueDate: taskData.dueDate || null,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        // Save to storage
        if (Storage.saveTask(task)) {
            return task;
        }

        return null;
    },

    // Update existing task
    updateTask(id, updates) {
        // Get existing task
        const existingTask = Storage.getTaskById(id);
        if (!existingTask) {
            console.error('Task not found:', id);
            return null;
        }

        // Merge updates
        const updatedTask = {
            ...existingTask,
            ...updates,
            id: existingTask.id, // Prevent ID changes
            createdAt: existingTask.createdAt // Prevent createdAt changes
        };

        // Validate updated task
        const validation = this.validateTask(updatedTask);
        if (!validation.isValid) {
            console.error('Task validation failed:', validation.errors);
            return null;
        }

        // Trim string fields
        if (updatedTask.title) {
            updatedTask.title = updatedTask.title.trim();
        }
        if (updatedTask.description) {
            updatedTask.description = updatedTask.description.trim();
        }

        // Save to storage
        if (Storage.saveTask(updatedTask)) {
            return updatedTask;
        }

        return null;
    },

    // Toggle task completion status
    toggleComplete(id) {
        const task = Storage.getTaskById(id);
        if (!task) {
            console.error('Task not found:', id);
            return null;
        }

        const updatedTask = {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : null
        };

        if (Storage.saveTask(updatedTask)) {
            return updatedTask;
        }

        return null;
    },

    // Delete task
    deleteTask(id) {
        return Storage.deleteTask(id);
    },

    // Check if task is past due
    isPastDue(task) {
        if (!task.dueDate || task.completed) {
            return false;
        }

        const dueDate = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day

        return dueDate < today;
    },

    // Check if task is due today
    isDueToday(task) {
        if (!task.dueDate || task.completed) {
            return false;
        }

        const dueDate = new Date(task.dueDate);
        const today = new Date();

        return dueDate.toDateString() === today.toDateString();
    },

    // Check if task is due soon (within next 3 days)
    isDueSoon(task) {
        if (!task.dueDate || task.completed) {
            return false;
        }

        const dueDate = new Date(task.dueDate);
        const today = new Date();
        const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

        return dueDate > today && dueDate <= threeDaysFromNow;
    },

    // Get task priority weight (for sorting)
    getPriorityWeight(priority) {
        const weights = {
            high: 3,
            medium: 2,
            low: 1
        };
        return weights[priority] || 0;
    },

    // Format due date for display
    formatDueDate(dueDate) {
        if (!dueDate) {
            return null;
        }

        const date = new Date(dueDate);
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // Reset time for comparison
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        if (compareDate.getTime() === today.getTime()) {
            return 'Today';
        } else if (compareDate.getTime() === tomorrow.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    },

    // Get task statistics
    getStatistics(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;
        const overdue = tasks.filter(t => this.isPastDue(t)).length;
        const dueToday = tasks.filter(t => this.isDueToday(t)).length;
        const dueSoon = tasks.filter(t => this.isDueSoon(t)).length;

        const byPriority = {
            high: tasks.filter(t => t.priority === 'high' && !t.completed).length,
            medium: tasks.filter(t => t.priority === 'medium' && !t.completed).length,
            low: tasks.filter(t => t.priority === 'low' && !t.completed).length
        };

        const byCategory = {};
        tasks.forEach(task => {
            if (!task.completed) {
                byCategory[task.category] = (byCategory[task.category] || 0) + 1;
            }
        });

        return {
            total,
            active,
            completed,
            overdue,
            dueToday,
            dueSoon,
            byPriority,
            byCategory
        };
    },

    // Duplicate task
    duplicateTask(id) {
        const originalTask = Storage.getTaskById(id);
        if (!originalTask) {
            console.error('Task not found:', id);
            return null;
        }

        const duplicatedTask = {
            ...originalTask,
            id: this.generateId(),
            title: originalTask.title + ' (Copy)',
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null
        };

        if (Storage.saveTask(duplicatedTask)) {
            return duplicatedTask;
        }

        return null;
    },

    // Get tasks by category
    getTasksByCategory(category) {
        const allTasks = Storage.getAllTasks();
        return allTasks.filter(task => task.category === category);
    },

    // Get tasks by priority
    getTasksByPriority(priority) {
        const allTasks = Storage.getAllTasks();
        return allTasks.filter(task => task.priority === priority);
    },

    // Get active tasks
    getActiveTasks() {
        const allTasks = Storage.getAllTasks();
        return allTasks.filter(task => !task.completed);
    },

    // Get completed tasks
    getCompletedTasks() {
        const allTasks = Storage.getAllTasks();
        return allTasks.filter(task => task.completed);
    },

    // Get overdue tasks
    getOverdueTasks() {
        const allTasks = Storage.getAllTasks();
        return allTasks.filter(task => this.isPastDue(task));
    }
};
