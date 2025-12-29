document.addEventListener('DOMContentLoaded', () => {
    // 安全获取配置
    if (!window.AppConfig) {
        console.error('Data configuration not found!');
        return;
    }
    const { SEARCH_ENGINES, HEADER_LINKS, QUICK_LINKS, CATEGORIES } = window.AppConfig;
    
    // 工具函数：防抖
    const debounce = (func, wait) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    // 全局状态管理
    let state = {
        isDark: localStorage.getItem('theme') === 'dark',
        activeEngine: SEARCH_ENGINES[0] || {},
        activeCategoryId: CATEGORIES[0]?.id || '',
        activeSubCategoryIds: {},
        isProgrammaticScroll: false, // 是否正在进行代码控制的滚动
        scrollTimer: null // 用于管理滚动锁定的定时器
    };

    // 初始化所有分类的默认子分类
    CATEGORIES.forEach(cat => {
        if(cat.subCategories && cat.subCategories.length > 0) {
            state.activeSubCategoryIds[cat.id] = cat.subCategories[0].id;
        }
    });

    // --- 顶部左侧链接渲染 ---
    const renderHeaderLinks = () => {
        const container = document.getElementById('header-links');
        if (!container) return;
        container.innerHTML = HEADER_LINKS.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" 
               class="whitespace-nowrap text-[13px] md:text-[14px] font-medium text-gray-600/90 dark:text-gray-400 px-2.5 py-1.5 rounded-lg hover:bg-black/5 hover:text-[#FF8C19] transition-all dark:hover:bg-white/10 dark:hover:text-[#FF8C19]">
               ${link.title}
            </a>
        `).join('');
    };

    // --- 快捷链接渲染 ---
    const renderQuickLinks = () => {
        const container = document.getElementById('quick-links');
        if (!container) return;
        container.innerHTML = QUICK_LINKS.map(link => `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer"
               class="group relative overflow-hidden rounded-xl md:rounded-2xl border border-gray-200 bg-gray-50/50 px-3 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-medium text-gray-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white/60 hover:backdrop-blur-md hover:text-[#FF8C19] hover:shadow-lg hover:shadow-orange-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-[#FF8C19] dark:hover:border-gray-600">
               <span class="relative z-10">${link.title}</span>
            </a>
        `).join('');
    };

    // --- 搜索引擎切换器 ---
    const renderEngineSwitcher = () => {
        const container = document.getElementById('engine-switcher');
        if (!container) return;
        container.style.position = 'relative';
        
        const buttonsHtml = SEARCH_ENGINES.map(engine => `
            <button type="button" data-name="${engine.name}" 
                class="engine-btn relative z-20 pb-2.5 px-1 font-medium text-sm md:text-[15px] shrink-0 transition-colors duration-300 outline-none">
                ${engine.name}
            </button>
        `).join('');

        const gliderHtml = `<div id="engine-glider" class="glider-transition hidden"></div>`;
        container.innerHTML = buttonsHtml + gliderHtml;

        const glider = document.getElementById('engine-glider');
        
        // 使用事件委托处理点击
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.engine-btn');
            if (!btn) return;
            const name = btn.getAttribute('data-name');
            state.activeEngine = SEARCH_ENGINES.find(e => e.name === name);
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
            updateSearchPlaceholder();
        };

        const resizeObserver = new ResizeObserver(debounce(() => requestAnimationFrame(updateUI), 100));
        resizeObserver.observe(container);
        setTimeout(updateUI, 100);
    };

    const updateSearchPlaceholder = () => {
        const input = document.getElementById('search-input');
        if (input && state.activeEngine) {
            input.placeholder = state.activeEngine.placeholder;
        }
    };

    // --- 侧边栏渲染 ---
    const renderSidebarLinks = (containerId, isMobile = false) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = CATEGORIES.map(cat => {
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
        
        // 绑定事件
        container.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const id = link.getAttribute('data-id');
                scrollToCategory(id);
                if(isMobile) toggleMobileMenu(false);
            });
        });
    };

    // --- 动态计算 Footer 高度 (精确自适应版) ---
    const adjustFooterHeight = debounce(() => {
        const footer = document.getElementById('main-footer');
        if (!CATEGORIES.length || !footer) return;
        
        const lastCatId = CATEGORIES[CATEGORIES.length - 1].id;
        const lastSection = document.getElementById(`category-${lastCatId}`);
        if (!lastSection) return;

        const viewportHeight = window.innerHeight;
        const headerOffset = window.innerWidth < 1024 ? 80 : 110;
        const gap = 64; 
        const lastSectionHeight = lastSection.offsetHeight;

        let minHeight = viewportHeight - headerOffset - lastSectionHeight - gap;
        footer.style.minHeight = minHeight > 0 ? `${minHeight}px` : 'auto';

    }, 30);

    // --- 主内容渲染 ---
    const renderContent = () => {
        const container = document.getElementById('content-area');
        if (!container) return;
        
        container.innerHTML = CATEGORIES.map(cat => `
            <section id="category-${cat.id}" data-cat-id="${cat.id}" class="category-section animate-fade-in group/section scroll-mt-[110px]" style="content-visibility: auto; contain-intrinsic-size: 500px;">
                <div class="panel-container p-5 md:p-8 rounded-2xl md:rounded-3xl transition-all duration-500">
                    <div class="mb-4 md:mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center flex-wrap pl-1 md:pl-2 border-b border-gray-100 pb-3 md:pb-4 dark:border-gray-800">
                        <div class="flex items-center gap-3">
                             <div class="p-1.5 md:p-2 rounded-lg bg-orange-50 dark:bg-gray-800 text-[#FF8C19]">
                                <i data-lucide="${cat.icon}" class="w-5 h-5 md:w-6 md:h-6"></i>
                             </div>
                             <h2 class="text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100 tracking-tight">${cat.name}</h2>
                        </div>
                        <span class="hidden h-5 w-px bg-gray-300 dark:bg-gray-700 md:block mx-2"></span>
                        
                        <div class="relative flex flex-wrap items-center p-1 bg-gray-100/50 dark:bg-black/20 rounded-full" id="tabs-${cat.id}"></div>
                    </div>
                    <div id="grid-${cat.id}" class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"></div>
                </div>
            </section>
        `).join('');

        CATEGORIES.forEach(cat => {
            initSubCategoryTabs(cat); 
            renderCards(cat);
        });

        const lastCatId = CATEGORIES[CATEGORIES.length - 1].id;
        const lastSection = document.getElementById(`category-${lastCatId}`);
        if(lastSection) {
            const sectionResizeObserver = new ResizeObserver(() => {
                adjustFooterHeight();
            });
            sectionResizeObserver.observe(lastSection);
        }
        
        if (window.lucide) window.lucide.createIcons();
        setTimeout(adjustFooterHeight, 100);
        setupIntersectionObserver();
    };

    // --- 子分类 Tab 逻辑 ---
    const initSubCategoryTabs = (cat) => {
        const container = document.getElementById(`tabs-${cat.id}`);
        if (!cat.subCategories || cat.subCategories.length === 0) {
            container.style.display = 'none';
            return;
        }

        const buttonsHtml = cat.subCategories.map(sub => `
            <button type="button" data-main="${cat.id}" data-sub="${sub.id}"
                class="subcat-btn relative z-10 px-4 py-1.5 md:px-5 md:py-2 text-xs md:text-[14px] font-semibold transition-colors duration-300 rounded-full cursor-pointer outline-none select-none">
                ${sub.name}
            </button>
        `).join('');

        const gliderHtml = `<div class="subcategory-glider glider-transition hidden" id="glider-${cat.id}"></div>`;
        container.innerHTML = buttonsHtml + gliderHtml;

        const glider = document.getElementById(`glider-${cat.id}`);

        const updateTabUI = () => {
            const btns = container.querySelectorAll('.subcat-btn');
            const activeId = state.activeSubCategoryIds[cat.id];
            const activeBtn = Array.from(btns).find(btn => btn.getAttribute('data-sub') === activeId);

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
                setTimeout(adjustFooterHeight, 50);
            }
        });

        const resizeObserver = new ResizeObserver(debounce(() => {
            requestAnimationFrame(updateTabUI);
        }, 100));
        resizeObserver.observe(container);
        updateTabUI();
    };

    // --- 卡片渲染 ---
    const renderCards = (cat) => {
        const container = document.getElementById(`grid-${cat.id}`);
        const activeSubId = state.activeSubCategoryIds[cat.id];
        const activeSub = cat.subCategories ? cat.subCategories.find(sub => sub.id === activeSubId) : null;
        
        if (!activeSub) return;
        
        container.classList.remove('animate-fade-in-up');
        void container.offsetWidth; 
        container.classList.add('animate-fade-in-up');

        const { gradient, iconName } = activeSub.iconConfig || { gradient: 'from-blue-400 to-cyan-400', iconName: 'link' };

        container.innerHTML = activeSub.sites.map(site => `
            <a href="${site.url}" target="_blank" rel="noopener noreferrer"
               class="site-card group relative flex h-full flex-row items-start gap-3 md:gap-4 overflow-hidden rounded-xl md:rounded-2xl p-4 md:p-5 transition-all duration-300">
                <div class="relative flex h-9 w-9 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} shadow-md text-white ring-1 ring-black/5 dark:ring-white/10">
                    <i data-lucide="${iconName}" class="w-5 h-5 md:w-6 md:h-6"></i>
                </div>
                <div class="relative min-w-0 flex-1 pt-0.5">
                    <h3 class="truncate text-[15px] md:text-[16px] font-bold text-gray-800 dark:text-gray-100 mb-0.5 md:mb-1">${site.title}</h3>
                    <p class="h-[40px] overflow-hidden text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">${site.description}</p>
                </div>
            </a>
        `).join('');
        
        if (window.lucide) window.lucide.createIcons({ root: container });
    };

    // --- 统一交互核心逻辑 (Scroll & Click Sync) ---
    
    // 1. 点击跳转逻辑：立即更新UI + 平滑滚动 + 锁定监听
    const scrollToCategory = (id) => {
        // 立即清除之前的定时器
        if (state.scrollTimer) clearTimeout(state.scrollTimer);
        
        // 状态加锁
        state.isProgrammaticScroll = true;
        
        // 立即更新侧边栏UI（提供即时反馈）
        state.activeCategoryId = id;
        updateSidebarUI();
        
        const el = document.getElementById(`category-${id}`);
        if (el) {
            // 使用原生平滑滚动，它会自动对齐 scroll-margin-top
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // 设定一个稍微宽裕的解锁时间，或者在检测到滚动结束时解锁
            // 简单起见，使用 1000ms 覆盖大部分平滑滚动时长
            state.scrollTimer = setTimeout(() => { 
                state.isProgrammaticScroll = false; 
            }, 1000);
        }
    };

    // 2. 滚动监听逻辑：判定线调整为屏幕上方 15% 处
    const setupIntersectionObserver = () => {
        const options = {
            root: null,
            // 关键修改：判定线改为距离顶部 15% 到 80% 的区域
            // 这意味着当元素的顶部进入屏幕上方这一条狭窄的“阅读线”时，才会触发高亮
            rootMargin: '-15% 0px -80% 0px', 
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            // 如果是点击触发的滚动，完全忽略观察器，防止高亮乱跳
            if (state.isProgrammaticScroll) return;

            // 找到所有进入判定区域的元素
            const visibleSections = entries.filter(entry => entry.isIntersecting);
            
            if (visibleSections.length > 0) {
                // 通常只会有一个，如果有多个，取第一个
                const targetId = visibleSections[0].target.getAttribute('data-cat-id');
                if (targetId && targetId !== state.activeCategoryId) {
                    state.activeCategoryId = targetId;
                    updateSidebarUI();
                }
            }
        }, options);

        document.querySelectorAll('.category-section').forEach(section => {
            observer.observe(section);
        });
    };

    const updateSidebarUI = () => {
        renderSidebarLinks('desktop-nav-links');
        renderSidebarLinks('mobile-nav-links', true);
    };

    // 监听 Resize
    window.addEventListener('resize', adjustFooterHeight);

    const toggleTheme = () => { 
        state.isDark = !state.isDark; 
        localStorage.setItem('theme', state.isDark ? 'dark' : 'light'); 
        applyTheme(); 
    };
    
    const applyTheme = () => { document.documentElement.classList.toggle('dark', state.isDark); };
    
    // 数字滚动动画
    const animateCount = () => {
        const els = [document.getElementById('site-count'), document.getElementById('mobile-site-count')];
        const total = CATEGORIES.reduce((acc, cat) => acc + (cat.subCategories ? cat.subCategories.reduce((s, sub) => s + (sub.sites ? sub.sites.length : 0), 0) : 0), 0);
        let start = 0;
        const duration = 1500;
        const startTime = performance.now();

        const frame = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (total - start) * ease);
            els.forEach(el => el && (el.textContent = current));
            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                els.forEach(el => el && (el.textContent = total));
            }
        };
        requestAnimationFrame(frame);
    };

    // 其他事件绑定
    const logo = document.getElementById('desktop-logo');
    if (logo) {
        logo.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            state.activeCategoryId = CATEGORIES[0]?.id;
            updateSidebarUI();
        });
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('search-input');
            const query = input ? input.value : '';
            if (query.trim()) window.open(`${state.activeEngine.url}${encodeURIComponent(query)}`, '_blank');
        });
    }

    const toggleMobileMenu = (show) => {
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('mobile-sidebar-overlay');
        if (!sidebar || !overlay) return;

        if (show) {
            overlay.classList.remove('hidden');
            void overlay.offsetWidth;
            overlay.classList.remove('opacity-0'); 
            sidebar.classList.remove('translate-x-[-100%]');
        } else {
            overlay.classList.add('opacity-0'); 
            sidebar.classList.add('translate-x-[-100%]');
            setTimeout(() => { overlay.classList.add('hidden'); }, 300);
        }
    };
    
    const menuBtn = document.getElementById('mobile-menu-btn');
    if(menuBtn) menuBtn.addEventListener('click', () => toggleMobileMenu(true));
    
    const menuOverlay = document.getElementById('mobile-sidebar-overlay');
    if(menuOverlay) menuOverlay.addEventListener('click', () => toggleMobileMenu(false));

    const modal = document.getElementById('about-modal');
    const aboutBtn = document.getElementById('about-btn');
    const closeAbout = document.getElementById('close-about');
    
    if (modal && aboutBtn && closeAbout) {
        aboutBtn.addEventListener('click', () => modal.classList.add('open'));
        closeAbout.addEventListener('click', () => modal.classList.remove('open'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });
    }

    // 初始化执行
    applyTheme();
    renderHeaderLinks();
    renderQuickLinks();
    renderEngineSwitcher();
    renderContent();
    updateSidebarUI();
    animateCount();
    
    // 初始 Footer 计算
    setTimeout(adjustFooterHeight, 100);
});