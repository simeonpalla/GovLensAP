
import google.generativeai as genai
import streamlit as st
import base64
import json

def get_ai_client():
    """Initialize Gemini client using API key from secrets or env"""
    api_key = st.secrets.get("GEMINI_API_KEY") or os.environ.get("API_KEY")
    if not api_key:
        st.error("⚠️ Gemini API key not found! Please set GEMINI_API_KEY in secrets.toml.")
        st.stop()
    return genai.GoogleGenerativeAI(api_key=api_key)

def analyze_complaint(image_bytes, description, location):
    """
    Analyze complaint using Gemini 3 with web search grounding
    """
    client = get_ai_client()
    
    # Base64 encode image for API
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    
    prompt = f"""
    Analyze this civic infrastructure complaint from Andhra Pradesh, India.
    
    LOCATION: {location}
    DESCRIPTION: {description}
    
    Perform the following:
    1. Identify the responsible AP government department.
    2. Estimate a typical budget required for this fix in Rupees.
    3. Determine the severity (Low, Medium, High, Critical).
    4. Provide reasoning based on impact to public safety.
    5. Search for current AP government schemes related to this issue.
    
    Respond STRICTLY in JSON format with the following keys:
    primaryDepartment, secondaryDepartments, issueType, severity, fundingRequired (bool), estimatedCost, permissionsNeeded (list), interdeptCoordination (bool), estimatedTimeline, reasoning.
    """
    
    try:
        response = client.models.generateContent(
            model='gemini-3-flash-preview',
            contents=[
                {
                    "parts": [
                        {"inlineData": {"mimeType": "image/jpeg", "data": image_b64}},
                        {"text": prompt}
                    ]
                }
            ],
            config={
                "tools": [{"googleSearch": {}}],
                "responseMimeType": "application/json"
            }
        )
        
        # Extract JSON from response.text
        # response.text is directly accessible in newer SDK versions
        result = json.loads(response.text.strip())
        
        # Add grounding metadata if available
        if hasattr(response, 'candidates') and response.candidates:
            metadata = getattr(response.candidates[0], 'groundingMetadata', None)
            if metadata:
                result['groundingSources'] = getattr(metadata, 'groundingChunks', [])
        
        return result
        
    except Exception as e:
        st.error(f"AI Analysis failed: {str(e)}")
        # Fallback response
        return {
            "primaryDepartment": "Roads & Buildings",
            "secondaryDepartments": [],
            "issueType": "Infrastructure Issue",
            "severity": "Medium",
            "fundingRequired": True,
            "estimatedCost": "₹50,000",
            "permissionsNeeded": ["Local Approval"],
            "interdeptCoordination": False,
            "estimatedTimeline": "14 days",
            "reasoning": "Fallback analysis used due to API error."
        }

def transcribe_audio(audio_bytes):
    """Transcribe audio using Gemini"""
    client = get_ai_client()
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
    
    try:
        response = client.models.generateContent(
            model='gemini-3-flash-preview',
            contents=[
                {
                    "parts": [
                        {"inlineData": {"mimeType": "audio/wav", "data": audio_b64}},
                        {"text": "Accurately transcribe the following audio. The speaker might be speaking in English or Telugu. Provide an English translation if it is in Telugu."}
                    ]
                }
            ]
        )
        return response.text
    except Exception as e:
        return f"Transcription error: {str(e)}"
