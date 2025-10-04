// Main application logic
class SimsplicerAI {
    constructor() {
        this.codeGenerator = new CodeGenerator();
        this.currentCode = { html: '', css: '', js: '' };
        this.currentTab = 'html';
        this.portfolio = JSON.parse(localStorage.getItem('simsplicer-portfolio') || '[]');
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadComponentLibrary();
        this.updatePortfolio();
    }

    initializeElements() {
        this.promptInput = document.getElementById('promptInput');
        this.styleSelector = document.getElementById('styleSelector');
        this.generateBtn = document.getElementById('generateBtn');
        this.codeDisplay = document.getElementById('codeContent');
        this.previewFrame = document.getElementById('previewFrame');
        this.tabs = document.querySelectorAll('.tab');
        this.componentGrid = document.getElementById('componentGrid');
        this.portfolioGrid = document.getElementById('portfolioGrid');
        this.saveModal = document.getElementById('saveModal');
    }

    attachEventListeners() {
        // Main generation button
        this.generateBtn.addEventListener('click', () => this.generateCode());
        
        // Enter key in prompt
        this.promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.generateCode();
            }
        });

        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Control buttons
        document.getElementById('remixBtn')?.addEventListener('click', () => this.remixCode());
        document.getElementById('saveBtn')?.addEventListener('click', () => this.showSaveModal());
        document.getElementById('shareBtn')?.addEventListener('click', () => this.shareCode());
        document.getElementById('refreshPreview')?.addEventListener('click', () => this.updatePreview());
        document.getElementById('fullscreenPreview')?.addEventListener('click', () => this.fullscreenPreview());

        // Floating buttons
        document.getElementById('randomizeBtn')?.addEventListener('click', () => this.randomGenerate());
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportCode());
        document.getElementById('importBtn')?.addEventListener('click', () => this.importCode());

        // Portfolio toggle
        document.getElementById('portfolioToggle')?.addEventListener('click', () => this.togglePortfolio());

        // Save modal
        document.getElementById('confirmSave')?.addEventListener('click', () => this.saveCreation());
        document.getElementById('cancelSave')?.addEventListener('click', () => this.hideSaveModal());

        // Library toggle
        document.getElementById('libraryToggle')?.addEventListener('click', () => this.toggleLibrary());
    }

    generateCode() {
        const prompt = this.promptInput.value.trim();
        const style = this.styleSelector.value;

        if (!prompt) {
            this.showNotification('Please enter a prompt!', 'warning');
            return;
        }

        // Show loading state
        this.generateBtn.textContent = 'FORGING...';
        this.generateBtn.disabled = true;

        // Add glitch effect during generation
        document.body.classList.add('generating');

        setTimeout(() => {
            try {
                this.currentCode = this.codeGenerator.generateCode(prompt, style);
                this.updateCodeDisplay();
                this.updatePreview();
                this.showNotification('Code generated successfully!', 'success');
            } catch (error) {
                this.showNotification('Generation failed! Try a different prompt.', 'error');
                console.error('Code generation error:', error);
            } finally {
                this.generateBtn.textContent = 'FORGE CODE';
                this.generateBtn.disabled = false;
                document.body.classList.remove('generating');
            }
        }, 1500); // Simulate AI processing time
    }

    updateCodeDisplay() {
        const content = this.currentCode[this.currentTab] || '';
        this.codeDisplay.textContent = content;
        this.highlightSyntax();
    }

    highlightSyntax() {
        // Simple syntax highlighting
        const content = this.codeDisplay.textContent;
        let highlighted = content;

        if (this.currentTab === 'css') {
            highlighted = highlighted
                .replace(/([a-zA-Z-]+)(?=\s*:)/g, '<span style="color: #00ffff;">$1</span>')
                .replace(/(#[0-9a-fA-F]{3,6})/g, '<span style="color: #ff00ff;">$1</span>')
                .replace(/(@[a-zA-Z-]+)/g, '<span style="color: #39ff14;">$1</span>');
        } else if (this.currentTab === 'html') {
            highlighted = highlighted
                .replace(/(<\/?[^>]+>)/g, '<span style="color: #00ffff;">$1</span>')
                .replace(/(class|id)=("[^"]*")/g, '$1=<span style="color: #ff00ff;">$2</span>');
        } else if (this.currentTab === 'js') {
            highlighted = highlighted
                .replace(/\b(function|const|let|var|if|else|for|while|return)\b/g, '<span style="color: #39ff14;">$1</span>')
                .replace(/('[^']*'|"[^"]*")/g, '<span style="color: #ff00ff;">$1</span>');
        }

        this.codeDisplay.innerHTML = highlighted;
    }

    updatePreview() {
        const html = this.currentCode.html || '';
        const css = this.currentCode.css || '';
        const js = this.currentCode.js || '';

        const previewContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${js}
    </script>
</body>
</html>`;

        const blob = new Blob([previewContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.previewFrame.src = url;
    }

    switchTab(tab) {
        this.currentTab = tab;
        this.tabs.forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        this.updateCodeDisplay();
    }

    loadComponentLibrary() {
        this.componentGrid.innerHTML = '';
        
        Object.entries(window.COMPONENT_LIBRARY).forEach(([style, components]) => {
            const styleHeader = document.createElement('div');
            styleHeader.className = 'library-style-header';
            styleHeader.innerHTML = `<h4>${style.toUpperCase()}</h4>`;
            this.componentGrid.appendChild(styleHeader);

            Object.entries(components).forEach(([name, component]) => {
                const item = document.createElement('div');
                item.className = 'component-item';
                item.innerHTML = `
                    <h5>${name}</h5>
                    <p>${style}</p>
                `;
                item.addEventListener('click', () => this.loadComponent(component));
                this.componentGrid.appendChild(item);
            });
        });
    }

    loadComponent(component) {
        this.currentCode = component;
        this.updateCodeDisplay();
        this.updatePreview();
        this.showNotification('Component loaded!', 'success');
    }

    randomGenerate() {
        const prompts = [
            'cyberpunk neon button with hologram effect',
            'minimalist card with subtle animation',
            'glitchcore text with static overlay',
            'slushwave gradient background',
            'vaporwave retro grid layout',
            'brutalist geometric form design'
        ];
        
        const styles = ['slushwave', 'glitchcore', 'minimal', 'cyberpunk', 'vaporwave', 'brutalist'];
        
        this.promptInput.value = prompts[Math.floor(Math.random() * prompts.length)];
        this.styleSelector.value = styles[Math.floor(Math.random() * styles.length)];
        this.generateCode();
    }

    remixCode() {
        if (!this.currentCode.html && !this.currentCode.css) {
            this.showNotification('No code to remix! Generate something first.', 'warning');
            return;
        }

        // Add random variations to existing code
        const variations = [
            () => this.addRandomColors(),
            () => this.addRandomAnimation(),
            () => this.addRandomEffects()
        ];

        const variation = variations[Math.floor(Math.random() * variations.length)];
        variation();
        this.updateCodeDisplay();
        this.updatePreview();
        this.showNotification('Code remixed!', 'success');
    }

    addRandomColors() {
        const colors = ['#ff006e', '#8338ec', '#3a86ff', '#06ffa5', '#ffbe0b', '#00ffff', '#ff00ff'];
        const newColor1 = colors[Math.floor(Math.random() * colors.length)];
        const newColor2 = colors[Math.floor(Math.random() * colors.length)];
        
        this.currentCode.css = this.currentCode.css
            .replace(/linear-gradient\([^)]+\)/g, `linear-gradient(45deg, ${newColor1}, ${newColor2})`)
            .replace(/#[0-9a-fA-F]{6}/g, newColor1);
    }

    addRandomAnimation() {
        const animations = [
            '@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }',
            '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }',
            '@keyframes rotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }'
        ];
        
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        this.currentCode.css += '\n' + randomAnimation;
    }

    addRandomEffects() {
        const effects = [
            'filter: blur(0.5px);',
            'text-shadow: 0 0 10px currentColor;',
            'box-shadow: 0 0 20px rgba(0,255,255,0.5);',
            'transform: perspective(1000px) rotateX(5deg);'
        ];
        
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        // Add effect to the first CSS rule
        this.currentCode.css = this.currentCode.css.replace(/\{/, `{\n    ${randomEffect}`);
    }

    showSaveModal() {
        if (!this.currentCode.html && !this.currentCode.css) {
            this.showNotification('No code to save! Generate something first.', 'warning');
            return;
        }
        this.saveModal.classList.add('active');
    }

    hideSaveModal() {
        this.saveModal.classList.remove('active');
        document.getElementById('creationName').value = '';
        document.getElementById('creationDescription').value = '';
    }

    saveCreation() {
        const name = document.getElementById('creationName').value.trim();
        const description = document.getElementById('creationDescription').value.trim();

        if (!name) {
            this.showNotification('Please enter a name for your creation!', 'warning');
            return;
        }

        const creation = {
            id: Date.now(),
            name,
            description,
            code: { ...this.currentCode },
            style: this.styleSelector.value,
            prompt: this.promptInput.value,
            timestamp: new Date().toISOString()
        };

        this.portfolio.push(creation);
        localStorage.setItem('simsplicer-portfolio', JSON.stringify(this.portfolio));
        this.updatePortfolio();
        this.hideSaveModal();
        this.showNotification('Creation saved to portfolio!', 'success');
    }

    updatePortfolio() {
        this.portfolioGrid.innerHTML = '';
        
        this.portfolio.forEach(creation => {
            const item = document.createElement('div');
            item.className = 'portfolio-item';
            item.innerHTML = `
                <h4>${creation.name}</h4>
                <p>${creation.description || 'No description'}</p>
                <div class="portfolio-meta">
                    <span class="style-tag">${creation.style}</span>
                    <span class="date">${new Date(creation.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="portfolio-actions">
                    <button onclick="simsplicer.loadPortfolioItem(${creation.id})">Load</button>
                    <button onclick="simsplicer.deletePortfolioItem(${creation.id})">Delete</button>
                </div>
            `;
            this.portfolioGrid.appendChild(item);
        });
    }

    loadPortfolioItem(id) {
        const item = this.portfolio.find(p => p.id === id);
        if (item) {
            this.currentCode = item.code;
            this.promptInput.value = item.prompt;
            this.styleSelector.value = item.style;
            this.updateCodeDisplay();
            this.updatePreview();
            this.showNotification('Portfolio item loaded!', 'success');
        }
    }

    deletePortfolioItem(id) {
        this.portfolio = this.portfolio.filter(p => p.id !== id);
        localStorage.setItem('simsplicer-portfolio', JSON.stringify(this.portfolio));
        this.updatePortfolio();
        this.showNotification('Item deleted from portfolio!', 'success');
    }

    togglePortfolio() {
        const section = document.getElementById('portfolioSection');
        section.classList.toggle('collapsed');
    }

    toggleLibrary() {
        const library = document.querySelector('.component-library');
        library.classList.toggle('expanded');
    }

    shareCode() {
        if (!this.currentCode.html && !this.currentCode.css) {
            this.showNotification('No code to share! Generate something first.', 'warning');
            return;
        }

        const shareData = {
            prompt: this.promptInput.value,
            style: this.styleSelector.value,
            code: this.currentCode
        };

        const shareUrl = 'data:application/json;base64,' + btoa(JSON.stringify(shareData));
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.showNotification('Share link copied to clipboard!', 'success');
        });
    }

    exportCode() {
        if (!this.currentCode.html && !this.currentCode.css) {
            this.showNotification('No code to export! Generate something first.', 'warning');
            return;
        }

        const exportData = {
            html: this.currentCode.html,
            css: this.currentCode.css,
            js: this.currentCode.js,
            metadata: {
                prompt: this.promptInput.value,
                style: this.styleSelector.value,
                generated: new Date().toISOString()
            }
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simsplicer-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importCode() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.currentCode = {
                            html: data.html || '',
                            css: data.css || '',
                            js: data.js || ''
                        };
                        if (data.metadata) {
                            this.promptInput.value = data.metadata.prompt || '';
                            this.styleSelector.value = data.metadata.style || 'minimal';
                        }
                        this.updateCodeDisplay();
                        this.updatePreview();
                        this.showNotification('Code imported successfully!', 'success');
                    } catch (error) {
                        this.showNotification('Failed to import code! Invalid file format.', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    fullscreenPreview() {
        const html = this.currentCode.html || '';
        const css = this.currentCode.css || '';
        const js = this.currentCode.js || '';

        const previewContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        ${css}
    </style>
</head>
<body>
    ${html}
    <script>
        ${js}
    </script>
</body>
</html>`;

        const newWindow = window.open('', '_blank');
        newWindow.document.write(previewContent);
        newWindow.document.close();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 25px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '10000',
            animation: 'slideIn 0.3s ease',
            background: type === 'success' ? '#39ff14' : 
                       type === 'error' ? '#ff073a' : 
                       type === 'warning' ? '#ffbe0b' : '#00ffff'
        });

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
.generating {
    animation: neural-processing 1.5s infinite ease-in-out;
}
@keyframes neural-processing {
    0%, 100% { filter: hue-rotate(0deg) brightness(1); }
    25% { filter: hue-rotate(90deg) brightness(1.2); }
    50% { filter: hue-rotate(180deg) brightness(0.8); }
    75% { filter: hue-rotate(270deg) brightness(1.1); }
}
.library-style-header {
    grid-column: 1 / -1;
    padding: 10px;
    margin: 10px 0;
    border-bottom: 1px solid var(--neon-cyan);
}
.library-style-header h4 {
    color: var(--neon-cyan);
    margin: 0;
    font-size: 0.9rem;
}
.portfolio-item {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--neon-green);
    border-radius: 10px;
    padding: 20px;
    transition: all 0.3s ease;
}
.portfolio-item:hover {
    border-color: var(--neon-pink);
    box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
}
.portfolio-meta {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
}
.style-tag {
    background: var(--neon-cyan);
    color: var(--dark-bg);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    text-transform: uppercase;
}
.portfolio-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}
.portfolio-actions button {
    background: transparent;
    border: 1px solid var(--neon-green);
    color: var(--neon-green);
    padding: 5px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.3s ease;
}
.portfolio-actions button:hover {
    background: var(--neon-green);
    color: var(--dark-bg);
}
`;
document.head.appendChild(style);

// Initialize the application
let simsplicer;
document.addEventListener('DOMContentLoaded', () => {
    simsplicer = new SimsplicerAI();
});

// Make globally available for onclick handlers
window.simsplicer = simsplicer;

