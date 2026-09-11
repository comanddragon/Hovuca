# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary: institutional partners and grant makers evaluating HOVUCA's credibility, focus, evidence, and potential fit for partnership.
- Secondary: prospective volunteers looking for a meaningful way to contribute.
- The public site also serves people exploring HOVUCA's programs, projects, publications, events, and community stories.

## Product Purpose

HOVUCA's public website explains the organization's work with vulnerable children, girls, young people, and communities across Cameroon. Its primary visitor outcome is confident exploration of HOVUCA's impact; partnership and volunteering are important next steps after that understanding is earned.

## Positioning

HOVUCA combines research, education, advocacy, practical programs, and community partnership. Existing public copy positions children and young people as partners in change rather than passive beneficiaries.

## Operating Context

Institutional visitors need to move from a concise understanding of HOVUCA to concrete programs, projects, evidence, publications, partners, and ways to make contact. Prospective volunteers need a clear path from the same impact story to opportunities for participation.

## Capabilities and Constraints

- Existing Next.js public routes cover programs, projects, events, blog stories, gallery collections, documents, courses, donations, contact, and organizational information.
- Public content is backed by the Django API and must continue to support dynamically managed programs, articles, projects, resources, and related material.
- The redesign is picture-first and must use carefully selected licensed photography, not placeholders. These images will be replaced with HOVUCA's own consent-cleared photography later.
- Photography involving children must be dignified and avoid exploitative or pity-led framing.
- Existing factual claims and impact numbers must not be expanded or invented; hard-coded claims currently visible on the site require organizational verification before they are treated as evidence.

## Brand Commitments

- Preserve the HOVUCA name, logo, Cameroonian context, and focus on vulnerable children, girls, young people, and communities.
- The experience should feel professional enough for institutional due diligence while remaining human and welcoming to volunteers.
- Impact exploration is the primary journey. Partnership and volunteer conversion should follow proof rather than interrupt it.
- The approved visual direction is the polished NGO category standard, executed without experimental motifs or ironic deviations.
- Quality references: UNESCO for institutional hierarchy and deep-content navigation; Peace First for youth agency and human storytelling; UNFPA for evidence, publication access, and dignity-first photography. These are craft benchmarks, not identities to copy.

## Evidence on Hand

- Existing program, project, article, event, resource, gallery, course, donation, donor, and volunteer content structures.
- A library of partner and donor logos in `frontend/public/donors/`.
- Existing HOVUCA imagery and public copy, which can guide subject matter but are not sufficient as the redesign's final picture-first library.
- Existing homepage figures such as project and reach counts are present in code but have not been confirmed by the user; they must be verified or replaced by sourced metrics before launch.
- No testimonials, grant outcomes, audit claims, or institutional endorsements should be invented.

## Product Principles

1. Let documented work and real evidence establish credibility before asking for support.
2. Present children and communities with agency, dignity, and context.
3. Make HOVUCA's Cameroonian grounding unmistakable without reducing the organization to visual clichés.
4. Give institutional partners a coherent path from mission to programs, evidence, governance, and contact.
5. Keep volunteering visible as a meaningful secondary path.

## Accessibility & Inclusion

- Photography and written content must remain understandable with useful alternative text and without relying on imagery alone.
- Navigation and impact storytelling must work across desktop and mobile, with reduced-motion support and keyboard-accessible interactions.
- Avoid imagery, language, or interaction patterns that sensationalize vulnerability.
