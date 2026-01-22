// --- AI提示词数据 (Prompt类型) ---
window.PROMPT_DATA = [
    {
        id: 'AI',
        name: 'Midjourney',
        icon: 'bot',
        subCategories: [
            {
                id: 'AI1',
                name: '#写实摄影',
                iconConfig: { gradient: 'from-purple-500 to-indigo-600', iconName: 'camera' },
                sites: [
                    { 
                        title: '赛博朋克少女', 
                        // image: 效果图
                        image: 'https://img.zcool.cn/community/01f0745e8568cba801216518a24c04.jpg@1280w_1l_2o_100sh.jpg', 
                        // prompt: 具体的提示词
                        prompt: 'Cyberpunk style, a girl standing in neon rain, futuristic city background, highly detailed, 8k resolution, cinematic lighting --ar 16:9',
                        url: '#' 
                    },
                    { 
                        title: '极简建筑摄影', 
                        image: 'https://img.zcool.cn/community/01c5f35e61c33ea8012165185d2685.jpg@1280w_1l_2o_100sh.jpg', 
                        prompt: 'Minimalist architecture, concrete walls, soft sunlight, blue sky, geometric composition, clean lines --v 5.2',
                        url: '#'
                    }
                ]
            }
        ]
    }
];