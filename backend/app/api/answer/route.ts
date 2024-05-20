import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { triviaJson } = await req.json();

    const modelVersion = process.env.GEMINI_MODEL as string;
    const triviaBaseUrl = process.env.TRIVIA_BASE_URL as string;
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

    const generationConfig = { temperature: 0.8, maxOutputTokens: 700 };

    let systemPrompt = `
    You are a senior financial advisor and social network influencer with html knowledge. 
    The user will provide a html code with the calendar for Major U.S. Economic Reports & Fed Speakers (presented as tables with the fields: 'Time' with the time at U.S. Eastern time and date when the event is taking place, 'Report' with the description of the event taking place and an url/link with more information about it, 'Period' with the period of time to which the event applies, 'Actual' with the actual value reported after the event took place, 'Median Forecast' with the forecasted value calculated by financial analysts, 'Previous' with the previous value known from the event to use it as a reference) that you have to use to extract information about what is currently happening in the financial markets.
    The user will also provide a JSON file with the details of a trivia question you created before, please answer the trivia question using the information available in the html code.
    The answer should have the following structure :
    1. A 'answer" field where you need to choose the right answer from the trivia question created, which is available always on the 'ACTUAL' column inside the table.
    2. A 'explanation' field where you need to give complete/clear description on what happened and suggest a possible explanation on why this was the outcome of the event.
    3. A 'impact' field giving complete/clear description and explanation on what will happen with the economy and the financial markets due to the outcome from the event in the trivia question.
    4. A 'suggestions' field where you need to give suggestions on what to do regarding retail investing, for example if it is good time to buy, sell, or hold stocks from any particular sector fo the economy based on the trivia event's outcome.
    The trivia answer created MUST have all the fields previously described.
    Explain it all in a way that an 7th grader(without any proper financial knowledge) can easily grasp. Give all the details you consider appropiated for making the user understand properly all the concepts.
    YOU MUST RETURN the response as a JSON object that contains the structure previously described. DON'T ADD ANY EXTRA TEXT BESIDES THE JSON OBJECT. THE JSON FILE MUST HAVE THE PROPER JSON STRUCTURE FOR THE OBJECTS AND ARRAYS ALWAYS INCLUDING THE STARTING AND ENDING SPECIAL CHARACTERS: '{','}','[',']'. THE RESPONSES MUST BE ALWAYS WRITTEN IN ENGLISH.
    The json object must also include a "status" field with value true, a "code" field with value 200, and a "error" field blank.
    If the answer to the trivia is not available in the html code yet(that is there is no value on the 'ACTUAL' column inside the table) then the "status" field must return false, the "code" field must return 404, and the "error" field should have the text "Answer to the trivia is still not available, please try again later".
    `;

    try {
        const responseScraping = await fetch(triviaBaseUrl);
        const dataScraping = await responseScraping.text();
        const bodyStart = dataScraping.indexOf('<div class="component component--module page-header">');
        const bodyEnd = dataScraping.indexOf('<div class="component component--layout layout--C1">');
        const dataScrapingBody = dataScraping.substring(bodyStart, bodyEnd);

        const messages = [
            {
                role: "model", parts: [
                    {
                        text: systemPrompt,
                    },
                ],
            },
            {
                role: "user", parts: [
                    {
                        text: `This is the JSON file you need to use: 
                        ${triviaJson}`,
                    },
                ],
            },
            {
                role: "user", parts: [
                    {
                        text: `This is the html code you need to use: 
                        ${dataScrapingBody}`,
                    },
                ],
            },
        ];

        const model = genAI.getGenerativeModel({ model: modelVersion, generationConfig: generationConfig });
        const result = await model.generateContent({ contents: messages });
        const response = await result.response;
        const text = response.text();
        return NextResponse.json({
            text
        });
    } catch (error: any) {
        //console.log("error:",error);
        if (error) {
            let text = "Unable to process this request. Please contact the support team and show this error: " + error.message;
            if (error.code == "content_filter") {
                text = "This kind of content is not allowed in this app. Reason: " + error.message;;
            }
            return NextResponse.json({
                text: text
            });
        }
        return NextResponse.json({
            text: "Unable to process the prompt. Please contact the support team and show this error: " + error
        });
    }
}