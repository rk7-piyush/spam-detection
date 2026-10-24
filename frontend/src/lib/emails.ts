export type Email = {
  id: string;
  from: string;
  email: string;
  subject: string;
  body: string;
  time: string;
  unread: boolean;
  starred: boolean;
  folder: "inbox" | "spam" | "sent";
  category?: "primary" | "promotions" | "social";
  verdict?: { label: "spam" | "ham"; confidence: number; reasons: string[] } | undefined;
};

export const seedEmails: Email[] = [
  { id: "1", from: "Ananya Sharma", email: "ananya@college.edu", subject: "Project review moved to Monday", body: "Hi Piyush,\n\nThe ML project review has been moved to Monday 10 AM. Please bring the latest accuracy metrics and the confusion matrix for your spam classifier.\n\nThanks,\nAnanya", time: "6:12 PM", unread: true, starred: true, folder: "inbox", category: "primary", verdict: { label: "ham", confidence: 0.97, reasons: ["No suspicious patterns found"] } },
  { id: "2", from: "GitHub", email: "noreply@github.com", subject: "[spam-detector] New pull request #42", body: "rahul-dev opened a pull request: Add TF-IDF vectorizer tuning.\n\nReview it on GitHub.", time: "4:45 PM", unread: true, starred: false, folder: "inbox", category: "primary", verdict: { label: "ham", confidence: 0.93, reasons: ["No suspicious patterns found"] } },
  { id: "3", from: "Prize Center", email: "claims@winner-now.biz", subject: "CONGRATULATIONS!!! You WON $5,000,000", body: "Dear winner,\n\nYou have been selected to receive a FREE prize of $5,000,000. Click here immediately to verify your account and provide your bank details. Act now, limited time!!!\n\nhttp://claim-prize.biz", time: "3:02 PM", unread: true, starred: false, folder: "spam", verdict: { label: "spam", confidence: 0.99, reasons: ["Prize / giveaway wording", "Urgency pressure", "Requests sensitive info", "Large money amounts", "Excessive caps / punctuation", "Contains links"] } },
  { id: "4", from: "Kaggle", email: "team@kaggle.com", subject: "New competition: SMS Spam Collection v2", body: "A new text classification competition just launched. Join thousands of data scientists and compete for medals.", time: "1:20 PM", unread: false, starred: false, folder: "inbox", category: "promotions", verdict: { label: "ham", confidence: 0.88, reasons: ["No suspicious patterns found"] } },
  { id: "5", from: "Crypto Wealth", email: "invest@double-btc.io", subject: "Double your Bitcoin in 24 hours — guaranteed", body: "Risk-free investment! Send 0.1 BTC and get 0.2 BTC back guaranteed. Urgent: offer ends tonight. http://double-btc.io", time: "11:48 AM", unread: false, starred: false, folder: "spam", verdict: { label: "spam", confidence: 0.96, reasons: ["Financial promise", "Urgency pressure", "Contains links"] } },
  { id: "6", from: "Rohit Verma", email: "rohit.v@gmail.com", subject: "Weekend trek plans 🏔️", body: "Hey! Are we still on for the Rajmachi trek this weekend? Let me know by Thursday so I can book the bus.", time: "Oct 23", unread: false, starred: true, folder: "inbox", category: "social", verdict: { label: "ham", confidence: 0.95, reasons: ["No suspicious patterns found"] } },
  { id: "7", from: "LinkedIn", email: "messages@linkedin.com", subject: "You appeared in 12 searches this week", body: "Your profile is getting noticed. See who's looking at your profile.", time: "Oct 23", unread: false, starred: false, folder: "inbox", category: "social", verdict: { label: "ham", confidence: 0.81, reasons: ["No suspicious patterns found"] } },
  { id: "8", from: "Bank Security", email: "alert@secure-bank-verify.co", subject: "Urgent: verify your account password", body: "Your account has been suspended. Click here to verify your account password and credit card immediately. http://secure-verify.co", time: "Oct 22", unread: false, starred: false, folder: "spam", verdict: { label: "spam", confidence: 0.98, reasons: ["Urgency pressure", "Requests sensitive info", "Contains links"] } },
  { id: "9", from: "Amazon", email: "orders@amazon.in", subject: "Your order has been shipped", body: "Your order of 'Hands-On Machine Learning' has shipped and will arrive on Oct 26.", time: "Oct 22", unread: false, starred: false, folder: "inbox", category: "primary", verdict: { label: "ham", confidence: 0.94, reasons: ["No suspicious patterns found"] } },
  { id: "10", from: "Coursera", email: "no-reply@coursera.org", subject: "50% off — Deep Learning Specialization", body: "Upgrade your skills this month with 50% off all specializations.", time: "Oct 21", unread: false, starred: false, folder: "inbox", category: "promotions", verdict: { label: "ham", confidence: 0.72, reasons: ["Large money amounts"] } },
];
