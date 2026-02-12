# Test Vault Setup Guide

## Quick Setup

### Option 1: Create New Vault in Obsidian

1. Open Obsidian
2. Click "Open another vault" → "Create new vault"
3. Name it: `vault-pal-test`
4. Location: `d:\vault-pal-test` (or your preferred location)
5. Click "Create"

### Option 2: Manual Folder Creation

```bash
# Create test vault folder
mkdir d:\vault-pal-test

# Create .obsidian folder (Obsidian will populate this)
mkdir d:\vault-pal-test\.obsidian
```

Then open this folder as a vault in Obsidian.

## Link Plugin for Development

Once you have a test vault, create a symlink so changes to your plugin code immediately reflect in the test vault:

### Windows (Run as Administrator)

```bash
# Navigate to test vault's plugins folder
cd d:\vault-pal-test\.obsidian\plugins

# Create symlink to your development folder
mklink /D vault-pal d:\vault-pal
```

### macOS/Linux

```bash
# Create symlink
ln -s ~/vault-pal ~/vault-pal-test/.obsidian/plugins/vault-pal
```

## Enable the Plugin

1. In Obsidian, open the test vault
2. Go to Settings → Community plugins
3. Disable "Restricted mode" if needed
4. Click "Browse" → find "Vault Pal" (it will appear as a local plugin)
5. Enable "Vault Pal"

## Install Hot Reload Plugin (Recommended)

For automatic plugin reloading during development:

1. In test vault settings → Community plugins
2. Browse and install "Hot-Reload"
3. Enable it
4. Now when you rebuild Vault Pal, it will auto-reload

## Create Test Template

Create a sample daily note template for testing:

1. Create folder: `d:\vault-pal-test\Templates`
2. Create file: `d:\vault-pal-test\Templates\Daily Note Template.md`
3. Add content:

```markdown
---
date: {{date}}
---

# Daily Review for {{date:YYYY-MM-DD}}

## Today

What went well? (1-3 bullets)

```vaultpal
prompt: "What went well today?"
```

What was difficult? (1-3 bullets)

```vaultpal
prompt: "What was difficult today?"
```

Gratitude, fleeting thoughts, ideas

```vaultpal
prompt: "Any gratitude, thoughts, or ideas to capture?"
```

## Tomorrow's Plan

What are your top priorities?

```vaultpal
prompt: "What are your top 3 priorities for tomorrow?"
```
```

4. Create folder for daily notes: `d:\vault-pal-test\Daily Notes`

## Configure Obsidian Daily Notes Plugin

1. Settings → Core plugins → Enable "Daily notes"
2. Settings → Daily notes:
   - Date format: `YYYY-MM-DD`
   - New file location: `Daily Notes/`
   - Template file location: `Templates/Daily Note Template.md`

## Verify Setup

Checklist:
- [ ] Test vault created
- [ ] Symlink created (or files copied)
- [ ] Plugin appears in Community plugins list
- [ ] Plugin can be enabled
- [ ] Hot-Reload plugin installed (optional but recommended)
- [ ] Template file created with vaultpal code blocks
- [ ] Daily Notes folder created
- [ ] Daily Notes plugin configured

## Development Workflow

1. Make changes to plugin code in `d:\vault-pal\`
2. Run `npm run dev` (watches for changes and rebuilds)
3. Hot-Reload automatically reloads the plugin in Obsidian
4. Test in the test vault
5. Check console (Ctrl+Shift+I) for errors

## Troubleshooting

**Plugin doesn't appear:**
- Check symlink was created correctly
- Verify manifest.json exists in plugin folder
- Restart Obsidian

**Plugin won't enable:**
- Check console for errors
- Verify main.js was built successfully
- Check manifest.json has correct structure

**Changes don't appear:**
- Make sure `npm run dev` is running
- Check Hot-Reload is enabled
- Try manually reloading plugin (disable/enable)
- Check for TypeScript compilation errors

**Symlink issues (Windows):**
- Must run command prompt as Administrator
- Use `/D` flag for directory symlink
- Use full absolute paths

## Next Steps

Once setup is complete:
1. Test that plugin loads successfully
2. Try opening the pet view (ribbon icon or command palette)
3. Configure plugin settings (template path, notes folder)
4. Test "Share my day" button (once implemented)
