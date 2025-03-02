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

// Predefined prompt to guide AI behavior for FIR writing
const FIR_PROMPT = `
You are a Police FIR Assistant for the Indian Police Department. Your task is to write a formal, detailed, and accurate First Information Report (FIR) based on the user's description of an incident. Use the following structure and guidelines:

1. **Introduction**: Start with "First Information Report (FIR) lodged at [Police Station Name] on [Date & Time]."
2. **Incident Details**: Include a clear, concise description of what happened, when, where, and who was involved (names, addresses if provided, witnesses, etc.). Use formal language, e.g., "On [Date], at [Time], an incident of [FIR Type] occurred at [Location], involving [Persons Involved]."
3. **Nature of Offence**: Specify the nature of the offense (e.g., theft, assault, fraud) and, if known, reference relevant sections of the Indian Penal Code (IPC) or other applicable laws.
4. **Evidence/Witnesses**: Mention any evidence (e.g., images, objects) or witnesses provided by the user.
5. **Conclusion**: End with "The complainant has provided the above details, and further investigation is recommended. This FIR is registered under the supervision of [Reporting Officer]."

Ensure the tone is official, precise, and legal, avoiding informal language or humor. Use only the information provided by the user, and do not invent details unless explicitly stated. If information is missing (e.g., police station, officer name), note it as "Not specified."

Return only the FIR text, formatted as plain text with proper line breaks and paragraphs, without any additional commentary or markup.
`;

// Populate input with FIR details and predefined prompt
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
    prompt += '\n' + FIR_PROMPT + '\nPlease describe the incident in detail:';

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

    // Add user message (including the predefined prompt if present)
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

// Generate formatted FIR document mimicking an authentic Indian FIR
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
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header img {
            width: 120px;
            height: auto;
        }
        .fir-title {
            font-size: 28px;
            font-weight: bold;
            color: #d32f2f;
            margin-bottom: 15px;
            text-decoration: underline;
        }
        .fir-number {
            font-size: 18px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 10px;
            text-align: center;
        }
        .fir-details {
            border: 2px solid #000000;
            padding: 15px;
            margin-bottom: 20px;
            background-color: #f9f9f9;
        }
        .fir-details p {
            margin: 8px 0;
            font-size: 14px;
        }
        .incident {
            margin-top: 20px;
            border-top: 2px solid #000000;
            padding-top: 15px;
        }
        .incident h3 {
            font-size: 20px;
            color: #0a3d91;
            margin-bottom: 10px;
        }
        .incident p {
            font-size: 14px;
            margin: 5px 0;
        }
        .legal-notice {
            margin-top: 20px;
            font-size: 12px;
            color: #666666;
            border-top: 1px solid #000000;
            padding-top: 10px;
        }
        .signature {
            margin-top: 30px;
            text-align: right;
            border-top: 2px solid #000000;
            padding-top: 15px;
        }
        .signature p {
            margin: 5px 0;
            font-size: 14px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666666;
            margin-top: 20px;
            border-top: 1px solid #000000;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="/api/placeholder/60/60" alt="Indian Police Logo" class="police-logo">
        <div class="fir-title">First Information Report</div>
        <div class="fir-number">FIR No: ${firNumber}</div>
    </div>
    <div class="fir-details">
        <p><strong>Police Station:</strong> ${station}</p>
        <p><strong>Date & Time of Occurrence:</strong> ${getCurrentDateTime()}</p>
        <p><strong>Nature of Offence:</strong> ${firType}</p>
        <p><strong>Reported By:</strong> ${officer || 'Not specified'}</p>
        <p><strong>Place of Occurrence:</strong> [Extracted from incident details or Not specified]</p>
    </div>
    <div class="incident">
        <h3>Details of the Incident:</h3>
        <p>${aiResponse.trim()}</p>
    </div>
    <div class="legal-notice">
        <p>*Note: This FIR is a preliminary record of information as provided by the complainant. It does not constitute evidence or a final determination of guilt. Further investigation under the supervision of the police authorities is required as per the provisions of the Code of Criminal Procedure, 1973 (CrPC), and the Indian Penal Code (IPC).</p>
        <p>This document is subject to verification and may be amended based on subsequent findings or additional evidence.</p>
    </div>
    <div class="signature">
        <p>________________________</p>
        <p>${officer || 'Reporting Officer'}</p>
        <p>Station House Officer, ${station || 'Not specified'}</p>
        <p>Date: ${getCurrentDateTime()}</p>
    </div>
    <div class="footer">
        <p>Government of India | Ministry of Home Affairs | Indian Police Department</p>
        <p>For official use only. Unauthorized reproduction or alteration is punishable under law.</p>
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
    // For download, convert HTML to plain text for .txt file, mimicking the FIR format
    const plainTextContent = `
First Information Report - ${firNumber}

FIR No: ${firNumber}
Police Station: ${document.getElementById('police-station').value || 'Not specified'}
Date & Time of Occurrence: ${getCurrentDateTime()}
Nature of Offence: ${document.getElementById('fir-type').value || 'Not specified'}
Reported By: ${document.getElementById('officer-name').value || 'Not specified'}
Place of Occurrence: [Extracted from incident details or Not specified]

Details of the Incident:
${firContent.match(/<p>(.*?)<\/p>/g)?.map(p => p.replace(/<\/?p>/g, '').trim()).join('\n') || 'No details available'}

Legal Notice:
*Note: This FIR is a preliminary record of information as provided by the complainant. It does not constitute evidence or a final determination of guilt. Further investigation under the supervision of the police authorities is required as per the provisions of the Code of Criminal Procedure, 1973 (CrPC), and the Indian Penal Code (IPC).
This document is subject to verification and may be amended based on subsequent findings or additional evidence.

Signature:
________________________
${document.getElementById('officer-name').value || 'Reporting Officer'}
Station House Officer, ${document.getElementById('police-station').value || 'Not specified'}
Date: ${getCurrentDateTime()}

Footer:
Government of India | Ministry of Home Affairs | Indian Police Department
For official use only. Unauthorized reproduction or alteration is punishable under law.
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
        const printWindow = window.open('', '', 'height=1000,width=1200');
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
