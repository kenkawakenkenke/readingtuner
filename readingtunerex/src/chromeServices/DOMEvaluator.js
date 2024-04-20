/*global chrome*/

import OpenAI, { toFile } from 'openai';

async function exampleChatCompletion(apiKey, input_json, model, age) {
   const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true,
   });

   const chatCompletion = await openai.chat.completions.create({
      messages: [
         {
            role: 'system', content: `The provided JSON input represents textContents
         extracted from a web article. It's an array of text objects containing an ID and the
         text as it appears on the page. The array also contains texts irrelevant to the main
         article, such as navigational labels. I want you to identify the texts forming the
         article (including the title, headers, captions, and any part of the article content)
         and then simplify the content to make it understandable for a ${age}-year-old. Use
         extra care to make sure you only use words that a ${age} year old that only speaks the
         original language of the article can understand.
         Return a modified JSON with only these main article text elements, where
         the 'text' field has been rewritten for a child's understanding.
         The result should be a JSON object containing a single field 'main_content'
         that references an array of the processed text objects.
         You must respect and keep the original language of the text in the simplified
         text too.
         ` },
         {
            role: 'user', content: input_json
         },
      ],
      model: model,
      response_format: { "type": "json_object" },
   });
   // console.log(chatCompletion.choices[0].message);
   return chatCompletion;
}

function isVisible(element) {
   try {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
   } catch (error) {
      return true;
   }
}

function isContentLike(element) {
   // Skip elements typically not containing user-visible content
   return !['META', 'LINK', 'HEAD', 'CANVAS', 'SVG', 'AUDIO', 'VIDEO', 'SOURCE', 'TRACK', 'PATH', 'SCRIPT', 'NOSCRIPT', 'STYLE', 'OBJECT', 'EMBED'].includes(element.tagName);
}
function hasSize(element) {
   try {
      const rect = element.getBoundingClientRect();
      return rect.height > 0 && rect.width > 0;
   } catch (error) {
      return false;
   }
}

function findElements(root, textNodes) {
   if (!isVisible(root)) return;
   if (root.nodeType === Node.TEXT_NODE) {
      if (root.textContent.trim().length > 0 && hasSize(root.parentNode)) {
         root.readTunerId = textNodes.length;
         textNodes.push(root);
      }
   } else if (isContentLike(root)) {
      root.childNodes.forEach(node => findElements(node, textNodes));
   }
}

// Add an overlay and a loading spinner to the page
function showLoadingOverlay() {
   let overlay = document.createElement('div');
   overlay.id = 'loadingOverlay';
   overlay.style.position = 'fixed';
   overlay.style.top = '0';
   overlay.style.left = '0';
   overlay.style.width = '100%';
   overlay.style.height = '100%';
   overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
   overlay.style.zIndex = '1000';
   overlay.style.display = 'flex';
   overlay.style.justifyContent = 'center';
   overlay.style.alignItems = 'center';
   overlay.style.fontSize = '24px';
   overlay.style.color = 'white';
   overlay.innerHTML = 'Loading... <div class="spinner"></div>';
   document.body.appendChild(overlay);
}

// Remove the overlay from the page
function hideLoadingOverlay() {
   let overlay = document.getElementById('loadingOverlay');
   if (overlay) {
      overlay.remove();
   }
}

// Example spinner CSS added via JavaScript for simplicity
function addSpinnerStyles() {
   const style = document.createElement('style');
   style.innerHTML = `
        .spinner {
            border: 16px solid #f3f3f3;
            border-top: 16px solid #3498db;
            border-radius: 50%;
            width: 120px;
            height: 120px;
            animation: spin 2s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
   document.head.appendChild(style);
}

const cachedProcessedTextsForAge = {};

// Function called when a new message is received
const messagesFromReactAppListener = (
   msg,
   sender,
   sendResponse,
) => {
   (async () => {
      const isDryRun = msg.model === "dryrun";

      // Ensure any info div added before are cleared out.
      document.querySelectorAll(".readingTunerInfoDiv").forEach(div => div.remove());

      console.log('[content.js]. ', msg.model, msg.age, msg.commit, new Date(), window.location.href);

      const textNodes = [];
      findElements(document, textNodes);
      const nodeForId = {};
      textNodes.forEach(node => nodeForId[node.readTunerId] = node);

      showLoadingOverlay();
      let processedTexts = [];
      if (isDryRun) {
         processedTexts = textNodes.map(textNode => ({ id: textNode.readTunerId, text: "!!!: " + textNode.textContent }));
      } else {
         processedTexts = cachedProcessedTextsForAge[msg.age];
         if (!processedTexts && msg.commit) {
            const origArticleJson = JSON.stringify(textNodes.map(node => ({ id: node.readTunerId, text: node.textContent })));
            const completionResult = await exampleChatCompletion(msg.apiKey, origArticleJson, msg.model, msg.age);
            processedTexts = JSON.parse(completionResult.choices[0].message.content).main_content;
            cachedProcessedTextsForAge[msg.age] = processedTexts;
         }
         if (!processedTexts) processedTexts = [];
         console.log(processedTexts);
      }
      processedTexts.forEach(element => {
         const textNode = textNodes[element.id];
         // console.log("convert", element.id, textNode.textContent);
         // console.log("=>", element.text);
         if (textNode) {
            const infoDiv = document.createElement('div');
            infoDiv.textContent = element.text;
            infoDiv.style.backgroundColor = '#f2f4f8'; // Light blue background
            infoDiv.style.border = '2px solid #99ccff'; // Soft blue border
            infoDiv.style.borderRadius = '10px'; // Rounded corners
            infoDiv.style.color = '#333333'; // Darker text for readability
            infoDiv.style.fontFamily = "'Arial', sans-serif"; // Clear, readable font
            infoDiv.style.fontSize = '18px'; // Larger text for easy reading
            infoDiv.style.padding = '15px'; // Spacing inside the div
            infoDiv.style.margin = '10px 0'; // Spacing outside the div
            infoDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; // Subtle shadow for 3D effect
            infoDiv.style.transition = 'all 0.3s ease'; // Smooth transition for interactive effects
            infoDiv.style.cursor = 'pointer'; // Cursor for interactive elements
            infoDiv.className = "readingTunerInfoDiv";
            textNode.parentNode.insertBefore(infoDiv, textNode);
         }
      });
      hideLoadingOverlay();

      // Prepare the response object with information about the site
      const response = {
         title: document.title,
      };

      sendResponse(response);
   })();
   return true;
}

/**
* Fired when a message is sent from either an extension process or a content script.
*/
if (!window.hasListener) {
   console.log("Add listener");
   chrome.runtime.onMessage.addListener(messagesFromReactAppListener);
   window.hasListener = true;
}
