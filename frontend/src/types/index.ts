// ─── Core ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// ─── Auth / User ──────────────────────────────────────────────────────────────

export type UserRole = "admin" | "staff" | "volunteer" | "student" | "donor";

export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone_number: string;
    avatar: string | null;
    role: UserRole;
    is_email_verified: boolean;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface UserPublic {
    id: string;
    email: string;
    full_name: string;
    avatar: string | null;
    role: UserRole;
}

export interface AuthTokens {
    access: string;
    refresh: string;
}

export interface LoginResponse {
    user: UserPublic;
}

export interface RegisterPayload {
    email: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    role?: UserRole;
    password: string;
    password_confirm: string;
}

export interface UpdateProfilePayload {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    avatar?: File;
}

export interface ChangePasswordPayload {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
}

// ─── Organization ─────────────────────────────────────────────────────────────

export interface Organization {
    id: string;
    name: string;
    slug: string;
    description: string;
    logo: string | null;
    website: string;
    email: string;
    phone: string;
    address: string;
    founded_year: number | null;
    is_active: boolean;
}

export interface Branch {
    id: string;
    organization: string;
    name: string;
    slug: string;
    location: string;
    manager: UserPublic | null;
    is_active: boolean;
}

export interface Department {
    id: string;
    branch: string;
    name: string;
    description: string;
    head: UserPublic | null;
}

// ─── Programs & Projects ──────────────────────────────────────────────────────

export type ProgramStatus = "draft" | "active" | "completed" | "cancelled";
export type ProjectStatus = "planning" | "in_progress" | "completed" | "on_hold";

export interface Program {
    id: string;
    organization: string;
    title: string;
    slug: string;
    excerpt: string;
    description: string;
    banner: string | null;
    status: ProgramStatus;
    start_date: string | null;
    end_date: string | null;
    target_beneficiaries: number;
    created_at: string;
}

export interface Project {
    id: string;
    program: Program | string;
    title: string;
    slug: string;
    excerpt: string;
    description: string;
    cover_image: string | null;
    cover_image_alt: string;
    lead: UserPublic | null;
    status: ProjectStatus;
    progress_percentage: string;
    raised_amount: string;
    target_beneficiaries: number | null;
    budget: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string;
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export type ArticleStatus = "draft" | "review" | "published" | "archived";

export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string;
    color: string;
    is_active: boolean;
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
}

export interface ArticleTopic {
    id: string;
    name: string;
    slug: string;
    parent: string | null;
}

export interface Article {
    id: string;
    author: UserPublic | null;
    category: Category | null;
    tags: Tag[];
    topics: ArticleTopic[];
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    cover_image: string | null;
    cover_image_alt: string;
    status: ArticleStatus;
    is_featured: boolean;
    published_at: string | null;
    meta_title: string;
    meta_description: string;
    view_count: number;
    reading_time_minutes: number;
    like_count: number;
    comment_count: number;
    program: string | null;
    created_at: string;
    is_liked: boolean;
    is_bookmarked: boolean;
}

export interface Comment {
    id: string;
    article: string;
    author: UserPublic | null;
    parent: string | null;
    body: string;
    is_approved: boolean;
    is_pinned: boolean;
    reply_count: number;
    replies?: Comment[];
    created_at: string;
}

export interface Resource {
    id: string;
    title: string;
    slug: string;
    description: string;
    category: string;
    file_url: string;
    published_at: string | null;
    created_at: string;
}

// ─── Donations ────────────────────────────────────────────────────────────────

export type CampaignStatus = "active" | "closed" | "draft";
export type DonationStatus = "pending" | "completed" | "failed" | "refunded";
export type DonationGateway = "stripe" | "paypal" | "manual";

export interface DonationPaymentSettings {
    bank_name: string;
    account_name: string;
    account_number: string;
    iban: string;
    swift_code: string;
    bank_currency: string;
    bank_instructions: string;
    paypal_url: string;
    campay_url: string;
}

export interface DonationCampaign {
    id: string;
    program: string | null;
    title: string;
    slug: string;
    description: string;
    goal_amount: string;
    raised_amount: string;
    progress_percentage: number;
    status: CampaignStatus;
    start_date: string | null;
    end_date: string | null;
    banner: string | null;
    created_at: string;
}

export interface Donation {
    id: string;
    donor: UserPublic | null;
    campaign: string | null;
    amount: string;
    currency: string;
    gateway: DonationGateway;
    gateway_transaction_id: string;
    status: DonationStatus;
    is_anonymous: boolean;
    message: string;
    receipt_sent: boolean;
    created_at: string;
}

export interface DonationPayload {
    campaign?: string;
    amount: number;
    currency?: string;
    gateway: DonationGateway;
    is_anonymous?: boolean;
    message?: string;
}

// ─── E-Learning ───────────────────────────────────────────────────────────────

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type ContentType = "video" | "text" | "pdf";
export type EnrollmentStatus = "enrolled" | "completed" | "dropped";

export interface Subject {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    is_active: boolean;
    course_count: number;
}

export interface Course {
    id: string;
    subject: Subject | null;
    instructor: UserPublic | null;
    title: string;
    slug: string;
    description: string;
    thumbnail: string | null;
    difficulty: CourseLevel;
    is_published: boolean;
    is_free: boolean;
    estimated_hours: number;
    enrollment_count: number;
    modules?: Module[];
    created_at: string;
}

export interface Module {
    id: string;
    course: string;
    title: string;
    description: string;
    order: number;
    age_min: number;
    age_max: number | null;
    chapter_count: number;
    has_quiz: boolean;
    chapters?: Chapter[];
}

export interface Chapter {
    id: string;
    module: string;
    title: string;
    content_type: ContentType;
    order: number;
    duration_minutes: number;
    is_preview: boolean;
    content_url?: string;
    content_body?: string;
    content_file?: string | null;
}

export interface Enrollment {
    id: string;
    user: UserPublic;
    course: Course;
    status: EnrollmentStatus;
    progress_percentage: number;
    enrolled_at: string;
    completed_at: string | null;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    pass_percentage: number;
    time_limit_minutes: number | null;
    max_attempts: number;
    is_active: boolean;
    questions?: Question[];
}

export interface Question {
    id: string;
    text: string;
    question_type: "mcq" | "true_false";
    order: number;
    marks: number;
    explanation: string;
    choices: Choice[];
}

export interface Choice {
    id: string;
    text: string;
    is_correct?: boolean;
}

export interface QuizAttempt {
    id: string;
    quiz: string;
    score: number;
    max_score: number;
    passed: boolean;
    percentage: number;
    started_at: string;
    completed_at: string | null;
}

// ─── Volunteers ───────────────────────────────────────────────────────────────

export type AvailabilityStatus = "available" | "busy" | "inactive";
export interface VolunteerApplicationPayload {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    occupation: string;
    skills: string;
    interests: string;
    availability: string;
    hours_per_week: number;
    motivation: string;
    contact_consent: boolean;
}
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface VolunteerProfile {
    id: string;
    user: UserPublic;
    bio: string;
    skills: string[];
    availability: AvailabilityStatus;
    hours_contributed: number;
    department: Department | null;
    created_at: string;
}

export interface VolunteerTask {
    id: string;
    volunteer: string;
    project: Project | null;
    title: string;
    description: string;
    status: TaskStatus;
    due_date: string | null;
    hours_logged: string;
    created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType = "system" | "course" | "quiz" | "donation" | "volunteer" | "chat";

export interface Notification {
    id: string;
    notification_type: NotificationType;
    title: string;
    body: string;
    action_url: string;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventStatus = "draft" | "published" | "cancelled" | "completed";
export type EventType = "in_person" | "online" | "hybrid";
export type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "waitlisted";

/** A single slide image uploaded to an event via /api/v1/events/{slug}/images/ */
export interface EventImage {
    id: number;
    image: string;
    alt_text: string;
    order: number;
}

export interface EventRegistration {
    id: number;
    event: number;
    user: { id: number; full_name: string; email: string };
    status: RegistrationStatus;
    notes: string;
    checked_in_at: string | null;
    created_at: string;
}

export interface EventCategory {
    id: number;
    name: string;
    slug: string;
    description: string;
    color: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EventList {
    id: number;
    slug: string;
    title: string;
    excerpt: string;
    cover_image: string | null;
    cover_image_alt: string;
    start_date: string;
    end_date: string;
    event_type: EventType;
    status: EventStatus;
    is_featured: boolean;
    is_registration_required: boolean;
    max_attendees: number | null;
    location_name: string;
    category: EventCategory | null;
    organizer_name: string | null;
    attendee_count: number;
    is_full: boolean;
    is_registered: boolean;
    view_count: number;
    created_at: string;
}

export interface EventDetail extends EventList {
    description: string;
    location_address: string;
    online_url: string;
    registration_deadline: string | null;
    meta_title: string;
    meta_description: string;
    /** Extra slideshow images — ordered by `order` asc, uploaded via images endpoint */
    images: EventImage[];
    my_registration: {
        id: number;
        user: number;
        user_full_name: string;
        user_email: string;
        status: RegistrationStatus;
        notes: string;
        checked_in_at: string | null;
        created_at: string;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface EventWrite {
    title: string;
    excerpt?: string;
    description?: string;
    cover_image?: File | null;
    cover_image_alt?: string;
    start_date: string;
    end_date: string;
    event_type?: EventType;
    location_name?: string;
    location_address?: string;
    online_url?: string;
    is_registration_required?: boolean;
    registration_deadline?: string | null;
    max_attendees?: number | null;
    category?: number | null;
    program?: number | null;
    is_featured?: boolean;
    meta_title?: string;
    meta_description?: string;
}

export interface EventRegistrationWrite {
    notes?: string;
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export type MediaType = "photo" | "video";

export interface GalleryImage {
    id: number;
    album: number;
    uploaded_by: { id: number; full_name: string } | null;
    image: string;
    thumbnail: string | null;
    media_type: MediaType;
    title: string;
    caption: string;
    alt_text: string;
    tags: string[];
    order: number;
    is_featured: boolean;
    view_count: number;
    created_at: string;
}

export interface GalleryAlbumList {
    id: number;
    slug: string;
    title: string;
    description: string;
    cover_image: string | null;
    effective_cover: string | null;
    is_published: boolean;
    is_featured: boolean;
    taken_at: string | null;
    image_count: number;
    created_by: { id: number; full_name: string } | null;
    event: number | null;
    program: number | null;
    project: number | null;
    created_at: string;
}

export interface GalleryAlbumDetail extends GalleryAlbumList {
    images: GalleryImage[];
}

export interface GalleryAlbumWrite {
    title: string;
    description?: string;
    cover_image?: File | null;
    is_published?: boolean;
    is_featured?: boolean;
    taken_at?: string | null;
    event?: number | null;
    program?: number | null;
    project?: number | null;
}

export interface GalleryImageWrite {
    album: number;
    image?: File;
    media_type?: MediaType;
    title?: string;
    caption?: string;
    alt_text?: string;
    tags?: string[];
    order?: number;
    is_featured?: boolean;
}

// ─── Donors ───────────────────────────────────────────────────────────────────
// Add these to src/types/index.ts alongside your existing types

export type DonorType =
    | "foundation"
    | "corporation"
    | "government"
    | "ngo"
    | "multilateral"
    | "faith_based"
    | "individual"
    | "other";

export type DonorTier = "platinum" | "gold" | "silver" | "bronze";

export type DonorStatus = "active" | "lapsed" | "prospect" | "inactive";

export interface DonorOrganization {
    id: string;
    name: string;
    slug: string;
    website: string | null;
    abbreviation: string;
    type: DonorType;
    logo: string | null;
    country: string;
    tier: DonorTier;
    status: DonorStatus;
    total_funded: string;   // DecimalField → string in DRF
    currency: string;
    first_funded_at: string | null;
    last_funded_at: string | null;
    grant_count: number;    // annotated on the list endpoint
    created_at: string;
}

export interface DonorOrganizationDetail extends DonorOrganization {
    description: string;
    website: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    focus_areas: string[];
    prefers_anonymous: boolean;
    notes: string;
    relationship_owner: UserPublic | null;
    contacts: DonorContact[];
    recent_grants: Grant[];
    updated_at: string;
}

export interface DonorContact {
    id: string;
    organization: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role:
        | "programme_officer"
        | "grants_manager"
        | "executive"
        | "finance"
        | "other";
    email: string;
    phone: string;
    is_primary: boolean;
    notes: string;
    created_at: string;
    updated_at: string;
}

export type GrantStatus = "pending" | "completed" | "cancelled";

export type GrantFundingType =
    | "project"
    | "operational"
    | "capacity"
    | "emergency"
    | "research"
    | "other";

export interface Grant {
    id: string;
    reference_code: string;
    title: string;
    donor_organization: string;
    donor_organization_name: string;
    program: string | null;
    program_title: string | null;
    project: string | null;
    project_title: string | null;
    funding_type: GrantFundingType;
    amount: string;
    currency: string;
    status: GrantStatus;
    agreement_date: string | null;
    disbursed_date: string | null;
    reporting_deadline: string | null;
    report_submitted: boolean;
    created_at: string;
}

export interface GrantDetail extends Grant {
    campaign: string | null;
    agreement_document: string | null;
    report_submitted_at: string | null;
    contact: DonorContact | null;
    internal_owner: UserPublic | null;
    notes: string;
    updated_at: string;
}

export interface DonorEngagement {
    id: string;
    organization: string;
    organization_name: string;
    contact: string | null;
    contact_name: string | null;
    logged_by: UserPublic | null;
    grant: string | null;
    grant_title: string | null;
    type:
        | "email"
        | "meeting"
        | "call"
        | "report"
        | "visit"
        | "event"
        | "proposal"
        | "other";
    date: string;
    summary: string;
    outcome: string;
    next_action: string;
    next_action_date: string | null;
    created_at: string;
    updated_at: string;
}

export interface DonorSummary {
    total_organizations: number;
    active_organizations: number;
    total_grants: number;
    total_funded_usd: string;
    platinum_count: number;
    gold_count: number;
    silver_count: number;
    bronze_count: number;
}

// ─── Filter shapes (consumed by the service) ──────────────────────────────────

export interface DonorOrganizationFilters {
    status?: DonorStatus;
    tier?: DonorTier;
    type?: DonorType;
    country?: string;
    search?: string;
    page?: number;
    page_size?: number;
}

export interface GrantFilters {
    donor?: string;
    status?: GrantStatus;
    funding_type?: GrantFundingType;
    program?: string;
    year?: number | string;
    search?: string;
    page?: number;
    page_size?: number;
}

export interface DonorEngagementFilters {
    organization?: string;
    type?: DonorEngagement["type"];
    page?: number;
    page_size?: number;
}
