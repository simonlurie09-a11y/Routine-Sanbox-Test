# App Privacy answers (App Store Connect → App Privacy)

**Answer: "No, we do not collect data from this app."** The product page then shows **Data Not Collected**.

Why this is accurate for version 1:

* Apple counts data as *collected* when it's sent off the device in a way that lets you or a partner access it for longer than it takes to answer a request in real time. Companion has no server, no account, no analytics, no crash-reporting SDK and no advertising SDK. Everything stays on the iPhone.
* **Open Food Facts lookups** send only a barcode number or search words, to answer that request. They aren't linked to the person and we don't keep them, so they aren't collection. (Open Food Facts' own servers see the IP address, as any website does. The privacy policy says so.)
* **Apple Health** data is read on the device, used there, and not sent anywhere.
* **Tracking:** none. There's no App Tracking Transparency prompt because nothing tracks.

The privacy manifest in the build matches this:

* `NSPrivacyTracking` false;
* no collected data types;
* only the required-reason API declarations that React Native and Expo need (user defaults, file timestamps, system boot time, disk space).

**Revisit these answers before any update that adds:**

* sign-in or sync;
* crash reporting or analytics;
* Oura, WHOOP or Fitbit;
* AI features;
* label-photo upload.

Each of those collects data and needs the matching data types declared.
