// Predefined aesthetic components library
const COMPONENT_LIBRARY = {
    slushwave: {
        'Neon Button': {
            html: '<button class="slush-btn">Click Me</button>',
            css: `.slush-btn {
                background: linear-gradient(45deg, #ff006e, #8338ec);
                border: none;
                color: white;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                text-transform: uppercase;
                letter-spacing: 2px;
                box-shadow: 0 0 20px rgba(255, 0, 110, 0.5);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .slush-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(255, 0, 110, 0.7);
            }`,
            js: ''
        },
        'Wavy Card': {
            html: '<div class="slush-card"><h3>Slushwave</h3><p>Aesthetic vibes</p></div>',
            css: `.slush-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px;
                border-radius: 20px;
                color: white;
                position: relative;
                overflow: hidden;
                box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
            }
            .slush-card::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
                animation: wave 3s ease-in-out infinite;
            }
            @keyframes wave {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }`,
            js: ''
        }
    },
    glitchcore: {
        'Glitch Text': {
            html: '<h2 class="glitch-text" data-text="GLITCH">GLITCH</h2>',
            css: `.glitch-text {
                font-family: 'Courier New', monospace;
                font-size: 3rem;
                font-weight: bold;
                text-transform: uppercase;
                position: relative;
                color: #00ff41;
                letter-spacing: 5px;
            }
            .glitch-text::before,
            .glitch-text::after {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            .glitch-text::before {
                animation: glitch-anim-1 0.5s infinite linear alternate-reverse;
                color: #ff0040;
                z-index: -1;
            }
            .glitch-text::after {
                animation: glitch-anim-2 0.5s infinite linear alternate-reverse;
                color: #00ffff;
                z-index: -2;
            }
            @keyframes glitch-anim-1 {
                0% { clip: rect(42px, 9999px, 44px, 0); }
                10% { clip: rect(12px, 9999px, 59px, 0); }
                20% { clip: rect(15px, 9999px, 34px, 0); }
                100% { clip: rect(45px, 9999px, 60px, 0); }
            }
            @keyframes glitch-anim-2 {
                0% { clip: rect(65px, 9999px, 119px, 0); }
                15% { clip: rect(25px, 9999px, 90px, 0); }
                35% { clip: rect(85px, 9999px, 90px, 0); }
                100% { clip: rect(45px, 9999px, 60px, 0); }
            }`,
            js: ''
        },
        'Static Box': {
            html: '<div class="static-box">ERROR 404</div>',
            css: `.static-box {
                width: 200px;
                height: 100px;
                background: #000;
                color: #00ff00;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                position: relative;
                overflow: hidden;
            }
            .static-box::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 0, 0.03) 2px,
                    rgba(0, 255, 0, 0.03) 4px
                );
                animation: static 0.1s infinite;
            }
            @keyframes static {
                0% { transform: translateY(0); }
                100% { transform: translateY(-2px); }
            }`,
            js: ''
        }
    },
    minimal: {
        'Clean Card': {
            html: '<div class="minimal-card"><h3>Title</h3><p>Clean and simple design</p></div>',
            css: `.minimal-card {
                background: #ffffff;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 20px rgba(0,0,0,0.1);
                border-left: 4px solid #007acc;
                max-width: 300px;
            }
            .minimal-card h3 {
                margin: 0 0 15px 0;
                color: #333;
                font-weight: 600;
            }
            .minimal-card p {
                color: #666;
                line-height: 1.6;
                margin: 0;
            }`,
            js: ''
        },
        'Simple Button': {
            html: '<button class="minimal-btn">Action</button>',
            css: `.minimal-btn {
                background: transparent;
                border: 2px solid #007acc;
                color: #007acc;
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-weight: 500;
            }
            .minimal-btn:hover {
                background: #007acc;
                color: white;
            }`,
            js: ''
        }
    },
    cyberpunk: {
        'Neon Panel': {
            html: '<div class="cyber-panel"><h3>ACCESS GRANTED</h3><p>Welcome to the matrix</p></div>',
            css: `.cyber-panel {
                background: linear-gradient(135deg, #0c0c0c, #1a1a1a);
                border: 2px solid #00ffff;
                padding: 25px;
                position: relative;
                color: #00ffff;
                font-family: 'Courier New', monospace;
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
            }
            .cyber-panel::before {
                content: '';
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                background: linear-gradient(45deg, #00ffff, #ff00ff, #00ffff);
                z-index: -1;
                animation: borderGlow 2s linear infinite;
            }
            @keyframes borderGlow {
                0% { filter: hue-rotate(0deg); }
                100% { filter: hue-rotate(360deg); }
            }
            .cyber-panel h3 {
                color: #ff00ff;
                text-shadow: 0 0 10px #ff00ff;
                margin-bottom: 10px;
            }`,
            js: ''
        }
    },
    vaporwave: {
        'Retro Grid': {
            html: '<div class="vapor-grid">AESTHETIC</div>',
            css: `.vapor-grid {
                background: linear-gradient(180deg, #ff006e, #8338ec);
                color: white;
                padding: 40px;
                text-align: center;
                font-size: 2rem;
                font-weight: bold;
                position: relative;
                overflow: hidden;
            }
            .vapor-grid::before {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 50%;
                background-image: 
                    linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
                background-size: 20px 20px;
                animation: gridMove 5s linear infinite;
            }
            @keyframes gridMove {
                0% { transform: translateY(0); }
                100% { transform: translateY(20px); }
            }`,
            js: ''
        }
    }
};

// Export for use in other files
window.COMPONENT_LIBRARY = COMPONENT_LIBRARY;

