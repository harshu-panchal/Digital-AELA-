# Translation System Setup Guide

This document explains how to set up and use the Google Cloud Translate API integration for the Digital AELA project using only an API key.

## Architecture Overview

The translation system uses:

- **Backend**: Google Cloud Translate API for translating text
- **Frontend**: i18next/react-i18next for managing translations with lazy loading
- **Caching**: IndexedDB (frontend) and in-memory cache (backend) for performance

## Backend Setup

### 1. Install Dependencies

The Google Cloud Translate package is already installed:

```bash
cd backend
npm install @google-cloud/translate
```

### 2. Get Google Cloud Translate API Key

Follow these simple steps to get your API key:

#### Step 1: Create a Google Cloud Account (if you don't have one)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account or create a new account
3. Complete the signup process if needed (requires credit card, but you get free credits)

#### Step 2: Create a New Project (or use existing)

1. In the Google Cloud Console, click on the **project dropdown** at the top
2. Click **"New Project"** (or select an existing project)
3. Enter a project name (e.g., "digital-aela-translations")
4. Click **"Create"**
5. Wait for the project to be created, then select it from the dropdown

#### Step 3: Enable Cloud Translation API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Cloud Translation API"**
3. Click on **"Cloud Translation API"** from the results
4. Click **"Enable"** button
5. Wait for the API to be enabled (this may take a minute)

#### Step 4: Create API Key

1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** at the top
3. Select **"API Key"** from the dropdown
4. A new API key will be created and displayed
5. **Copy the API key** - you'll need it in the next step

#### Step 5: (Recommended) Restrict the API Key

For security, restrict your API key to only work with the Cloud Translation API:

1. Click on the API key you just created (or click "Edit API key" from the popup)
2. Under **"API restrictions"**, select **"Restrict key"**
3. Choose **"Cloud Translation API"** from the list
4. Click **"Save"**

**⚠️ Security Note:** Keep your API key secure and never commit it to version control!

### 3. Configure Your `.env` File

1. Go to your `backend` directory
2. **Copy the example file** (if you don't have a `.env` file yet):
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and add your API key:

```
GOOGLE_CLOUD_TRANSLATE_API_KEY=your_api_key_here
```

**That's it!** You don't need a Project ID or JSON file. Just the API key is sufficient.

**Example `.env` file:**

```
GOOGLE_CLOUD_TRANSLATE_API_KEY=AIzaSyA1234567890abcdefghijklmnopqrstuvw
```

### 4. ⚠️ CRITICAL SECURITY: Verify Your `.gitignore` File

**BEFORE PUSHING TO GITHUB, VERIFY:**

1. **Check that `.gitignore` exists** in both root and `backend/` directories
2. **Verify `.env` is listed** in `.gitignore` files
3. **Check if `.env` was already committed** (see troubleshooting below)
4. **Never commit your `.env` file** - it contains sensitive secrets!

The `.gitignore` files should already be configured, but double-check:

**Root `.gitignore` should include:**

```
.env
backend/.env
```

**Backend `.gitignore` should include:**

```
.env
```

**If you accidentally committed `.env` to Git:**

1. Remove it from Git tracking: `git rm --cached backend/.env`
2. Commit the removal: `git commit -m "Remove .env file from version control"`
3. If you already pushed, **immediately rotate/regenerate all your API keys and secrets**
4. Add `.env` to `.gitignore` if it's not already there

### 5. Test the Setup

1. Start your backend server:

```bash
cd backend
npm run dev
```

2. Check the console logs - you should see: `[Google Cloud] Translate client initialized successfully`

3. If you see a warning, double-check that:
   - Your API key is correctly set in the `.env` file
   - The Cloud Translation API is enabled in your Google Cloud project
   - There are no extra spaces or quotes around the API key in the `.env` file

### 6. API Endpoints

The translation API is available at:

- `POST /api/v1/translate` - Translate single text
- `POST /api/v1/translate/batch` - Translate multiple texts
- `POST /api/v1/translate/object` - Translate object properties

## Frontend Setup

### 1. Dependencies

Already installed:

- `i18next`
- `react-i18next`
- `i18next-http-backend`
- `i18next-browser-languagedetector`

### 2. Translation Files Structure

Translation files are located in `frontend/public/locales/{lang}/{namespace}.json`

Supported languages:

- `en` - English
- `hi` - Hindi
- `ur` - Urdu
- `bn` - Bangla
- `ne` - Nepali
- `si` - Sinhala
- `ps` - Pashto
- `ar` - Arabic

Namespaces:

- `common.json` - Shared UI elements (buttons, labels, navigation)
- `home.json` - Home page content
- More namespaces can be added per route/feature

### 3. Using Translations in Components

#### Static Text (Translation Files)

Use the `t` function from `LanguageContext`:

```jsx
import { useLanguage } from "../../../src/contexts/LanguageContext";

const MyComponent = () => {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t("nav.home", { defaultValue: "Home" })}</h1>
      <button>{t("buttons.submit", { defaultValue: "Submit" })}</button>
    </div>
  );
};
```

#### Dynamic Content (Google Cloud Translate API)

Use the `useDynamicTranslation` hook:

```jsx
import { useDynamicTranslation } from "../../../src/hooks/useDynamicTranslation";

const MyComponent = ({ course }) => {
  const { translate } = useDynamicTranslation();
  const [translatedTitle, setTranslatedTitle] = useState(course.title);

  useEffect(() => {
    translate(course.title).then(setTranslatedTitle);
  }, [course.title, translate]);

  return <h1>{translatedTitle}</h1>;
};
```

#### Translating Objects from API

```jsx
import { translateObject } from "../../../src/services/translationService";

const MyComponent = ({ courseData }) => {
  const { language } = useLanguage();
  const [translatedData, setTranslatedData] = useState(courseData);

  useEffect(() => {
    translateObject(courseData, language, "en", ["title", "description"]).then(
      setTranslatedData
    );
  }, [courseData, language]);

  return (
    <div>
      <h1>{translatedData.title}</h1>
      <p>{translatedData.description}</p>
    </div>
  );
};
```

## Performance Optimizations

1. **Lazy Loading**: Translation namespaces are loaded on-demand per route
2. **Caching**: Translations are cached in IndexedDB (24-hour TTL)
3. **Batch Translation**: Multiple texts are translated in a single API call
4. **Suspense**: React Suspense is used for smooth translation loading

## Language Selection

The language selection is already integrated into the Navbar. Users can select their preferred language, which is saved to localStorage and persisted across sessions.

## Adding New Translations

### 1. Add Translation Keys

Add keys to `frontend/public/locales/en/{namespace}.json`:

```json
{
  "myKey": "My English Text"
}
```

### 2. Use in Components

```jsx
const { t } = useLanguage();
const text = t("myKey", { defaultValue: "My English Text" });
```

### 3. Translation Files for Other Languages

Translation files for other languages will be automatically populated using Google Cloud Translate API when users switch languages. The translations are cached for performance.

## Testing

1. Start the backend:

```bash
cd backend
npm run dev
```

2. Start the frontend:

```bash
cd frontend
npm run dev
```

3. Test translation:
   - Change language in the Navbar
   - Verify UI text changes
   - Check browser console for translation API calls
   - Verify translations are cached in IndexedDB

## ⚠️ SECURITY CHECKLIST BEFORE DEPLOYING TO GITHUB

**BEFORE pushing your code to GitHub, verify these security measures:**

- [ ] **`.env` file is in `.gitignore`** (check both root and `backend/.gitignore`)
- [ ] **`.env` file is NOT in Git** (run `git status` - `.env` should not appear)
- [ ] **`.env.example` exists** as a template (without actual secrets)
- [ ] **No secrets in code files** (check for hardcoded API keys)
- [ ] **No credentials JSON files committed** (check for `*-credentials.json` files)
- [ ] **All API keys are unique** (not shared or reused)
- [ ] **API keys are restricted** (in Google Cloud Console)

**Quick Verification Commands:**

```bash
# Check if .env is tracked by Git
git ls-files | grep .env

# Check if .env is in .gitignore
grep -r "\.env" .gitignore backend/.gitignore

# See what files will be committed
git status
```

**If `.env` shows up in `git ls-files` or `git status`:**

1. Remove it: `git rm --cached backend/.env`
2. Commit: `git commit -m "Remove .env from version control"`
3. **IMPORTANT:** Rotate all your API keys immediately if you already pushed to GitHub!

## Troubleshooting

### Translations not working?

1. **Check API Key**: Verify your API key is correctly set in `backend/.env` file

   - Make sure there are no extra spaces or quotes
   - The format should be: `GOOGLE_CLOUD_TRANSLATE_API_KEY=AIzaSy...`

2. **Verify API is Enabled**: Check that Cloud Translation API is enabled in Google Cloud Console

   - Go to "APIs & Services" → "Library"
   - Search for "Cloud Translation API" and ensure it shows "Enabled"

3. **Check API Key Restrictions**: If you restricted the API key, make sure it's allowed for Cloud Translation API

   - Go to "APIs & Services" → "Credentials"
   - Click on your API key and check "API restrictions"

4. **Check Backend Logs**: Look at your backend console for error messages

   - You should see: `[Google Cloud] Translate client initialized successfully`
   - If you see errors, they will help identify the issue

5. **Check Browser Console**: Look for errors in the browser console

   - Network errors might indicate API key issues
   - Verify translation files exist in `public/locales`

6. **Verify .env File**: Make sure your `.env` file is in the `backend` directory (not `backend/src`)

### Performance issues?

1. Check IndexedDB cache is working
2. Verify batch translation is used for multiple texts
3. Check network tab for API call patterns

### Common Issues

**Issue**: "No credentials found" warning

**Solution**: Make sure `GOOGLE_CLOUD_TRANSLATE_API_KEY` is set in your `backend/.env` file

**Issue**: "Failed to initialize Translate client" error

**Solution**:

- Verify your API key is valid
- Make sure the Cloud Translation API is enabled
- Check that there are no typos in the API key

**Issue**: Translations work but are slow

**Solution**:

- Check that caching is working (look for cached results in IndexedDB)
- Verify batch translation is being used for multiple texts

## Next Steps

- Add more translation keys as needed
- Update more components to use translations
- Add translation keys for all static content
- Implement SEO-friendly translated URLs (optional)

## FAQ

### Do I need a Project ID?

**No.** When using API key authentication, you only need the API key. The Project ID is optional.

### Do I need a JSON credentials file?

**No.** API key authentication doesn't require any JSON file. Just add your API key to the `.env` file.

### Can I use this in production?

Yes! API key authentication works perfectly for production. Just make sure to:

- Restrict your API key to only Cloud Translation API
- Set up usage quotas and billing alerts in Google Cloud Console
- Never commit your API key to version control

### What if I exceed the free quota?

Google Cloud offers a free tier for Cloud Translation API. If you exceed it, you'll be charged based on usage. Set up billing alerts in Google Cloud Console to monitor costs.
