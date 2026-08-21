# Aurumi Doc Studio

Build a new micro app called Aurumi Guide Studio.

This application will be the central authoring, management, review, publishing and knowledge source system for Aurumi product Help and Guides.

For this first build, focus ONLY on:

Application shell and navigation

Simulated backend/provider architecture

Mock API integrations

Realistic seed data

Dashboard

Guide Library

Basic data loading, filtering and detail navigation

Do NOT build the full article authoring editor, approval workflow, publishing workflow, public Help Portal or AI chat experience yet. Those will be added in later builds.

1. PRODUCT PURPOSE

Aurumi Guide Studio manages Help Guides and documentation for:

Aurumi micro apps

Aurumi product features

Aurumi AI capabilities and intents

Third-party connectors and their capabilities

Configuration and administration

Troubleshooting

General product concepts and policies

The same published Guide will eventually be used by:

A standard web Help Portal

In-app contextual Help

Aurumi Help via conversational Chat Interface

Future AI-powered support experiences

Guide Studio is the authoring and management system. It is not the public Help Portal.

2. IMPORTANT ARCHITECTURAL PRINCIPLE

Guide Studio must NOT directly import or depend on mock JSON files from UI components.

Use a provider/service architecture.

The UI must communicate with provider interfaces.

For this prototype, those providers return simulated asynchronous API responses using seeded mock data.

Later, the mock providers should be replaceable with real APIs without changing the UI or core Guide Studio domain model.

Architecture:

External Source Providers
↓
Normalized Reference Models
↓
Guide Studio Domain / Associations
↓
Guide Library and future Article Lifecycle

3. SIMULATED EXTERNAL PROVIDERS

A. DevHarmony Provider

DevHarmony owns Apps and Features.

The hierarchy is:

DevHarmony
→ Apps
→ Features
→ Feature Versions

Do NOT assume Guide Studio can fetch one flat global Features list.

Use simulated provider methods equivalent to:

getApps()

getFeaturesByApp(appId)

getFeatureVersions(featureId)

Use async simulated API calls.

Seed DevHarmony Apps:

Deals

Features:

Create Deal

Edit Deal

Update Deal Stage

Delete Deal

Merge Duplicate Deals

Export Deals

Employee Management

Features:

Create Employee

Invite Employee

Edit Employee

Manage Employee Roles

Deactivate Employee

Attendance & Leave

Features:

Configure Attendance

Configure Leave Policies

Apply for Leave

Approve Leave

View Attendance Reports

Each Feature should have a stable external ID.

Simulate at least some Features having versions, for example:

Create Deal:

Version 1.0

Version 1.1

Update Deal Stage:

Version 1.0

Version 2.0

Most other Features can initially have Version 1.0.

Feature versions are important because Guide Studio will eventually associate documentation with applicable product versions.

B. Aurumi AI Studio Provider

Aurumi AI Studio Conversation Studio owns the hierarchy:

Topics
→ Intents
→ Utterances

For this build, Guide Studio only needs to consume Topics and Intents.

Use simulated provider methods equivalent to:

getTopics()

getIntentsByTopic(topicId)

Do NOT load all Intents automatically when the application starts.

Fetch Topics first and load Intents for a Topic when required.

Seed Topics:

Deals

Intents:

Create Deal

Edit Deal

Delete Deal

Why Can't I Edit a Deal?

How Do I Change a Deal Stage?

Employee Management

Intents:

Add Employee

Invite Employee

Change Employee Role

Why Can't I Access Employee Management?

Connectors

Intents:

Connect Zoho Books

Zoho Authentication Failed

Invoice Synchronisation Failed

Disconnect Zoho Books

Each Intent should have:

Stable external ID

Name

Topic reference

Short description

Simulated utterance count

Do not build utterance editing in this app.

C. Connector Provider

Third-party software may need Help Guides even when there is no corresponding DevHarmony Feature.

The hierarchy is:

Connector
→ Capabilities

Use simulated provider methods equivalent to:

getConnectors()

getCapabilitiesByConnector(connectorId)

Seed Connectors:

Zoho Books

Capabilities:

Connect Zoho Books

Authenticate Account

Configure Invoice Synchronisation

Disconnect Zoho Books

WhatsApp Business

Capabilities:

Connect WhatsApp Account

Configure Business Number

Configure Message Synchronisation

Each Connector and Capability should have stable external IDs.

4. GUIDE STUDIO DOMAIN MODEL

Guide Studio owns Guides independently from the external source systems.

Do NOT make a DevHarmony Feature, AI Intent or Connector Capability the parent record of a Guide.

A Guide is an independent domain entity.

Use a model conceptually equivalent to:

Guide

id

title

slug

summary

guideType

status

currentVersion

owner

createdAt

updatedAt

publishedAt

associations

Guide Types:

How-To Guide

Troubleshooting

Concept

Configuration

Administration

Connector Guide

Policy / Reference

Initial statuses:

Draft

In Review

Approved

Published

Archived

For this Build 1, display and filter these statuses, but do not implement workflow transitions yet.

5. GUIDE ASSOCIATIONS

A Guide can be associated with multiple external entities.

Support many-to-many relationships conceptually between:

Guide ↔ App

Guide ↔ Feature

Guide ↔ AI Topic

Guide ↔ AI Intent

Guide ↔ Connector

Guide ↔ Connector Capability

Guide ↔ Related Guide

Use normalized association/reference records.

External references should retain source information.

For example:

source: "devharmony"
externalId: "feature-create-deal"

or:

source: "ai-studio"
externalId: "intent-create-deal"

Do not duplicate ownership of external entities inside Guide Studio.

6. SEED GUIDES

Create approximately 12–15 realistic Guides.

Include deliberately incomplete documentation coverage.

Suggested seed Guides:

How to Create a Deal

Type: How-To Guide

Status: Published

Version: 1.1

Related App: Deals

Related Feature: Create Deal

Related Topic: Deals

Related Intents: Create Deal, How Do I Create a Deal?

How to Edit a Deal

Published

How to Change a Deal Stage

Published

Why Can't I Edit a Deal?

Troubleshooting

Published

How to Create an Employee

Published

How to Invite an Employee

In Review

Managing Employee Roles

Draft

How to Configure Attendance

Published

How to Configure Leave Policies

Draft

How to Connect Zoho Books

Published

Troubleshoot Zoho Authentication

Published

Troubleshoot Invoice Synchronisation

In Review

How to Connect WhatsApp Business

Approved

Understanding Role-Based Access

Published

Aurumi Product Navigation Basics

Published

Leave several DevHarmony Features, AI Intents and Connector Capabilities without Guide coverage so future Documentation Coverage functionality will be meaningful.

7. APPLICATION SHELL AND NAVIGATION

Create a professional Aurumi-style enterprise SaaS application.

Use the existing Aurumi design language where appropriate.

The application should feel consistent with the broader Aurumi ecosystem, but Guide Studio should have its own identity.

Primary navigation:

Dashboard

Guide Library

Review Queue

Documentation Coverage

Sources

Include these sections now even if some are placeholders for later builds.

For Build 1:

Dashboard → functional

Guide Library → functional

Sources → functional

Review Queue → placeholder with basic status summary

Documentation Coverage → placeholder with high-level coverage summary only

Do not create dead-end screens. Every navigation item should have a meaningful page, even if future functionality is clearly marked as coming later.

8. DASHBOARD

Build an operational Dashboard, not just a marketing overview.

Show KPI cards:

Total Guides

Draft

In Review

Approved

Published

Archived

Show Documentation Coverage summary:

DevHarmony Features

Total Features

Features with at least one associated Guide

Features without Guide coverage

AI Studio Intents

Total Intents

Intents mapped to at least one Guide

Intents without Guide coverage

Connector Capabilities

Total Capabilities

Capabilities with Guide coverage

Capabilities without Guide coverage

Because data is hierarchical, calculate these metrics through the simulated provider data and Guide associations.

Do not hard-code the final metric values into UI components.

Also show:

Recent Guide Activity

Use seeded recent updates with:

Guide title

Status

Owner

Last updated date/time

Guides Needing Attention

For example:

Guides in Review

Drafts not updated recently

Features with no documentation

Keep the dashboard clean and executive-friendly.

9. GUIDE LIBRARY

Create a high-quality Guide Library as the main working area.

Include:

Search

Search by:

Guide title

Summary

Guide type

Filters

Status

Guide Type

Related App

Related AI Topic

Related Connector

For Build 1, do not overcomplicate the filters.

Guide List

Show:

Title

Guide Type

Status

Current Version

Primary Related Source / Context

Owner

Last Updated

Use visual status badges.

Each Guide row should be clickable.

Clicking a Guide should navigate to a Guide Detail page.

10. GUIDE DETAIL PAGE

For Build 1, create a read-oriented Guide Detail page.

Do not build the full authoring editor yet.

Show:

Header

Guide title

Status badge

Current version

Guide type

Owner

Last updated

Summary

Display the guide summary.

Associations

Clearly display associated:

Apps

Features

AI Topics

AI Intents

Connectors

Connector Capabilities

Use meaningful chips or cards.

Show the source system for each external association.

Example:

DevHarmony → Deals → Create Deal

AI Studio → Deals → Create Deal

Connector → Zoho Books → Configure Invoice Synchronisation

Version Information

Display a simple current version section.

If associated Feature Versions exist, show applicable Feature Version information.

For Build 1, this can be simulated/read-only.

Activity

Show a simple seeded activity history.

Do not implement editing yet.

Include clear actions such as:

Edit Guide — disabled or marked "Authoring in next build"

View Source Associations

View Related Guides

The detail page should make the Guide Studio domain model visually understandable.

11. SOURCES PAGE

Create a functional Sources page showing the three external knowledge sources.

DevHarmony

Show:

Apps
→ Features
→ Feature Versions

Allow the user to:

View Apps

Select an App

Load its Features

Select a Feature

View its versions

Use lazy simulated loading.

Do not load all Features at once on application startup.

Aurumi AI Studio

Show:

Topics
→ Intents

Allow:

View Topics

Select Topic

Load Intents for that Topic

Display:

Intent name

Description

Simulated utterance count

Guide coverage status

Connectors

Show:

Connectors
→ Capabilities

Allow:

View Connectors

Select Connector

Load its Capabilities

Display Guide coverage status.

The Sources page should make it visually obvious that Guide Studio consumes, but does not own, these source entities.

12. SIMULATED BACKEND RULES

Use asynchronous mock services.

Simulate:

Loading states

Empty states where appropriate

API errors where appropriate

Refresh actions

Separate:

Domain types

Provider interfaces

Mock provider implementations

Seed data

The UI should use provider/service methods, not directly access raw mock data.

Use stable IDs.

Prepare the architecture so a future real API provider can replace each mock provider.

Conceptually:

DevHarmonyProvider
AIStudioProvider
ConnectorProvider
GuideStudioProvider

Avoid scattering provider logic across UI components.

13. IMPORTANT UI / UX RULES

The app should feel like a mature enterprise knowledge-management micro app.

Prioritize:

Clean information hierarchy

Dense but readable enterprise UI

Consistent tables and filters

Clear source ownership

Clear Guide status

Easy navigation between related entities

Good empty and loading states

Do not use excessive gradients, oversized cards or decorative marketing visuals.

Do not make the Dashboard look like a generic SaaS landing page.

This is an internal operational application.

Use realistic names, dates and owners in seed data.

14. DO NOT BUILD YET

Explicitly exclude these from Build 1:

Rich text editor

Markdown editor

Raw Markdown storage UI

Create Guide workflow

Edit Guide workflow

Draft submission

Review actions

Approval actions

Publishing actions

Public Help Portal

Public search

AI Chat interface

Vector search

Embeddings

AI retrieval pipeline

Real external APIs

However, structure the application so these can be added in subsequent builds without reworking the core provider architecture.

SUCCESS CRITERIA

At the end of Build 1, I should be able to:

Open Guide Studio and understand its purpose immediately.

View documentation health and coverage on the Dashboard.

Browse and search the Guide Library.

Filter Guides by status, type and source context.

Open a Guide and clearly understand its metadata and external associations.

Browse DevHarmony Apps and lazily load Features and Feature Versions.

Browse AI Studio Topics and lazily load Intents.

Browse Connectors and lazily load Capabilities.

See which source entities have or do not have Guide coverage.

Understand clearly that Guide Studio owns Guides, while DevHarmony, AI Studio and Connector systems remain source systems.

Replace mock provider implementations with real API implementations later without requiring a UI rewrite.

Use simulated backend data throughout the application.
Make the mock data realistic enough that the relationships and purpose of the product are immediately understandable.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9cccb34a-ec54-4741-b5a4-38c9fc198667).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
