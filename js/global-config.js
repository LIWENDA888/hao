// --- 核心配置与APP定义 ---
window.GLOBAL_CONFIG = {
    // APP 列表 (用于九宫格切换)
    APPS: [
        { 
            id: 'design', 
            name: '设计导航', 
            icon: 'layout-grid', 
            type: 'standard', // 标准卡片
            dataVar: 'DESIGN_DATA', // 对应 window.DESIGN_DATA
            desc: '设计师必备灵感库'
        },
        { 
            id: 'font', 
            name: '字体仓库', 
            icon: 'type', 
            type: 'cover', // 封面卡片
            dataVar: 'FONT_DATA', // 对应 window.FONT_DATA
            desc: '精选免费商用字体'
        },
        { 
            id: 'prompt', 
            name: 'AI 提示词', 
            icon: 'sparkles', 
            type: 'prompt', // 提示词卡片
            dataVar: 'PROMPT_DATA', // 对应 window.PROMPT_DATA
            desc: 'Midjourney/SD 咒语'
        }
    ],

    // 搜索引擎配置
    SEARCH_ENGINES: [
        { name: '百度', url: 'https://www.baidu.com/s?wd=', placeholder: '搜索 百度...' },
        { name: '形近字', url: 'https://tools.zizao.top/chaoyin/?mode=similar', placeholder: '请输入单字...' },
        { name: '百度AI', url: 'https://chat.baidu.com/search?word=', placeholder: '搜索 百度AI...' },
        { name: '图片', url: 'https://image.baidu.com/search/index?tn=baiduimage&fm=result&ie=utf-8&word=', placeholder: '搜索百度图片...' },
        { name: '免版权图片', url: 'https://www.logosc.cn/so/?s=', placeholder: '搜索免版权图片' },
        { name: '翻译', url: 'https://fanyi.baidu.com/#/zh/en/', placeholder: '百度翻译...' },
        { name: '花瓣', url: 'https://huaban.com/search?q=', placeholder: '搜索 花瓣图片...' },
        { name: '必应', url: 'https://www.cn.bing.com/search?q=', placeholder: '搜索 Bing...' },
        { name: '谷歌', url: 'https://www.google.com/search?q=', placeholder: '搜索 Google...' },
    ],
    

    // 顶部左侧链接
    HEADER_LINKS: [
        { title: '自在造字首页', url: 'https://www.zizao.top' },
        { title: '字体产品列表', url: 'https://www.zizao.top/fonts' },
        { title: '可变实验室', url: 'https://vf.zizao.top' },
        { title: '超引形近字', url: 'https://chaoyin.zizao.top' },
    ],

    // 快捷链接
    QUICK_LINKS: [
        { title: '视频在线下载', url: 'https://snapany.com/zh' },
        { title: 'Google Ai Studio', url: 'https://aistudio.google.com' },
        { title: 'Google Gemini', url: 'https://gemini.google.com/app' },
        { title: 'Github', url: 'https://github.com' },
        { title: 'Cloudflare', url: 'https://cloudflare.com' },
        { title: '阿里云', url: 'https://aliyun.com' },
        { title: 'Lovart', url: 'https://www.lovart.ai' },
    ]
};