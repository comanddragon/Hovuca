"""
Management command to seed realistic development data.

Usage (via manage.py — recommended):
    python manage.py seed_data                        # seed everything
    python manage.py seed_data --flush                # wipe DB first, then seed
    python manage.py seed_data --app users            # seed only a specific section

    Django will use whatever DJANGO_SETTINGS_MODULE is already set in your
    environment (or .env).  Set it explicitly if needed:
        DJANGO_SETTINGS_MODULE=config.settings.development python manage.py seed_data

Usage (standalone script):
    python apps/core/management/commands/seed_data.py
    python apps/core/management/commands/seed_data.py --flush
    python apps/core/management/commands/seed_data.py --app users

Place this file at:
    apps/core/management/commands/seed_data.py
"""

import os
import sys
import django

# ---------------------------------------------------------------------------
# Standalone bootstrap — only runs when executed directly, not via manage.py
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    # Resolve project root (4 levels up: commands/ -> management/ -> core/ -> apps/ -> root)
    _commands_dir = os.path.abspath(os.path.dirname(__file__))
    _project_root = os.path.dirname(  # project root
        os.path.dirname(             # apps/
            os.path.dirname(         # apps/core/
                os.path.dirname(     # apps/core/management/
                    _commands_dir    # apps/core/management/commands/
                )
            )
        )
    )
    if _project_root not in sys.path:
        sys.path.insert(0, _project_root)

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    django.setup()

from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone


# ===========================================================================
# Seed Data Constants
# ===========================================================================

USERS = [
    dict(email="staff@hovuca.org",       first_name="Sarah",      last_name="Nkomo",  role="staff"),
    dict(email="instructor@hovuca.org",  first_name="Prof. David", last_name="Mbeki", role="staff"),
    dict(email="volunteer1@test.com",    first_name="Alice",      last_name="Fomba",  role="volunteer"),
    dict(email="volunteer2@test.com",    first_name="Bruno",      last_name="Tchinda", role="volunteer"),
    dict(email="student1@test.com",      first_name="Emile",      last_name="Ngassa", role="student"),
    dict(email="student2@test.com",      first_name="Fatima",     last_name="Oumar",  role="student"),
    dict(email="donor@test.com",         first_name="George",     last_name="Wafula", role="donor"),
]

ORGANIZATION = dict(
    slug="hovuca",
    name="HOVUCA",
    description="Helping Our Vulnerable Communities Achieve.",
    email="info@hovuca.org",
    website="https://hovuca.org",
    founded_year=2018,
    is_active=True,
)

BRANCH = dict(
    slug="yaounde-hq",
    name="Yaoundé HQ",
    location="Yaoundé, Cameroon",
    is_active=True,
)

DEPARTMENTS = [
    "Education",
    "Tech",
    "Finance",
    "Volunteer Coordination",
    "Communications",
    "Legal & Compliance",
    "Monitoring & Evaluation",
    "Partnerships",
    "Human Resources",
    "Field Operations",
]

PROGRAMS = [
    dict(
        title="Digital Literacy Initiative",
        status="active",
        description=(
            "Equipping underserved communities with foundational digital skills. "
            "This program covers basic computer use, internet safety, and productivity "
            "tools, ensuring participants can access online services, pursue remote work, "
            "and engage confidently in an increasingly digital world."
        ),
        excerpt="Bridging the digital divide by teaching essential computer and internet skills to underserved communities.",
    ),
    dict(
        title="Community Health Outreach",
        status="active",
        description=(
            "Delivering preventive healthcare education and free screenings to rural "
            "and peri-urban communities. Trained health volunteers visit homes and "
            "community centres to share knowledge on hygiene, nutrition, maternal "
            "health, and early disease detection."
        ),
        excerpt="Bringing preventive health education and free screenings directly to rural and peri-urban households.",
    ),
    dict(
        title="Youth Entrepreneurship",
        status="draft",
        description=(
            "A structured mentorship and seed-funding program for young people aged "
            "18–30 who want to start or grow small businesses. Participants receive "
            "business-plan coaching, access to a micro-grant, and six months of "
            "post-launch support from experienced entrepreneurs."
        ),
        excerpt="Mentoring ambitious youth with the skills, funding, and networks needed to launch sustainable small businesses.",
    ),
    dict(
        title="Clean Water Access",
        status="active",
        description=(
            "Partnering with local governments and engineers to install boreholes, "
            "rehabilitate wells, and set up rainwater-harvesting systems in villages "
            "that rely on unsafe water sources. The program also trains community "
            "water committees to maintain infrastructure long after project closure."
        ),
        excerpt="Installing and rehabilitating water infrastructure so communities gain reliable access to safe, clean water.",
    ),
    dict(
        title="Girls' Education Scholarship",
        status="active",
        description=(
            "Removing financial barriers that prevent girls from completing secondary "
            "school. Scholarships cover tuition, uniforms, books, and sanitary supplies. "
            "Each scholar is paired with a female mentor and receives quarterly "
            "psychosocial support sessions to address social pressures on attendance."
        ),
        excerpt="Keeping girls in school through scholarships, mentorship, and targeted psychosocial support.",
    ),
    dict(
        title="Agri-Business Training",
        status="active",
        description=(
            "Supporting smallholder farmers — with a focus on women — to adopt "
            "climate-smart agricultural techniques, improve post-harvest handling, "
            "and access formal markets. Training modules cover soil health, record "
            "keeping, cooperative formation, and negotiating with buyers."
        ),
        excerpt="Empowering smallholder farmers with modern techniques and market-access skills to boost household incomes.",
    ),
    dict(
        title="Legal Aid Clinic",
        status="active",
        description=(
            "Providing free legal advice and representation to low-income individuals "
            "facing housing disputes, domestic violence cases, and labour rights "
            "violations. Volunteer lawyers hold weekly clinics at community centres "
            "and collaborate with paralegal trainees from local universities."
        ),
        excerpt="Offering free legal counsel and representation to vulnerable individuals who cannot afford private lawyers.",
    ),
    dict(
        title="Mental Health Awareness Campaign",
        status="draft",
        description=(
            "Tackling the stigma surrounding mental illness through community dialogues, "
            "radio broadcasts, and training of community health workers as first-line "
            "mental-health support providers. The campaign also maps referral pathways "
            "to professional psychiatric and counselling services."
        ),
        excerpt="Reducing mental-health stigma and strengthening community-level support networks across urban and rural areas.",
    ),
    dict(
        title="Refugee Integration Support",
        status="active",
        description=(
            "Helping newly arrived refugees navigate documentation, language barriers, "
            "and access to education and employment. Case workers provide individualised "
            "support plans, while integration workshops connect refugees with host-community "
            "members to foster mutual understanding and social cohesion."
        ),
        excerpt="Facilitating the social and economic integration of refugees through case management and community dialogues.",
    ),
    dict(
        title="Environmental Stewardship",
        status="draft",
        description=(
            "Mobilising youth and schools to plant trees, restore degraded land, and "
            "reduce plastic waste in their neighbourhoods. The program combines "
            "environmental education with hands-on restoration activities, and tracks "
            "ecological outcomes through quarterly biodiversity and soil-health assessments."
        ),
        excerpt="Engaging youth in tree-planting, land restoration, and waste-reduction to build a greener future.",
    ),
]

COURSE_SUBJECTS = [
    "Computer Science",
    "Web Development",
    "Data Science",
    "Cybersecurity",
    "Mobile Development",
    "Artificial Intelligence",
    "Cloud Computing",
    "Digital Marketing",
    "Graphic Design",
    "Project Management",
]

BLOG_CATEGORIES = [
    ("News",          "#3B82F6"),
    ("Education",     "#10B981"),
    ("Stories",       "#F59E0B"),
    ("Health",        "#EF4444"),
    ("Technology",    "#8B5CF6"),
    ("Environment",   "#22C55E"),
    ("Policy",        "#F97316"),
    ("Partnerships",  "#06B6D4"),
    ("Volunteering",  "#EC4899"),
    ("Research",      "#6366F1"),
]

BLOG_TAGS = [
    "community",
    "health",
    "technology",
    "youth",
    "education",
    "environment",
    "women",
    "refugees",
    "agriculture",
    "mental-health",
]

ARTICLES = [
    dict(
        title="HOVUCA Launches New Digital Literacy Program",
        is_featured=True,
        excerpt=(
            "HOVUCA officially launched its flagship Digital Literacy Initiative this month, "
            "bringing tablet-based training centres to three underserved neighbourhoods in Yaoundé."
        ),
        body=(
            "<p>HOVUCA officially launched its flagship <strong>Digital Literacy Initiative</strong> "
            "this month, bringing tablet-based training centres to three underserved neighbourhoods "
            "in Yaoundé. Over 300 residents attended the opening day, eager to acquire skills that "
            "will help them access online job platforms, government e-services, and digital banking.</p>"
            "<p>The programme runs six-week cohorts and covers basic computer operation, internet "
            "navigation, email communication, and digital safety. Graduates receive a certificate "
            "recognised by several local employers. 'This is not just about technology,' said "
            "programme coordinator Sarah Nkomo. 'It is about giving people a seat at the table "
            "in a world that is moving fast.'</p>"
            "<p>Funding for the first year comes from a combination of private donors and a grant "
            "from the Digital Africa Foundation. HOVUCA plans to expand to five additional sites "
            "before the end of the fiscal year.</p>"
        ),
    ),
    dict(
        title="5 Ways Technology is Changing NGO Work",
        is_featured=False,
        excerpt=(
            "From data collection apps to AI-assisted translation, non-profits are leveraging "
            "digital tools to do more with less. Here are five innovations reshaping the sector."
        ),
        body=(
            "<p>The non-profit sector has historically lagged behind the private sector in technology "
            "adoption, but the gap is closing fast. Here are five innovations that are reshaping how "
            "organisations like HOVUCA deliver impact.</p>"
            "<h2>1. Mobile Data Collection</h2>"
            "<p>Paper-based surveys are giving way to smartphone apps like KoboToolbox and ODK, "
            "cutting data-entry errors and enabling real-time analysis in the field.</p>"
            "<h2>2. AI-Assisted Translation</h2>"
            "<p>Teams working across multiple languages are using AI tools to translate training "
            "materials and beneficiary communications instantly, reducing reliance on costly "
            "professional translators for routine content.</p>"
            "<h2>3. Digital Financial Transfers</h2>"
            "<p>Mobile money platforms allow NGOs to disburse cash assistance directly to "
            "beneficiaries' phones, improving transparency and eliminating leakage.</p>"
            "<h2>4. Satellite Monitoring</h2>"
            "<p>Environmental and agricultural programmes now use satellite imagery to track land "
            "cover change and crop health across vast areas without costly field visits.</p>"
            "<h2>5. Cloud-Based Collaboration</h2>"
            "<p>Distributed teams across multiple regions share documents, manage tasks, and hold "
            "video calls seamlessly, enabling truly decentralised programme delivery.</p>"
        ),
    ),
    dict(
        title="Volunteer Spotlight: Alice Fomba's Story",
        is_featured=True,
        excerpt=(
            "Alice Fomba gave up a corporate marketing role to volunteer full-time with HOVUCA. "
            "Two years later, she says it is the best decision she ever made."
        ),
        body=(
            "<p>Alice Fomba had a comfortable office job, a company car, and a clear promotion "
            "ladder ahead of her. She walked away from all of it to volunteer with HOVUCA — and "
            "she has never looked back.</p>"
            "<p>'I kept reading impact reports and thinking: someone has to actually go and do this,' "
            "she recalls. 'Eventually I realised that someone could be me.' Alice now leads our "
            "community outreach team in the Biyem-Assi district, coordinating a roster of 45 "
            "part-time volunteers and managing relationships with 12 partner schools.</p>"
            "<p>Her marketing background has proved invaluable. Under her stewardship, volunteer "
            "recruitment applications tripled and social media engagement grew by 180 percent. "
            "But Alice says the numbers are secondary to the relationships. 'When a student you "
            "have been supporting passes their baccalauréat, no KPI captures that feeling.'</p>"
            "<p>Alice encourages anyone considering volunteering to start small — even two hours "
            "a week makes a difference. 'The community gives you back far more than you give it.'</p>"
        ),
    ),
    dict(
        title="Clean Water Reaches 1,200 Families in Mbalmayo",
        is_featured=True,
        excerpt=(
            "After eight months of construction, HOVUCA's borehole project in Mbalmayo is now "
            "fully operational, serving over 1,200 households with safe drinking water."
        ),
        body=(
            "<p>Eight months after breaking ground, HOVUCA's <strong>Clean Water Access</strong> "
            "programme has delivered safe drinking water to 1,200 families in the Mbalmayo "
            "district. The project included drilling four boreholes, rehabilitating two existing "
            "wells, and installing a solar-powered pumping station.</p>"
            "<p>Before the intervention, residents walked up to four kilometres each way to collect "
            "water from a stream shared with livestock — a journey that fell disproportionately "
            "on women and girls. 'My daughters used to miss school two days a week for water "
            "collection,' said community leader Madeleine Owona. 'Now they attend every day.'</p>"
            "<p>A trained water committee of eight volunteers oversees maintenance and collects a "
            "small monthly fee to fund future repairs, ensuring the infrastructure remains "
            "functional long after the project formally closes.</p>"
        ),
    ),
    dict(
        title="Meet the 2024 Girls' Education Scholars",
        is_featured=False,
        excerpt=(
            "Thirty young women from across the Centre Region have been awarded HOVUCA "
            "scholarships for the 2024–2025 academic year. Here are their stories."
        ),
        body=(
            "<p>This year's cohort of <strong>Girls' Education Scholarship</strong> recipients "
            "is our largest yet: thirty young women from twelve towns and villages across the "
            "Centre Region will receive full secondary-school support for the 2024–2025 "
            "academic year.</p>"
            "<p>Scholars were selected based on academic merit, financial need, and demonstrated "
            "leadership potential within their communities. Each will receive tuition, uniforms, "
            "textbooks, and a monthly stipend, as well as being matched with a professional "
            "female mentor.</p>"
            "<p>Among this year's recipients is 16-year-old Justine Ekani from Obala, who scored "
            "the highest mark in her district's primary-leaving examination despite caring for "
            "two younger siblings. 'I want to become an engineer,' she says. 'This scholarship "
            "means I can actually try.'</p>"
        ),
    ),
    dict(
        title="Agri-Business Training Boosts Farmer Incomes by 40%",
        is_featured=False,
        excerpt=(
            "An independent evaluation of HOVUCA's agri-business training programme found "
            "that participating farmers increased their net income by an average of 40 percent "
            "within 12 months."
        ),
        body=(
            "<p>An independent evaluation commissioned by HOVUCA has found that farmers who "
            "completed the <strong>Agri-Business Training</strong> programme increased their "
            "net household income by an average of 40 percent within 12 months of graduation.</p>"
            "<p>The evaluation surveyed 280 participants across three regions and attributed the "
            "income gains to three main factors: reduced post-harvest losses through improved "
            "storage techniques, higher sale prices achieved through cooperative bulk selling, "
            "and diversification into higher-value crops.</p>"
            "<p>Programme manager Christelle Abena said the results exceeded expectations. "
            "'We knew the training was working from the stories farmers were sharing, but "
            "seeing it quantified is hugely motivating for the team and for our funders.'</p>"
            "<p>Based on the evaluation findings, HOVUCA will expand the programme to two "
            "additional regions in 2025 with support from a new institutional donor.</p>"
        ),
    ),
    dict(
        title="Legal Aid Clinic Celebrates 500th Case",
        is_featured=False,
        excerpt=(
            "HOVUCA's free Legal Aid Clinic has now handled 500 cases since opening in 2022, "
            "recovering land rights, wages, and custody for clients who had no other recourse."
        ),
        body=(
            "<p>HOVUCA's <strong>Legal Aid Clinic</strong> quietly passed a significant milestone "
            "last week: the 500th case since the clinic opened its doors in March 2022. The "
            "clinic provides free legal advice and representation to low-income individuals "
            "facing housing disputes, domestic violence, and labour-rights violations.</p>"
            "<p>Of the 500 cases closed, 78 percent resulted in a favourable outcome for the "
            "client — whether a negotiated settlement, a court ruling, or a referral to a "
            "specialist service. Twelve volunteer lawyers and eight paralegal trainees have "
            "contributed their time to the clinic since its launch.</p>"
            "<p>'Case 500 was a widow who was being unlawfully evicted from her late husband's "
            "property,' said clinic coordinator Emmanuel Fouda. 'She kept her home. That is "
            "what this clinic is about.'</p>"
        ),
    ),
    dict(
        title="Breaking the Silence: Mental Health in Our Communities",
        is_featured=True,
        excerpt=(
            "Stigma keeps many people from seeking help for mental health challenges. "
            "HOVUCA's new campaign is working to change that — one conversation at a time."
        ),
        body=(
            "<p>In many communities, admitting to depression or anxiety is still seen as a sign "
            "of weakness or even spiritual failure. HOVUCA's new <strong>Mental Health Awareness "
            "Campaign</strong> is confronting that stigma head-on through community dialogues, "
            "radio programming, and the training of community health workers as first-line "
            "support providers.</p>"
            "<p>The campaign launched with a series of town-hall conversations in four "
            "neighbourhoods. Trained facilitators shared personal experiences and introduced "
            "the concept of psychological wellbeing in culturally resonant terms. Attendance "
            "exceeded all expectations — standing-room only at every event.</p>"
            "<p>'People are hungry for this conversation,' said campaign lead Dr. Nathalie "
            "Bello. 'They just need a safe space to start it.' HOVUCA is now working with "
            "three community radio stations to broadcast weekly mental-health segments "
            "reaching an estimated audience of 50,000 listeners.</p>"
        ),
    ),
    dict(
        title="How Refugees Are Building New Lives in Yaoundé",
        is_featured=False,
        excerpt=(
            "Through HOVUCA's Refugee Integration Support programme, dozens of displaced "
            "families are finding stable housing, schooling for their children, and pathways "
            "to lawful employment."
        ),
        body=(
            "<p>Arriving in a new city without papers, language, or contacts is an overwhelming "
            "experience. HOVUCA's <strong>Refugee Integration Support</strong> programme assigns "
            "each newly arrived family a dedicated case worker who helps them navigate "
            "registration with UNHCR, enrolment of children in school, and access to "
            "healthcare and livelihood support.</p>"
            "<p>Over the past year the programme has assisted 140 families from five countries. "
            "Eighty-three percent of school-age children in the caseload are now enrolled in "
            "formal education — up from 21 percent at arrival. Forty-two adults have secured "
            "lawful employment or established small businesses.</p>"
            "<p>Integration workshops pair refugee and host-community participants in shared "
            "activities — cooking classes, sports, craft cooperatives — building friendships "
            "that extend well beyond the programme. 'My neighbours taught me Cameroonian "
            "recipes,' says Amina, a mother of three from the Central African Republic. "
            "'Now I sell them at the market on Saturdays.'</p>"
        ),
    ),
    dict(
        title="Youth Plant 10,000 Trees Across the Centre Region",
        is_featured=True,
        excerpt=(
            "Over a single weekend, 800 young volunteers mobilised by HOVUCA planted 10,000 "
            "native tree seedlings across degraded land in six communities."
        ),
        body=(
            "<p>Eight hundred young volunteers descended on six communities across the Centre "
            "Region last weekend to plant 10,000 native tree seedlings as part of HOVUCA's "
            "<strong>Environmental Stewardship</strong> programme. The mass planting is the "
            "largest single conservation event the organisation has ever organised.</p>"
            "<p>Species selected include mango, moringa, and indigenous hardwoods suited to "
            "the local climate. Each planting site was chosen in consultation with village "
            "councils and the Ministry of Environment, and community members have committed "
            "to watering and protecting the seedlings through their first dry season.</p>"
            "<p>'Trees are not just about carbon,' said programme lead Victor Mba. 'They "
            "provide shade, fruit, firewood, and a reason for children to care about the "
            "land they live on.' Survival rates will be monitored quarterly, with a target "
            "of 80 percent canopy establishment within 18 months.</p>"
        ),
    ),
]

DONATION_CAMPAIGNS = [
    dict(title="School Supplies Drive 2024",      goal_amount=10000, status="active"),
    dict(title="Medical Equipment for Clinic",    goal_amount=25000, status="active"),
    dict(title="Youth Tech Lab Fund",             goal_amount=15000, status="draft"),
    dict(title="Clean Water for Mbalmayo",        goal_amount=30000, status="active"),
    dict(title="Girls' Scholarship Endowment",    goal_amount=50000, status="active"),
    dict(title="Refugee Emergency Relief",        goal_amount=20000, status="active"),
    dict(title="Tree Planting Initiative",        goal_amount=8000,  status="active"),
    dict(title="Mental Health Resource Centre",   goal_amount=18000, status="draft"),
    dict(title="Legal Aid Clinic Expansion",      goal_amount=12000, status="active"),
    dict(title="Agri-Business Training Scale-Up", goal_amount=40000, status="draft"),
]

EVENT_CATEGORIES = [
    dict(name="Workshop",       color="#3B82F6"),
    dict(name="Fundraiser",     color="#F59E0B"),
    dict(name="Community Day",  color="#10B981"),
    dict(name="Health Camp",    color="#EF4444"),
    dict(name="Training",       color="#8B5CF6"),
    dict(name="Awareness",      color="#06B6D4"),
]

EVENTS = [
    dict(
        title="Digital Skills Bootcamp — Cohort 4",
        excerpt="A five-day intensive bootcamp teaching foundational computer and internet skills to youth aged 16–25.",
        description="<p>Join us for our fourth Digital Skills Bootcamp — five packed days covering computer basics, internet safety, email, spreadsheets, and online job applications. Participants who complete all sessions receive a certificate recognised by partner employers in Yaoundé.</p><p>Lunch and materials are provided free of charge. Spaces are limited to 40 participants per cohort to ensure quality instruction.</p>",
        event_type="in_person",
        location_name="HOVUCA Training Centre, Yaoundé",
        location_address="Avenue Kennedy, Yaoundé, Cameroon",
        status="published",
        is_featured=True,
        is_registration_required=True,
        max_attendees=40,
        category_name="Workshop",
        days_from_now=14,
        duration_hours=8,
    ),
    dict(
        title="Annual Fundraising Gala 2025",
        excerpt="An evening of inspiration, music, and giving — celebrating five years of HOVUCA's impact.",
        description="<p>Join us for our flagship annual gala at the Hilton Yaoundé. The evening features a keynote from our Executive Director, testimonials from programme beneficiaries, live music by the Yaoundé Youth Orchestra, and a silent auction.</p><p>All proceeds go directly to our Girls' Education Scholarship fund. Tables of 10 available. Formal dress code.</p>",
        event_type="in_person",
        location_name="Hilton Yaoundé",
        location_address="Boulevard du 20 Mai, Yaoundé, Cameroon",
        status="published",
        is_featured=True,
        is_registration_required=True,
        max_attendees=200,
        category_name="Fundraiser",
        days_from_now=30,
        duration_hours=4,
    ),
    dict(
        title="Community Health Screening Day — Biyem-Assi",
        excerpt="Free blood pressure, blood sugar, and vision screenings for all residents in the Biyem-Assi district.",
        description="<p>HOVUCA's Community Health Outreach team is bringing free preventive health screenings to Biyem-Assi. Trained nurses and community health workers will conduct blood pressure checks, blood sugar tests, and basic vision assessments.</p><p>Results are provided on the spot. Anyone requiring follow-up will be referred to our partner clinic free of charge. No appointment needed — simply walk in.</p>",
        event_type="in_person",
        location_name="Biyem-Assi Community Hall",
        location_address="Rue 1.863, Biyem-Assi, Yaoundé",
        status="published",
        is_featured=False,
        is_registration_required=False,
        max_attendees=None,
        category_name="Health Camp",
        days_from_now=7,
        duration_hours=6,
    ),
    dict(
        title="Refugee Integration Welcome Day",
        excerpt="A welcoming community event connecting newly arrived refugee families with host-community members and local services.",
        description="<p>This half-day event brings together newly arrived refugee families and host-community volunteers for a shared meal, cultural exchange, and an information fair featuring NGOs, government agencies, and local employers.</p><p>Interpretation is available in French, Arabic, Fulfulde, and Sango. Children's activities run throughout the morning.</p>",
        event_type="in_person",
        location_name="Centre Social de Melen",
        location_address="Quartier Melen, Yaoundé",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=120,
        category_name="Community Day",
        days_from_now=10,
        duration_hours=5,
    ),
    dict(
        title="Agri-Business Training — Module 3: Market Access",
        excerpt="Practical training for smallholder farmers on negotiating with buyers, cooperative structures, and digital market platforms.",
        description="<p>Module 3 of our Agri-Business Training series focuses entirely on getting your produce to market at the best price. Topics include cooperative formation, buyer negotiation tactics, using WhatsApp and online platforms to find customers, and record-keeping for loan applications.</p><p>This session is open to graduates of Modules 1 and 2 only. Transport reimbursement is available for participants travelling more than 20 km.</p>",
        event_type="in_person",
        location_name="HOVUCA Field Office, Mbalmayo",
        location_address="Route de Sangmélima, Mbalmayo, Cameroon",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=30,
        category_name="Training",
        days_from_now=21,
        duration_hours=7,
    ),
    dict(
        title="Mental Health Awareness Town Hall — Nkoldongo",
        excerpt="An open community dialogue on mental wellbeing, stigma, and local support resources.",
        description="<p>Our Mental Health Awareness Campaign hosts its fourth town-hall dialogue in the Nkoldongo neighbourhood. Trained facilitators will guide open conversations about depression, anxiety, grief, and the importance of seeking help. A community health worker will be available for private consultations.</p><p>The session is free and open to all. Refreshments provided.</p>",
        event_type="in_person",
        location_name="Nkoldongo Parish Hall",
        location_address="Rue du Stade, Nkoldongo, Yaoundé",
        status="published",
        is_featured=True,
        is_registration_required=False,
        max_attendees=None,
        category_name="Awareness",
        days_from_now=5,
        duration_hours=3,
    ),
    dict(
        title="Youth Entrepreneurship Pitch Day",
        excerpt="Twelve young entrepreneurs present their business plans to a panel of investors and mentors for feedback and seed funding.",
        description="<p>The culmination of our Youth Entrepreneurship programme's second cohort: 12 participants pitch their business plans to a panel of local investors, experienced entrepreneurs, and HOVUCA programme staff.</p><p>Three finalists will receive micro-grants of XAF 500,000 each and six months of post-award mentorship. The event is open to the public — come and cheer on the next generation of Cameroonian entrepreneurs.</p>",
        event_type="in_person",
        location_name="Palais des Congrès, Yaoundé",
        location_address="Avenue Konrad Adenauer, Yaoundé",
        status="published",
        is_featured=True,
        is_registration_required=True,
        max_attendees=150,
        category_name="Fundraiser",
        days_from_now=45,
        duration_hours=5,
    ),
    dict(
        title="Tree Planting Day — Soa Forest Reserve",
        excerpt="Join 500 volunteers to plant 5,000 native seedlings in the degraded Soa Forest Reserve.",
        description="<p>HOVUCA's Environmental Stewardship programme invites volunteers of all ages to join us for a mass tree-planting day at the Soa Forest Reserve. Gloves, tools, seedlings, and lunch are provided.</p><p>Buses depart from HOVUCA headquarters at 07:00. Please wear comfortable clothing and closed-toe shoes. No experience necessary — our team will guide you every step of the way.</p>",
        event_type="in_person",
        location_name="Soa Forest Reserve",
        location_address="Soa, Centre Region, Cameroon",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=500,
        category_name="Community Day",
        days_from_now=60,
        duration_hours=8,
    ),
    dict(
        title="Girls in STEM Workshop",
        excerpt="A full-day workshop encouraging secondary-school girls to explore careers in science, technology, engineering, and mathematics.",
        description="<p>In partnership with the University of Yaoundé I, HOVUCA is hosting a day of hands-on STEM activities, career talks from female engineers and scientists, and a robotics demonstration for girls in secondary school (Form 4–Upper Sixth).</p><p>Participants must be enrolled in a secondary school in the Centre Region. A letter from their school confirming enrolment is required at registration. Transport is provided from selected pickup points.</p>",
        event_type="in_person",
        location_name="Faculty of Science, University of Yaoundé I",
        location_address="BP 812, Yaoundé",
        status="published",
        is_featured=True,
        is_registration_required=True,
        max_attendees=80,
        category_name="Workshop",
        days_from_now=35,
        duration_hours=8,
    ),
    dict(
        title="Legal Rights Awareness Seminar — Domestic Workers",
        excerpt="Know your rights: a seminar on labour law, minimum wage, and legal recourse for domestic workers.",
        description="<p>HOVUCA's Legal Aid Clinic is partnering with the National Federation of Domestic Workers to deliver a plain-language seminar on employment rights, contracts, the legal minimum wage, and how to report violations.</p><p>The session will be conducted in French and Pidgin English. Free legal consultations are available for 30 minutes after the seminar on a first-come, first-served basis.</p>",
        event_type="in_person",
        location_name="HOVUCA Training Centre, Yaoundé",
        location_address="Avenue Kennedy, Yaoundé, Cameroon",
        status="published",
        is_featured=False,
        is_registration_required=False,
        max_attendees=None,
        category_name="Awareness",
        days_from_now=18,
        duration_hours=3,
    ),
    dict(
        title="Clean Water Project Handover Ceremony — Mbalmayo",
        excerpt="Join us as we officially hand over the completed borehole and water committee to the Mbalmayo community.",
        description="<p>After 10 months of construction and community mobilisation, HOVUCA's Clean Water Access programme formally hands over four boreholes and a solar pumping station to the elected Mbalmayo Water Committee.</p><p>The ceremony will include remarks from local government officials, a blessing from community elders, and the first official draw of water. All are welcome. Refreshments will be served.</p>",
        event_type="in_person",
        location_name="Mbalmayo Town Square",
        location_address="Centre-ville, Mbalmayo, Cameroon",
        status="published",
        is_featured=True,
        is_registration_required=False,
        max_attendees=None,
        category_name="Community Day",
        days_from_now=-5,
        duration_hours=3,
    ),
    dict(
        title="Online Fundraising Masterclass for NGOs",
        excerpt="Learn proven digital fundraising strategies from experts who have raised millions for non-profit causes.",
        description="<p>This free online masterclass covers crowdfunding platforms, donor email campaigns, social media fundraising, and grant writing basics — all tailored for small and medium-sized NGOs in sub-Saharan Africa.</p><p>The session will be recorded and shared with all registered participants. A Q&A with the facilitators follows the main presentation.</p>",
        event_type="online",
        location_name="",
        location_address="",
        online_url="https://meet.hovuca.org/fundraising-masterclass",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=300,
        category_name="Training",
        days_from_now=25,
        duration_hours=2,
    ),
    dict(
        title="Scholars' Recognition Ceremony 2025",
        excerpt="Celebrating 45 girls completing their secondary education on the HOVUCA Girls' Education Scholarship.",
        description="<p>This annual ceremony honours the 45 young women who completed their secondary education this academic year with support from the HOVUCA Girls' Education Scholarship. Families, mentors, school principals, and donors are all invited to celebrate this milestone.</p><p>Each scholar will receive her certificate, a bursary letter for tertiary education, and a mentorship connection for the next phase of her journey.</p>",
        event_type="in_person",
        location_name="Hôtel Mont Fébé, Yaoundé",
        location_address="Mont Fébé, Yaoundé, Cameroon",
        status="published",
        is_featured=True,
        is_registration_required=True,
        max_attendees=250,
        category_name="Community Day",
        days_from_now=50,
        duration_hours=4,
    ),
    dict(
        title="Volunteer Orientation & Induction — Q2 2025",
        excerpt="Welcome session for all new volunteers joining HOVUCA in the second quarter of 2025.",
        description="<p>All new volunteers accepted into HOVUCA's programmes in Q2 2025 are required to attend this half-day induction. The session covers HOVUCA's mission and values, safeguarding policies, data protection obligations, and an introduction to your programme team.</p><p>You will also receive your volunteer ID, access credentials, and a copy of the volunteer handbook. Lunch is provided.</p>",
        event_type="in_person",
        location_name="HOVUCA Training Centre, Yaoundé",
        location_address="Avenue Kennedy, Yaoundé, Cameroon",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=60,
        category_name="Training",
        days_from_now=12,
        duration_hours=4,
    ),
    dict(
        title="World Water Day Community Walk",
        excerpt="A 5 km awareness walk through Yaoundé to mark World Water Day and highlight HOVUCA's clean water mission.",
        description="<p>To mark World Water Day (22 March), HOVUCA is organising a 5 km community walk through central Yaoundé. Participants are invited to carry water jerricans for a symbolic stretch of the route — representing the daily burden carried by millions without safe water access.</p><p>The walk ends with a public rally featuring guest speakers, live music, and an exhibition of HOVUCA's water projects. Bring the whole family.</p>",
        event_type="in_person",
        location_name="Place de la Réunification, Yaoundé",
        location_address="Place de la Réunification, Yaoundé",
        status="published",
        is_featured=False,
        is_registration_required=False,
        max_attendees=None,
        category_name="Awareness",
        days_from_now=22,
        duration_hours=3,
    ),
    dict(
        title="Participatory Film Screening: 'Roots & Routes'",
        excerpt="A documentary screening and community discussion on displacement, identity, and belonging in Cameroon.",
        description="<p>'Roots & Routes' is a short documentary produced by HOVUCA's Refugee Integration Support programme, featuring the stories of five families who arrived in Yaoundé over the past two years. The screening is followed by a 45-minute facilitated discussion with the filmmakers and two of the documentary's subjects.</p><p>Open to the public. Free entry. Seating is limited — register early.</p>",
        event_type="in_person",
        location_name="Institut Français du Cameroun",
        location_address="Avenue Charles de Gaulle, Yaoundé",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=90,
        category_name="Awareness",
        days_from_now=40,
        duration_hours=2,
    ),
    dict(
        title="Soil Health & Composting Workshop",
        excerpt="Practical training for farmers on composting, organic fertiliser production, and soil conservation techniques.",
        description="<p>Healthy soil is the foundation of every productive farm. This one-day hands-on workshop teaches smallholder farmers how to make compost from agricultural waste, apply organic fertilisers correctly, and protect topsoil from erosion.</p><p>Participants take home a starter composting kit. The workshop is conducted in French and Ewondo. Register through your local extension officer or directly with HOVUCA.</p>",
        event_type="in_person",
        location_name="IRAD Demonstration Farm, Nkolbisson",
        location_address="Nkolbisson, Yaoundé",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=35,
        category_name="Training",
        days_from_now=28,
        duration_hours=8,
    ),
    dict(
        title="Cybersecurity Awareness Day for Students",
        excerpt="Interactive sessions on online safety, phishing, password hygiene, and digital citizenship for university students.",
        description="<p>In partnership with the Faculty of Engineering at the University of Yaoundé I, HOVUCA's Digital Literacy Initiative presents a free Cybersecurity Awareness Day. Sessions run throughout the day and cover phishing recognition, strong password creation, safe social media use, and your rights under Cameroonian digital law.</p><p>Open to all university students. No registration required — simply show your student card at the door.</p>",
        event_type="in_person",
        location_name="Amphi 700, University of Yaoundé I",
        location_address="BP 812, Yaoundé",
        status="published",
        is_featured=False,
        is_registration_required=False,
        max_attendees=None,
        category_name="Workshop",
        days_from_now=16,
        duration_hours=6,
    ),
    dict(
        title="Partner NGO Coordination Meeting — Q2 2025",
        excerpt="Quarterly coordination meeting for HOVUCA's network of partner organisations across the Centre Region.",
        description="<p>This closed coordination meeting brings together representatives from HOVUCA's 18 partner NGOs to share programme updates, discuss referral pathways, align on advocacy priorities, and plan joint activities for Q3 2025.</p><p>Attendance is by invitation only. Partners who have not received an invitation should contact partnerships@hovuca.org.</p>",
        event_type="hybrid",
        location_name="HOVUCA Conference Room, Yaoundé",
        location_address="Avenue Kennedy, Yaoundé, Cameroon",
        online_url="https://meet.hovuca.org/partner-q2",
        status="published",
        is_featured=False,
        is_registration_required=True,
        max_attendees=50,
        category_name="Training",
        days_from_now=20,
        duration_hours=4,
    ),
    dict(
        title="End-of-Year Volunteer Appreciation Evening",
        excerpt="Celebrating the dedication of over 200 HOVUCA volunteers with an evening of recognition, awards, and community.",
        description="<p>Every year HOVUCA gathers its volunteer family to say thank you. This year's appreciation evening features an awards ceremony recognising outstanding volunteers across six categories, a buffet dinner, live music, and a photo exhibition documenting the year's field activities.</p><p>Volunteers who have completed at least 20 hours in 2025 will receive a certificate of service. Dress: smart casual.</p>",
        event_type="in_person",
        location_name="Hôtel La Falaise, Yaoundé",
        location_address="Rue 1.820, Bastos, Yaoundé",
        status="draft",
        is_featured=False,
        is_registration_required=True,
        max_attendees=220,
        category_name="Community Day",
        days_from_now=180,
        duration_hours=5,
    ),
]

GALLERY_ALBUMS = [
    dict(
        title="Digital Literacy Bootcamp — Cohort 3",
        description="Photos from our third digital skills bootcamp held at the HOVUCA Training Centre in March 2025. Forty participants completed the five-day programme.",
        is_published=True,
        is_featured=True,
        program_title="Digital Literacy Initiative",
    ),
    dict(
        title="Annual Gala 2024",
        description="Highlights from our 2024 fundraising gala at the Hilton Yaoundé, including the silent auction, live performances, and the scholar testimonials.",
        is_published=True,
        is_featured=True,
        program_title=None,
    ),
    dict(
        title="Clean Water Handover — Mbalmayo",
        description="The official handover ceremony for HOVUCA's borehole and solar pumping station in Mbalmayo, attended by community leaders and local government officials.",
        is_published=True,
        is_featured=True,
        program_title="Clean Water Access",
    ),
    dict(
        title="Tree Planting Day 2024 — Soa",
        description="Eight hundred volunteers planted 10,000 native tree seedlings across the Soa Forest Reserve in a single weekend.",
        is_published=True,
        is_featured=False,
        program_title="Environmental Stewardship",
    ),
    dict(
        title="Girls in STEM Workshop 2024",
        description="Secondary-school girls explored robotics, coding, and careers in science at our annual Girls in STEM day hosted at the University of Yaoundé I.",
        is_published=True,
        is_featured=True,
        program_title="Girls' Education Scholarship",
    ),
    dict(
        title="Community Health Screening — Biyem-Assi",
        description="Free health screenings for over 400 residents of Biyem-Assi, including blood pressure checks, blood sugar tests, and basic vision assessments.",
        is_published=True,
        is_featured=False,
        program_title="Community Health Outreach",
    ),
    dict(
        title="Refugee Welcome Day — October 2024",
        description="Host-community volunteers and newly arrived refugee families came together for a day of shared meals, activities, and information exchange.",
        is_published=True,
        is_featured=False,
        program_title="Refugee Integration Support",
    ),
    dict(
        title="Youth Entrepreneurship Pitch Day — Cohort 1",
        description="Twelve young entrepreneurs pitched their business plans to a panel of investors. Three finalists each received a XAF 500,000 micro-grant.",
        is_published=True,
        is_featured=True,
        program_title="Youth Entrepreneurship",
    ),
    dict(
        title="Volunteer Orientation — Q1 2025",
        description="Induction day for 55 new volunteers joining HOVUCA's programmes in the first quarter of 2025.",
        is_published=True,
        is_featured=False,
        program_title=None,
    ),
    dict(
        title="Scholars' Recognition Ceremony 2024",
        description="Forty-two girls received their scholarship certificates and bursary letters at our annual recognition ceremony, celebrated with their families and mentors.",
        is_published=True,
        is_featured=True,
        program_title="Girls' Education Scholarship",
    ),
    dict(
        title="Agri-Business Field Day — Mbalmayo",
        description="Smallholder farmers visited demonstration plots and received hands-on training in composting, crop rotation, and record-keeping.",
        is_published=True,
        is_featured=False,
        program_title="Agri-Business Training",
    ),
    dict(
        title="Legal Aid Clinic — 500th Case Milestone",
        description="Staff, volunteers, and partner lawyers gathered to mark the Legal Aid Clinic's 500th case — a testament to two years of dedicated community legal service.",
        is_published=True,
        is_featured=False,
        program_title="Legal Aid Clinic",
    ),
    dict(
        title="Mental Health Town Hall — Bastos",
        description="Community members filled the Bastos Parish Hall for an open dialogue on mental wellbeing, stigma, and local support pathways.",
        is_published=True,
        is_featured=False,
        program_title="Mental Health Awareness Campaign",
    ),
    dict(
        title="World Water Day Walk 2024",
        description="Hundreds of Yaoundé residents joined HOVUCA's 5 km awareness walk carrying water jerricans through the city centre to highlight the global water crisis.",
        is_published=True,
        is_featured=False,
        program_title="Clean Water Access",
    ),
    dict(
        title="Film Screening: Roots & Routes",
        description="Community members and dignitaries attended the premiere of HOVUCA's short documentary on refugee integration, followed by a live discussion with the film's subjects.",
        is_published=True,
        is_featured=False,
        program_title="Refugee Integration Support",
    ),
    dict(
        title="Cybersecurity Day — University of Yaoundé I",
        description="Students attended interactive sessions on phishing, password safety, and digital rights at our annual Cybersecurity Awareness Day.",
        is_published=True,
        is_featured=False,
        program_title="Digital Literacy Initiative",
    ),
    dict(
        title="Partner Coordination Meeting — Q4 2024",
        description="Representatives from 18 partner NGOs gathered for HOVUCA's quarterly coordination meeting to align on advocacy priorities and programme delivery.",
        is_published=False,
        is_featured=False,
        program_title=None,
    ),
    dict(
        title="Volunteer Appreciation Evening 2024",
        description="Over 180 volunteers were celebrated at HOVUCA's annual appreciation evening, with awards across six categories and live music.",
        is_published=True,
        is_featured=True,
        program_title=None,
    ),
    dict(
        title="Soil Health Workshop — Nkolbisson",
        description="Farmers learned composting, organic fertiliser production, and soil conservation at a hands-on workshop held at the IRAD Demonstration Farm.",
        is_published=True,
        is_featured=False,
        program_title="Agri-Business Training",
    ),
    dict(
        title="Digital Literacy Bootcamp — Cohort 1",
        description="Archive photos from the very first HOVUCA digital skills bootcamp, held in January 2023 with 32 participants from three Yaoundé neighbourhoods.",
        is_published=True,
        is_featured=False,
        program_title="Digital Literacy Initiative",
    ),
]

# Each entry: (unsplash_url, title, caption, tags, is_featured)
GALLERY_IMAGES = [
    # Digital Literacy / Tech
    ("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200", "Students at laptops", "Participants working through the digital literacy curriculum on day two of the bootcamp.", ["digital", "youth", "education"], True),
    ("https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200", "Instructor explaining screen", "Programme coordinator Sarah Nkomo guides a participant through email setup.", ["digital", "education", "women"], False),
    ("https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1200", "Coding session", "Youth participants tackle their first HTML exercise during the web basics module.", ["digital", "coding", "youth"], True),
    ("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200", "Tablet training", "Community members practise using tablets at the Biyem-Assi learning hub.", ["digital", "community", "technology"], False),
    ("https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200", "Certificate distribution", "Graduates receive their digital literacy certificates at the cohort closing ceremony.", ["digital", "education", "celebration"], True),

    # Community / Events
    ("https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200", "Community gathering", "Over 300 community members attended the programme launch event at the Yaoundé City Hall.", ["community", "event", "youth"], True),
    ("https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200", "Group discussion", "Participants engage in a facilitated group dialogue during the mental health town hall.", ["community", "mental-health", "dialogue"], False),
    ("https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1200", "Gala evening", "Guests at the 2024 Annual Fundraising Gala at the Hilton Yaoundé.", ["fundraiser", "gala", "community"], True),
    ("https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200", "Panel discussion", "Investors and mentors provide feedback during the Youth Entrepreneurship Pitch Day.", ["entrepreneurship", "youth", "event"], False),
    ("https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200", "Conference room", "HOVUCA's quarterly partner coordination meeting in session.", ["partnerships", "meeting", "staff"], False),

    # Health
    ("https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200", "Health screening", "A nurse checks a community member's blood pressure at the Biyem-Assi screening day.", ["health", "community", "screening"], True),
    ("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200", "Medical consultation", "A volunteer doctor conducts a private consultation at the mobile health camp.", ["health", "volunteer", "women"], False),
    ("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200", "Health education", "Community health workers deliver a nutrition education session to mothers.", ["health", "education", "women"], False),

    # Environment / Agriculture
    ("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200", "Tree planting", "Volunteers plant native seedlings at the Soa Forest Reserve during tree planting day.", ["environment", "youth", "community"], True),
    ("https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200", "Farm training", "Smallholder farmers observe composting techniques at the Nkolbisson demonstration farm.", ["agriculture", "training", "women"], False),
    ("https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200", "Seedlings nursery", "Native tree seedlings being prepared at HOVUCA's nursery ahead of the mass planting event.", ["environment", "sustainability"], False),
    ("https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200", "Harvest celebration", "Agri-business programme participants show off their first post-training harvest.", ["agriculture", "women", "community"], True),

    # Water
    ("https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=1200", "Borehole handover", "Community leaders and HOVUCA staff at the official handover of the Mbalmayo borehole.", ["water", "community", "milestone"], True),
    ("https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200", "Water collection", "A woman draws clean water from the newly installed solar-powered pump in Mbalmayo.", ["water", "women", "community"], True),
    ("https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=1200", "World Water Day walk", "Participants in HOVUCA's World Water Day awareness walk carry jerricans through central Yaoundé.", ["water", "awareness", "community"], False),
]

# ---------------------------------------------------------------------------
# Donors
# ---------------------------------------------------------------------------
# Each entry maps directly to DonorOrganization fields.
# total_funded and tier are left at defaults — _seed_donors calls
# recalculate_totals() + recalculate_donor_tier() after creating grants so
# they are always computed from real data rather than hardcoded.
# ---------------------------------------------------------------------------

DONORS = [
    dict(
        name="Gates Foundation",
        abbreviation="GF",
        type="foundation",
        country="United States",
        city="Seattle",
        website="https://gatesfoundation.org",
        email="grants@gatesfoundation.org",
        status="active",
        focus_areas=["Education", "Health", "Digital Literacy"],
        notes="Primary funder of the Digital Literacy Initiative and Girls' Education Scholarship.",
    ),
    dict(
        name="Open Society Foundations",
        abbreviation="OSF",
        type="foundation",
        country="United States",
        city="New York",
        website="https://opensocietyfoundations.org",
        email="info@opensocietyfoundations.org",
        status="active",
        focus_areas=["Legal Aid", "Human Rights", "Refugee Integration"],
        notes="Supports the Legal Aid Clinic and Refugee Integration Support programme.",
    ),
    dict(
        name="USAID",
        abbreviation="USAID",
        type="government",
        country="United States",
        city="Washington D.C.",
        website="https://usaid.gov",
        email="cameroon@usaid.gov",
        status="active",
        focus_areas=["Health", "Agriculture", "Water & Sanitation"],
        notes="Multi-year partnership covering Clean Water Access and Community Health Outreach.",
    ),
    dict(
        name="UNICEF Cameroon",
        abbreviation="UNICEF",
        type="multilateral",
        country="Cameroon",
        city="Yaoundé",
        website="https://unicef.org/cameroon",
        email="yaoundé@unicef.org",
        status="active",
        focus_areas=["Child Protection", "Education", "Health"],
        notes="Co-funding partner for the Girls' Education Scholarship since 2021.",
    ),
    dict(
        name="Wellcome Trust",
        abbreviation="WT",
        type="foundation",
        country="United Kingdom",
        city="London",
        website="https://wellcome.org",
        email="grants@wellcome.org",
        status="active",
        focus_areas=["Health", "Mental Health", "Research"],
        notes="Funding the Mental Health Awareness Campaign and community health research activities.",
    ),
    dict(
        name="Ford Foundation",
        abbreviation="FF",
        type="foundation",
        country="United States",
        city="New York",
        website="https://fordfoundation.org",
        email="info@fordfoundation.org",
        status="active",
        focus_areas=["Inequality", "Education", "Women Empowerment"],
        notes="Three-year unrestricted grant supporting HOVUCA's organisational capacity building.",
    ),
    dict(
        name="Rockefeller Foundation",
        abbreviation="RF",
        type="foundation",
        country="United States",
        city="New York",
        website="https://rockefellerfoundation.org",
        email="grants@rockefellerfoundation.org",
        status="active",
        focus_areas=["Agriculture", "Food Security", "Environment"],
        notes="Supports the Agri-Business Training and Environmental Stewardship programmes.",
    ),
    dict(
        name="FCDO / British High Commission",
        abbreviation="FCDO",
        type="government",
        country="United Kingdom",
        city="London",
        website="https://gov.uk/world/organisations/british-high-commission-yaounde",
        email="yaounde.bhc@fcdo.gov.uk",
        status="active",
        focus_areas=["Governance", "Rule of Law", "Girls' Education"],
        notes="Annual grant to the Girls' Education Scholarship through the Girls' Education Challenge fund.",
    ),
    dict(
        name="Mastercard Foundation",
        abbreviation="MCF",
        type="foundation",
        country="Canada",
        city="Toronto",
        website="https://mastercardfdn.org",
        email="info@mastercardfdn.org",
        status="active",
        focus_areas=["Youth Employment", "Education", "Digital Skills"],
        notes="Flagship donor for the Youth Entrepreneurship programme and digital skills track.",
    ),
    dict(
        name="Comic Relief",
        abbreviation="CR",
        type="ngo",
        country="United Kingdom",
        city="London",
        website="https://comicrelief.com",
        email="grants@comicrelief.com",
        status="active",
        focus_areas=["Child Poverty", "Health", "Community Development"],
        notes="Project grant supporting community health screenings in peri-urban Yaoundé.",
    ),
    dict(
        name="Luminos Fund",
        abbreviation="LF",
        type="foundation",
        country="United States",
        city="Boston",
        website="https://luminosfund.org",
        email="info@luminosfund.org",
        status="active",
        focus_areas=["Education", "Out-of-School Children", "Girls"],
        notes="Funding accelerated learning components within the Girls' Education Scholarship.",
    ),
    dict(
        name="GIZ — Deutsche Gesellschaft für Internationale Zusammenarbeit",
        abbreviation="GIZ",
        type="government",
        country="Germany",
        city="Bonn",
        website="https://giz.de",
        email="cameroon@giz.de",
        status="active",
        focus_areas=["Vocational Training", "Agriculture", "Rural Development"],
        notes="Technical assistance and co-funding partner for the Agri-Business Training programme.",
    ),
    dict(
        name="AFD — Agence Française de Développement",
        abbreviation="AFD",
        type="government",
        country="France",
        city="Paris",
        website="https://afd.fr",
        email="yaounde@afd.fr",
        status="active",
        focus_areas=["Water & Sanitation", "Urban Development", "Climate"],
        notes="Provided a concessional grant for the Clean Water Access infrastructure in Mbalmayo.",
    ),
    dict(
        name="UNHCR Cameroon",
        abbreviation="UNHCR",
        type="multilateral",
        country="Cameroon",
        city="Yaoundé",
        website="https://unhcr.org/cameroon",
        email="cmryao@unhcr.org",
        status="active",
        focus_areas=["Refugee Protection", "Livelihoods", "Integration"],
        notes="Operational partnership agreement for the Refugee Integration Support programme.",
    ),
    dict(
        name="Aga Khan Foundation",
        abbreviation="AKF",
        type="foundation",
        country="Switzerland",
        city="Geneva",
        website="https://akdn.org/aga-khan-foundation",
        email="info@akfusa.org",
        status="active",
        focus_areas=["Rural Development", "Health", "Education"],
        notes="Piloting a rural health outreach model with HOVUCA in the Adamawa region.",
    ),
    dict(
        name="Norwegian Refugee Council",
        abbreviation="NRC",
        type="ngo",
        country="Norway",
        city="Oslo",
        website="https://nrc.no",
        email="cameroon@nrc.no",
        status="active",
        focus_areas=["Refugee Protection", "Legal Aid", "Shelter"],
        notes="Sub-granting arrangement — NRC channels ECHO funding through HOVUCA for refugee legal aid.",
    ),
    dict(
        name="Digital Africa Foundation",
        abbreviation="DAF",
        type="foundation",
        country="France",
        city="Paris",
        website="https://digital-africa.co",
        email="grants@digital-africa.co",
        status="active",
        focus_areas=["Digital Skills", "Tech Entrepreneurship", "Innovation"],
        notes="Seed funder of the Digital Literacy Initiative; continues as a strategic partner.",
    ),
    dict(
        name="Cameroon Baptist Convention Health Board",
        abbreviation="CBCHB",
        type="faith_based",
        country="Cameroon",
        city="Bamenda",
        website="https://cbchb.org",
        email="info@cbchb.org",
        status="lapsed",
        focus_areas=["Health", "HIV/AIDS", "Community Development"],
        notes="Collaborated on HIV/AIDS outreach 2019–2022; relationship dormant pending new programming.",
    ),
    dict(
        name="Mo Ibrahim Foundation",
        abbreviation="MIF",
        type="foundation",
        country="United Kingdom",
        city="London",
        website="https://mo.ibrahim.foundation",
        email="info@mo.ibrahim.foundation",
        status="prospect",
        focus_areas=["Governance", "Leadership", "Youth"],
        notes="Identified as a prospect for the Youth Entrepreneurship programme; introductory meeting scheduled.",
    ),
    dict(
        name="Children's Investment Fund Foundation",
        abbreviation="CIFF",
        type="foundation",
        country="United Kingdom",
        city="London",
        website="https://ciff.org",
        email="enquiries@ciff.org",
        status="active",
        focus_areas=["Child Health", "Nutrition", "Girls' Education"],
        notes="Co-investor in the Girls' Education Scholarship alongside FCDO; focuses on the nutrition component.",
    ),
]

# ---------------------------------------------------------------------------
# Donor grants — one or two representative completed grants per donor so that
# recalculate_totals() produces realistic tier assignments.
# (program_title=None is intentional for some entries — generic org support.)
# ---------------------------------------------------------------------------

DONOR_GRANTS = [
    # Gates Foundation — platinum
    dict(donor_name="Gates Foundation",                   title="Digital Literacy Initiative Year 1",           amount=120000, program_title="Digital Literacy Initiative",       funding_type="project",     years_ago=2),
    dict(donor_name="Gates Foundation",                   title="Girls' Scholarship Endowment 2024",            amount=80000,  program_title="Girls' Education Scholarship",       funding_type="project",     years_ago=1),
    # Open Society — gold
    dict(donor_name="Open Society Foundations",           title="Legal Aid Clinic Launch Grant",                amount=45000,  program_title="Legal Aid Clinic",                   funding_type="project",     years_ago=2),
    dict(donor_name="Open Society Foundations",           title="Refugee Integration Programme Support",        amount=30000,  program_title="Refugee Integration Support",         funding_type="project",     years_ago=1),
    # USAID — platinum
    dict(donor_name="USAID",                              title="Clean Water Access — Phase 1",                 amount=150000, program_title="Clean Water Access",                 funding_type="project",     years_ago=2),
    dict(donor_name="USAID",                              title="Community Health Outreach 2024",               amount=60000,  program_title="Community Health Outreach",           funding_type="project",     years_ago=1),
    # UNICEF — gold
    dict(donor_name="UNICEF Cameroon",                    title="Girls' Education Co-Funding 2023",             amount=35000,  program_title="Girls' Education Scholarship",       funding_type="project",     years_ago=1),
    # Wellcome Trust — gold
    dict(donor_name="Wellcome Trust",                     title="Mental Health Campaign Seed Grant",            amount=28000,  program_title="Mental Health Awareness Campaign",    funding_type="research",    years_ago=1),
    # Ford Foundation — gold
    dict(donor_name="Ford Foundation",                    title="Organisational Capacity Grant",                amount=50000,  program_title=None,                                 funding_type="operational", years_ago=1),
    # Rockefeller — gold
    dict(donor_name="Rockefeller Foundation",             title="Agri-Business Training Scale-Up",              amount=40000,  program_title="Agri-Business Training",              funding_type="project",     years_ago=1),
    # FCDO — gold
    dict(donor_name="FCDO / British High Commission",     title="Girls' Education Challenge 2023–2024",         amount=55000,  program_title="Girls' Education Scholarship",       funding_type="project",     years_ago=1),
    # Mastercard Foundation — platinum
    dict(donor_name="Mastercard Foundation",              title="Youth Entrepreneurship Programme Launch",      amount=90000,  program_title="Youth Entrepreneurship",             funding_type="project",     years_ago=2),
    dict(donor_name="Mastercard Foundation",              title="Digital Skills for Employment 2024",           amount=45000,  program_title="Digital Literacy Initiative",        funding_type="capacity",    years_ago=1),
    # Comic Relief — silver
    dict(donor_name="Comic Relief",                       title="Community Health Screenings Grant",            amount=18000,  program_title="Community Health Outreach",          funding_type="project",     years_ago=1),
    # Luminos Fund — silver
    dict(donor_name="Luminos Fund",                       title="Accelerated Learning for Girls",               amount=22000,  program_title="Girls' Education Scholarship",       funding_type="project",     years_ago=1),
    # GIZ — gold
    dict(donor_name="GIZ — Deutsche Gesellschaft für Internationale Zusammenarbeit", title="Agri-Business Technical Assistance", amount=38000, program_title="Agri-Business Training", funding_type="capacity", years_ago=1),
    # AFD — gold
    dict(donor_name="AFD — Agence Française de Développement", title="Mbalmayo Water Infrastructure Grant",    amount=75000,  program_title="Clean Water Access",                 funding_type="project",     years_ago=2),
    # UNHCR — silver
    dict(donor_name="UNHCR Cameroon",                     title="Refugee Integration Operational Support",     amount=20000,  program_title="Refugee Integration Support",         funding_type="operational", years_ago=1),
    # Aga Khan Foundation — silver
    dict(donor_name="Aga Khan Foundation",                title="Rural Health Outreach Pilot",                 amount=15000,  program_title="Community Health Outreach",          funding_type="project",     years_ago=1),
    # Norwegian Refugee Council — silver
    dict(donor_name="Norwegian Refugee Council",          title="ECHO Refugee Legal Aid Sub-Grant",            amount=24000,  program_title="Legal Aid Clinic",                   funding_type="project",     years_ago=1),
    # Digital Africa Foundation — silver
    dict(donor_name="Digital Africa Foundation",          title="Digital Literacy Initiative Seed Funding",    amount=12000,  program_title="Digital Literacy Initiative",        funding_type="project",     years_ago=3),
    # CBCHB — bronze (lapsed)
    dict(donor_name="Cameroon Baptist Convention Health Board", title="HIV/AIDS Community Outreach 2022",      amount=8000,   program_title="Community Health Outreach",          funding_type="project",     years_ago=3),
    # CIFF — gold
    dict(donor_name="Children's Investment Fund Foundation", title="Girls' Nutrition & Education Co-Grant",   amount=42000,  program_title="Girls' Education Scholarship",       funding_type="project",     years_ago=1),
    # Mo Ibrahim — prospect, no grant yet (skip)
]


# ===========================================================================
# Management Command
# ===========================================================================

class Command(BaseCommand):
    help = "Seed the database with realistic development data."

    def create_superuser(self):
        from apps.accounts.models import User

        if not User.objects.filter(username='ntsemancho').exists():
            user = User.objects.create_superuser(
                username='ntsemancho',
                email='ntsemancho@gmail.com',
                first_name='Ntse',
                last_name='Mancho',
                password='85213'
            )
            user.save()
            self.stdout.write(self.style.SUCCESS('Created superuser: ntsemancho'))
        else:
            self.stdout.write(self.style.WARNING('Superuser already exists'))

    def add_arguments(self, parser):
        parser.add_argument(
            "--flush",
            action="store_true",
            help="Flush the database before seeding (WARNING: deletes all data).",
        )
        parser.add_argument(
            "--app",
            type=str,
            default="all",
            choices=["all", "users", "org", "programs", "courses", "blog", "donations", "events", "gallery", "donors"],
            help="Seed only a specific section.",
        )

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write(self.style.WARNING("Flushing database..."))
            from django.core.management import call_command
            call_command("flush", "--noinput")

        app = options["app"]

        if app in ("all", "users"):
            self._seed_users()
        if app in ("all", "org"):
            self._seed_organization()
        if app in ("all", "programs"):
            self._seed_programs()
        if app in ("all", "courses"):
            self._seed_courses()
        if app in ("all", "blog"):
            self._seed_blog()
        if app in ("all", "donations"):
            self._seed_donations()
        if app in ("all", "events"):
            self._seed_events()
        if app in ("all", "gallery"):
            self._seed_gallery()
        if app in ("all", "donors"):
            self._seed_donors()

        self.stdout.write(self.style.SUCCESS("✅  Seed data complete."))

    # ------------------------------------------------------------------
    # Seeders
    # ------------------------------------------------------------------

    def _seed_users(self):
        from apps.accounts.models import User

        for data in USERS:
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults={**data, "is_active": True, "is_email_verified": True},
            )
            if created:
                user.set_password("password123")
                user.save()
                self.stdout.write(f"  Created user: {user.email}")

    def _seed_organization(self):
        from apps.accounts.models import User
        from apps.organization.models import Organization, Branch, Department

        org, _ = Organization.objects.get_or_create(
            slug=ORGANIZATION["slug"],
            defaults={k: v for k, v in ORGANIZATION.items() if k != "slug"},
        )

        manager = User.objects.filter(role="staff").first()
        branch, _ = Branch.objects.get_or_create(
            organization=org,
            slug=BRANCH["slug"],
            defaults={**{k: v for k, v in BRANCH.items() if k != "slug"}, "manager": manager},
        )

        for dept_name in DEPARTMENTS:
            Department.objects.get_or_create(
                branch=branch,
                name=dept_name,
                defaults=dict(description=f"{dept_name} department"),
            )

        self.stdout.write(f"  Organization '{org.name}' seeded.")

    def _seed_programs(self):
        from apps.organization.models import Organization
        from apps.programs.models import Program, Project

        org = Organization.objects.first()
        if not org:
            return

        for pdata in PROGRAMS:
            prog, created = Program.objects.get_or_create(
                slug=slugify(pdata["title"]),
                defaults=dict(organization=org, target_beneficiaries=500, **pdata),
            )
            if created:
                Project.objects.get_or_create(
                    program=prog,
                    slug=slugify(f"{pdata['title']}-phase-1"),
                    defaults=dict(
                        title=f"{pdata['title']} — Phase 1",
                        description=pdata.get("description", ""),
                        excerpt=pdata.get("excerpt", ""),
                        status="in_progress",
                        budget=50000,
                    ),
                )
                self.stdout.write(f"  Program '{prog.title}' seeded.")

    def _seed_courses(self):
        from apps.accounts.models import User
        from apps.elearning.models.course import Subject, Course
        from apps.elearning.models.module import Module
        from apps.elearning.models.chapter import Chapter

        instructor = User.objects.filter(email="instructor@hovuca.org").first()

        for subj_name in COURSE_SUBJECTS:
            subj, _ = Subject.objects.get_or_create(
                slug=slugify(subj_name),
                defaults=dict(name=subj_name, is_active=True),
            )

            course, created = Course.objects.get_or_create(
                slug=slugify(f"intro-to-{subj_name}"),
                defaults=dict(
                    subject=subj,
                    instructor=instructor,
                    title=f"Introduction to {subj_name}",
                    description=f"A beginner-friendly introduction to {subj_name}.",
                    difficulty="beginner",
                    estimated_hours=10,
                    is_published=True,
                    is_free=True,
                ),
            )

            if created:
                for mod_i in range(1, 3):
                    mod = Module.objects.create(
                        course=course,
                        title=f"Module {mod_i}: Foundations",
                        order=mod_i,
                    )
                    for ch_i in range(1, 4):
                        Chapter.objects.create(
                            module=mod,
                            title=f"Chapter {ch_i}: Topic {ch_i}",
                            order=ch_i,
                            content_type="text",
                            content_body=f"Content for chapter {ch_i} of module {mod_i}.",
                            duration_minutes=15,
                            is_preview=(ch_i == 1),
                        )
                self.stdout.write(f"  Course '{course.title}' seeded.")

    def _seed_blog(self):
        from apps.accounts.models import User
        from apps.blogs.models import Category, Tag, Article

        author = User.objects.filter(role="staff").first()

        for cat_name, color in BLOG_CATEGORIES:
            Category.objects.get_or_create(
                slug=slugify(cat_name),
                defaults=dict(name=cat_name, color=color, is_active=True),
            )

        for tag_name in BLOG_TAGS:
            Tag.objects.get_or_create(slug=tag_name, defaults=dict(name=tag_name))

        category = Category.objects.first()

        for adata in ARTICLES:
            article, created = Article.objects.get_or_create(
                title=adata["title"],
                slug=slugify(adata["title"]),
                defaults=dict(
                    author=author,
                    category=category,
                    status="published",
                    published_at=timezone.now(),
                    **{k: v for k, v in adata.items() if k != "title"},
                ),
            )
            if created:
                self.stdout.write(f"  Article '{article.title}' seeded.")

    def _seed_donations(self):
        from apps.donations.models import DonationCampaign

        for cdata in DONATION_CAMPAIGNS:
            campaign, created = DonationCampaign.objects.get_or_create(
                slug=slugify(cdata["title"]),
                defaults=dict(
                    description=f"Help us reach our goal: {cdata['title']}",
                    raised_amount=0,
                    **cdata,
                ),
            )
            if created:
                self.stdout.write(f"  Campaign '{campaign.title}' seeded.")

    def _seed_events(self):
        from django.utils import timezone
        from datetime import timedelta
        from apps.accounts.models import User
        from apps.programs.models import Program
        from apps.events.models import EventCategory, Event

        organizer = User.objects.filter(role="staff").first()

        for cat_data in EVENT_CATEGORIES:
            EventCategory.objects.get_or_create(
                slug=slugify(cat_data["name"]),
                defaults=dict(
                    name=cat_data["name"],
                    color=cat_data["color"],
                    is_active=True,
                ),
            )

        for edata in EVENTS:
            category = EventCategory.objects.filter(name=edata["category_name"]).first()
            program = None
            if edata.get("program_title"):
                program = Program.objects.filter(title=edata["program_title"]).first()

            now = timezone.now()
            start = now + timedelta(days=edata["days_from_now"])
            end = start + timedelta(hours=edata["duration_hours"])

            event, created = Event.objects.get_or_create(
                slug=slugify(edata["title"]),
                defaults=dict(
                    title=edata["title"],
                    excerpt=edata["excerpt"],
                    description=edata["description"],
                    event_type=edata["event_type"],
                    location_name=edata.get("location_name", ""),
                    location_address=edata.get("location_address", ""),
                    online_url=edata.get("online_url", ""),
                    status=edata["status"],
                    is_featured=edata["is_featured"],
                    is_registration_required=edata["is_registration_required"],
                    max_attendees=edata.get("max_attendees"),
                    start_date=start,
                    end_date=end,
                    organizer=organizer,
                    category=category,
                    program=program,
                ),
            )
            if created:
                self.stdout.write(f"  Event '{event.title}' seeded.")

    def _seed_gallery(self):
        import urllib.request
        import tempfile
        import os
        from django.core.files import File
        from apps.accounts.models import User
        from apps.programs.models import Program
        from apps.gallery.models import GalleryAlbum, GalleryImage

        uploader = User.objects.filter(role="staff").first()
        albums = []

        for adata in GALLERY_ALBUMS:
            program = None
            if adata.get("program_title"):
                program = Program.objects.filter(title=adata["program_title"]).first()

            album, created = GalleryAlbum.objects.get_or_create(
                slug=slugify(adata["title"]),
                defaults=dict(
                    title=adata["title"],
                    description=adata["description"],
                    is_published=adata["is_published"],
                    is_featured=adata["is_featured"],
                    created_by=uploader,
                    program=program,
                ),
            )
            albums.append(album)
            if created:
                self.stdout.write(f"  Gallery album '{album.title}' seeded.")

        if not albums:
            return

        for i, (url, title, caption, tags, is_featured) in enumerate(GALLERY_IMAGES):
            album = albums[i % len(albums)]

            if GalleryImage.objects.filter(album=album, title=title).exists():
                continue

            try:
                with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
                    urllib.request.urlretrieve(url, tmp.name)
                    tmp_path = tmp.name

                with open(tmp_path, "rb") as f:
                    fname = slugify(title) + ".jpg"
                    img = GalleryImage(
                        album=album,
                        uploaded_by=uploader,
                        title=title,
                        caption=caption,
                        alt_text=title,
                        tags=tags,
                        is_featured=is_featured,
                        order=i,
                        media_type="photo",
                    )
                    img.image.save(fname, File(f), save=True)

                os.unlink(tmp_path)
                self.stdout.write(f"  Image '{title}' seeded into '{album.title}'.")
            except Exception as exc:
                self.stdout.write(
                    self.style.WARNING(f"  Could not fetch image '{title}': {exc}")
                )

    def _seed_donors(self):
        from datetime import timedelta
        from apps.accounts.models import User
        from apps.programs.models import Program
        from apps.donors.models import DonorOrganization, DonorContact, Grant
        from apps.donors import services as donor_services

        relationship_owner = User.objects.filter(role="staff").first()

        # ── 1. Create / update DonorOrganization records ──────────────────────
        for ddata in DONORS:
            org, created = DonorOrganization.objects.get_or_create(
                slug=slugify(ddata["name"]),
                defaults=dict(
                    relationship_owner=relationship_owner,
                    currency="USD",
                    prefers_anonymous=False,
                    **ddata,
                ),
            )
            if created:
                # Seed one primary contact per organisation
                DonorContact.objects.create(
                    organization=org,
                    first_name="Grants",
                    last_name="Office",
                    role="grants_manager",
                    email=ddata.get("email", ""),
                    is_primary=True,
                )
                self.stdout.write(f"  Donor org '{org.name}' seeded.")

        # ── 2. Create completed grants ────────────────────────────────────────
        for gdata in DONOR_GRANTS:
            donor_org = DonorOrganization.objects.filter(
                name=gdata["donor_name"]
            ).first()
            if not donor_org:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Donor '{gdata['donor_name']}' not found — skipping grant."
                    )
                )
                continue

            program = None
            if gdata.get("program_title"):
                program = Program.objects.filter(title=gdata["program_title"]).first()

            # Compute a realistic disbursed_date from years_ago
            disbursed = timezone.now().date() - timedelta(days=365 * gdata["years_ago"])
            agreement = disbursed - timedelta(days=90)
            reporting_deadline = disbursed + timedelta(days=180)

            ref_code = (
                f"{donor_org.abbreviation or donor_org.name[:3].upper()}"
                f"-{disbursed.year}"
                f"-{Grant.objects.filter(donor_organization=donor_org).count() + 1:03d}"
            )

            grant, created = Grant.objects.get_or_create(
                donor_organization=donor_org,
                title=gdata["title"],
                defaults=dict(
                    program=program,
                    reference_code=ref_code,
                    funding_type=gdata["funding_type"],
                    amount=gdata["amount"],
                    currency="USD",
                    status=Grant.Status.COMPLETED,
                    agreement_date=agreement,
                    disbursed_date=disbursed,
                    reporting_deadline=reporting_deadline,
                    report_submitted=True,
                    report_submitted_at=timezone.now() - timedelta(days=30),
                    internal_owner=relationship_owner,
                    notes=f"Seeded grant for {donor_org.name}.",
                ),
            )
            if created:
                self.stdout.write(
                    f"  Grant '{grant.title}' → {donor_org.name} seeded."
                )

        # ── 3. Recalculate totals + tier for every donor ──────────────────────
        for org in DonorOrganization.objects.filter(deleted_at__isnull=True):
            org.recalculate_totals()
            donor_services.recalculate_donor_tier(org)

        self.stdout.write("  Donor totals and tiers recalculated.")


# ===========================================================================
# Standalone entry point
# ===========================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed the database with development data.")
    parser.add_argument("--flush", action="store_true", help="Flush the database before seeding.")
    parser.add_argument(
        "--app",
        type=str,
        default="all",
        choices=["all", "users", "org", "programs", "courses", "blog", "donations", "events", "gallery", "donors"],
        help="Seed only a specific section.",
    )
    args = parser.parse_args()

    Command().handle(verbosity=1, flush=args.flush, app=args.app)