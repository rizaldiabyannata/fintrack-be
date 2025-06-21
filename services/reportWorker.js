const amqplib = require("amqplib");
const logger = require("../utils/logUtils");
const User = require("../models/user.model");
const Transaction = require("../models/transaction.model");
const Budget = require("../models/budget.model");
const { Parser } = require("json2csv");
const { sendEmailWithAttachment } = require("../utils/otpService"); // Gunakan kembali fungsi email

const RABBITMQ_URI = process.env.RABBITMQ_URI || "amqp://localhost";
const QUEUE_NAME = "export_queue";

// Fungsi untuk memproses pesan dari queue
async function processExportJob(msg) {
  if (msg === null) return;

  const content = msg.content.toString();
  logger.info(`[Worker] Received job: ${content}`);

  try {
    const { userId } = JSON.parse(content);

    // 1. Ambil data pengguna
    const user = await User.findById(userId);
    if (!user) {
      logger.error(`[Worker] User with ID ${userId} not found.`);
      return;
    }

    // 2. Ambil semua data transaksi dan budget
    const transactions = await Transaction.find({ userId })
      .populate("categoryId", "name")
      .sort({ createdAt: "asc" });
    const budgets = await Budget.find({ userId }).populate(
      "categoryId",
      "name"
    );

    if (transactions.length === 0) {
      logger.info(
        `[Worker] No transactions for user ${user.email}. Job finished.`
      );
      return;
    }

    // 3. Proses dan kalkulasi data (keseluruhan)
    let totalIncome = 0;
    let totalExpense = 0;
    const spendingByCategory = {};

    transactions.forEach((tx) => {
      if (tx.type === "income") totalIncome += tx.amount;
      if (tx.type === "expense") {
        totalExpense += tx.amount;
        const categoryName = tx.categoryId
          ? tx.categoryId.name
          : "Uncategorized";
        spendingByCategory[categoryName] =
          (spendingByCategory[categoryName] || 0) + tx.amount;
      }
    });

    // 4. Buat konten CSV
    const summaryData = [
      { field: "Total Pemasukan", value: totalIncome },
      { field: "Total Pengeluaran", value: totalExpense },
      { field: "Saldo Akhir", value: totalIncome - totalExpense },
      {}, // Baris kosong sebagai pemisah
    ];

    const budgetSummary = budgets.map((b) => ({
      "Kategori Budget": b.categoryId.name,
      "Batas Budget": b.amountLimit,
      "Total Pengeluaran": spendingByCategory[b.categoryId.name] || 0,
      "Sisa Budget":
        b.amountLimit - (spendingByCategory[b.categoryId.name] || 0),
    }));

    const transactionList = transactions.map((tx) => ({
      Tanggal: tx.createdAt.toISOString().split("T")[0],
      Kategori: tx.categoryId ? tx.categoryId.name : "Uncategorized",
      Tipe: tx.type,
      Jumlah: tx.amount,
      Deskripsi: tx.description,
    }));

    const summaryCsv = new Parser({ header: false }).parse(summaryData);
    const budgetCsv = new Parser().parse(budgetSummary);
    const transactionCsv = new Parser().parse(transactionList);

    const finalCsv = `RINGKASAN KESELURUHAN\n${summaryCsv}\n\nRINGKASAN BUDGET\n${budgetCsv}\n\nDAFTAR TRANSAKSI\n${transactionCsv}`;

    // 5. Kirim email
    const fileName = `Fintrack_Laporan_Keseluruhan.csv`;
    const subject = `Laporan Keuangan Fintrack Anda (Keseluruhan)`;
    const htmlBody = `<p>Halo ${user.name},</p><p>Berikut terlampir laporan keuangan keseluruhan Anda.</p>`;

    await sendEmailWithAttachment(user.email, subject, htmlBody, [
      {
        filename: fileName,
        content: finalCsv,
        contentType: "text/csv",
      },
    ]);

    logger.info(`[Worker] Report successfully sent to ${user.email}`);
  } catch (error) {
    logger.error(`[Worker] Error processing job: ${error.message}`, {
      stack: error.stack,
    });
  }
}

// Inisialisasi worker untuk mendengarkan queue
const startWorker = async () => {
  try {
    const connection = await amqplib.connect(RABBITMQ_URI);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, { durable: true }); // durable: true, agar pesan tidak hilang jika RabbitMQ restart

    logger.info(`[Worker] Waiting for jobs in ${QUEUE_NAME}.`);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        await processExportJob(msg);
        channel.ack(msg); // Konfirmasi bahwa pesan telah diproses
      },
      { noAck: false }
    ); // noAck: false, agar kita bisa mengirim konfirmasi (ack)
  } catch (error) {
    logger.error(`[Worker] Failed to start: ${error.message}`);
    // Coba koneksi kembali setelah beberapa saat
    setTimeout(startWorker, 5000);
  }
};

module.exports = { startWorker };
