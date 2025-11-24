// Set your password here
const password = "YOUR_PASSWORD_HERE";
const API_URL = "http://localhost:5000/api/v1"; // Change if your backend is on different URL

// Get your access token
const tokens = JSON.parse(localStorage.getItem("aela.auth.tokens"));
const accessToken = tokens?.accessToken;

if (!accessToken) {
  console.error("❌ Please log in as super admin first!");
} else {
  fetch(`${API_URL}/admin/settings/financial-password/set`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ password: password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        console.log("✅ SUCCESS! Financial password set successfully!");
        console.log("You can now access financial pages with this password.");
      } else {
        console.error("❌ Error:", data.error?.message);
      }
    })
    .catch((error) => {
      console.error("❌ Network error:", error);
    });
}
