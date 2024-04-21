# readingtuner

A simple chrome extension to make web articles readable by kids.

# Chrome extension

The popup page is React based. I followed instructions in this blog to set this up: https://blog.logrocket.com/creating-chrome-extension-react-typescript/

For building locally:

```
# Make sure you're in the extensions directory
cd readingtunerex

# Then build.
npm run build
```

You can then go to chrome://extensions and select the `readingtunerex/build` directory by selecting "Add unpackedextension".

The extension is also currently under review in the chrome extension web store.

# Use of Open AI API

Because I don't want to pay for your use of OpenAI :X, you need to set up your own OpenAI API.

1. Go to the API keys page (creating an account if you don't have one, etc): https://platform.openai.com/api-keys

2. Create a user API key.

3. Copy the secret key to in the extension popup > Details > API Key.

Note that the key is only stored locally on your browser- you can check the code.
