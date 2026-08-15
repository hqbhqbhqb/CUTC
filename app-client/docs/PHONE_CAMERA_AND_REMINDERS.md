# Phone camera and reminder implementation

## Implemented phone workflow

1. The desktop AI Assistant creates an ephemeral PeerJS ID and a 192-bit random room secret.
2. The pairing URL stores the peer ID and secret in the URL fragment. URL fragments are not sent to the web server.
3. The phone page requests the rear camera at up to 4K, falling back to 1080p when necessary.
4. The phone authenticates both its PeerJS data connection and media call with the room secret.
5. WebRTC transports encrypted live video to the desktop. The desktop attaches that stream to the same MediaPipe Pose, Hand Landmarker, lesion scan, and coverage pipeline used by its local camera.
6. The phone exposes camera zoom and torch controls when supported. The desktop can enter a full-screen white illumination mode that adjusts its rendered white level from measured skin brightness.

Keep the phone fixed before scanning. Moving it after targets are mapped changes the image coordinate system, so finger guidance would no longer align with the target map. The app analyzes high-resolution crops of one fixed reference view rather than asking the user to move the phone between close-ups.

Browsers cannot change the device's physical screen-brightness setting. The illumination screen adjusts rendered color only. Soft external lighting is still preferable because a torch or bright screen can create glare that resembles a pale area.

PeerJS Cloud exchanges connection metadata; it does not intentionally relay or store the video frames. Direct WebRTC can fail on restrictive carrier or corporate networks. A production medical deployment should use a private authenticated signaling service and managed TURN servers.

## Implemented email workflow

1. Profile checks whether the Vercel email API has a server-side `RESEND_API_KEY`.
2. The user requests a verification email at the address registered in the browser.
3. The API sends a signed 30-minute confirmation link. The signing key never reaches the browser.
4. Opening the link schedules reminders for the next 14 days by default. Up to six unique medication times per day are grouped to reduce duplicate messages.
5. Email content is generic by default. Medication names are included only when explicitly selected.
6. The browser stores opaque scheduled-email IDs and a signed management token so the user can cancel or refresh pending reminders.
7. When Profile is reopened within three days of expiry and the schedule is unchanged, reminders renew automatically.

The API validates same-origin writes, email addresses, signed tokens, payload sizes, medication times, and includes warm-instance request throttling. Resend idempotency keys reduce duplicates. Pending emails are cancelled if a partial scheduling operation fails.

Required production environment:

- `RESEND_API_KEY`
- a sender domain verified in Resend
- `REMINDER_FROM`, such as `DermaCare <reminders@example.com>`

This zero-database design deliberately schedules a limited rolling window. Indefinite recurring delivery, account recovery, cross-device cancellation, stronger global rate limiting, and Web Push after the browser closes require durable backend storage and production authentication.
