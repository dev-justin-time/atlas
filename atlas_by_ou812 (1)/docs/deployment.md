# Deployment

## Current Websim deployment

The project is served directly from its workspace. Changes appear in the live preview without a build. Publishing is controlled by Websim's editor/platform workflow; the project code has no supported publish API or deployment credentials to invoke.

## Automated deployment status

Unattended production deployment is not configured. This workspace does not provide a repository remote, a deployment target, or target credentials. No workflow has been added that would claim to deploy but cannot authenticate or publish.

A generic static-hosting action is not a valid drop-in deployment: chat completions depend on the Websim runtime, and **server.js** depends on Websim's Worker runtime, authenticated user headers, and database binding. A static copy would omit those services.

To automate deployment outside Websim, first choose a host that supports both the browser app and the backend/database contract, then supply the repository and secret/binding setup for that host. The deployment pipeline should validate the JavaScript modules and backend contract before promoting a release. Until those target details exist, use Websim's own preview and publishing flow.
