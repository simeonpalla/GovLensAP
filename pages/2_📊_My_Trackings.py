
import streamlit as st
from utils.storage import get_complaint_by_id

st.set_page_config(page_title="Track Status - GovLens AP", page_icon="📊", layout="wide")

# Load CSS
with open("styles/main.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

st.title("📊 Track Your Grievance")

complaint_id = st.text_input("Enter your Tracking ID (e.g. AP-2026-XXXX)")

if complaint_id:
    complaint = get_complaint_by_id(complaint_id)
    
    if complaint:
        st.divider()
        col1, col2 = st.columns([1, 2])
        
        with col1:
            st.image(complaint['image'], use_column_width=True)
            st.markdown(f"**Status:** <span class='badge'>{complaint['status']}</span>", unsafe_allow_html=True)
            st.write(f"**Department:** {complaint['analysis']['primaryDepartment']}")
            st.write(f"**Severity:** {complaint['analysis']['severity']}")
            
        with col2:
            st.subheader("📋 Issue Summary")
            st.write(f"**Location:** {complaint['location']}")
            st.write(f"**Description:** {complaint['description']}")
            
            st.subheader("📍 Status Timeline")
            for event in complaint['timeline']:
                st.markdown(f"""
                <div class='timeline-item'>
                    <strong>{event['stage']}</strong> - {event['timestamp'][:16].replace('T', ' ')}<br/>
                    <small>{event['action']}</small>
                    {f"<br/><em>Officer: {event['officer']}</em>" if event['officer'] else ""}
                </div>
                """, unsafe_allow_html=True)
                
            st.subheader("📅 Estimated Completion")
            st.write(f"Targeting resolution within **{complaint['analysis']['estimatedTimeline']}**")
    else:
        st.error("Tracking ID not found. Please verify the ID and try again.")
