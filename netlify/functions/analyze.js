// This is the complete and final code for your secure middleman (the proxy)
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }
  try {
    const { jobDescription, resume } = JSON.parse(event.body);
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API key not configured on the server.' }),
      };
    }
    const prompt = `
      You are a highly advanced AI-powered Applicant Tracking System (ATS). Your primary function is to analyze a candidate's CV against a provided job description and generate a detailed, structured report in JSON format. Do not include any introductory text or markdown formatting in your response.
      Job Description: --- ${jobDescription} ---
      Candidate's CV: --- ${resume} ---
      Analyze the CV against the Job Description and provide the report.
    `;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            matchScore: { type: 'NUMBER' },
            summary: { type: 'STRING' },
            keywordAnalysis: {
              type: 'OBJECT',
              properties: {
                matchingKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
                missingKeywords: { type: 'ARRAY', items: { type: 'STRING' } },
              },
            },
            experienceAnalysis: { type: 'STRING' },
            educationAnalysis: { type: 'STRING' },
            suggestions: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ["matchScore", "summary", "keywordAnalysis", "experienceAnalysis", "educationAnalysis", "suggestions"]
        },
      },
    };
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error:', errorText);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Google API Error: ${errorText}` }),
      };
    }
    const data = await response.json();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An internal error occurred.' }),
    };
  }
};
