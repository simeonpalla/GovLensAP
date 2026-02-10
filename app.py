
import streamlit as st
import pandas as pd
from utils.storage import init_storage, load_complaints
import base64

# Page config
st.set_page_config(
    page_title="GovLens AP - Smart Grievance Platform",
    page_icon="🏛️",
    layout="wide"
)

# Initialize storage
init_storage()

# Load CSS
with open("styles/main.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# Hero Section
st.markdown("<h1 class='main-title'>🏛️ GovLens AP</h1>", unsafe_allow_html=True)
st.markdown("### Smart Grievance Intelligence Platform for Andhra Pradesh")

st.info("""
GovLens AP leverages Gemini 3 AI to streamline civic issue reporting. 
Upload a photo, record your voice, and let our AI categorize your grievance and route it to the right department instantly.
""")

# Metrics
complaints = load_complaints()
total = len(complaints)
pending = len([c for c in complaints if c['status'] != 'Resolved'])
resolved = total - pending

col1, col2, col3 = st.columns(3)
with col1:
    st.markdown(f"<div class='metric-card'><h4>Total Logged</h4><h2>{total}</h2></div>", unsafe_allow_html=True)
with col2:
    st.markdown(f"<div class='metric-card' style='border-left-color: #D4A574;'><h4>Under Process</h4><h2>{pending}</h2></div>", unsafe_allow_html=True)
with col3:
    st.markdown(f"<div class='metric-card' style='border-left-color: #6B9080;'><h4>Resolved</h4><h2>{resolved}</h2></div>", unsafe_allow_html=True)

st.divider()

# Navigation
st.markdown("### Quick Access")
nav_col1, nav_col2, nav_col3 = st.columns(3)

with nav_col1:
    if st.button("📝 Submit New Grievance", use_container_width=True):
        st.switch_page("pages/1_📝_Submit_Complaint.py")

with nav_col2:
    if st.button("📊 Track My Tracking", use_container_width=True):
        st.switch_page("pages/2_📊_My_Trackings.py")

with nav_col3:
    if st.button("👨‍💼 Officer Portal", use_container_width=True):
        st.switch_page("pages/3_👨‍💼_Officer_Dashboard.py")

# Featured Recent
if complaints:
    st.markdown("### 🔔 Recently Reported")
    recent = complaints[-3:][::-1]
    cols = st.columns(3)
    for i, c in enumerate(recent):
        with cols[i]:
            with st.container():
                st.markdown(f"<div class='complaint-card'>", unsafe_allow_html=True)
                if c.get('image'):
                    st.image(c['image'], use_column_width=True)
                st.write(f"**ID:** {c['id']}")
                st.write(f"**Status:** {c['status']}")
                st.write(c['description'][:100] + "...")
                st.markdown("</div>", unsafe_allow_html=True)
