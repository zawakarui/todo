// LocalStorage Manager
const Storage = {
    STORAGE_KEY: 'todos',
    CATEGORIES_KEY: 'todoCategories',
    SETTINGS_KEY: 'todoSettings',

    // Initialize storage if empty
    initStorage() {
        try {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            }
            if (!localStorage.getItem(this.CATEGORIES_KEY)) {
                const defaultCategories = ['general', 'work', 'personal', 'shopping'];
                localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(defaultCategories));
            }
            if (!localStorage.getItem(this.SETTINGS_KEY)) {
                const defaultSettings = {
                    defaultView: 'all',
                    sortBy: 'created',
                    theme: 'light'
                };
                localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(defaultSettings));
            }
            return true;
        } catch (error) {
            console.error('Failed to initialize storage:', error);
            return false;
        }
    },

    // Check if localStorage is available
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.error('localStorage is not available:', error);
            return false;
        }
    },

    // Get all tasks
    getAllTasks() {
        try {
            const tasks = localStorage.getItem(this.STORAGE_KEY);
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('Failed to get tasks:', error);
            return [];
        }
    },

    // Get task by ID
    getTaskById(id) {
        const tasks = this.getAllTasks();
        return tasks.find(task => task.id === id);
    },

    // Save task (add or update)
    saveTask(task) {
        try {
            const tasks = this.getAllTasks();
            const existingIndex = tasks.findIndex(t => t.id === task.id);

            if (existingIndex !== -1) {
                tasks[existingIndex] = task;
            } else {
                tasks.push(task);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Failed to save task:', error);
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Please delete some tasks or export your data.');
            }
            return false;
        }
    },

    // Delete task by ID
    deleteTask(id) {
        try {
            const tasks = this.getAllTasks();
            const filteredTasks = tasks.filter(task => task.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTasks));
            return true;
        } catch (error) {
            console.error('Failed to delete task:', error);
            return false;
        }
    },

    // Delete multiple tasks
    deleteTasks(ids) {
        try {
            const tasks = this.getAllTasks();
            const filteredTasks = tasks.filter(task => !ids.includes(task.id));
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredTasks));
            return true;
        } catch (error) {
            console.error('Failed to delete tasks:', error);
            return false;
        }
    },

    // Clear all completed tasks
    clearCompleted() {
        try {
            const tasks = this.getAllTasks();
            const activeTasks = tasks.filter(task => !task.completed);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeTasks));
            return true;
        } catch (error) {
            console.error('Failed to clear completed tasks:', error);
            return false;
        }
    },

    // Get all categories
    getCategories() {
        try {
            const categories = localStorage.getItem(this.CATEGORIES_KEY);
            return categories ? JSON.parse(categories) : ['general'];
        } catch (error) {
            console.error('Failed to get categories:', error);
            return ['general'];
        }
    },

    // Add new category
    addCategory(category) {
        try {
            if (!category || typeof category !== 'string') {
                return false;
            }

            const categories = this.getCategories();
            const normalizedCategory = category.trim().toLowerCase();

            if (categories.includes(normalizedCategory)) {
                return false; // Category already exists
            }

            categories.push(normalizedCategory);
            localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
            return true;
        } catch (error) {
            console.error('Failed to add category:', error);
            return false;
        }
    },

    // Delete category
    deleteCategory(category) {
        try {
            const categories = this.getCategories();
            const filteredCategories = categories.filter(cat => cat !== category);

            if (filteredCategories.length === categories.length) {
                return false; // Category not found
            }

            localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(filteredCategories));
            return true;
        } catch (error) {
            console.error('Failed to delete category:', error);
            return false;
        }
    },

    // Get settings
    getSettings() {
        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : {
                defaultView: 'all',
                sortBy: 'created',
                theme: 'light'
            };
        } catch (error) {
            console.error('Failed to get settings:', error);
            return { defaultView: 'all', sortBy: 'created', theme: 'light' };
        }
    },

    // Save settings
    saveSettings(settings) {
        try {
            const currentSettings = this.getSettings();
            const updatedSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(updatedSettings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    },

    // Export data as JSON
    exportData() {
        try {
            const data = {
                tasks: this.getAllTasks(),
                categories: this.getCategories(),
                settings: this.getSettings(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Failed to export data:', error);
            return null;
        }
    },

    // Import data from JSON
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate data structure
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid data format: tasks array missing');
            }

            // Import tasks
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.tasks));

            // Import categories if available
            if (data.categories && Array.isArray(data.categories)) {
                localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(data.categories));
            }

            // Import settings if available
            if (data.settings && typeof data.settings === 'object') {
                localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(data.settings));
            }

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            alert('Failed to import data. Please check the file format.');
            return false;
        }
    },

    // Clear all data
    clearAllData() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            localStorage.removeItem(this.CATEGORIES_KEY);
            localStorage.removeItem(this.SETTINGS_KEY);
            this.initStorage();
            return true;
        } catch (error) {
            console.error('Failed to clear data:', error);
            return false;
        }
    },

    // Get storage usage info
    getStorageInfo() {
        try {
            const tasks = localStorage.getItem(this.STORAGE_KEY) || '';
            const categories = localStorage.getItem(this.CATEGORIES_KEY) || '';
            const settings = localStorage.getItem(this.SETTINGS_KEY) || '';

            const totalSize = tasks.length + categories.length + settings.length;
            const totalSizeKB = (totalSize / 1024).toFixed(2);
            const taskCount = this.getAllTasks().length;

            return {
                taskCount,
                totalSize: totalSizeKB + ' KB',
                tasksSize: (tasks.length / 1024).toFixed(2) + ' KB'
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }
};

// Initialize storage when script loads
if (Storage.isAvailable()) {
    Storage.initStorage();
} else {
    alert('localStorage is not available. The app may not function properly.');
}
