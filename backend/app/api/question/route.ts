import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { triviaPeriod } = await req.json();

    const modelVersion = process.env.GEMINI_MODEL as string;
    const triviaBaseUrl = process.env.TRIVIA_BASE_URL as string;
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);

    const generationConfig = { temperature: 0.8, maxOutputTokens: 700 };

    const period = triviaPeriod;
    let eventPeriod = "happening this week";
    if(period == "nextweek"){
        eventPeriod = "happening in the next week";
    } else if(period == "lastweek"){
        eventPeriod = "that happened last week";
    }

    const systemPrompt = `You are a senior financial advisor and social network influencer with html knowledge. 
    The user will provide a html code with the calendar for Major U.S. Economic Reports & Fed Speakers (presented as tables with the fields: 'Time' with the time at U.S. Eastern time and date when the event is taking place, 'Report' with the description of the event taking place and an url/link with more information about it, 'Period' with the period of time to which the event applies, 'Actual' with the actual value reported after the event took place, 'Median Forecast' with the forecasted value calculated by financial analysts, 'Previous' with the previous value known from the event to use it as a reference) that you have to use to extract information about what is happening in the financial markets.
    Using the html code first you MUST identify all the events inside the tables, second you must identify what is the MOST relevant AND important event ${eventPeriod} from that list of events(for example, a company announcing earnings, FED announcement, announcement of reports about inflation or other macroeconomics variables related to the economy's performance) which could have the biggest impact in the economy and stock markets, and third you have to create a trivia using the event info. 
    The trivia must have the following structure:
    1. A 'question' field with a question regarding the event that is happenning providing also the previous outcome of the event(which is available on the 'PREVIOUS' column inside the table), the question should be written in future tense.
    2. A 'answers' array with the list of the possible outcomes as answers from the trivia, give at least three options if possible.
    3. A 'context' field with a complete/clear description and context of the event happening to help the user to understand what is the financial event happening so he would be able to pick an answer.
    4. A 'impact' field that should include a complete/clear description of what could be the impact that the event could have on the economy and the financial markets(stock markets, commodities, ETFs, cryptocurrencies, etc...) depending on the outcomes of the event, explaining what would happen for each possible answer.
    5. A 'deadline' field with the date and time when the event is taking place in a 'MM/DD/YY-HH:MM' at U.S. Eastern time.
    6. A 'concepts' array with a list of all the financial words/concepts and theirs explanations that could be new for a user without any financial knowledge.
    7. A 'urls' array with the urls/links to webpages that could be relevant for understanding better the question, this should be extracted from the html code.
    The trivia created MUST have all the fields previously described.
    Explain it all in a way that an 7th grader(without any proper financial knowledge) can easily grasp. Give all the details you consider appropiated for making the user understand properly all the concepts.
    YOU MUST RETURN the response as a JSON object that contains the structure previously described. DON'T ADD ANY EXTRA TEXT BESIDES THE JSON OBJECT. THE JSON FILE MUST HAVE THE PROPER JSON STRUCTURE FOR THE OBJECTS AND ARRAYS ALWAYS INCLUDING THE STARTING AND ENDING SPECIAL CHARACTERS: '{','}','[',']'. THE RESPONSES MUST BE ALWAYS WRITTEN IN ENGLISH.
    The json object must also include a "status" field with value true, a "code" field with value 200, and a "error" field blank.
    If the a trivia question is not possible to be generated from the html code then the "status" field must return false, the "code" field must return 404, and the "error" field should have the text "In this moment It is not possible to create a trivia question for the events ${eventPeriod}, please try again later".
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
                        text: `This is the html code you need to use: 
                        <html><body>${dataScrapingBody}</body></html>`,
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
        //console.log("error:", error);
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