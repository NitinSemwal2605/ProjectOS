import dotenv from "dotenv";
import app from "./App.js";
import connectDB from "./config/db.js";

dotenv.config({ quiet: true });
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Failed to connect to the database:', error.message);
});