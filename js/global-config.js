// --- 核心配置与全局数据定义 ---
window.GLOBAL_CONFIG = {
    // 悬浮显示的通知公告列表 (新增了 icon、desc 和 color 配置)
    NOTICES:[
        { 
            title: '自在导航 V2.0 焕新上线！', 
            desc: '全新的视觉体验，更丰富的实用工具',
            date: '03-16', 
            icon: 'rocket',
            color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/20',
            url: 'https://www.zizao.top' 
        },
        { 
            title: '新增免版权图片与音视频专区', 
            desc: '收录百余个高质量免费素材站点',
            date: '03-15', 
            icon: 'image',
            color: 'text-orange-500 bg-orange-100 dark:bg-orange-500/20',
            url: 'https://www.zizao.top' 
        },
        { 
            title: '提交收录申请或建议', 
            desc: '发现好的网站？快来提交给我们吧',
            date: '03-10', 
            icon: 'mail-plus',
            color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/20',
            url: 'https://www.zizao.top' 
        }
    ],

    // 搜索引擎配置
    SEARCH_ENGINES:[
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
    HEADER_LINKS:[
        { title: '自在造字首页', url: 'https://www.zizao.top' },
        { title: '字体产品列表', url: 'https://www.zizao.top/fonts' },
        { title: '自在 · 可变', url: 'https://vf.zizao.top' },
        { title: '超引形近字', url: 'https://chaoyin.zizao.top' },
        { title: '免费商用字体', url: 'https://free.zizao.top' },
    ],

    // 快捷链接
    QUICK_LINKS:[
        { title: 'Google Ai Studio', url: 'https://aistudio.google.com' },
        { title: 'Google Gemini', url: 'https://gemini.google.com/app' },
        { title: 'Xiaomi Mimo Studio', url: 'https://aistudio.xiaomimimo.com/' },
        { title: 'Github', url: 'https://github.com' },
        { title: 'Cloudflare', url: 'https://cloudflare.com' },
        { title: 'Aliyun', url: 'https://aliyun.com' },
    ]
};