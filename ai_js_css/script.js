// Enhanced script.js with improved functionality
let conversationHistory = [];

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Add welcome message
    const welcomeMessage = "👋 Hello! I'm Ishinder's AI assistant. How can I help you today?";
    addMessage('assistant', welcomeMessage);
    
    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Image upload handler
    document.getElementById('upload-button').addEventListener('click', function() {
        document.getElementById('image-upload').click();
    });
    
    document.getElementById('image-upload').addEventListener('change', handleImageUpload);
    
    // Send button handler
    document.getElementById('send-button').addEventListener('click', sendMessage);
    
    // Enter key handler
    document.getElementById('user-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Clear chat handler
    document.getElementById('clear-chat').addEventListener('click', clearChat);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        addMessage('error', 'Image too large. Please upload an image smaller than 5MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Create image message
        const imgContainer = document.createElement('div');
        imgContainer.className = 'message user-message';
        
        const img = document.createElement('img');
        img.className = 'uploaded-image';
        img.src = e.target.result;
        
        // Add loading state
        img.style.opacity = '0.7';
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Processing image...';
        loadingText.className = 'image-loading';
        
        // Add image to chat
        imgContainer.appendChild(img);
        imgContainer.appendChild(loadingText);
        
        const chatBox = document.getElementById('chat-box');
        chatBox.appendChild(imgContainer);
        
        // Add to conversation history
        conversationHistory.push({
            role: 'user',
            content: [
                { type: 'text', text: 'User uploaded an image' },
                { type: 'image_url', image_url: { url: e.target.result } }
            ]
        });
        
        // Remove loading state when image is loaded
        img.onload = function() {
            img.style.opacity = '1';
            imgContainer.removeChild(loadingText);
            chatBox.scrollTop = chatBox.scrollHeight;
        };
        
        chatBox.scrollTop = chatBox.scrollHeight;
    };
    
    reader.readAsDataURL(file);
    // Reset file input so the same file can be uploaded again
    e.target.value = '';
}

async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;
    
    // Disable input while processing
    input.value = '';
    input.disabled = true;
    document.getElementById('send-button').disabled = true;
    
    // Add user message
    addMessage('user', message);
    
    try {
        // Add typing indicator
        const typingIndicator = addTypingIndicator();
        
        // API call with timeout of 45 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        
        const response = await fetch('https://my-ai-4pkn.onrender.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        // Remove typing indicator
        removeTypingIndicator(typingIndicator);
        
        // Add AI message
        addMessage('assistant', reply);
        
    } catch (error) {
        console.error('Error:', error);
        
        // Remove typing indicator if it exists
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            removeTypingIndicator(indicator);
        }
        
        // Add appropriate error message
        if (error.name === 'AbortError') {
            addMessage('error', 'Request timed out. The server is taking too long to respond.');
        } else {
            addMessage('error', 'An error occurred. Please try again later.');
        }
    } finally {
        // Re-enable input
        input.disabled = false;
        document.getElementById('send-button').disabled = false;
        input.focus();
    }
}

function addMessage(role, content) {
    const chatBox = document.getElementById('chat-box');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : role === 'error' ? 'error-message' : 'ai-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content markdown-body';
    
    // Process markdown for assistant and user messages
    if (role !== 'error') {
        contentDiv.innerHTML = marked.parse(content, {
            breaks: true,
            gfm: true,
            highlight: (code, lang) => {
                const language = Prism.languages[lang] ? lang : 'plaintext';
                return Prism.highlight(code, Prism.languages[language], language);
            }
        });
    } else {
        // Simple error message without markdown
        contentDiv.innerHTML = `<p>⚠️ ${content}</p>`;
    }
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    
    // Apply syntax highlighting
    Prism.highlightAllUnder(contentDiv);
    
    // Make code blocks copyable
    addCopyButtonsToCodeBlocks(contentDiv);
    
    // Add message timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    messageDiv.appendChild(timestamp);
    
    // Update conversation history (except for error messages)
    if (role !== 'error') {
        conversationHistory.push({
            role: role === 'user' ? 'user' : 'assistant',
            content: content
        });
    }
    
    // Scroll to bottom with a small delay to ensure content is rendered
    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
    
    return messageDiv;
}

function addTypingIndicator() {
    const chatBox = document.getElementById('chat-box');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message ai-message typing-indicator';
    
    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    for (let i = 0; i < 3; i++) {
        dots.appendChild(document.createElement('div'));
    }
    
    typingDiv.appendChild(dots);
    chatBox.appendChild(typingDiv);
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
}

function removeTypingIndicator(indicator) {
    const chatBox = document.getElementById('chat-box');
    if (indicator && indicator.parentNode === chatBox) {
        chatBox.removeChild(indicator);
    }
}

function clearChat() {
    // Ask for confirmation
    if (!confirm('Are you sure you want to clear the chat history?')) {
        return;
    }
    
    // Clear the chat
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    
    // Reset conversation history
    conversationHistory = [];
    
    // Add welcome message
    const welcomeMessage = "👋 Chat cleared! How can I help you today?";
    addMessage('assistant', welcomeMessage);
}

function addCopyButtonsToCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll('pre code');
    
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentNode;
        
        // Create copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
        `;
        
        // Add copy functionality
        copyButton.addEventListener('click', () => {
            const code = codeBlock.textContent;
            navigator.clipboard.writeText(code).then(() => {
                // Show "Copied!" message
                copyButton.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                `;
                
                // Reset after 2 seconds
                setTimeout(() => {
                    copyButton.innerHTML = `
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;
                }, 2000);
            });
        });
        
        // Add the button to pre
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
    });
}

// Initialize Marked.js
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
});

// Initialize Prism
Prism.manual = true;