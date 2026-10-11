const Transaction = require("../models/transaction");
/**
 * Get the income of the authenticated freelancer
 * - Fetch all transactions for the authenticated freelancer.
 * - Calculate the total income from completed transactions.
 * - Return a 200 OK response with the total income and the list of transactions if successful, or an appropriate error response if an error occurs.
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
exports.income = async (req, res, next) => {
    try {
        const freelancerId = req.user.id;

        // Fetch all transactions for the authenticated freelancer
        const transactions = await Transaction.find({ freelancer: freelancerId }).exec();

        // Calculate the total income from completed transactions
        const totalIncome = transactions.filter((transaction) => transaction.status === "Completed").reduce((total, transaction) => total + transaction.amount, 0);

        return res.status(200).json({ 
            totalIncome,
            transactions,
        });
    } catch (error) {
        next(error);
    }
}; 