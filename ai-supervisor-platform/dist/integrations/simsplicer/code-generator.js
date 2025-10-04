// AI Code Generation Engine (Simulated)
class CodeGenerator {
    constructor() {
        this.templates = {
            slushwave: {
                colors: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
                patterns: ['gradient', 'glow', 'wave', 'pulse'],
                effects: ['blur', 'shadow', 'transform', 'opacity']
            },
            glitchcore: {
                colors: ['#00ff41', '#ff0040', '#00ffff', '#ffff00', '#ff00ff'],
                patterns: ['static', 'distortion', 'clip', 'scan'],
                effects: ['clip-path', 'filter', 'animation', 'transform']
            },
            minimal: {
                colors: ['#007acc', '#333333', '#666666', '#ffffff', '#f5f5f5'],
                patterns: ['clean', 'simple', 'border', 'shadow'],
                effects: ['transition', 'hover', 'focus', 'opacity']
            },
            cyberpunk: {
                colors: ['#00ffff', '#ff00ff', '#39ff14', '#0080ff', '#ff073a'],
                patterns: ['neon', 'grid', 'hologram', 'matrix'],
                effects: ['glow', 'scan', 'flicker', 'border-glow']
            },
            vaporwave: {
                colors: ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b'],
                patterns: ['retro', 'gradient', 'grid', 'wave'],
                effects: ['perspective', 'gradient', 'glow', 'animation']
            },
            brutalist: {
                colors: ['#000000', '#ffffff', '#ff0000', '#0000ff', '#ffff00'],
                patterns: ['bold', 'geometric', 'contrast', 'block'],
                effects: ['transform', 'scale', 'border', 'shadow']
            }
        };
    }

    generateCode(prompt, style) {
        const template = this.templates[style] || this.templates.minimal;
        const codeType = this.detectCodeType(prompt);
        
        switch (codeType) {
            case 'button':
                return this.generateButton(prompt, style, template);
            case 'card':
                return this.generateCard(prompt, style, template);
            case 'layout':
                return this.generateLayout(prompt, style, template);
            case 'animation':
                return this.generateAnimation(prompt, style, template);
            case 'form':
                return this.generateForm(prompt, style, template);
            default:
                return this.generateGeneric(prompt, style, template);
        }
    }

    detectCodeType(prompt) {
        const lowercasePrompt = prompt.toLowerCase();
        if (lowercasePrompt.includes('button')) return 'button';
        if (lowercasePrompt.includes('card')) return 'card';
        if (lowercasePrompt.includes('layout') || lowercasePrompt.includes('grid')) return 'layout';
        if (lowercasePrompt.includes('animation') || lowercasePrompt.includes('animate')) return 'animation';
        if (lowercasePrompt.includes('form') || lowercasePrompt.includes('input')) return 'form';
        return 'generic';
    }

    generateButton(prompt, style, template) {
        const colors = template.colors;
        const primaryColor = colors[0];
        const secondaryColor = colors[1];
        
        const html = `<button class="${style}-generated-btn">Click Me</button>`;
        
        let css = `.${style}-generated-btn {
            background: linear-gradient(45deg, ${primaryColor}, ${secondaryColor});
            border: none;
            color: white;
            padding: 15px 30px;
            border-radius: ${style === 'minimal' ? '4px' : '25px'};
            font-size: 16px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.3s ease;`;

        if (style === 'glitchcore') {
            css += `
            position: relative;
            font-family: 'Courier New', monospace;
            }
            .${style}-generated-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: ${primaryColor};
                animation: glitch-bg 0.3s infinite;
            }
            @keyframes glitch-bg {
                0%, 100% { opacity: 0; }
                50% { opacity: 0.5; }
            }`;
        } else if (style === 'cyberpunk') {
            css += `
            box-shadow: 0 0 20px ${primaryColor}40;
            border: 2px solid ${primaryColor};
            }
            .${style}-generated-btn:hover {
                box-shadow: 0 0 30px ${primaryColor}80;
                transform: translateY(-2px);
            }`;
        } else {
            css += `
            box-shadow: 0 4px 15px ${primaryColor}40;
            }
            .${style}-generated-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px ${primaryColor}60;
            }`;
        }

        return {
            html,
            css,
            js: `// Add interactive functionality here
document.querySelector('.${style}-generated-btn')?.addEventListener('click', function() {
    this.style.transform = 'scale(0.95)';
    setTimeout(() => this.style.transform = '', 150);
});`
        };
    }

    generateCard(prompt, style, template) {
        const colors = template.colors;
        const primaryColor = colors[0];
        
        const html = `<div class="${style}-generated-card">
    <h3>Generated Card</h3>
    <p>This card was generated based on your prompt: "${prompt}"</p>
    <button class="card-action">Action</button>
</div>`;

        let css = `.${style}-generated-card {
            background: ${style === 'minimal' ? '#ffffff' : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`};
            padding: 30px;
            border-radius: ${style === 'minimal' ? '8px' : '15px'};
            color: ${style === 'minimal' ? '#333' : 'white'};
            box-shadow: 0 10px 30px rgba(0,0,0,${style === 'minimal' ? 0.1 : 0.3});
            position: relative;
            overflow: hidden;
            max-width: 350px;
        }`;

        if (style === 'glitchcore') {
            css += `
        .${style}-generated-card::after {
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
            animation: static-lines 0.1s infinite;
        }
        @keyframes static-lines {
            0% { transform: translateY(0); }
            100% { transform: translateY(-2px); }
        }`;
        }

        css += `
        .card-action {
            background: ${style === 'minimal' ? 'transparent' : primaryColor};
            border: 2px solid ${primaryColor};
            color: ${style === 'minimal' ? primaryColor : 'white'};
            padding: 10px 20px;
            border-radius: 5px;
            margin-top: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .card-action:hover {
            background: ${primaryColor};
            color: white;
        }`;

        return {
            html,
            css,
            js: `// Card interaction
document.querySelector('.card-action')?.addEventListener('click', function() {
    alert('Card action triggered!');
});`
        };
    }

    generateLayout(prompt, style, template) {
        const html = `<div class="${style}-generated-layout">
    <header class="layout-header">Header</header>
    <main class="layout-main">
        <div class="layout-item">Item 1</div>
        <div class="layout-item">Item 2</div>
        <div class="layout-item">Item 3</div>
    </main>
</div>`;

        const css = `.${style}-generated-layout {
            min-height: 300px;
            background: ${style === 'minimal' ? '#f5f5f5' : 'linear-gradient(45deg, ' + template.colors[0] + ', ' + template.colors[1] + ')'};
            padding: 20px;
            border-radius: 10px;
        }
        .layout-header {
            background: ${template.colors[0]};
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        .layout-main {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .layout-item {
            background: ${style === 'minimal' ? 'white' : 'rgba(255,255,255,0.1)'};
            padding: 30px;
            border-radius: 8px;
            text-align: center;
            color: ${style === 'minimal' ? '#333' : 'white'};
            border: ${style === 'cyberpunk' ? '1px solid ' + template.colors[0] : 'none'};
            ${style === 'cyberpunk' ? 'box-shadow: 0 0 15px ' + template.colors[0] + '40;' : ''}
        }`;

        return {
            html,
            css,
            js: '// Layout generated successfully'
        };
    }

    generateAnimation(prompt, style, template) {
        const html = `<div class="${style}-animated-element">Animated Element</div>`;
        
        let css = `.${style}-animated-element {
            width: 200px;
            height: 100px;
            background: linear-gradient(45deg, ${template.colors[0]}, ${template.colors[1]});
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            margin: 50px auto;`;

        if (style === 'slushwave') {
            css += `
            border-radius: 20px;
            animation: wave-pulse 2s ease-in-out infinite;
        }
        @keyframes wave-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }`;
        } else if (style === 'glitchcore') {
            css += `
            animation: glitch-shake 0.5s infinite;
        }
        @keyframes glitch-shake {
            0%, 100% { transform: translate(0); }
            10% { transform: translate(-2px, 2px); }
            20% { transform: translate(2px, -2px); }
            30% { transform: translate(-2px, -2px); }
            40% { transform: translate(2px, 2px); }
        }`;
        } else {
            css += `
            animation: smooth-bounce 3s ease-in-out infinite;
        }
        @keyframes smooth-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }`;
        }

        return {
            html,
            css,
            js: '// Animation element generated'
        };
    }

    generateForm(prompt, style, template) {
        const html = `<form class="${style}-generated-form">
    <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" placeholder="Enter your name">
    </div>
    <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="Enter your email">
    </div>
    <button type="submit" class="form-submit">Submit</button>
</form>`;

        const css = `.${style}-generated-form {
            max-width: 400px;
            padding: 30px;
            background: ${style === 'minimal' ? 'white' : 'linear-gradient(135deg, ' + template.colors[0] + ', ' + template.colors[1] + ')'};
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .form-group {
            margin-bottom: 20px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: ${style === 'minimal' ? '#333' : 'white'};
            font-weight: bold;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: ${style === 'minimal' ? '1px solid #ddd' : '2px solid ' + template.colors[0]};
            border-radius: 5px;
            background: ${style === 'minimal' ? 'white' : 'rgba(255,255,255,0.1)'};
            color: ${style === 'minimal' ? '#333' : 'white'};
        }
        .form-submit {
            background: ${template.colors[0]};
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            transition: all 0.3s ease;
        }
        .form-submit:hover {
            background: ${template.colors[1]};
        }`;

        return {
            html,
            css,
            js: `document.querySelector('.${style}-generated-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Form submitted!');
});`
        };
    }

    generateGeneric(prompt, style, template) {
        const html = `<div class="${style}-generated-element">
    <h2>Generated Element</h2>
    <p>This element was created based on your prompt: "${prompt}"</p>
    <div class="element-decoration"></div>
</div>`;

        const css = `.${style}-generated-element {
            padding: 30px;
            background: ${style === 'minimal' ? 'white' : 'linear-gradient(135deg, ' + template.colors[0] + ', ' + template.colors[1] + ')'};
            border-radius: 15px;
            color: ${style === 'minimal' ? '#333' : 'white'};
            position: relative;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 500px;
            margin: 20px auto;
        }
        .element-decoration {
            width: 50px;
            height: 4px;
            background: ${template.colors[0]};
            margin-top: 20px;
            border-radius: 2px;
        }`;

        return {
            html,
            css,
            js: '// Generic element generated'
        };
    }
}

// Export for use in other files
window.CodeGenerator = CodeGenerator;

