# Translation System Setup Guide

This document explains how to set up and use the Google Cloud Translate API integration for the Digital AELA project.

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

### 2. Configure Google Cloud Credentials

You need to set up Google Cloud credentials. Choose one of these options:

#### Option A: API Key (Simpler)

1. Get a Google Cloud Translate API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Cloud Translation API
3. Add to your `.env` file:

```
GOOGLE_CLOUD_TRANSLATE_API_KEY=your_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
```

#### Option B: Service Account (Recommended for Production)

1. Create a service account in Google Cloud Console
2. Download the credentials JSON file
3. Add to your `.env` file:

```
GOOGLE_CLOUD_CREDENTIALS_PATH=/path/to/credentials.json
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
```

### 3. API Endpoints

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

## Troubleshooting

### Translations not working?

1. Check Google Cloud credentials are set correctly
2. Verify Google Cloud Translate API is enabled
3. Check browser console for errors
4. Verify translation files exist in `public/locales`

### Performance issues?

1. Check IndexedDB cache is working
2. Verify batch translation is used for multiple texts
3. Check network tab for API call patterns

## Next Steps

- Add more translation keys as needed
- Update more components to use translations
- Add translation keys for all static content
- Implement SEO-friendly translated URLs (optional)
