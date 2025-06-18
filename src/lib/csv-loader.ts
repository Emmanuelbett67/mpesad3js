import Papa from "papaparse";

export interface Transaction {
  date: string;
  direction: "IN" | "OUT";
  clean_amount: number;
  description: string;
  raw: string;
  category: string;
}

export const loadTransactions = (csvUrl: string): Promise<Transaction[]> =>
  new Promise((resolve, reject) => {
    Papa.parse(csvUrl, {
      download: true,
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        const transactions = results.data as Transaction[];
        // Filter out any empty rows and ensure clean_amount is a number
        const validTransactions = transactions.filter(
          (t) => t && t.date && typeof t.clean_amount === "number"
        );
        resolve(validTransactions);
      },
      error: reject,
    });
  }); 