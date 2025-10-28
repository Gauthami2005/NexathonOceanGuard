require("dotenv").config();
const sendEmail = require("./utils/sendEmail");

(async () => {
  await sendEmail(
    "nihalhshetty30@gmail.com",
    "Test Email from OceanGuard",
    "<h3>Hey! This is a test email from OceanGuard backend 🚀</h3>"
  );
})();
