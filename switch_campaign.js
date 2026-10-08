require('dotenv').config();
const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    name: { type: String, required: true },
    reelId: { type: String, required: true, unique: true },
    triggerMode: { type: String, enum: ['any_comment', 'keyword'], default: 'any_comment' },
    keywords: [{ type: String }],
    dmMessage: { type: String, required: true },
    link: { type: String },
    commentReply: { type: String },
    active: { type: Boolean, default: true }
});

const Campaign = mongoose.model('Campaign', campaignSchema);

async function updateCampaigns() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB...");

        // Delete Day 21
        await Campaign.deleteOne({ reelId: "18403109965144963" });
        console.log("🗑️ Deleted Day 21 Campaign");

        // Insert Day 45
        const result = await Campaign.findOneAndUpdate(
            { reelId: "18095410199196285" },
            {
                name: "Day 45 Reel Automation",
                triggerMode: "any_comment",
                dmMessage: "Hey! Here is the Day 45 resource you requested 👇",
                link: "https://docs.google.com/document/d/1lVRQRPjtnt0f6fIYxvVF1cBUD2IN6ONM/edit?usp=sharing&ouid=106429519398405414481&rtpof=true&sd=true",
                active: true
            },
            { upsert: true, new: true }
        );

        console.log("✅ Campaign for Day 45 successfully saved!");
        console.log(result);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

updateCampaigns();
