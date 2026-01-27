require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
// });

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running');
});