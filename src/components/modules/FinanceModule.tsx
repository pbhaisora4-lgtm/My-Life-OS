import React, { useState } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { FinanceTransaction, SavingsInvestmentGoal } from '../../types';
import { dbService } from '../../services/db';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Download,
  Plus,
  Trash2,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from 'lucide-react';

export const FinanceModule: React.FC = () => {
  const {
    selectedDate,
    financeTransactions,
    saveFinanceTransaction,
    deleteFinanceTransaction,
    savingsInvestments,
    saveSavingsInvestment,
    deleteSavingsInvestment,
    settings,
    showIslandNotice,
  } = useLifeOS();

  const [activeTab, setActiveTab] = useState<'transactions' | 'monthly' | 'savings'>('transactions');

  // Transaction form state
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Apple Pay');

  // Savings form state
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<'savings' | 'investment'>('savings');
  const [currentAmt, setCurrentAmt] = useState('');
  const [targetAmt, setTargetAmt] = useState('');

  const expenseCategories = [
    'Food & Dining',
    'Groceries',
    'Transportation',
    'Housing & Utilities',
    'Technology & Apps',
    'Health & Fitness',
    'Leisure & Fun',
    'Personal & Shopping',
    'Other Expense',
  ];

  const incomeCategories = [
    'Salary / Paycheck',
    'Freelance / Consulting',
    'Investment Returns',
    'Bonus',
    'Other Income',
  ];

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || isNaN(num) || num <= 0) return;

    const newTx: FinanceTransaction = {
      id: `fin_${Date.now()}`,
      date: selectedDate,
      type: txType,
      category,
      amount: num,
      currency: settings.currency || 'USD',
      notes: notes.trim() || category,
      paymentMethod,
    };

    await saveFinanceTransaction(newTx);
    setAmount('');
    setNotes('');
  };

  const handleAddSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = parseFloat(currentAmt) || 0;
    const t = parseFloat(targetAmt) || 0;
    if (!goalTitle.trim() || t <= 0) return;

    const newGoal: SavingsInvestmentGoal = {
      id: `goal_${Date.now()}`,
      title: goalTitle.trim(),
      type: goalType,
      currentAmount: c,
      targetAmount: t,
      currency: settings.currency || 'USD',
    };

    await saveSavingsInvestment(newGoal);
    setGoalTitle('');
    setCurrentAmt('');
    setTargetAmt('');
  };

  const handleExportCSV = async () => {
    const csv = await dbService.exportFinanceCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lifeos_finance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showIslandNotice('Finance CSV Exported', 'Downloaded records file');
  };

  // Month-to-date calculation (based on selectedDate's YYYY-MM)
  const currentYearMonth = selectedDate.slice(0, 7);
  const monthTransactions = financeTransactions.filter((t) =>
    t.date.startsWith(currentYearMonth)
  );

  const totalMonthIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalMonthExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netSavingsMonth = totalMonthIncome - totalMonthExpense;

  // Selected date transactions
  const selectedDateTransactions = financeTransactions.filter(
    (t) => t.date === selectedDate
  );

  // Group by category for monthly breakdown
  const categoryExpenses: Record<string, number> = {};
  monthTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  const sortedCategories = Object.entries(categoryExpenses).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-500">
            Module 05
          </p>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Finance & Money
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Income, daily spending, savings, investments and monthly summaries.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-slate-200 transition"
          title="Export Finance CSV"
        >
          <Download className="w-3.5 h-3.5" />
          <span>CSV</span>
        </button>
      </div>

      {/* Monthly Financial Overview Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>Income</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="mt-1 text-base sm:text-lg font-bold font-mono text-emerald-500">
            +${totalMonthIncome.toFixed(0)}
          </p>
          <span className="text-[9px] text-slate-400">Month-to-Date</span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>Expenses</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="mt-1 text-base sm:text-lg font-bold font-mono text-rose-500">
            -${totalMonthExpense.toFixed(0)}
          </p>
          <span className="text-[9px] text-slate-400">Month-to-Date</span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            <span>Net Flow</span>
            <PiggyBank className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <p
            className={`mt-1 text-base sm:text-lg font-bold font-mono ${
              netSavingsMonth >= 0 ? 'text-emerald-500' : 'text-rose-500'
            }`}
          >
            {netSavingsMonth >= 0 ? '+' : ''}${netSavingsMonth.toFixed(0)}
          </p>
          <span className="text-[9px] text-slate-400">Net Balance</span>
        </div>
      </div>

      {/* Segmented Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-white/5 rounded-xl">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'transactions'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Daily Spending ({selectedDateTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'monthly'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Monthly Summary
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'savings'
              ? 'bg-white dark:bg-[#151924] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Savings & Invest
        </button>
      </div>

      {/* TAB 1: Transactions & Add */}
      {activeTab === 'transactions' && (
        <div className="space-y-3.5">
          {/* Add Transaction Form */}
          <form
            onSubmit={handleAddTransaction}
            className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Log Transaction for {selectedDate}
              </h3>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTxType('expense');
                    setCategory('Food & Dining');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    txType === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxType('income');
                    setCategory('Salary / Paycheck');
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    txType === 'income'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Income
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">
                  Amount ({settings.currency})
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                >
                  {(txType === 'expense' ? expenseCategories : incomeCategories).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Notes / Merchant</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Whole Foods, Uber to office, Client retainer"
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Payment</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                >
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={!amount}
              className={`w-full py-2.5 rounded-xl text-white text-xs font-semibold shadow-md active:scale-95 transition ${
                txType === 'expense' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              + Record {txType === 'expense' ? 'Expense' : 'Income'}
            </button>
          </form>

          {/* Transactions List */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-white/5">
              Entries for {selectedDate}
            </h3>

            {selectedDateTransactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No transactions recorded for this day.
              </p>
            ) : (
              selectedDateTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {tx.notes || tx.category}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {tx.category} · {tx.paymentMethod}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-mono font-bold ${
                        tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => deleteFinanceTransaction(tx.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Monthly Summary Breakdown */}
      {activeTab === 'monthly' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-indigo-500" />
              Monthly Category Spending ({currentYearMonth})
            </h3>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
              Total: ${totalMonthExpense.toFixed(2)}
            </span>
          </div>

          {sortedCategories.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No expenses recorded for this month yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {sortedCategories.map(([cat, amt]) => {
                const percent =
                  totalMonthExpense > 0
                    ? Math.round((amt / totalMonthExpense) * 100)
                    : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{cat}</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        ${amt.toFixed(2)} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Savings & Investments */}
      {activeTab === 'savings' && (
        <div className="space-y-3.5">
          <form
            onSubmit={handleAddSavingsGoal}
            className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3"
          >
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              Add Savings / Investment Goal
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Goal Title</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Emergency Fund, S&P 500 Index, House Downpayment"
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Type</label>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as any)}
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs"
                >
                  <option value="savings">Savings</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Current Amount ($)</label>
                <input
                  type="number"
                  value={currentAmt}
                  onChange={(e) => setCurrentAmt(e.target.value)}
                  placeholder="5000"
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 dark:text-slate-400">Target Amount ($)</label>
                <input
                  type="number"
                  value={targetAmt}
                  onChange={(e) => setTargetAmt(e.target.value)}
                  placeholder="20000"
                  className="mt-1 w-full p-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!goalTitle.trim() || !targetAmt}
              className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition"
            >
              + Create Financial Goal
            </button>
          </form>

          {/* Goals List */}
          <div className="space-y-2.5">
            {savingsInvestments.map((g) => {
              const progress = Math.min(
                100,
                Math.round((g.currentAmount / g.targetAmount) * 100)
              );
              return (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#121622] border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                        {g.type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                        {g.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-500">
                        ${g.currentAmount.toLocaleString()} / ${g.targetAmount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => deleteSavingsInvestment(g.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{progress}% Achieved</span>
                    <span>Remaining: ${(g.targetAmount - g.currentAmount).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
