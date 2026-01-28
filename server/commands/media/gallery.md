# /gallery - View and Manage Generated Media

## Purpose
Browse, organize, and manage all generated images and videos for the brand.

## Usage
```
/gallery [subcommand] [options]
```

## Subcommands

### `/gallery` or `/gallery show`
Display all generated media for the current brand.
Shows a summary of:
- Total images and videos
- Recent generations
- Favorites
- By status (completed, pending, failed)

### `/gallery images`
Show only images, with details:
- Thumbnail preview (if available)
- Prompt used
- Style preset
- Generation date
- Status

### `/gallery videos`
Show only videos, with details:
- Thumbnail preview
- Duration
- Provider used
- Generation date
- Status

### `/gallery favorites`
Show media marked as favorites.

### `/gallery by-copy [copy-id]`
Show media generated from a specific piece of copy.

### `/gallery delete [media-id]`
Delete a specific image or video.

### `/gallery rate [media-id] [1-5]`
Rate a generated image (helps improve future generations).

### `/gallery favorite [media-id]`
Toggle favorite status for a media item.

## Example Interaction

**User**: /gallery

**Assistant**: Here's your media gallery for [Brand Name]:

**Summary**:
- Total Images: 24 (22 completed, 2 pending)
- Total Videos: 8 (7 completed, 1 processing)
- Favorites: 5

**Recent Generations** (last 7 days):

| Type | Preview | Prompt | Status | Date |
|------|---------|--------|--------|------|
| Image | [thumb] | Premium coffee in warm morning light... | Completed | Jan 28 |
| Video | [thumb] | Coffee pour with steam, cinematic... | Processing | Jan 28 |
| Image | [thumb] | Minimalist product shot on white... | Completed | Jan 27 |

**Quick Actions**:
- `/gallery images` - View all images
- `/gallery videos` - View all videos
- `/gallery favorites` - View favorites
- `/gallery delete [id]` - Delete media

What would you like to do?

---

**User**: /gallery images

**Assistant**: **Images for [Brand Name]** (24 total)

**Completed** (22):

1. **img_abc123** - Jan 28, 2025
   - Prompt: "Premium coffee cup with steam, golden hour..."
   - Style: Lifestyle | Ratio: 1:1 | Provider: Seedream
   - Rating: ⭐⭐⭐⭐⭐ | ❤️ Favorite

2. **img_def456** - Jan 27, 2025
   - Prompt: "Minimalist product shot, white background..."
   - Style: Product | Ratio: 4:5 | Provider: Seedream
   - Rating: ⭐⭐⭐⭐

*[...more images...]*

**Pending** (2):
- img_ghi789 - Started Jan 28, 10:30 AM
- img_jkl012 - Started Jan 28, 10:32 AM

## Notes
- Gallery data is stored in the local database
- Images are saved locally for offline access
- Ratings help train future prompt optimization
- Favorites can be used as reference for future generations
