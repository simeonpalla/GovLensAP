
# GovLens AP - Smart Grievance Intelligence Platform

GovLens AP is an AI-first civic grievance platform for Andhra Pradesh. It uses **Gemini 3** to process multimodal inputs (photos, voice, text), automatically classify responsible departments, estimate budgets, and provide real-time tracking for citizens.

## 🚀 Deployment

### 1. Local Setup
1. Clone this repository.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create `.streamlit/secrets.toml`:
   ```toml
   GEMINI_API_KEY = "your-api-key-here"
   ```
4. Run the app:
   ```bash
   streamlit run app.py
   ```

### 2. Streamlit Cloud
1. Push this code to a GitHub repository.
2. Connect the repo to [Streamlit Cloud](https://share.streamlit.io).
3. In App Settings -> Secrets, add your `GEMINI_API_KEY`.

## 🤖 Gemini 3 Integration
- **Multimodal Analysis**: Processes image + text context to classify issues.
- **Web Search Grounding**: Uses `googleSearch` to verify AP government schemes and resolution SOPs.
- **Audio Transcription**: Translates and transcribes citizen voice messages.
- **Reasoning**: Estimates resolution timelines and resource needs.

## 👨‍💼 Features
- **Citizen Portal**: Photo upload, Voice recording, Real-time Status tracking.
- **Officer Dashboard**: Queue management, Action logging, Analytics.
- **Persistence**: Local JSON storage (scalable to database).
