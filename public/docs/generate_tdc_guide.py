from reportlab.lib.pagesizes import A4, letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, Table, TableStyle
from reportlab.lib.units import inch, cm
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
import urllib.request
import tempfile
import os
import time

def get_logo():
    """Try to get the logo with retries and fallback"""
    logo_url = "https://i.imgur.com/VyBIzSl.png"
    max_retries = 3
    retry_delay = 2  # seconds
    
    # First check if we have a local copy
    local_logo = "logo.png"
    if os.path.exists(local_logo):
        return Image(local_logo)
    
    # Try to download with retries
    for attempt in range(max_retries):
        try:
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp:
                urllib.request.urlretrieve(logo_url, temp.name)
                logo = Image(temp.name)
                logo.drawHeight = 1.5 * inch
                logo.drawWidth = 2.5 * inch
                return logo
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(retry_delay)
                continue
            else:
                print("Could not load logo, proceeding without it")
                return None

class ThunderDragonGuide(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(filename, **kw)
        page_width, page_height = letter
        frame = Frame(
            self.leftMargin,
            self.bottomMargin,
            page_width - self.leftMargin - self.rightMargin,
            page_height - self.bottomMargin - self.topMargin,
            id='normal'
        )
        template = PageTemplate(
            id='with_background',
            frames=frame,
            onPage=self.add_background
        )
        self.addPageTemplates([template])
    
    def add_background(self, canvas, doc):
        canvas.setFillColor(colors.black)
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True)

def generate_thunder_dragon_club_guide():
    # Create a PDF document with custom template
    doc = ThunderDragonGuide(
        "Thunder_Dragon_Club_User_Guide.pdf",
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Colors from CSS
    primary_color = colors.HexColor('#8B0000')  # Dark red
    secondary_color = colors.HexColor('#4A0404')  # Darker red
    text_color = colors.white
    background_color = colors.black
    accent_color = colors.HexColor('#FFD700')  # Gold
    
    # Get the standard styles
    styles = getSampleStyleSheet()
    
    # Modify existing styles instead of adding new ones
    styles["Title"].textColor = accent_color
    styles["Title"].fontSize = 24
    styles["Title"].alignment = TA_CENTER
    styles["Title"].spaceAfter = 20
    
    styles["Heading1"].textColor = accent_color
    styles["Heading1"].fontSize = 20
    styles["Heading1"].spaceAfter = 12
    
    styles["Heading2"].textColor = accent_color
    styles["Heading2"].fontSize = 16
    styles["Heading2"].spaceAfter = 8
    
    styles["Normal"].textColor = text_color
    styles["Normal"].fontSize = 12
    styles["Normal"].spaceAfter = 6
    
    # Add custom styles with unique names
    styles.add(ParagraphStyle(
        name='CustomBullet',
        fontName='Helvetica',
        fontSize=12,
        spaceAfter=6,
        leftIndent=20,
        textColor=text_color,
        bulletIndent=10,
        bulletText='•'
    ))
    
    # Build the content
    elements = []
    
    # Try to add logo
    logo = get_logo()
    if logo:
        elements.append(logo)
        elements.append(Spacer(1, 0.5 * inch))
    
    # Rest of your existing content...
    elements.append(Paragraph("Thunder Dragon Club", styles["Title"]))
    elements.append(Paragraph("User Guide", styles["Title"]))
    elements.append(Spacer(1, 0.5 * inch))
    
    # Introduction
    elements.append(Paragraph("Introduction", styles["Heading1"]))
    elements.append(Paragraph(
        "The Thunder Dragon Club (TDC) is a loyalty program designed for Bhutanese citizens "
        "to gain more affordable access to wine and create loyalty to Bhutan Wine Company (BWC). "
        "This program helps generate an extensive customer database for marketing wine and events "
        "at the BWC wine bar for the local population.",
        styles["Normal"]
    ))
    elements.append(Paragraph(
        "The program provides different incentives for trade and non-trade members to emphasize "
        "the importance of trade guests to our business. Trade members receive more points per "
        "ngultrum spent and more points per referral, which can be redeemed at the wine bar.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Login Instructions
    elements.append(Paragraph("Logging In", styles["Heading2"]))
    elements.append(Paragraph(
        "To begin using the Thunder Dragon Club management system, navigate to the login page "
        "and enter your administrator credentials. The system will authenticate you and redirect "
        "to the main dashboard upon successful login.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Dashboard Overview
    elements.append(Paragraph("Dashboard Overview", styles["Heading2"]))
    elements.append(Paragraph(
        "The dashboard provides access to all management functions through a navigation menu: "
        "Members, Transactions, Referrals, Redemptions, and Configuration. Each section allows "
        "you to manage different aspects of the loyalty program.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    elements.append(PageBreak())
    
    # 1. Adding Members
    elements.append(Paragraph("1. Adding Members", styles["Heading1"]))
    elements.append(Paragraph(
        "The Members section allows you to add new club members and search for existing ones. "
        "Adding members properly is crucial for tracking their activities and rewards.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To add a new member:", styles["Heading2"]))
    elements.append(Paragraph("1. Navigate to the Members tab in the dashboard", styles["CustomBullet"]))
    elements.append(Paragraph("2. Click the \"Add New Member\" button", styles["CustomBullet"]))
    elements.append(Paragraph("3. Fill in the required information:", styles["CustomBullet"]))
    elements.append(Paragraph("• First Name", styles["CustomBullet"]))
    elements.append(Paragraph("• Last Name", styles["CustomBullet"]))
    elements.append(Paragraph("• Phone Number", styles["CustomBullet"]))
    elements.append(Paragraph("• Email Address", styles["CustomBullet"]))
    elements.append(Paragraph("4. Select the appropriate Member Type:", styles["CustomBullet"]))
    elements.append(Paragraph("• Non-Trade - Regular customers", styles["CustomBullet"]))
    elements.append(Paragraph("• Trade - Industry professionals (restaurants, hotels, distributors)", styles["CustomBullet"]))
    elements.append(Paragraph("5. Click \"Add Member\" to save the information", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Member Types:", styles["Heading2"]))
    elements.append(Paragraph(
        "The system distinguishes between two types of members, each with different benefits:",
        styles["Normal"]
    ))
    
    # Create a table for member types
    member_data = [
        ['Member Type', 'Description', 'Benefits'],
        ['Non-Trade', 'Regular customers', '• Standard points per ngultrum\n• Standard referral bonus'],
        ['Trade', 'Industry professionals', '• Enhanced points per ngultrum\n• Enhanced referral bonus\n• Special trade events']
    ]
    
    member_table = Table(member_data, colWidths=[2*inch, 2*inch, 2.5*inch])
    member_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), accent_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#333333')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    
    elements.append(member_table)
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(PageBreak())
    
    # 2. Member Transactions
    elements.append(Paragraph("2. Member Transactions", styles["Heading1"]))
    elements.append(Paragraph(
        "Recording transactions is essential for calculating points earned by members. "
        "The transaction management system allows you to track purchases and award points based on spending.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To record a transaction:", styles["Heading2"]))
    elements.append(Paragraph("1. Navigate to the Transactions tab in the dashboard", styles["CustomBullet"]))
    elements.append(Paragraph("2. Search for the member using their name or email", styles["CustomBullet"]))
    elements.append(Paragraph("3. Select the correct member from the search results", styles["CustomBullet"]))
    elements.append(Paragraph("4. Enter the transaction details:", styles["CustomBullet"]))
    elements.append(Paragraph("• Amount (in Ngultrum)", styles["CustomBullet"]))
    elements.append(Paragraph("• Date of purchase", styles["CustomBullet"]))
    elements.append(Paragraph("• Notes (optional)", styles["CustomBullet"]))
    elements.append(Paragraph("5. Verify the points to be earned", styles["CustomBullet"]))
    elements.append(Paragraph("6. Click \"Record Transaction\" to save", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Points Calculation:", styles["Heading2"]))
    elements.append(Paragraph(
        "Points are automatically calculated based on the transaction amount and member type. "
        "The current configuration determines how many points are earned per ngultrum spent:",
        styles["Normal"]
    ))
    elements.append(Paragraph("• Non-Trade members: Points rate × Amount spent", styles["CustomBullet"]))
    elements.append(Paragraph("• Trade members: Enhanced points rate × Amount spent", styles["CustomBullet"]))
    elements.append(Paragraph(
        "The points preview display shows exactly how many points will be awarded before "
        "you submit the transaction.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(PageBreak())
    
    # 3. Points Redemption
    elements.append(Paragraph("3. Points Redemption", styles["Heading1"]))
    elements.append(Paragraph(
        "Members can redeem their accumulated points for products, discounts, or special offers. "
        "The redemption system allows you to track what members are redeeming their points for.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To process a redemption:", styles["Heading2"]))
    elements.append(Paragraph("1. Navigate to the Redemptions tab in the dashboard", styles["CustomBullet"]))
    elements.append(Paragraph("2. Search for the member using their name or email", styles["CustomBullet"]))
    elements.append(Paragraph("3. Select the correct member from the search results", styles["CustomBullet"]))
    elements.append(Paragraph("4. Enter the redemption details:", styles["CustomBullet"]))
    elements.append(Paragraph("• Points to redeem", styles["CustomBullet"]))
    elements.append(Paragraph("• Description of what they're redeeming for", styles["CustomBullet"]))
    elements.append(Paragraph("5. Click \"Redeem Points\" to process the redemption", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Redemption Guidelines:", styles["Heading2"]))
    elements.append(Paragraph(
        "When processing redemptions, keep in mind the following guidelines:",
        styles["Normal"]
    ))
    elements.append(Paragraph(
        "• Members can only redeem points they have accumulated", styles["CustomBullet"]))
    elements.append(Paragraph(
        "• Points should be redeemed at a reasonable value ratio", styles["CustomBullet"]))
    elements.append(Paragraph(
        "• All redemptions should be properly documented with a description", styles["CustomBullet"]))
    elements.append(Paragraph(
        "• Consider special promotions for point redemption to encourage loyalty", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(PageBreak())
    
    # 4. Referral Management
    elements.append(Paragraph("4. Referral Management", styles["Heading1"]))
    elements.append(Paragraph(
        "The referral program allows existing members to introduce new customers to BWC. "
        "Members receive bonus points when someone they refer becomes a new member.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("The referral process:", styles["Heading2"]))
    elements.append(Paragraph(
        "1. BWC provides referral cards to members who want to refer others", styles["CustomBullet"]))
    elements.append(Paragraph(
        "2. The referral card can be redeemed for a free 2-3oz tasting pour at the BWC wine bar", styles["CustomBullet"]))
    elements.append(Paragraph(
        "3. When a referred person visits, attempt to upsell them on other items", styles["CustomBullet"]))
    elements.append(Paragraph(
        "4. Collect their information to add them as a new member", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To record a successful referral:", styles["Heading2"]))
    elements.append(Paragraph("1. Navigate to the Referrals tab in the dashboard", styles["CustomBullet"]))
    elements.append(Paragraph("2. Search for the referring member using their name or email", styles["CustomBullet"]))
    elements.append(Paragraph("3. Select the correct referring member", styles["CustomBullet"]))
    elements.append(Paragraph("4. Enter the new member's details:", styles["CustomBullet"]))
    elements.append(Paragraph("• First Name", styles["CustomBullet"]))
    elements.append(Paragraph("• Last Name", styles["CustomBullet"]))
    elements.append(Paragraph("• Email Address", styles["CustomBullet"]))
    elements.append(Paragraph("• Phone Number", styles["CustomBullet"]))
    elements.append(Paragraph("5. Click \"Submit Referral\" to process", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Referral Points:", styles["Heading2"]))
    elements.append(Paragraph(
        "Referral points are automatically calculated based on the member type:",
        styles["Normal"]
    ))
    elements.append(Paragraph("• Non-Trade members receive the standard referral bonus", styles["CustomBullet"]))
    elements.append(Paragraph("• Trade members receive an enhanced referral bonus", styles["CustomBullet"]))
    elements.append(Paragraph(
        "The referring member will see these points added to their account immediately upon "
        "successful processing of the referral.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(PageBreak())
    
    # 5. Member Details
    elements.append(Paragraph("5. Member Details", styles["Heading1"]))
    elements.append(Paragraph(
        "The member details view provides comprehensive information about a member, "
        "including their transaction history, redemption history, and referral activity.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To access member details:", styles["Heading2"]))
    elements.append(Paragraph("1. Navigate to the Members tab in the dashboard", styles["CustomBullet"]))
    elements.append(Paragraph("2. Search for the member using their name or email", styles["CustomBullet"]))
    elements.append(Paragraph("3. Click \"View Details\" next to the correct member", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Member details include:", styles["Heading2"]))
    elements.append(Paragraph("Basic Information", styles["Heading2"]))
    elements.append(Paragraph("• Name, email, phone, and member type", styles["CustomBullet"]))
    elements.append(Paragraph("• Current points balance", styles["CustomBullet"]))
    elements.append(Paragraph("• Membership date", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.1 * inch))
    
    elements.append(Paragraph("Activity Summary", styles["Heading2"]))
    elements.append(Paragraph("• Total amount spent", styles["CustomBullet"]))
    elements.append(Paragraph("• Total points earned", styles["CustomBullet"]))
    elements.append(Paragraph("• Total points redeemed", styles["CustomBullet"]))
    elements.append(Paragraph("• Current points balance", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.1 * inch))
    
    elements.append(Paragraph("Detailed Tabs", styles["Heading2"]))
    elements.append(Paragraph("• Transactions: History of all purchases and points earned", styles["CustomBullet"]))
    elements.append(Paragraph("• Redemptions: History of all point redemptions", styles["CustomBullet"]))
    elements.append(Paragraph("• Referrals: History of all successful referrals made", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(PageBreak())
    
    # 6. Member Data Export
    elements.append(Paragraph("6. Member Data Export", styles["Heading1"]))
    elements.append(Paragraph(
        "The export functionality allows you to download member data, transactions, redemptions, "
        "and referrals in CSV format for reporting, analysis, or backup purposes.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To export data:", styles["Heading2"]))
    elements.append(Paragraph("1. Navigate to the Members tab in the dashboard", styles["CustomBullet"]))
    elements.append(Paragraph("2. Scroll down to the Export Data section", styles["CustomBullet"]))
    elements.append(Paragraph("3. Select the export type:", styles["CustomBullet"]))
    elements.append(Paragraph("• Members", styles["CustomBullet"]))
    elements.append(Paragraph("• Transactions", styles["CustomBullet"]))
    elements.append(Paragraph("• Referrals", styles["CustomBullet"]))
    elements.append(Paragraph("• Redemptions", styles["CustomBullet"]))
    elements.append(Paragraph("4. Optional: Set a date range filter", styles["CustomBullet"]))
    elements.append(Paragraph("5. Click one of the export options:", styles["CustomBullet"]))
    elements.append(Paragraph("• \"Export Filtered Data\" to export based on your date range", styles["CustomBullet"]))
    elements.append(Paragraph("• \"Export All Data\" to export everything in the selected category", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Individual Member Export:", styles["Heading2"]))
    elements.append(Paragraph(
        "You can also export data for an individual member:",
        styles["Normal"]
    ))
    elements.append(Paragraph("1. Navigate to the member's details view", styles["CustomBullet"]))
    elements.append(Paragraph("2. Click the \"Export to CSV\" button", styles["CustomBullet"]))
    elements.append(Paragraph("3. The exported file will include:", styles["CustomBullet"]))
    elements.append(Paragraph("• Basic member information", styles["CustomBullet"]))
    elements.append(Paragraph("• Activity summary", styles["CustomBullet"]))
    elements.append(Paragraph("• Transaction history", styles["CustomBullet"]))
    elements.append(Paragraph("• Redemption history", styles["CustomBullet"]))
    elements.append(Paragraph("• Referral history", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(PageBreak())
    
    # 7. Points Configuration
    elements.append(Paragraph("7. Points Configuration", styles["Heading1"]))
    elements.append(Paragraph(
        "The configuration section allows administrators to adjust the points system to match "
        "business requirements and marketing strategies. This includes setting points rates "
        "for purchases and referrals.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To access configuration settings:", styles["Heading2"]))
    elements.append(Paragraph("1. Navigate to the Configuration tab in the dashboard", styles["CustomBullet"]))
    elements.append(Paragraph("2. Adjust the following settings:", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Points Per Ngultrum Spent:", styles["Heading2"]))
    elements.append(Paragraph(
        "Configure how many points members earn for each ngultrum spent:",
        styles["Normal"]
    ))
    elements.append(Paragraph("• Non-Trade Members: Set the base points rate", styles["CustomBullet"]))
    elements.append(Paragraph("• Trade Members: Set the enhanced points rate", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Referral Bonus Points:", styles["Heading2"]))
    elements.append(Paragraph(
        "Configure how many points members earn for each successful referral:",
        styles["Normal"]
    ))
    elements.append(Paragraph("• Non-Trade Members: Set the base referral bonus", styles["CustomBullet"]))
    elements.append(Paragraph("• Trade Members: Set the enhanced referral bonus", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("To save configuration changes:", styles["Heading2"]))
    elements.append(Paragraph("1. Review the Configuration Summary to confirm changes", styles["CustomBullet"]))
    elements.append(Paragraph("2. Click \"Save Configuration\" to apply changes", styles["CustomBullet"]))
    elements.append(Paragraph(
        "Note: Configuration changes will apply to all future transactions and referrals, "
        "but will not retroactively affect past activities.",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.3 * inch))
    elements.append(PageBreak())
    
    # Best Practices
    elements.append(Paragraph("Best Practices", styles["Heading1"]))
    elements.append(Paragraph(
        "Follow these guidelines to ensure effective management of the Thunder Dragon Club program:",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 0.2 * inch))
    
    elements.append(Paragraph("Member Management:", styles["Heading2"]))
    elements.append(Paragraph("• Verify member information for accuracy before adding to the system", styles["CustomBullet"]))
    elements.append(Paragraph("• Regularly update member contact information when changes occur", styles["CustomBullet"]))
    elements.append(Paragraph("• Identify and mark trade members appropriately to ensure proper benefits", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.1 * inch))
    
    elements.append(Paragraph("Transaction Tracking:", styles["Heading2"]))
    elements.append(Paragraph("• Record transactions as soon as possible after purchase", styles["CustomBullet"]))
    elements.append(Paragraph("• Double-check transaction amounts for accuracy", styles["CustomBullet"]))
    elements.append(Paragraph("• Include descriptive notes when relevant", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.1 * inch))
    
    elements.append(Paragraph("Referral Program:", styles["Heading2"]))
    elements.append(Paragraph("• Encourage members to use the referral program", styles["CustomBullet"]))
    elements.append(Paragraph("• Track which referral strategies are most effective", styles["CustomBullet"]))
    elements.append(Paragraph("• Regularly promote the referral program benefits to members", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.1 * inch))
    
    elements.append(Paragraph("Data Management:", styles["Heading2"]))
    elements.append(Paragraph("• Regularly export data as a backup", styles["CustomBullet"]))
    elements.append(Paragraph("• Use exported data for marketing analysis", styles["CustomBullet"]))
    elements.append(Paragraph("• Protect member data according to privacy regulations", styles["CustomBullet"]))
    elements.append(Spacer(1, 0.3 * inch))
    
    # Closing
    elements.append(Paragraph(
        "This user guide provides a comprehensive overview of the Thunder Dragon Club management system. "
        "For technical support or questions about the system, please contact the system administrator.",
        styles["Normal"]
    ))
    
    # Build the PDF
    doc.build(elements)
    
    print("PDF guide generated successfully!")

if __name__ == "__main__":
    generate_thunder_dragon_club_guide()