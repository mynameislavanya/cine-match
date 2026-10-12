// Generates a short, human-friendly invite code like "K3F9QX".
const generateInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

module.exports = generateInviteCode;
