// ============================================================
// Bibliotheca · 图书管理系统 · Vue 应用逻辑
// ============================================================

const { createApp, ref, reactive, computed, onMounted, nextTick, watch } = Vue;
const { ElMessage, ElMessageBox } = ElementPlus;

const app = createApp({
    setup() {
        // --- 状态 ---
        const books = ref([]);                  // 图书列表
        const loading = ref(false);             // 加载状态
        const searchKeyword = ref('');          // 搜索关键词
        const viewMode = ref('grid');           // 视图模式：grid / table

        const dialogVisible = ref(false);       // 对话框可见性
        const dialogTitle = ref('');            // 对话框标题
        const submitting = ref(false);          // 提交中状态
        const nameInput = ref(null);            // 书名输入框引用（用于自动聚焦）

        // 表单数据
        const form = reactive({
            id: null,
            name: '',
            author: '',
            price: 0,
            publisher: ''
        });

        // --- 计算属性：统计数据 ---
        const totalAuthors = computed(() => {
            const authors = new Set();
            books.value.forEach(b => {
                if (b.author && b.author.trim()) authors.add(b.author.trim());
            });
            return authors.size;
        });

        const totalValue = computed(() => {
            const sum = books.value.reduce((acc, b) => {
                return acc + (b.price != null ? Number(b.price) : 0);
            }, 0);
            return sum.toFixed(2);
        });

        // --- API 调用 ---
        async function loadBooks() {
            loading.value = true;
            try {
                const res = await API.list(searchKeyword.value);
                if (res.data.code === 200) {
                    books.value = res.data.data || [];
                } else {
                    ElMessage.error(res.data.message || '加载失败');
                }
            } catch (err) {
                ElMessage.error('网络错误，加载图书失败');
                console.error(err);
            } finally {
                loading.value = false;
            }
        }

        // 功能5：搜索
        function handleSearch() {
            loadBooks();
        }

        // 清除搜索
        function clearSearch() {
            searchKeyword.value = '';
            loadBooks();
        }

        // 功能2：打开新增对话框
        function openAddDialog() {
            dialogTitle.value = '新 入 藏';
            form.id = null;
            form.name = '';
            form.author = '';
            form.price = 0;
            form.publisher = '';
            dialogVisible.value = true;
            // 自动聚焦书名输入框
            nextTick(() => {
                if (nameInput.value) nameInput.value.focus();
            });
        }

        // 功能3：打开编辑对话框
        function openEditDialog(book) {
            dialogTitle.value = '批 注 修 订';
            form.id = book.id;
            form.name = book.name;
            form.author = book.author || '';
            form.price = book.price != null ? Number(book.price) : 0;
            form.publisher = book.publisher || '';
            dialogVisible.value = true;
            nextTick(() => {
                if (nameInput.value) nameInput.value.focus();
            });
        }

        // 提交（新增或更新）
        async function handleSubmit() {
            // 简单校验
            if (!form.name || !form.name.trim()) {
                ElMessage.warning('请输入书名');
                if (nameInput.value) nameInput.value.focus();
                return;
            }
            submitting.value = true;
            try {
                const payload = {
                    id: form.id,
                    name: form.name.trim(),
                    author: form.author ? form.author.trim() : null,
                    price: form.price,
                    publisher: form.publisher ? form.publisher.trim() : null
                };
                const isEdit = form.id != null;
                const res = isEdit ? await API.update(payload) : await API.add(payload);
                if (res.data.code === 200) {
                    ElMessage.success(isEdit ? '修 订 完 成' : '入 藏 完 成');
                    dialogVisible.value = false;
                    await loadBooks();
                } else {
                    ElMessage.error(res.data.message || '操作失败');
                }
            } catch (err) {
                ElMessage.error('网络错误，操作失败');
                console.error(err);
            } finally {
                submitting.value = false;
            }
        }

        // 功能4：删除（带确认）
        async function handleDelete(book) {
            try {
                await ElMessageBox.confirm(
                    `确定要将《${book.name}》移出馆藏吗？`,
                    '移 除 确 认',
                    {
                        confirmButtonText: '确 认 移 除',
                        cancelButtonText: '取 消',
                        type: 'warning',
                        customClass: 'bibliotheca-message-box'
                    }
                );
            } catch (e) {
                return; // 用户取消
            }
            try {
                const res = await API.remove(book.id);
                if (res.data.code === 200) {
                    ElMessage.success('已 移 出 馆 藏');
                    await loadBooks();
                } else {
                    ElMessage.error(res.data.message || '删除失败');
                }
            } catch (err) {
                ElMessage.error('网络错误，删除失败');
                console.error(err);
            }
        }

        // 监听对话框关闭后重置表单
        watch(dialogVisible, (val) => {
            if (!val) {
                // 重置表单
                form.id = null;
                form.name = '';
                form.author = '';
                form.price = 0;
                form.publisher = '';
            }
        });

        // 功能1：页面加载时自动获取图书
        onMounted(() => {
            loadBooks();
        });

        return {
            // 状态
            books, loading, searchKeyword, viewMode,
            dialogVisible, dialogTitle, submitting, nameInput, form,
            // 计算属性
            totalAuthors, totalValue,
            // 方法
            handleSearch, clearSearch, openAddDialog, openEditDialog, handleSubmit, handleDelete
        };
    }
});

// 注册 Element Plus（用于 ElMessage / ElMessageBox）
app.use(ElementPlus);
// 注册所有图标组件（修复之前的 bug）
app.use(ElementPlusIconsVue);
app.mount('#app');
