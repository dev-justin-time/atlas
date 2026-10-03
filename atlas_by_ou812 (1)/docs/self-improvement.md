# Feedback and Adaptive Behavior

A.T.L.A.S. has a small, explicit feedback loop. AI-generated replies offer **Useful** and **Needs work** controls. A needs-work rating can include a short preference such as “show assumptions before recommendations.” The preference is used as optional context on subsequent assistant requests from this browser.

## What is saved

The app stores only aggregate helpful/needs-work counts and the latest eight user-entered response preferences in browser localStorage under the key **atlas-learning-v1**. It does not save the rated question or answer as feedback, upload feedback to the backend, or change model weights. Browser storage may be unavailable or cleared by the user/browser.

Use **/resetlearning** to clear the feedback profile. Preferences are soft guidance: they do not override the current request or safety requirements.

This is per-browser personalization, not autonomous self-modification or model training.
