# DermaCare Vision

DermaCare is a camera-guided web MVP that helps a user apply prescribed medication to hard-to-see areas of the back. It uses MediaPipe to confirm a back-facing pose and track the index fingertip, local contrast analysis to highlight possible treatment areas, Web Speech for voice guidance, and a coverage map to track application progress.

> DermaCare is an assistive prototype, not a medical device. It does not diagnose pityriasis versicolor, ringworm, acne, or any other condition. Medication must only be used as prescribed by a healthcare professional.

## Features

- Local demo registration and sign-in, Terms & Conditions, and Privacy Policy.
- Multiple topical and oral medications with one or more daily times.
- Editable task schedule, completion tracking, and a 30-day contribution chart.
- On-device MediaPipe Pose and Hand Landmarker processing; camera frames are not uploaded or stored.
- A contracted torso ROI plus skin validation prevents bright lamps or walls beside the body from becoming targets.
- Pose smoothing and a short occlusion hold keep the back map stable when an arm moves behind the body.
- Pityriasis versicolor, ringworm, and back-acne modes.
- English Web Speech guidance. Direction words repeat every 800 ms; status messages are allowed to finish.
- Shape-aware coverage: at least 90% area coverage, three seconds of contact, and rubbing motion are required.
- Up to 1080p camera capture, a high-detail scan pass, automatic rear-camera selection on phones, and hardware zoom when supported.
- Desktop-to-phone QR pairing: a fixed phone rear camera publishes an encrypted WebRTC stream and the desktop runs the existing MediaPipe/vision pipeline.
- Phone-side 4K/1080p requests, camera zoom and torch controls when the browser exposes them, plus an adaptive white desktop illumination screen.
- Device notifications for medication times while the app remains open, including in a background tab.
- Opt-in email reminders with address verification, privacy-safe generic content, scheduled delivery, cancellation, and automatic renewal while the user revisits Profile.

## Run locally

Node.js 20+ is required. Node.js 22 or 24 is recommended.

```bash
cd app-client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Quick test

1. Create a demo account and accept the legal terms.
2. Select a condition and add at least one topical medication.
3. Open **AI Assistant**, select **Start camera and voice**, and allow camera access.
4. Keep the complete back inside the dashed polygon with soft, even lighting.
5. Point with the index finger and fold the other fingers. Follow the English directions.
6. When the beeping begins, stay close to the highlighted cells and rub gently for three to four seconds.
7. Open **Profile → Medication reminders** to enable device notifications.

To use the phone rear camera, select **Phone rear** in AI Assistant, scan the QR code, open the link on the phone, and select **Connect rear camera**. Keep the phone fixed after the scan starts.

Camera access requires a secure context: `localhost` during development or an HTTPS deployment.

## Validation

```bash
npm run lint
npm run test:email
npm run test:vision
npm run build
npm run preview
```

MediaPipe models and WebAssembly assets are stored in `public/models` and `public/mediapipe`, so the models are not fetched from a third-party CDN during use.

## Email deployment setup

The email API is deployed as `api/email-reminders.js`. Set these server-only Vercel environment variables:

- `RESEND_API_KEY` (required)
- `REMINDER_FROM`, for example `DermaCare <reminders@your-domain.com>` (recommended)
- `EMAIL_TOKEN_SECRET` (optional; a key-derived signing secret is used when omitted)
- `EMAIL_SCHEDULE_DAYS` from 1–30 (optional; default 14)

Resend requires a verified sender domain for arbitrary recipients. After changing environment variables, redeploy production. The browser never receives the API key.

## Phone camera

The implemented QR workflow uses an ephemeral PeerJS signaling room and peer-to-peer WebRTC video. See [docs/PHONE_CAMERA_AND_REMINDERS.md](docs/PHONE_CAMERA_AND_REMINDERS.md) for usage, privacy, and connectivity constraints.

## MVP limitations

- Authentication and health-related schedule data are still stored in `localStorage`; this is not suitable for production health data.
- Highlighting is a color/local-contrast heuristic and can still confuse glare, scars, uneven lighting, or another skin condition.
- Reliable device notifications after the browser closes still require Web Push and a durable backend.
- Email delivery requires a Resend API key and verified sender domain. Without them, the Profile page reports the feature as unavailable instead of exposing a client-side mail secret.
- The default PeerJS Cloud connection can fail on networks that block direct WebRTC. A clinical production release should operate a private signaling service and managed TURN fallback.
- Production use requires clinical validation on labeled data across skin tones, lighting conditions, cameras, and confirmed diagnoses.
