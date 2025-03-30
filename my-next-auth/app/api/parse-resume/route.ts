// app/api/parse-resume/route.js
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('resume');

        if (!file) {
            return NextResponse.json(
                { error: 'No resume file provided' },
                { status: 400 }
            );
        }

        // Read file as ArrayBuffer
        const bytes = await file.arrayBuffer();
        // Convert to base64
        const base64Data = Buffer.from(bytes).toString('base64');

        // Get model based on file type
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash"  // Use a PDF-capable model
        });

        // Create the text prompt
        const textPrompt = `You are an expert technical recruiter specializing in software development talent evaluation.
      
      This is a resume. Carefully analyze it and rate the candidate's skills using the FULL range of 1-10 in these areas, where:
      - 1-3 means novice/beginner level
      - 4-6 means intermediate level
      - 7-8 means advanced level
      - 9-10 means expert level
      
      Areas to rate:
      1. Backend Development - Evaluate server-side programming, API development, database skills
      2. Frontend Development - Evaluate UI/UX, JavaScript frameworks, responsive design skills
      3. Fullstack Development - Evaluate the overall balance and depth of both frontend and backend skills
      
      Also identify specific skills mentioned (programming languages, frameworks, tools) and rate each on a scale of 1-10 using the same rating scale guidelines.
      
      Be generous with your ratings if you see evidence of skill, and use the FULL range of the scale from 1-10.
      
      Format your response as a JSON object exactly like this:
      {
        "backend": 7,
        "frontend": 8, 
        "fullstack": 7,
        "skills": [
          {"name": "JavaScript", "level": 8},
          {"name": "React", "level": 9},
          {"name": "Node.js", "level": 7}
        ]
      }
      
      Respond with ONLY the JSON object, no explanations or other text.`;

        // Create content request with file data first, then text prompt
        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data
                }
            },
            {
                text: textPrompt
            }
        ]);

        const response = await result.response;
        const responseText = response.text();

        console.log("Raw LLM response:", responseText);

        // Parse the JSON from the response
        try {
            // Look for JSON content (sometimes Gemini adds surrounding text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            let jsonString;

            if (jsonMatch) {
                jsonString = jsonMatch[0];
            } else {
                const jsonStart = responseText.indexOf('{');
                const jsonEnd = responseText.lastIndexOf('}') + 1;

                if (jsonStart === -1 || jsonEnd === -1) {
                    console.error('Unable to find JSON in response');
                    return NextResponse.json(fallbackSkillsData());
                }

                jsonString = responseText.substring(jsonStart, jsonEnd);
            }

            // Try parsing the JSON
            const parsedData = JSON.parse(jsonString);

            // Validate the parsed data
            if (!parsedData.backend || !parsedData.frontend || !parsedData.fullstack) {
                console.error('Missing required fields in parsed data');
                return NextResponse.json(fallbackSkillsData());
            }

            // Ensure skills array exists
            if (!parsedData.skills || !Array.isArray(parsedData.skills)) {
                parsedData.skills = [];
            }

            return NextResponse.json(parsedData);
        } catch (error) {
            console.error('Error parsing JSON from LLM response:', error);
            return NextResponse.json(fallbackSkillsData());
        }
    } catch (error) {
        console.error('Error analyzing resume:', error);
        return NextResponse.json(
            { error: 'Failed to analyze resume: ' + error.message },
            { status: 500 }
        );
    }
}

function fallbackSkillsData() {
    // Return default data if the LLM fails
    return {
        backend: 5,
        frontend: 5,
        fullstack: 5,
        skills: [
            { name: "JavaScript", level: 5 },
            { name: "HTML/CSS", level: 5 }
        ]
    };
}