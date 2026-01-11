// Filter and Sort Logic
const Filters = {
    // Filter by status (all, active, completed)
    filterByStatus(tasks, status) {
        if (status === 'all') {
            return tasks;
        } else if (status === 'active') {
            return tasks.filter(task => !task.completed);
        } else if (status === 'completed') {
            return tasks.filter(task => task.completed);
        }
        return tasks;
    },

    // Filter by category
    filterByCategory(tasks, category) {
        if (!category || category === 'all') {
            return tasks;
        }
        return tasks.filter(task => task.category === category);
    },

    // Filter by priority
    filterByPriority(tasks, priority) {
        if (!priority || priority === 'all') {
            return tasks;
        }
        return tasks.filter(task => task.priority === priority);
    },

    // Filter by date range
    filterByDateRange(tasks, startDate, endDate) {
        if (!startDate && !endDate) {
            return tasks;
        }

        return tasks.filter(task => {
            if (!task.dueDate) {
                return false;
            }

            const taskDate = new Date(task.dueDate);

            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                return taskDate >= start && taskDate <= end;
            } else if (startDate) {
                const start = new Date(startDate);
                return taskDate >= start;
            } else if (endDate) {
                const end = new Date(endDate);
                return taskDate <= end;
            }

            return true;
        });
    },

    // Filter overdue tasks
    filterOverdue(tasks) {
        return tasks.filter(task => Task.isPastDue(task));
    },

    // Filter tasks due today
    filterDueToday(tasks) {
        return tasks.filter(task => Task.isDueToday(task));
    },

    // Filter tasks due soon
    filterDueSoon(tasks) {
        return tasks.filter(task => Task.isDueSoon(task));
    },

    // Search tasks by title or description
    searchTasks(tasks, query) {
        if (!query || query.trim().length === 0) {
            return tasks;
        }

        const searchTerm = query.toLowerCase().trim();

        return tasks.filter(task => {
            const titleMatch = task.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = task.description &&
                                    task.description.toLowerCase().includes(searchTerm);
            return titleMatch || descriptionMatch;
        });
    },

    // Sort by due date
    sortByDate(tasks, order = 'asc') {
        return [...tasks].sort((a, b) => {
            // Tasks without due date go to the end
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;

            const dateA = new Date(a.dueDate);
            const dateB = new Date(b.dueDate);

            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });
    },

    // Sort by priority
    sortByPriority(tasks, order = 'desc') {
        return [...tasks].sort((a, b) => {
            const weightA = Task.getPriorityWeight(a.priority);
            const weightB = Task.getPriorityWeight(b.priority);

            return order === 'desc' ? weightB - weightA : weightA - weightB;
        });
    },

    // Sort by created date
    sortByCreated(tasks, order = 'desc') {
        return [...tasks].sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);

            return order === 'desc' ? dateB - dateA : dateA - dateB;
        });
    },

    // Sort by title
    sortByTitle(tasks, order = 'asc') {
        return [...tasks].sort((a, b) => {
            const titleA = a.title.toLowerCase();
            const titleB = b.title.toLowerCase();

            if (order === 'asc') {
                return titleA.localeCompare(titleB);
            } else {
                return titleB.localeCompare(titleA);
            }
        });
    },

    // Sort by completion status
    sortByCompletion(tasks) {
        return [...tasks].sort((a, b) => {
            // Active tasks first
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });
    },

    // Apply sort
    applySort(tasks, sortType, order = 'desc') {
        switch (sortType) {
            case 'dueDate':
                return this.sortByDate(tasks, order);
            case 'priority':
                return this.sortByPriority(tasks, order);
            case 'created':
                return this.sortByCreated(tasks, order);
            case 'title':
                return this.sortByTitle(tasks, order);
            case 'completion':
                return this.sortByCompletion(tasks);
            default:
                return tasks;
        }
    },

    // Combine multiple filters
    combineFilters(tasks, filterOptions) {
        let filteredTasks = [...tasks];

        // Apply status filter
        if (filterOptions.status) {
            filteredTasks = this.filterByStatus(filteredTasks, filterOptions.status);
        }

        // Apply category filter
        if (filterOptions.category) {
            filteredTasks = this.filterByCategory(filteredTasks, filterOptions.category);
        }

        // Apply priority filter
        if (filterOptions.priority) {
            filteredTasks = this.filterByPriority(filteredTasks, filterOptions.priority);
        }

        // Apply date range filter
        if (filterOptions.startDate || filterOptions.endDate) {
            filteredTasks = this.filterByDateRange(
                filteredTasks,
                filterOptions.startDate,
                filterOptions.endDate
            );
        }

        // Apply search
        if (filterOptions.search) {
            filteredTasks = this.searchTasks(filteredTasks, filterOptions.search);
        }

        // Apply special filters
        if (filterOptions.overdue) {
            filteredTasks = this.filterOverdue(filteredTasks);
        }
        if (filterOptions.dueToday) {
            filteredTasks = this.filterDueToday(filteredTasks);
        }
        if (filterOptions.dueSoon) {
            filteredTasks = this.filterDueSoon(filteredTasks);
        }

        // Apply sort
        if (filterOptions.sortBy) {
            filteredTasks = this.applySort(
                filteredTasks,
                filterOptions.sortBy,
                filterOptions.sortOrder || 'desc'
            );
        }

        return filteredTasks;
    },

    // Get current filter state from UI
    getCurrentFilters() {
        const statusButtons = document.querySelectorAll('.btn-filter');
        let status = 'all';
        statusButtons.forEach(btn => {
            if (btn.classList.contains('active')) {
                status = btn.getAttribute('data-filter');
            }
        });

        return {
            status: status,
            category: document.getElementById('filter-category')?.value || 'all',
            priority: document.getElementById('filter-priority')?.value || 'all',
            search: document.getElementById('search-input')?.value || '',
            sortBy: document.getElementById('sort-by')?.value || 'created',
            sortOrder: 'desc'
        };
    },

    // Group tasks by category
    groupByCategory(tasks) {
        const grouped = {};

        tasks.forEach(task => {
            if (!grouped[task.category]) {
                grouped[task.category] = [];
            }
            grouped[task.category].push(task);
        });

        return grouped;
    },

    // Group tasks by priority
    groupByPriority(tasks) {
        const grouped = {
            high: [],
            medium: [],
            low: []
        };

        tasks.forEach(task => {
            if (grouped[task.priority]) {
                grouped[task.priority].push(task);
            }
        });

        return grouped;
    },

    // Group tasks by due date
    groupByDueDate(tasks) {
        const grouped = {
            overdue: [],
            today: [],
            tomorrow: [],
            thisWeek: [],
            later: [],
            noDueDate: []
        };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));

        tasks.forEach(task => {
            if (!task.dueDate) {
                grouped.noDueDate.push(task);
                return;
            }

            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate < today) {
                grouped.overdue.push(task);
            } else if (dueDate.getTime() === today.getTime()) {
                grouped.today.push(task);
            } else if (dueDate.getTime() === tomorrow.getTime()) {
                grouped.tomorrow.push(task);
            } else if (dueDate <= endOfWeek) {
                grouped.thisWeek.push(task);
            } else {
                grouped.later.push(task);
            }
        });

        return grouped;
    },

    // Get filter summary
    getFilterSummary(filterOptions) {
        const parts = [];

        if (filterOptions.status && filterOptions.status !== 'all') {
            parts.push(`Status: ${filterOptions.status}`);
        }

        if (filterOptions.category && filterOptions.category !== 'all') {
            parts.push(`Category: ${filterOptions.category}`);
        }

        if (filterOptions.priority && filterOptions.priority !== 'all') {
            parts.push(`Priority: ${filterOptions.priority}`);
        }

        if (filterOptions.search) {
            parts.push(`Search: "${filterOptions.search}"`);
        }

        return parts.length > 0 ? parts.join(' | ') : 'All tasks';
    }
};
