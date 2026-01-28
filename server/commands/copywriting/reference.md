# /reference - Manage Reference Materials

## What This Does
Add, list, or use reference materials for a brand. Reference materials help inform content generation with competitor examples, inspiration, and brand guidelines.

## How to Use

### Add a reference
/reference add [URL or paste content]

Examples:
/reference add https://competitor.com/great-landing-page
/reference add "Our brand tagline is: Innovation meets simplicity"

### List references
/reference list

### Use a reference for content
/reference use [title or ID] for [topic]

Example:
/reference use "competitor landing page" for our new product launch

## Reference Types

### URL References
- Automatically scraped and stored
- Original URL preserved for later access
- Content extracted for analysis

### Text References
- Paste snippets directly
- Client briefs
- Key messages
- Brand guidelines

### File References
- PDFs and documents
- Uploaded via the UI

### Project References
- Link to other brand work
- Previous campaigns

## Organization
- Add tags for easy filtering
- Search by title or tags
- Group by type

## Using References in Content Generation
When creating content with /create or /social:
1. Mention the reference in your brief
2. Agent will incorporate relevant elements
3. Maintains brand voice while using reference inspiration

Example workflow:
```
/reference add https://competitor.com/amazing-post
/create linkedin post similar to competitor example
```

## Storage
- References are stored per-brand
- Accessible across all sessions
- Can be updated or deleted via UI
