document.addEventListener('DOMContentLoaded', () => {
    const { SEARCH_ENGINES, HEADER_LINKS, QUICK_LINKS, CATEGORIES } = window.AppConfig;
    
    let state = {
        isDark: localStorage.getItem('theme') === 'dark',
        activeEngine: SEARCH_ENGINES[0],
        activeCategoryId: CATEGORIES[0].id,
        activeSubCategoryIds: {},
        isProgrammaticScroll: false
    };

    // 初始化所有分类的默认子分类
    CATEGORIES.forEach(cat => {
        if(cat.subCategories && cat.subCategories.length > 0) {
            state.activeSubCategoryIds[cat.id] = cat.subCategories[0].id;
        }
    });

    // --- 顶部链接渲染 ---
    const renderHeaderLinks = () => {
        const container = document.getElementById('header-links');
        container.innerHTML = HEADER_LINKS.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" 
               class="whitespace-nowrap text-[13px] md:text-[14px] font-medium text-gray-600/90 dark:text-gray-400 px-2.5 py-1.5 rounded-lg hover:bg-black/5 hover:text-[#FF8C19] transition-all dark:hover:bg-white/10 dark:hover:text-[#FF8C19]">
               ${link.title}
            </a>
        `).join('');
    };

    // --- 快捷链接渲染 (优化：圆角加大，悬浮背景半透明) ---
    const renderQuickLinks = () => {
        const container = document.getElementById('quick-links');
        container.innerHTML = QUICK_LINKS.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer"
               class="group relative overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-medium text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white/60 hover:backdrop-blur-md hover:text-[#FF8C19] hover:shadow-lg hover:shadow-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-[#FF8C19] dark:hover:border-gray-600">
               <span class="relative z-10">${link.title}</span>
            </a>
        `).join('');
    };

    // --- 搜索引擎切换器 (带滑动下划线) ---
    const renderEngineSwitcher = () => {
        const container = document.getElementById('engine-switcher');
        // 必须设置为 relative 以便滑块定位
        container.style.position = 'relative';
        
        // 生成按钮 HTML
        const buttonsHtml = SEARCH_ENGINES.map(engine => `
            <button type="button" data-name="${engine.name}" 
                class="engine-btn relative z-20 pb-2.5 px-1 font-medium text-sm md:text-[15px] shrink-0 transition-colors duration-300 outline-none">
                ${engine.name}
            </button>
        `).join('');

        // 添加滑块元素
        const gliderHtml = `<div id="engine-glider" class="glider-transition hidden"></div>`;
        container.innerHTML = buttonsHtml + gliderHtml;

        // 绑定事件
        const btns = container.querySelectorAll('.engine-btn');
        const glider = document.getElementById('engine-glider');

        // 更新 UI 位置的函数
        const updateUI = () => {
            btns.forEach(btn => {
                const isAuth = btn.getAttribute('data-name') === state.activeEngine.name;
                // 设置文字颜色
                if (isAuth) {
                    btn.className = 'engine-btn relative z-20 pb-2.5 px-1 font-bold text-gray-900 dark:text-white shrink-0 transition-colors duration-300 outline-none';
                    // 移动滑块
                    glider.classList.remove('hidden');
                    glider.style.left = `${btn.offsetLeft}px`;
                    glider.style.width = `${btn.offsetWidth}px`;
                } else {
                    btn.className = 'engine-btn relative z-20 pb-2.5 px-1 font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 shrink-0 transition-colors duration-300 outline-none';
                }
            });
            updateSearchPlaceholder();
        };

        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.getAttribute('data-name');
                state.activeEngine = SEARCH_ENGINES.find(e => e.name === name);
                updateUI();
            });
        });

        // 初始化
        // 使用 setTimeout 确保 DOM 渲染完成以便计算位置
        setTimeout(updateUI, 50);
        // 窗口大小改变时重新计算位置
        window.addEventListener('resize', updateUI);
    };

    const updateSearchPlaceholder = () => {
        const input = document.getElementById('search-input');
        input.placeholder = state.activeEngine.placeholder;
    };

    // --- 侧边栏渲染 ---
    const renderSidebarLinks = (containerId, isMobile = false) => {
        const container = document.getElementById(containerId);
        container.innerHTML = CATEGORIES.map(cat => {
            const isActive = state.activeCategoryId === cat.id;
            return `
            <a href="#category-${cat.id}" data-id="${cat.id}"
                class="sidebar-link group cursor-pointer relative flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-all duration-300 ${
                    isActive 
                    ? 'bg-[#FF8C19] text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }">
                <i data-lucide="${cat.icon}" class="h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}"></i>
                <span class="tracking-wide">${cat.name}</span>
            </a>`;
        }).join('');
        lucide.createIcons();
        container.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('data-id');
                scrollToCategory(id);
                if(isMobile) toggleMobileMenu(false);
            });
        });
    };

    // --- 主内容区域渲染 (优化：每排改为 5 个) ---
    const renderContent = () => {
        const container = document.getElementById('content-area');
        container.innerHTML = CATEGORIES.map(cat => `
            <section id="category-${cat.id}" class="animate-fade-in group/section scroll-mt-[100px]">
                <div class="panel-container p-5 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-500">
                    <div class="mb-4 md:mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center flex-wrap pl-1 md:pl-2 border-b border-gray-100 pb-3 md:pb-4 dark:border-gray-800">
                        <div class="flex items-center gap-3">
                             <div class="p-1.5 md:p-2 rounded-lg bg-orange-50 dark:bg-gray-800 text-[#FF8C19]">
                                <i data-lucide="${cat.icon}" class="w-5 h-5 md:w-6 md:h-6"></i>
                             </div>
                             <h2 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">${cat.name}</h2>
                        </div>
                        <span class="hidden h-5 w-px bg-gray-300 dark:bg-gray-700 md:block mx-2"></span>
                        
                        <div class="relative flex flex-wrap items-center p-1 bg-gray-100/50 dark:bg-black/20 rounded-full" id="tabs-${cat.id}">
                            </div>
                    </div>
                    <div id="grid-${cat.id}" class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"></div>
                </div>
            </section>
        `).join('');

        // 为每个分类初始化 Tab 和 内容
        CATEGORIES.forEach(cat => {
            initSubCategoryTabs(cat); // 初始化 Tab 逻辑
            renderCards(cat); // 渲染默认卡片
        });
        lucide.createIcons();
    };

    // --- 二级分类 Tab 初始化 (带滑动背景) ---
    const initSubCategoryTabs = (cat) => {
        const container = document.getElementById(`tabs-${cat.id}`);
        if (!cat.subCategories || cat.subCategories.length === 0) {
            container.style.display = 'none';
            return;
        }

        // 1. 生成按钮 HTML (z-index 10, 确保在滑块之上)
        const buttonsHtml = cat.subCategories.map(sub => `
            <button type="button" data-main="${cat.id}" data-sub="${sub.id}"
                class="subcat-btn relative z-10 px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-[14px] font-semibold transition-colors duration-300 rounded-full cursor-pointer outline-none select-none">
                ${sub.name}
            </button>
        `).join('');

        // 2. 添加滑块 (z-index 1)
        const gliderHtml = `<div class="subcategory-glider glider-transition hidden" id="glider-${cat.id}"></div>`;
        container.innerHTML = buttonsHtml + gliderHtml;

        // 3. 逻辑控制
        const btns = container.querySelectorAll('.subcat-btn');
        const glider = document.getElementById(`glider-${cat.id}`);

        const updateTabUI = () => {
            const activeId = state.activeSubCategoryIds[cat.id];
            
            btns.forEach(btn => {
                const subId = btn.getAttribute('data-sub');
                const isActive = subId === activeId;

                if (isActive) {
                    // 激活态文字颜色
                    btn.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-200');
                    btn.classList.add('text-white');
                    
                    // 移动滑块
                    glider.classList.remove('hidden');
                    glider.style.left = `${btn.offsetLeft}px`;
                    glider.style.top = `${btn.offsetTop}px`;
                    glider.style.width = `${btn.offsetWidth}px`;
                    glider.style.height = `${btn.offsetHeight}px`;
                } else {
                    // 非激活态文字颜色
                    btn.classList.remove('text-white');
                    btn.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-200');
                }
            });
        };

        // 绑定点击事件
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const subId = btn.getAttribute('data-sub');
                // 只有当 ID 改变时才触发刷新，避免重复渲染
                if (state.activeSubCategoryIds[cat.id] !== subId) {
                    state.activeSubCategoryIds[cat.id] = subId;
                    updateTabUI(); // 移动滑块
                    renderCards(cat); // 刷新卡片内容
                }
            });
        });

        // 监听全局 Resize 以修正滑块位置
        window.addEventListener('resize', updateTabUI);

        // 初始执行一次
        setTimeout(updateTabUI, 50);
    };

    // --- 卡片渲染 (仅刷新 Grid 内容) ---
    const renderCards = (cat) => {
        const container = document.getElementById(`grid-${cat.id}`);
        const activeSubId = state.activeSubCategoryIds[cat.id];
        
        const activeSub = cat.subCategories ? cat.subCategories.find(sub => sub.id === activeSubId) : null;
        
        // 清空容器并添加淡入动画类
        container.innerHTML = '';
        container.classList.remove('animate-fade-in-up');
        void container.offsetWidth; // 触发重绘
        container.classList.add('animate-fade-in-up');

        if (!activeSub) return;
        
        const { gradient, iconName } = activeSub.iconConfig || { gradient: 'from-blue-400 to-cyan-400', iconName: 'link' };

        container.innerHTML = activeSub.sites.map(site => `
            <a href="${site.url}" target="_blank" rel="noopener noreferrer"
               class="site-card group relative flex h-full flex-row items-start gap-3 md:gap-4 overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-5 transition-all duration-300">
                <div class="relative flex h-9 w-9 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-md text-white ring-1 ring-black/5 dark:ring-white/10">
                    <i data-lucide="${iconName}" class="w-5 h-5 md:w-6 md:h-6"></i>
                </div>
                <div class="relative min-w-0 flex-1 pt-0.5">
                    <h3 class="truncate text-[15px] md:text-[16px] font-bold text-gray-800 dark:text-gray-100 mb-0.5 md:mb-1">${site.title}</h3>
                    <p class="h-[40px] overflow-hidden text-xs leading-relaxed text-gray-500 dark:text-gray-400">${site.description}</p>
                </div>
            </a>
        `).join('');
        
        lucide.createIcons({ root: container });
    };

    // --- 滚动与交互逻辑 ---
    const scrollToCategory = (id) => {
        state.activeCategoryId = id;
        state.isProgrammaticScroll = true;
        updateSidebarUI();
        const el = document.getElementById(`category-${id}`);
        if (el) {
            const offset = window.innerWidth < 1024 ? 80 : 110;
            window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - offset, behavior: "smooth" });
            setTimeout(() => { state.isProgrammaticScroll = false; }, 1200);
        }
    };

    const updateSidebarUI = () => {
        renderSidebarLinks('desktop-nav-links');
        renderSidebarLinks('mobile-nav-links', true);
    };

    window.addEventListener('scroll', () => {
        if (state.isProgrammaticScroll) return;
        let newActiveId = CATEGORIES[0].id;
        const threshold = window.innerWidth < 1024 ? 150 : 200;
        
        for (const cat of CATEGORIES) {
            const el = document.getElementById(`category-${cat.id}`);
            if (el && el.getBoundingClientRect().top <= threshold) newActiveId = cat.id; else break;
        }
        if (newActiveId !== state.activeCategoryId) {
            state.activeCategoryId = newActiveId;
            updateSidebarUI();
        }
    });

    const toggleTheme = () => { state.isDark = !state.isDark; localStorage.setItem('theme', state.isDark ? 'dark' : 'light'); applyTheme(); };
    const applyTheme = () => { document.documentElement.classList.toggle('dark', state.isDark); };
    
    const animateCount = () => {
        const els = [document.getElementById('site-count'), document.getElementById('mobile-site-count')];
        const total = CATEGORIES.reduce((acc, cat) => acc + (cat.subCategories ? cat.subCategories.reduce((s, sub) => s + (sub.sites ? sub.sites.length : 0), 0) : 0), 0);
        let start = 0;
        const timer = setInterval(() => {
            start += Math.ceil(total / 125);
            if (start >= total) { els.forEach(el => el && (el.textContent = total)); clearInterval(timer); } 
            else els.forEach(el => el && (el.textContent = start));
        }, 16);
    };

    document.getElementById('desktop-logo').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value;
        if (query.trim()) window.open(`${state.activeEngine.url}${encodeURIComponent(query)}`, '_blank');
    });

    const toggleMobileMenu = (show) => {
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        if (show) {
            overlay.classList.remove('hidden');
            setTimeout(() => { overlay.classList.remove('opacity-0'); sidebar.classList.remove('translate-x-[-100%]'); }, 10);
        } else {
            overlay.classList.add('opacity-0'); sidebar.classList.add('translate-x-[-100%]');
            setTimeout(() => { overlay.classList.add('hidden'); }, 300);
        }
    };
    document.getElementById('mobile-menu-btn').addEventListener('click', () => toggleMobileMenu(true));
    document.getElementById('mobile-sidebar-overlay').addEventListener('click', () => toggleMobileMenu(false));

    const modal = document.getElementById('about-modal');
    document.getElementById('about-btn').addEventListener('click', () => modal.classList.add('open'));
    document.getElementById('close-about').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

    // 初始化执行
    applyTheme();
    renderHeaderLinks();
    renderQuickLinks();
    renderEngineSwitcher(); // 现在包含滑动初始化
    updateSidebarUI();
    renderContent(); // 现在包含 Tab 滑动初始化
    animateCount();
});