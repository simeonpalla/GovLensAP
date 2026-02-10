
import streamlit as st
import pandas as pd
import plotly.express as px
from utils.storage import load_complaints, update_complaint_status

st.set_page_config(page_title="Officer Dashboard - GovLens AP", page_icon="👨‍💼", layout="wide")

# Load CSS
with open("styles/main.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

st.title("👨‍💼 Admin & Officer Portal")

tab1, tab2 = st.tabs(["📋 Complaint Queue", "📈 Intelligence Dashboard"])

complaints = load_complaints()

with tab1:
    if not complaints:
        st.info("No grievances logged yet.")
    else:
        # Filters
        st.write("### 🔍 Filters")
        f_col1, f_col2, f_col3 = st.columns(3)
        
        all_depts = list(set([c['analysis']['primaryDepartment'] for c in complaints]))
        dept_f = f_col1.multiselect("Department", all_depts, default=all_depts)
        
        status_f = f_col2.multiselect("Status", ["Submitted", "Assigned", "Under Review", "Resolved"], default=["Submitted", "Assigned", "Under Review"])
        
        # Apply filters
        filtered = [c for c in complaints if c['analysis']['primaryDepartment'] in dept_f and c['status'] in status_f]
        
        st.write(f"Displaying **{len(filtered)}** active grievances.")
        
        for c in filtered[::-1]:
            with st.expander(f"📌 {c['id']} | {c['analysis']['issueType']} | {c['location']}"):
                exp_col1, exp_col2 = st.columns([1, 2])
                
                with exp_col1:
                    st.image(c['image'], use_column_width=True)
                    st.write(f"**AI Severity Score:** {c['analysis']['severity']}")
                    st.write(f"**Resource Est:** {c['analysis']['estimatedCost']}")
                
                with exp_col2:
                    st.write(f"**Citizen Description:** {c['description']}")
                    st.write(f"**AI Reasoning:** {c['analysis']['reasoning']}")
                    
                    st.divider()
                    st.write("### 🛠️ Take Action")
                    action_col1, action_col2 = st.columns(2)
                    
                    new_action = action_col1.selectbox("Next Step", ["Assign to Team", "Forward to Department", "Request Extra Funds", "Mark Resolved"], key=f"act_{c['id']}")
                    notes = action_col2.text_area("Internal Notes", placeholder="Reason for action...", key=f"notes_{c['id']}")
                    
                    if st.button("Update Status", key=f"btn_{c['id']}"):
                        update_complaint_status(c['id'], new_action, notes, officer_name="Officer X")
                        st.success("Status Updated Successfully!")
                        st.rerun()

with tab2:
    if not complaints:
        st.info("Analytics will populate as complaints arrive.")
    else:
        st.header("Intelligence Overview")
        
        # Data Prep
        df = pd.DataFrame([
            {
                "id": c['id'],
                "department": c['analysis']['primaryDepartment'],
                "severity": c['analysis']['severity'],
                "status": c['status'],
                "cost": float(c['analysis']['estimatedCost'].replace('₹', '').replace(',', '')) if '₹' in c['analysis']['estimatedCost'] else 0
            } for c in complaints
        ])
        
        stat_col1, stat_col2, stat_col3 = st.columns(3)
        stat_col1.metric("Average Severity", "High")
        stat_col2.metric("Projected Total Budget", f"₹{df['cost'].sum():,.2f}")
        stat_col3.metric("Critical Bottlenecks", len(df[df['severity'] == 'Critical']))
        
        # Charts
        c1, c2 = st.columns(2)
        
        with c1:
            fig_dept = px.bar(df.groupby('department').size().reset_index(name='count'), x='department', y='count', title="Grievances by Department")
            st.plotly_chart(fig_dept, use_container_width=True)
            
        with c2:
            fig_sev = px.pie(df, names='severity', title="Severity Distribution", hole=0.4)
            st.plotly_chart(fig_sev, use_container_width=True)
            
        fig_status = px.line(df.index, y=df.cost.cumsum(), title="Budget Allocation Trend")
        st.plotly_chart(fig_status, use_container_width=True)
