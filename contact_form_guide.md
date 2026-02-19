# Contact Form System Implementation Guide

This guide summarizes the robust implementation of a contact form using **React**, **Vite**, and **StaticForms**.

## 1. System Overview
- **Frontend**: React (Functional Components)
- **Backend Service**: [StaticForms](https://www.staticforms.xyz/) (No-code backend for form handling)
- **Data Capture**: `FormData` API (Recommended over pure React state for submission)

## 2. Key Components

### Implementation in `Contact.jsx`

#### Robust Submission Handler
The most reliable way to capture form data is using `new FormData(event.target)`. This avoids issues where React state might not be perfectly synchronized at the moment of the submit event.

```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const payload = {
        accessKey: 'YOUR_STATIC_FORMS_ACCESS_KEY',
        subject: 'Custom Email Subject',
        name: data.get('name'),
        email: data.get('email'),
        message: data.get('message'),
        replyTo: data.get('email'), // Optional: allows direct reply to the user
        honeypot: data.get('honeypot') // Anti-spam
    };

    try {
        const response = await fetch('https://api.staticforms.xyz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (result.success) {
            // Handle success (e.g., show message, reset form)
            form.reset();
        }
    } catch (error) {
        // Handle error
    }
};
```

#### Anti-Spam (Honeypot)
Include a hidden input field that users can't see but bots will fill. If it contains data, the submission can be flagged or ignored by StaticForms.

```jsx
<input type="text" name="honeypot" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
```

## 3. Deployment Checklist
To ensure changes are visible on the live site:
1. **Build**: Run `npm run build` to generate the production files in `/dist`.
2. **Push**: `git push origin main` to sync the source code.
3. **Deploy**: Run `npm run deploy` (which typically runs `gh-pages -d dist`) to update the live environment.

## 4. Troubleshooting
- **Empty Emails**: Usually means the JavaScript payload was empty. Use `FormData` to ensure capture.
- **Old Version Visible**: Clear browser cache or perform a **Force Refresh** (`Cmd+Shift+R` / `Ctrl+F5`).
- **No Response from Button**: Check the browser console (F12) for JavaScript errors or failed network requests.

---
*Created on 2026-02-10 for future reference.*
