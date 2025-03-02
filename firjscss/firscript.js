// firscript.js
let conversationHistory = [];
let isListening = false;
let recognition;
let firNumber = generateFIRNumber();

// Generate random FIR number
function generateFIRNumber() {
    const timestamp = Date.now().toString().slice(-6);
    return `FIR-${timestamp}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// Format current date and time
function getCurrentDateTime() {
    return new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Update FIR info display
function updateFIRInfo() {
    document.getElementById('fir-number').textContent = firNumber;
    document.getElementById('fir-datetime').textContent = getCurrentDateTime();
    document.getElementById('current-date').textContent = getCurrentDateTime();
    const station = document.getElementById('police-station').value;
    document.getElementById('fir-station').textContent = station || '-';
}

// Populate input with FIR details
function updateInputPrompt() {
    const station = document.getElementById('police-station').value;
    const firType = document.getElementById('fir-type').value;
    const officer = document.getElementById('officer-name').value;
    
    let prompt = '';
    prompt += `FIR Number: ${firNumber}\n`;
    prompt += `Date & Time: ${getCurrentDateTime()}\n`;
    if (station) prompt += `Police Station: ${station}\n`;
    if (firType) prompt += `FIR Type: ${firType}\n`;
    if (officer) prompt += `Reporting Officer: ${officer}\n`;
    prompt += '\nPlease describe the incident in detail:';

    const input = document.getElementById('user-input');
    if (!input.value || !conversationHistory.length) {
        input.value = prompt;
    }
}

// Initialize Speech Recognition
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your browser does not support speech recognition. Please use Chrome or another supported browser.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        document.getElementById('voice-indicator').classList.add('active');
    };

    recognition.onend = () => {
        isListening = false;
        document.getElementById('voice-indicator').classList.remove('active');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputBox = document.getElementById('user-input');
        inputBox.value += '\n' + transcript;
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        alert('Speech recognition error: ' + event.error);
        isListening = false;
        document.getElementById('voice-indicator').classList.remove('active');
    };
}

// Event Listeners for Voice and Image
document.getElementById('voice-button').addEventListener('click', () => {
    if (!recognition) {
        initializeSpeechRecognition();
    }
    if (isListening) {
        recognition.stop();
    } else {
        recognition.start();
    }
});

document.getElementById('image-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const chatBox = document.getElementById('chat-box');
            const imgContainer = document.createElement('div');
            imgContainer.className = 'message user-message';
            const img = document.createElement('img');
            img.className = 'uploaded-image';
            img.src = e.target.result;
            imgContainer.appendChild(img);
            chatBox.appendChild(imgContainer);
            
            // Simplify image upload to text for API compatibility
            conversationHistory.push({
                role: 'user',
                content: `User uploaded an image at ${getCurrentDateTime()}`
            });

            chatBox.scrollTop = chatBox.scrollHeight;
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('police-station').addEventListener('change', () => {
    updateFIRInfo();
    updateInputPrompt();
});

document.getElementById('fir-type').addEventListener('change', updateInputPrompt);
document.getElementById('officer-name').addEventListener('input', updateInputPrompt);

// Send message function with FIR document generation
async function sendMessage() {
    const input = document.getElementById('user-input');
    const message = input.value.trim();
    if (!message) return;

    input.value = '';
    const chatBox = document.getElementById('chat-box');

    // Add user message
    addMessage('user', message);

    try {
        // Add typing indicator
        const typingIndicator = addTypingIndicator();

        console.log('Sending conversation history:', JSON.stringify(conversationHistory, null, 2));

        // API call with simplified structure
        const response = await fetch('https://my-ai-4pkn.onrender.com/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory.map(msg => ({
                role: msg.role,
                content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
            }))})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('Invalid API response format');
        }

        const aiResponse = data.choices[0].message.content;
        chatBox.removeChild(typingIndicator);

        // Generate and display FIR document
        const firDocument = generateFIRDocument(aiResponse);
        addMessage('assistant', firDocument);

    } catch (error) {
        console.error('Error Details:', error);
        chatBox.removeChild(typingIndicator);
        addMessage('error', `An error occurred: ${error.message}. Please check the console for details or try again.`);
    }
}

// Generate formatted FIR document mimicking a standard Indian FIR
function generateFIRDocument(aiResponse) {
    const station = document.getElementById('police-station').value || 'Not specified';
    const firType = document.getElementById('fir-type').value || 'Not specified';
    const officer = document.getElementById('officer-name').value || 'Not specified';

    const firContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>First Information Report - ${firNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            width: 100px;
            height: auto;
        }
        .fir-title {
            font-size: 24px;
            font-weight: bold;
            color: #d32f2f;
            margin-bottom: 10px;
        }
        .fir-details {
            border: 2px solid #000000;
            padding: 15px;
            margin-bottom: 20px;
        }
        .fir-details p {
            margin: 5px 0;
            line-height: 1.5;
        }
        .incident {
            margin-top: 20px;
            border-top: 2px solid #000000;
            padding-top: 15px;
        }
        .signature {
            margin-top: 30px;
            text-align: right;
            border-top: 2px solid #000000;
            padding-top: 15px;
        }
        .signature p {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="/api/placeholder/60/60" alt="Indian Police Logo" class="police-logo">
        <div class="fir-title">First Information Report</div>
    </div>
    <div class="fir-details">
        <p><strong>FIR Number:</strong> ${firNumber}</p>
        <p><strong>Date & Time of Report:</strong> ${getCurrentDateTime()}</p>
        <p><strong>Police Station:</strong> ${station}</p>
        <p><strong>Type of Incident:</strong> ${firType}</p>
        <p><strong>Reporting Officer:</strong> ${officer}</p>
    </div>
    <div class="incident">
        <h3>Incident Details:</h3>
        <p>${aiResponse.trim()}</p>
    </div>
    <div class="signature">
        <p>________________________</p>
        <p>${officer || 'Reporting Officer'}</p>
        <p>Signature & Designation</p>
    </div>
</body>
</html>
    `.trim();

    // Update download and print functionality to use this FIR document
    updateFIRActions(firContent);
    return firContent; // This will be displayed as HTML in the chat box
}

// Update FIR download and print actions
function updateFIRActions(firContent) {
    // For download, convert HTML to plain text for .txt file
    const plainTextContent = `
First Information Report - ${firNumber}

FIR Number: ${firNumber}
Date & Time of Report: ${getCurrentDateTime()}
Police Station: ${document.getElementById('police-station').value || 'Not specified'}
Type of Incident: ${document.getElementById('fir-type').value || 'Not specified'}
Reporting Officer: ${document.getElementById('officer-name').value || 'Not specified'}

Incident Details:
${firContent.match(/<p>(.*?)<\/p>/g)?.map(p => p.replace(/<\/?p>/g, '').trim()).join('\n') || 'No details available'}

Signature:
________________________
${document.getElementById('officer-name').value || 'Reporting Officer'}
Signature & Designation
    `.trim();

    document.getElementById('download-fir').onclick = () => {
        const blob = new Blob([plainTextContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${firNumber}_FIR.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    document.getElementById('print-fir').onclick = () => {
        const printWindow = window.open('', '', 'height=800,width=1000');
        printWindow.document.write(firContent);
        printWindow.document.close();
        printWindow.print();
    };
}

function addMessage(role, content) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'ai-message'}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content; // Use raw HTML for FIR document display in chat box
    
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);

    if (role !== 'error') {
        conversationHistory.push({
            role: role === 'user' ? 'user' : 'assistant',
            content: content.toString() // Ensure content is a string for API compatibility
        });
    }

    chatBox.scrollTop = chatBox.scrollHeight;
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
    chatBox.scrollTop = chatBox.scrollHeight;
    return typingDiv;
}

// Handle Enter key
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Clear Chat
document.getElementById('clear-chat').addEventListener('click', () => {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    conversationHistory = [];
    firNumber = generateFIRNumber();
    updateFIRInfo();
    updateInputPrompt();
    // Reset FIR actions to default state (optional)
    updateFIRActions('');
});

// Initialize
marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: false,
    mangle: false
});
Prism.manual = true;
updateFIRInfo();
updateInputPrompt();
