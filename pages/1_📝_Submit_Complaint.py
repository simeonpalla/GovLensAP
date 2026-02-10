
import streamlit as st
from utils.gemini_service import analyze_complaint, transcribe_audio
from utils.storage import save_complaint
from audio_recorder_streamlit import audio_recorder
from PIL import Image
import io
import base64
import uuid
from datetime import datetime

st.set_page_config(page_title="Submit Complaint - GovLens AP", page_icon="📝", layout="wide")

# Load CSS
with open("styles/main.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

st.title("📝 Submit New Grievance")
st.write("Provide details of the civic issue. AI will analyze and route it for you.")

col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("📸 Visual Evidence")
    uploaded_file = st.file_uploader("Upload or take a photo of the issue", type=["jpg", "jpeg", "png"])
    
    if uploaded_file:
        st.image(uploaded_file, caption="Preview", use_column_width=True)
        image_bytes = uploaded_file.getvalue()

    st.subheader("🎤 Voice Description")
    st.write("Record in English or Telugu")
    audio_bytes = audio_recorder(
        text="Click to record",
        recording_color="#e8b62c",
        neutral_color="#5B7C99",
        icon_size="2x"
    )

with col2:
    st.subheader("✍️ Context Details")
    description = st.text_area("Description", placeholder="Describe the issue in detail...")
    location = st.text_input("Location", placeholder="E.g. Ward 12, Visakhapatnam")
    
    # Transcription logic
    if audio_bytes and not description:
        with st.spinner("Transcribing audio..."):
            transcript = transcribe_audio(audio_bytes)
            st.session_state.transcript = transcript
            st.info(f"AI Transcription: {transcript}")
            description = transcript

    if st.button("🚀 Analyze Grievance", use_container_width=True):
        if not uploaded_file:
            st.error("Please upload a photo of the issue.")
        elif not (description or audio_bytes):
            st.error("Please provide a description (text or voice).")
        else:
            with st.spinner("🤖 AI is analyzing your complaint..."):
                analysis = analyze_complaint(image_bytes, description, location)
                st.session_state.current_analysis = analysis
                st.session_state.image_bytes = image_bytes
                st.session_state.description = description
                st.session_state.location = location

# Result Display
if 'current_analysis' in st.session_state:
    res = st.session_state.current_analysis
    st.divider()
    st.success("Analysis Complete!")
    
    with st.container():
        st.markdown("### 📊 AI Analysis Results")
        res_col1, res_col2 = st.columns(2)
        
        with res_col1:
            st.write(f"**🏢 Responsible Dept:** {res['primaryDepartment']}")
            st.write(f"**📊 Issue Type:** {res['issueType']}")
            st.write(f"**💰 Est. Budget:** {res['estimatedCost']}")
            
        with res_col2:
            st.write(f"**⚠️ Severity:** {res['severity']}")
            st.write(f"**⏱️ Resolution Goal:** {res['estimatedTimeline']}")
            st.write(f"**📋 Approvals Needed:** {', '.join(res['permissionsNeeded'])}")
            
        st.info(f"**🧠 AI Reasoning:** {res['reasoning']}")

        if st.button("✅ Confirm Submission", type="primary", use_container_width=True):
            cid = f"AP-{datetime.now().year}-{str(uuid.uuid4())[:6].upper()}"
            
            # Convert image to b64 for storage
            image_b64 = f"data:image/jpeg;base64,{base64.b64encode(st.session_state.image_bytes).decode('utf-8')}"
            
            save_complaint(
                cid, 
                res, 
                image_b64, 
                st.session_state.description, 
                st.session_state.location
            )
            
            st.balloons()
            st.success(f"Complaint Submitted Successfully! Tracking ID: **{cid}**")
            st.write("Please note down this ID to track status.")
            
            # Clear state
            del st.session_state.current_analysis
            if st.button("Back to Home"):
                st.switch_page("app.py")
