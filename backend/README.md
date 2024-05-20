# Trivia creator
Follow the instructions below to make it work.

## How to use it

### Install all the dependencies
`npm install`

### Create .env in root
Create the .env file in root and include your Google Gemini API key there with the variable 'GOOGLE_API_KEY' and the rest of variables present in .env.example: 
`GOOGLE_API_KEY="apiKeyHERE!!!!!"`
`TRIVIA_BASE_URL="https://www.marketwatch.com/economy-politics/calendar"`
`GEMINI_MODEL="gemini-1.5-pro-latest"`
`GEMINI_PRO="gemini-1.5-pro-latest"`
`GEMINI_FLASH="gemini-1.5-flash-latest"`

### Run the app
`npm run dev`

## Troubleshooting

The feature generating a question from an url is doing web scraping to extract the text from the web page shared. If you are running the app in Localhost then a Cross-Origin Resource Sharing (CORS) issue would occur. To fix the issue you would need to use the Firefox web browser and install the extension [CORS Everywhere](https://addons.mozilla.org/en-US/firefox/addon/cors-everywhere/).

## Tech behind

This app is using Google AI API for connecting to Gemini Pro 1.5 LLM.

## Copyrights

All copyrights reserved to Dev Bambino user, 2024. The commercial use of the code provided in this repository is forbidden without express authorization.