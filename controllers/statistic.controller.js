const Transaction = require("../models/transaction.model");
const User = require("../models/user.model");

/**
 * @function getStats
 * @description Fungsi dasar untuk mengambil statistik (income, expense, atau keseluruhan) berdasarkan periode (bulanan/tahunan),
 * dan mengelompokkannya berdasarkan tipe kategori dari model Category.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {('monthly'|'yearly')} period - Tipe periode filter.
 */
const getStats = async (req, res, period) => {
  try {
    const { year, month, type } = req.query;
    const { uid } = req.user;

    if (!year) {
      return res.status(400).json({
        success: false,
        message: "Query parameter `year` dibutuhkan.",
      });
    }
    if (period === "monthly" && !month) {
      return res.status(400).json({
        success: false,
        message: "Query parameter `month` dibutuhkan untuk statistik bulanan.",
      });
    }

    const user = await User.findOne({ uid });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan." });
    }
    const userId = user._id;

    const startDate = new Date(
      parseInt(year),
      period === "monthly" ? parseInt(month) - 1 : 0,
      1
    );
    const endDate = new Date(
      parseInt(year),
      period === "monthly" ? parseInt(month) : 12,
      1
    );

    if (type === "income" || type === "expense") {
      const pipeline = [
        {
          $match: {
            userId,
            type,
            createdAt: { $gte: startDate, $lt: endDate },
          },
        },

        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        { $unwind: "$categoryDetails" },

        { $match: { "categoryDetails.type": type } },

        {
          $group: {
            _id: "$categoryDetails.type",
            type_total_amount: { $sum: "$amount" },

            categories: {
              $push: {
                categoryId: "$categoryId",
                category_name: "$categoryDetails.name",
                amount: "$amount",
              },
            },
          },
        },

        {
          $unwind: "$categories",
        },
        {
          $group: {
            _id: {
              type: "$_id",
              categoryId: "$categories.categoryId",
              category_name: "$categories.category_name",
            },
            category_total_amount: { $sum: "$categories.amount" },
          },
        },

        {
          $group: {
            _id: "$_id.type",
            type_total_amount: { $sum: "$category_total_amount" },
            details: {
              $push: {
                category_name: "$_id.category_name",
                total_amount: "$category_total_amount",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            type: "$_id",
            total_amount: "$type_total_amount",
            details: "$details",
          },
        },
        { $sort: { total_amount: -1 } },
      ];

      const results = await Transaction.aggregate(pipeline);
      const totalAmount = results.reduce(
        (sum, item) => sum + item.total_amount,
        0
      );

      const formattedResults = results.map((typeGroup) => {
        const detailsWithPercentage = typeGroup.details
          .map((category) => ({
            ...category,
            percentage:
              typeGroup.total_amount > 0
                ? parseFloat(
                    (
                      (category.total_amount / typeGroup.total_amount) *
                      100
                    ).toFixed(2)
                  )
                : 0,
          }))
          .sort((a, b) => b.total_amount - a.total_amount);
        return {
          ...typeGroup,
          details: detailsWithPercentage,
          percentage:
            totalAmount > 0
              ? parseFloat(
                  ((typeGroup.total_amount / totalAmount) * 100).toFixed(2)
                )
              : 0,
        };
      });

      return res.status(200).json({
        data: {
          [`total_${type}`]: totalAmount,
          breakdown_by_type: formattedResults,
        },
      });
    } else {
      const facetPipeline = (transactionType) => [
        { $match: { type: transactionType } },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: {
            path: "$categoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        { $match: { "categoryDetails.type": transactionType } },
        {
          $group: {
            _id: {
              type: "$categoryDetails.type",
              category_name: "$categoryDetails.name",
            },
            category_total_amount: { $sum: "$amount" },
          },
        },
        {
          $group: {
            _id: "$_id.type",
            type_total_amount: { $sum: "$category_total_amount" },
            details: {
              $push: {
                category_name: "$_id.category_name",
                total_amount: "$category_total_amount",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            type: "$_id",
            total_amount: "$type_total_amount",
            details: "$details",
          },
        },
        { $sort: { total_amount: -1 } },
      ];

      const results = await Transaction.aggregate([
        { $match: { userId, createdAt: { $gte: startDate, $lt: endDate } } },
        {
          $facet: {
            expense: facetPipeline("expense"),
            income: facetPipeline("income"),
          },
        },
      ]);

      const data = results[0];
      const totalIncome = data.income.reduce(
        (sum, item) => sum + item.total_amount,
        0
      );
      const totalExpense = data.expense.reduce(
        (sum, item) => sum + item.total_amount,
        0
      );

      const formatFacetResults = (facetData, grandTotal) =>
        facetData.map((typeGroup) => {
          const detailsWithPercentage = typeGroup.details
            .map((category) => ({
              ...category,
              percentage:
                typeGroup.total_amount > 0
                  ? parseFloat(
                      (
                        (category.total_amount / typeGroup.total_amount) *
                        100
                      ).toFixed(2)
                    )
                  : 0,
            }))
            .sort((a, b) => b.total_amount - a.total_amount);
          return {
            ...typeGroup,
            details: detailsWithPercentage,
            percentage:
              grandTotal > 0
                ? parseFloat(
                    ((typeGroup.total_amount / grandTotal) * 100).toFixed(2)
                  )
                : 0,
          };
        });

      return res.status(200).json({
        summary: {
          total_income: totalIncome,
          total_expense: totalExpense,
          net_balance: totalIncome - totalExpense,
        },
        income_breakdown: formatFacetResults(data.income, totalIncome),
        expense_breakdown: formatFacetResults(data.expense, totalExpense),
      });
    }
  } catch (error) {
    console.error(`Error fetching statistics:`, error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server.",
      error: error.message,
    });
  }
};

exports.getMonthlyStats = (req, res) => {
  getStats(req, res, "monthly");
};

exports.getYearlyStats = (req, res) => {
  getStats(req, res, "yearly");
};
