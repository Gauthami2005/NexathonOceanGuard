const User = require("../models/user");

/**
 * Simulate sending a notification to a report's original reporter when status changes.
 * In the future, replace console.log with actual email/SMS/WebSocket push.
 */
async function sendReportStatusNotification(reporterId, reportTitle, newStatus, authorityNotes) {
  try {
    const user = await User.findById(reporterId).select("email name fcmToken");
    const email = user?.email || "unknown@user.local";
    const name = user?.name || "User";
    const details = [
      `Hello ${name},`,
      `Your report '${reportTitle}' has been updated to status '${newStatus}'.`,
      authorityNotes ? `Notes: ${authorityNotes}` : null,
    ].filter(Boolean).join(" \n");

    // Placeholder for real notification integration (e.g., Nodemailer, FCM, WebSocket)
    console.log(`[notification] to=${email} status=${newStatus} title='${reportTitle}'`);
    console.log(details);
    return { success: true };
  } catch (err) {
    console.error("[notification] Failed to send notification:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendReportStatusNotification };


