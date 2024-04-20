/*global chrome*/
import './App.css';
import React, { useState, useEffect } from 'react';

function App() {
  const [age, setAge] = useState(8);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt3.5');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load API key from storage
  useEffect(() => {
    chrome.storage.local.get(['apiKey', 'model'], (result) => {
      if (result.apiKey) {
        setApiKey(result.apiKey);
      }
      if (result.model) {
        setModel(result.model);
      }
    });
  }, []);

  const handleApiKeyChange = (e) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    chrome.storage.local.set({ apiKey: newApiKey });
  };

  const handleModelChange = (e) => {
    const newModel = e.target.value;
    setModel(newModel);
    chrome.storage.local.set({ model: newModel });
  };

  function simplify() {
    chrome.tabs && chrome.tabs.query({
      active: true,
      currentWindow: true
    }, tabs => {
      chrome.tabs.sendMessage(
        tabs[0].id || 0,
        {
          type: 'GET_DOM',
          apiKey,
          model,
          age,
        },
        (response) => {
          console.log("received response");
        });
    });
  }

  return (
    <div className="App">
      <h1>Reading Tuner</h1>
      <label>
        Age:
        <input
          type="range"
          min="5"
          max="100"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <div id="agediv">
          {age}
        </div>
      </label>
      <button onClick={simplify}>Tune! ({model})</button>
      <div>
        <button onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? 'Hide details' : 'Details'}
        </button>
        {showAdvanced && (
          <div>
            <label>
              API Key <small>(<a href="https://platform.openai.com/api-keys">Please get an OpenAI API key if you don't have one</a>)</small>:
              <input type="password" value={apiKey} onChange={handleApiKeyChange} />
            </label>
            <label>
              Model:
              <select value={model} onChange={handleModelChange}>
                <option value="gpt-3.5-turbo">GPT-3.5 (Cheap but low quality)</option>
                <option value="gpt-4-turbo-preview">GPT-4 (Expensive but high quality)</option>
                <option value="dryrun">Dry Run (For testing)</option>
              </select>
            </label>
          </div>
        )}
      </div>
    </div >
  );
}

export default App;
