document.addEventListener('DOMContentLoaded', () => {
    // 1. 安全检查
    if (!window.GLOBAL_CONFIG) {
        console.error('Config not found!');
        return;
    }

    const { SEARCH_ENGINES, HEADER_LINKS, QUICK_LINKS, APPS } = window.GLOBAL_CONFIG;
    
    // 工具函数
    const debounce = (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // 全局状态
    let state = {
        isDark: localStorage.getItem('theme') === 'dark',
        activeEngine: SEARCH_ENGINES[0] || {},
        activeCategoryId: '',
        activeSubCategoryIds: {},
        isProgrammaticScroll: false,
        scrollTimer: null,
        currentAppId: APPS[0].id,
        currentAppType: APPS[0].type,
        currentCategories: [], 
    };

    // --- 新增：核心搜索修复 ---
    const setupSearchSubmit = () => {
        const form = document.getElementById('search-form');
        const input = document.getElementById('search-input');

        if (!form || !input) return;

        // 监听 Submit 事件（同时支持回车键和点击右侧箭头按钮）
        form.addEventListener('submit', (e) => {
            e.preventDefault(); // 关键：阻止表单默认提交刷新
            
            const val = input.value.trim();
            if (val) {
                // 拼接URL，使用 encodeURIComponent 处理特殊字符
                const targetUrl = state.activeEngine.url + encodeURIComponent(val);
                window.open(targetUrl, '_blank');
            } else {
                input.focus();
            }
        });
    };

    // --- 数据加载 ---
    const loadAppData = (appId) => {
        const app = APPS.find(a => a.id === appId);
        if (!app) return;

        state.currentAppId = app.id;
        state.currentAppType = app.type;
        const data = window[app.dataVar] || [];
        state.currentCategories = data;

        state.activeCategoryId = data[0]?.id || '';
        state.activeSubCategoryIds = {};
        data.forEach(cat => {
            if(cat.subCategories && cat.subCategories.length > 0) {
                state.activeSubCategoryIds[cat.id] = cat.subCategories[0].id;
            }
        });

        updateAppHeaderUI(app);
        renderSidebarLinks('desktop-nav-links');
        renderSidebarLinks('mobile-nav-links', true);
        renderContent();
        animateCount();
        window.scrollTo({ top: 0, behavior: 'auto' });
    };

    // --- 顶部链接 ---
    const renderHeaderLinks = () => {
        const container = document.getElementById('header-links');
        if (!container) return;
        container.classList.add('pr-12'); 
        container.innerHTML = HEADER_LINKS.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" 
               class="whitespace-nowrap text-[13px] md:text-[14px] font-medium text-gray-600/90 dark:text-gray-400 px-2.5 py-1.5 rounded-lg hover:bg-black/5 hover:text-[#FF8C19] transition-all dark:hover:bg-white/10 dark:hover:text-[#FF8C19]">
               ${link.title}
            </a>
        `).join('');
    };

    // --- 快捷链接 (支持横滑) ---
    const renderQuickLinks = () => {
        const container = document.getElementById('quick-links');
        if (!container) return;
        // 注意：这里加入了 shrink-0 和 whitespace-nowrap 确保在手机上横向排列不换行
        container.innerHTML = QUICK_LINKS.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer"
               class="group relative shrink-0 whitespace-nowrap overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-medium text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white/60 hover:backdrop-blur-md hover:text-[#FF8C19] hover:shadow-lg hover:shadow-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-[#FF8C19] dark:hover:border-gray-600">
               <span class="relative z-10">${link.title}</span>
            </a>
        `).join('');
    };

    // --- APP 切换菜单 (九宫格大厂风格) ---
    const renderAppSwitcher = () => {
        const grid = document.getElementById('app-grid');
        if (!grid) return;

        // 1. 设置容器为 Grid 布局 (3列)，以及内边距
        grid.className = "grid grid-cols-3 gap-2 p-1 max-h-[320px] overflow-y-auto custom-scrollbar";

        grid.innerHTML = APPS.map(app => {
            const isActive = app.id === state.currentAppId;
            
            // 2. 渲染每个格子
            return `
            <div class="app-switch-item group flex flex-col items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 border border-transparent
                ${isActive 
                    ? 'bg-orange-50 border-orange-100/50 dark:bg-white/10 dark:border-white/5 shadow-sm' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-[1.02]'
                }" 
                data-id="${app.id}" title="${app.desc}">
                
                <!-- 图标容器 -->
                <div class="w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${isActive 
                        ? 'bg-[#FF8C19] text-white shadow-lg shadow-orange-500/30' 
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 group-hover:bg-white group-hover:shadow-md dark:group-hover:bg-gray-600'
                    }">
                    <i data-lucide="${app.icon}" class="w-5 h-5 md:w-6 md:h-6"></i>
                </div>
                
                <!-- 文字标题 -->
                <span class="text-[12px] font-medium tracking-wide text-center w-full truncate px-1 transition-colors
                    ${isActive ? 'text-[#FF8C19]' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}">
                    ${app.name}
                </span>
            </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons({ root: grid });

        // 绑定点击事件
        grid.querySelectorAll('.app-switch-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-id');
                if (id !== state.currentAppId) {
                    loadAppData(id);
                    renderAppSwitcher(); // 重新渲染以更新选中状态
                }
            });
        });
    };

    const updateAppHeaderUI = (app) => {
        const nameEl = document.getElementById('current-app-name');
        const mobileNameEl = document.getElementById('mobile-app-name');
        if(nameEl) nameEl.textContent = app.name;
        if(mobileNameEl) mobileNameEl.textContent = app.name;
    };

    // --- 搜索引擎切换 ---
    const renderEngineSwitcher = () => {
        const container = document.getElementById('engine-switcher');
        if (!container) return;
        
        const buttonsHtml = SEARCH_ENGINES.map(engine => `
            <button type="button" data-name="${engine.name}" 
                class="engine-btn relative z-20 pb-2.5 px-1 font-medium text-sm md:text-[15px] shrink-0 transition-colors duration-300 outline-none">
                ${engine.name}
            </button>
        `).join('');
        
        const gliderHtml = `<div id="engine-glider" class="glider-transition absolute bottom-0 h-[3px] bg-[#FF8C19] rounded-full shadow-[0_0_10px_rgba(255,140,25,0.6)] z-10 hidden"></div>`;
        container.innerHTML = buttonsHtml + gliderHtml;
        const glider = document.getElementById('engine-glider');
        
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.engine-btn');
            if (!btn) return;
            state.activeEngine = SEARCH_ENGINES.find(e => e.name === btn.getAttribute('data-name'));
            updateUI();
        });

        const updateUI = () => {
            const btns = container.querySelectorAll('.engine-btn');
            const activeBtn = Array.from(btns).find(btn => btn.getAttribute('data-name') === state.activeEngine.name);
            
            btns.forEach(btn => {
                const isActive = btn === activeBtn;
                btn.className = `engine-btn relative z-20 pb-2.5 px-1 shrink-0 transition-colors duration-300 outline-none ${
                    isActive 
                    ? 'font-bold text-gray-900 dark:text-white' 
                    : 'font-medium text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                }`;
            });

            if (activeBtn && glider) {
                glider.classList.remove('hidden');
                glider.style.left = `${activeBtn.offsetLeft}px`;
                glider.style.width = `${activeBtn.offsetWidth}px`;
            }
            
            const input = document.getElementById('search-input');
            if (input) input.placeholder = state.activeEngine.placeholder;
        };
        
        setTimeout(updateUI, 100);
        window.addEventListener('resize', debounce(updateUI, 100));
    };

    // --- 侧边栏 ---
    const renderSidebarLinks = (containerId, isMobile = false) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = state.currentCategories.map(cat => {
            const isActive = state.activeCategoryId === cat.id;
            return `
            <a href="#category-${cat.id}" data-id="${cat.id}"
                class="sidebar-link group cursor-pointer relative flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left text-[15px] font-medium transition-all duration-300 ${
                    isActive 
                    ? 'bg-[#FF8C19] text-white shadow-md shadow-orange-500/20' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                }">
                <i data-lucide="${cat.icon}" class="h-5 w-5 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}"></i>
                <span class="tracking-wide">${cat.name}</span>
            </a>`;
        }).join('');
        if (window.lucide) window.lucide.createIcons({ root: container });
        container.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('data-id');
                scrollToCategory(id);
                if(isMobile) toggleMobileMenu(false);
            });
        });
    };

    // --- 内容渲染 ---
    const renderContent = () => {
        const container = document.getElementById('content-area');
        if (!container) return;
        
        container.innerHTML = state.currentCategories.map(cat => `
            <section id="category-${cat.id}" data-cat-id="${cat.id}" class="category-section animate-fade-in group/section scroll-mt-[110px]" style="content-visibility: auto; contain-intrinsic-size: 500px;">
                <div class="panel-container p-5 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-500 relative">
                    <div class="glass-decoration absolute -right-20 -top-20 w-64 h-64 bg-blue-400/10 blur-[80px] rounded-full opacity-0 pointer-events-none transition-opacity duration-700"></div>
                    
                    <div class="mb-4 md:mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center flex-wrap pl-1 md:pl-2 border-b border-gray-100 pb-3 md:pb-4 dark:border-gray-800 relative z-10">
                        <div class="flex items-center gap-3">
                             <div class="p-1.5 md:p-2 rounded-lg bg-orange-50 dark:bg-gray-800 text-[#FF8C19]">
                                <i data-lucide="${cat.icon}" class="w-5 h-5 md:w-6 md:h-6"></i>
                             </div>
                             <h2 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">${cat.name}</h2>
                        </div>
                        <span class="hidden h-5 w-px bg-gray-300 dark:bg-gray-700 md:block mx-2"></span>
                        
                        <!-- Tabs 容器 (已优化：支持横向滑动，移除 flex-wrap) -->
                        <div class="relative flex items-center overflow-x-auto no-scrollbar mask-gradient-right pb-1 max-w-full gap-1 p-1 bg-gray-100/50 dark:bg-black/20 rounded-full" id="tabs-${cat.id}"></div>
                    </div>
                    
                    <div id="grid-${cat.id}" class="grid gap-4 md:gap-5 relative z-10 ${
                        state.currentAppType === 'prompt' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 
                        state.currentAppType === 'cover' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 
                        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                    }"></div>
                </div>
            </section>
        `).join('');

        state.currentCategories.forEach(cat => {
            initSubCategoryTabs(cat); 
            renderCards(cat);
        });

        if (window.lucide) window.lucide.createIcons();
        setupIntersectionObserver();
    };

    const initSubCategoryTabs = (cat) => {
        const container = document.getElementById(`tabs-${cat.id}`);
        if (!cat.subCategories || cat.subCategories.length === 0) {
            container.style.display = 'none';
            return;
        }

        const buttonsHtml = cat.subCategories.map(sub => `
            <button type="button" data-main="${cat.id}" data-sub="${sub.id}"
                class="subcat-btn shrink-0 whitespace-nowrap relative z-10 px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-[14px] font-semibold transition-colors duration-300 rounded-full cursor-pointer outline-none select-none">
                ${sub.name}
            </button>
        `).join('');
        const gliderHtml = `<div class="subcategory-glider glider-transition hidden" id="glider-${cat.id}"></div>`;
        container.innerHTML = buttonsHtml + gliderHtml;
        const glider = document.getElementById(`glider-${cat.id}`);

        const updateTabUI = () => {
            const btns = container.querySelectorAll('.subcat-btn');
            const activeBtn = Array.from(btns).find(btn => btn.getAttribute('data-sub') === state.activeSubCategoryIds[cat.id]);

            btns.forEach(btn => {
                if (btn === activeBtn) {
                    btn.classList.remove('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-200');
                    btn.classList.add('text-white');
                } else {
                    btn.classList.remove('text-white');
                    btn.classList.add('text-gray-500', 'hover:text-gray-700', 'dark:text-gray-400', 'dark:hover:text-gray-200');
                }
            });

            if (activeBtn && glider) {
                glider.classList.remove('hidden');
                glider.style.left = `${activeBtn.offsetLeft}px`;
                glider.style.top = `${activeBtn.offsetTop}px`;
                glider.style.width = `${activeBtn.offsetWidth}px`;
                glider.style.height = `${activeBtn.offsetHeight}px`;
            }
        };

        container.addEventListener('click', (e) => {
             const btn = e.target.closest('.subcat-btn');
             if(!btn) return;
             const subId = btn.getAttribute('data-sub');
             if (state.activeSubCategoryIds[cat.id] !== subId) {
                state.activeSubCategoryIds[cat.id] = subId;
                updateTabUI();
                renderCards(cat);
            }
        });

        const observer = new ResizeObserver(debounce(() => requestAnimationFrame(updateTabUI), 100));
        observer.observe(container);
        updateTabUI();
    };

    // --- 核心：多态卡片渲染 ---
    const renderCards = (cat) => {
        const container = document.getElementById(`grid-${cat.id}`);
        const activeSubId = state.activeSubCategoryIds[cat.id];
        const activeSub = cat.subCategories ? cat.subCategories.find(sub => sub.id === activeSubId) : null;
        if (!activeSub) return;

        container.classList.remove('animate-fade-in-up');
        void container.offsetWidth; 
        container.classList.add('animate-fade-in-up');

        const iconCfg = activeSub.iconConfig || { gradient: 'from-blue-400 to-cyan-400', iconName: 'link' };

        // 1. 标准设计卡片 (支持 localIcon)
        if (state.currentAppType === 'standard') {
            container.innerHTML = activeSub.sites.map(site => {
                let iconHtml;
                if (site.localIcon) {
                    iconHtml = `
                        <img src="${site.localIcon}" alt="${site.title}" 
                             class="h-9 w-9 shrink-0 rounded-full object-cover bg-white shadow-sm ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-500">
                    `;
                } else {
                    iconHtml = `
                        <div class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${iconCfg.gradient} shadow-md text-white ring-1 ring-black/5 dark:ring-white/10 group-hover:scale-110 transition-transform duration-500">
                            <i data-lucide="${iconCfg.iconName}" class="w-5 h-5"></i>
                        </div>
                    `;
                }

                return `
                <a href="${site.url}" target="_blank" rel="noopener noreferrer"
                   class="site-card group relative flex h-full flex-row items-start gap-3 md:gap-4 overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-5 transition-all duration-300">
                    ${iconHtml}
                    <div class="relative min-w-0 flex-1 pt-0.5">
                        <h3 class="truncate text-[15px] md:text-[16px] font-bold text-gray-800 dark:text-gray-100 mb-0.5 md:mb-1">${site.title}</h3>
                        <p class="h-[40px] overflow-hidden text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">${site.description}</p>
                    </div>
                </a>
            `}).join('');
        }
        
        // 2. 字体/封面卡片
        else if (state.currentAppType === 'cover') {
            container.innerHTML = activeSub.sites.map(site => `
                <a href="${site.url}" target="_blank" rel="noopener noreferrer"
                   class="group flex flex-col transition-all duration-300 p-0 relative hover:-translate-y-1">
                    <div class="w-full aspect-[16/9] overflow-hidden rounded-lg relative shadow-sm hover:shadow-[0_15px_30px_-5px_rgba(255,140,25,0.15)] dark:hover:shadow-lg transition-shadow duration-300 bg-gray-100 dark:bg-gray-800">
                        <img src="${site.image}" alt="${site.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy">
                    </div>
                    <div class="pt-2 flex items-center justify-center">
                        <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide text-center transition-colors">${site.title}</h3>
                    </div>
                </a>
            `).join('');
        }
        
        // 3. AI 提示词卡片
        else if (state.currentAppType === 'prompt') {
            container.innerHTML = activeSub.sites.map(site => `
                <div class="site-card prompt-card group flex flex-col h-full overflow-hidden rounded-2xl p-0 transition-all duration-300">
                    <div class="w-full h-40 md:h-48 bg-gray-100 dark:bg-gray-800 relative overflow-hidden shrink-0 cursor-pointer" onclick="window.open('${site.image}', '_blank')">
                        <img src="${site.image}" alt="${site.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy">
                    </div>
                    <div class="flex-1 p-3 flex flex-col gap-2 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
                        <div class="flex justify-between items-center">
                            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate pr-2">${site.title}</h3>
                            <button class="copy-trigger text-[10px] px-2 py-1 rounded-md bg-gray-200 hover:bg-[#FF8C19] hover:text-white dark:bg-gray-700 dark:hover:bg-[#FF8C19] text-gray-600 dark:text-gray-300 font-medium transition-colors flex items-center gap-1 active:scale-95 outline-none">
                                <i data-lucide="copy" class="w-3 h-3"></i> <span>复制</span>
                            </button>
                        </div>
                        <textarea class="w-full h-20 text-xs leading-relaxed p-2 rounded-lg bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-700 outline-none text-gray-600 dark:text-gray-300 resize-none focus:bg-white dark:focus:bg-black/60 focus:border-[#FF8C19] transition-all placeholder-gray-400" spellcheck="false">${site.prompt}</textarea>
                    </div>
                </div>
            `).join('');

            container.querySelectorAll('.copy-trigger').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const textarea = btn.parentElement.nextElementSibling;
                    const text = textarea.value; 
                    const span = btn.querySelector('span');
                    
                    navigator.clipboard.writeText(text).then(() => {
                        const originalText = span.textContent;
                        span.textContent = '已复制';
                        btn.classList.add('bg-green-100', 'text-green-600', 'hover:bg-green-100', 'hover:text-green-600');
                        btn.classList.remove('bg-gray-200', 'hover:bg-[#FF8C19]', 'hover:text-white');
                        setTimeout(() => {
                            span.textContent = originalText;
                            btn.classList.remove('bg-green-100', 'text-green-600', 'hover:bg-green-100', 'hover:text-green-600');
                            btn.classList.add('bg-gray-200', 'hover:bg-[#FF8C19]', 'hover:text-white');
                        }, 2000);
                    });
                });
            });
        }
        
        if (window.lucide) window.lucide.createIcons({ root: container });
    };

    const scrollToCategory = (id) => {
        if (state.scrollTimer) clearTimeout(state.scrollTimer);
        state.isProgrammaticScroll = true;
        state.activeCategoryId = id;
        updateSidebarUI();
        const el = document.getElementById(`category-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            state.scrollTimer = setTimeout(() => { state.isProgrammaticScroll = false; }, 1000);
        }
    };

    const setupIntersectionObserver = () => {
        const observer = new IntersectionObserver((entries) => {
            if (state.isProgrammaticScroll) return;
            const visible = entries.filter(e => e.isIntersecting);
            if (visible.length > 0) {
                const targetId = visible[0].target.getAttribute('data-cat-id');
                if (targetId && targetId !== state.activeCategoryId) {
                    state.activeCategoryId = targetId;
                    updateSidebarUI();
                }
            }
        }, { rootMargin: '-15% 0px -80% 0px', threshold: 0 });
        document.querySelectorAll('.category-section').forEach(s => observer.observe(s));
    };

    const updateSidebarUI = () => {
        renderSidebarLinks('desktop-nav-links');
        renderSidebarLinks('mobile-nav-links', true);
    };

    const animateCount = () => {
        const els = [document.getElementById('site-count'), document.getElementById('mobile-site-count')];
        const total = state.currentCategories.reduce((acc, cat) => acc + (cat.subCategories ? cat.subCategories.reduce((s, sub) => s + (sub.sites ? sub.sites.length : 0), 0) : 0), 0);
        els.forEach(el => el && (el.textContent = total));
    };

    // LOGO 点击回顶
    const logo = document.getElementById('desktop-logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        state.isDark = !state.isDark;
        localStorage.setItem('theme', state.isDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', state.isDark);
    });
    
    const toggleMobileMenu = (show) => {
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        if (show) {
            overlay.classList.remove('hidden', 'opacity-0');
            sidebar.classList.remove('translate-x-[-100%]');
        } else {
            overlay.classList.add('opacity-0');
            sidebar.classList.add('translate-x-[-100%]');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        }
    };
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => toggleMobileMenu(true));
    document.getElementById('mobile-sidebar-overlay')?.addEventListener('click', () => toggleMobileMenu(false));

    document.documentElement.classList.toggle('dark', state.isDark);
    renderHeaderLinks();
    renderQuickLinks();
    renderEngineSwitcher();
    renderAppSwitcher();
    loadAppData(state.currentAppId);
    setupSearchSubmit(); // 执行搜索初始化
});