# Focused Learning & Content System

## Overview
A task management system that enforces focused learning through locked progression and automates content creation from completed work.

## Core Features

### 1. Weekly Goals & Daily Tasks
- Create weekly goal (Learning OR Product Building)
- Add 7 daily tasks per week
- Each task includes:
  - Description
  - Resource links (articles, videos, tweets)

### 2. Progressive Lock System
- Day N+1 locked until Day N is marked complete
- Week N+1 locked until Week N (all 7 days) is complete
- Manual completion (checkbox)

### 3. AI Content Generation
**Triggers:** When task marked complete

**User provides:**
- Code (GitHub link or paste)
- Raw learning notes

**AI generates (3 formats):**
- X post (short)
- LinkedIn post (medium)
- Technical blog (long)

**Content types:**
- Learning tasks → Educational tone ("Today I learned...")
- Product tasks → Update tone ("Shipping...")

**Weekly wrap-up:**
- Auto-generated when Week 7/7 completes
- Synthesizes all 7 daily completions
- Same 3 format outputs

### 4. Example Post Storage
User saves reference posts for AI style matching:
- 1-2 examples for Learning content
- 1-2 examples for Product Building content

## Data Structure

**Weekly Goal**
- Title
- Type: Learning | Product Building
- Status: Active | Complete
- Daily Tasks (7)

**Daily Task**
- Description
- Resource links (array)
- Status: Locked | Active | Complete
- Completion data:
  - Code (link or text)
  - Learning notes (text)
  - Generated content (optional)

**Example Posts**
- Type: Learning | Product Building
- Platform: X | LinkedIn | Blog
- Content text

## User Flow

1. Create weekly goal → Set type (Learning/Product)
2. Create Day 1 task → Add resources
3. Work on task → Study resources
4. Mark complete → Provide code + notes
5. (Optional) Generate content → Review/edit AI output
6. Day 2 unlocks → Repeat
7. Complete Week 7/7 → Weekly wrap-up option unlocks

## Key Constraints
- Cannot skip days (strict sequence)
- Cannot start new week until current week 100% complete
- Content generation is optional (not required to unlock next task)
- All completion confirmations are manual