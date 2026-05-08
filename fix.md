# MedClaro Frontend & Feature Audit Plan

Based on the strategic vision outlined in `Features.md` and an audit of the current frontend implementation, this document details the gaps between the ideal real-world use cases and the existing codebase. It provides a structured plan for an AI IDE to execute improvements.

## 1. Collaborative Family "Care Circles" (High Priority Gap)

**Current State:** 
The current implementation (`client/components/dashboard/family-client.tsx`) only supports "Family Profiles" under a single user account. You can switch profiles using local storage (`window.localStorage.setItem("selectedFamilyMemberId", ...)`). 
**The Issue:** 
This is not a "Networked Model" with role-based access (Admins, Contributors, Viewers) as specified. It doesn't allow a sibling or spouse to log in with their own account and collaborate. It's essentially just filtering data for one user.
**Proposed Fix:**
- **Backend/DB Schema:** Update the database to support a `CareCircle` collection where multiple `User` IDs can be linked with roles (Admin, Contributor, Viewer).
- **Frontend Refactor:** Redesign `family-client.tsx` to handle invitations via email/link. 
- **Activity Feed:** Ensure `activity-feed.tsx` aggregates events from all members in the circle instead of just the currently selected local profile.

## 2. The Unified "Omni-Aware" Personal Health Assistant (High Priority Gap)

**Current State:** 
The chatbot (`client/components/reports/chat-panel.tsx`) is tied directly to a single `reportId` (`/reports/${reportId}/chat`). 
**The Issue:** 
The vision mandates a persistent, global Chatbot that has context of **all** reports, medications, and family history. Users currently cannot ask comparative queries like "Did my cholesterol medicine from last month actually lower my LDL today?" because the chat context is isolated to a single PDF.
**Proposed Fix:**
- **Global Chat UI:** Create a floating global chat widget or a dedicated `/assistant` page.
- **Context Aggregation:** Modify the backend chat endpoint to accept a `userId` or `familyMemberId` and aggregate their entire "Health State" (latest N reports, active medications) into the Gemini prompt context.

## 3. WhatsApp / Voice Integration (Medium Priority Gap)

**Current State:** 
The app has a share to WhatsApp button (`wa.me/?text=...`) in `summary-generator.tsx` and text-to-speech in `emergency-card.tsx`.
**The Issue:** 
`Features.md` specifies a *WhatsApp bot* where Grandpa can send a voice note and get a reply. Currently, there is no bidirectional WhatsApp bot integration.
**Proposed Fix:**
- **Backend Setup:** Integrate the Twilio API or WhatsApp Cloud API in the backend.
- **Webhook:** Set up a webhook to receive incoming audio/text messages, pass them to Gemini, and reply via WhatsApp.

## 4. UI/UX and Layout Polish

**Current State:** 
The UI uses a solid foundation (Tailwind, Lucide icons, modern card layouts).
**The Issue:** 
Some components feel disconnected or rely on basic visual cues. Switching family profiles via local storage and a full-page reload isn't smooth. The timeline can get cluttered.
**Proposed Fix:**
- **Profile Switcher:** Implement a modern dropdown/avatar cluster in the global navbar (Header) to switch Care Circle contexts instantly without full page reloads.
- **Unified Dashboard:** Rather than hiding things under "Switch Profile", the dashboard could show a unified summary of the whole family's critical alerts (e.g., "Grandpa's sugar is high", "Mom needs a checkup") at the top.

## Execution Plan for AI IDE

When executing the next phases, prioritize these steps:

1. **Step 1: Database Migration for Care Circles**
   - Create `Circle` and `CircleMember` models.
   - Migrate existing family profiles to the new Circle structure.

2. **Step 2: Omni-Aware Chatbot Implementation**
   - Create `client/components/ui/global-chat.tsx`.
   - Implement the `Health State` JSON summarizer on the backend before calling Gemini.

3. **Step 3: Update Chat Panel UI**
   - Remove the `reportId` dependency from the chat panel. 
   - Allow the chat panel to reference specific reports in its UI responses (e.g., citations).

4. **Step 4: Real-time UI Polish**
   - Ensure `timelineUpdating` and other loading states use skeleton loaders rather than just lowering opacity and blurring.
