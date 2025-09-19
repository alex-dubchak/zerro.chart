import { defineStore } from 'pinia';
import chartDataService from '../services/chartDataService';
import dayjs from 'dayjs';
import { getRate } from './rates';

export const useChartStore = defineStore('chartData', {
  state: () => ({
    transactions: [],
    categories: {},
    topCategories: {},
    accounts: {},
    instruments: {},
    data: {},
    summaryChartOptions: {
      period: 12,
      dataStart: dayjs('2022-01-01').valueOf(),
      hiddenCategories: [],
    },
    monthChartOptions: {
      period: 0,
      periodLabel: '',
    },
    compareChartOptions: {
      period1: 0,
      period2: 1,
      period1Label: '',
      period2Label: '',
    },
    yearChartOptions: {
      period: 0,
      periodLabel: '',
    },
    flowChartOptions: {
      period: 0,
      periodLabel: '',
    },
    accountChartOptions: {
      period: 0,
      periodLabel: null,
    },
    resultAcount: 'eea8547c-fd6a-4177-a813-43f006fe1fb5',
    convertRates: true,
    isLoaded: false,
  }),

  getters: {
    flowChartData(state) {
      const period = state.getFlowPeriod();
      const colors = ["#36A2EB", "#FF6384", "#FF9F40", "#FFCD56", "#4BC0C0", "#9966FF", "#C9CBCF",]
      const catColors = {}
      let colorIndex = 0

      const getColor = (item) => {
        const cat = item.replace('In ', '').replace('Out ', '');
        if (!catColors[cat]) {
          catColors[cat] = colors[colorIndex % colors.length]
          colorIndex++
        }
        const result = catColors[cat]
        return result;
      }
      const ds = {
        data: [],
        labels: {},
        colorFrom: (c) => getColor(c.dataset.data[c.dataIndex].from),
        colorTo: (c) => getColor(c.dataset.data[c.dataIndex].to),
        size: 'min'
      };

      for (const { id, title } of Object.values(this.accounts)) {
        ds.labels['In ' + id] = title;
        ds.labels['Out ' + id] = title;
      }

      for (const { id, title } of Object.values(this.getTopCategories())) {
        ds.labels['In ' + id] = title;
        ds.labels['Out ' + id] = title;
      }
      const data = state.data[period];
      const dataIn = Object.entries(state.data[period].dataIn);
      for (const [account, amount] of dataIn) {
        ds.data.push({
          from: 'In ' + account,
          to: 'Income',
          flow: amount
        })
      }

      const dataOut = Object.entries(state.data[period].dataOut);
      for (const [account, categories] of dataOut) {
        let total = 0;
        const categoriesEntries = Object.entries(categories);
        for (const [category, amount] of categoriesEntries) {
          total += amount;
          ds.data.push({
            from: 'Out ' + account,
            to: 'Out ' + category,
            flow: amount
          })
        }

        ds.data.push({
          from: "Income",
          to: 'Out ' + account,
          flow: total
        })
      }
      if (data.save >= 0) {
        ds.data.push({
          from: "Income",
          to: 'Save',
          flow: data.save
        })
      } else {
        ds.data.push({
          from: "Overspending",
          to: 'Income',
          flow: -data.save
        })
      }

      console.log(ds);
      return {
        datasets: [
          ds,
        ]
      }
    },

    monthChartData(state) {
      const period = state.getMonthPeriod();
      return this.categoriesChartData(state.data[period], this.monthChartOptions.periodLabel);
    },
    compareChartData(state) {
      // Get periods and load chart data
      const { result1: period1, result2: period2 } = state.getComparePeriods();
      const data1 = this.categoriesChartData(state.data[period1], this.compareChartOptions.period1Label);
      const data2 = this.categoriesChartData(state.data[period2], this.compareChartOptions.period2Label);

      // Get expense datasets using array destructuring
      const [expence1] = data1.datasets.filter(ds => ds.tag === 'expence');
      const [expence2] = data2.datasets.filter(ds => ds.tag === 'expence');

      // Create combined data structure from period 1
      const commonData = data1.labels.reduce((obj, label, index) => {
        obj[label] = { data1: expence1.data[index], data2: null };
        return obj;
      }, {});

      // Merge in period 2 data using forEach instead of reduce
      data2.labels.forEach((label, index) => {
        commonData[label] = {
          ...commonData[label] || { data1: null, data2: null },
          data2: expence2.data[index]
        };
      });

      // Extract sort logic into a separate function for clarity
      const sortPriority = (label1, data1, label2, data2) => {
        // Both null values first
        if (data1.data1 === null && data1.data2 === null) return -1;
        if (data2.data1 === null && data2.data2 === null) return 1;

        // Save always at the bottom
        if (label1 === 'Save') return 1;
        if (label2 === 'Save') return -1;

        // Sort by data1 value (descending)
        return (data2.data1 || 0) - (data1.data1 || 0);
      };

      // Sort and extract data using method chaining
      const sortedEntries = Object.entries(commonData)
        .sort(([l1, a], [l2, b]) => sortPriority(l1, a, l2, b));

      // Create result structure from sorted data with object destructuring
      const { labels, data1: sortedData1, data2: sortedData2 } = sortedEntries.reduce(
        (result, [label, values]) => {
          result.labels.push(label);
          result.data1.push(values.data1 || 0);
          result.data2.push(values.data2 || 0);
          return result;
        },
        { labels: [], data1: [], data2: [] }
      );

      // Update expense datasets with sorted data
      expence1.data = sortedData1;
      expence2.data = sortedData2;

      // Return chart data with styled datasets using template literals
      return {
        labels,
        datasets: [
          ...data1.datasets.map(ds => ({
            ...ds,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            xAxisID: ds.tag === 'expence' ? 'x1' : 'x',
            label: ds.label, // Just use the tag as the label identifier
            // Add a display name to use in tooltips but not in legend
            displayName: `${ds.label} (${ds.tag})`
          })),
          ...data2.datasets.map(ds => ({
            ...ds,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            xAxisID: ds.tag === 'expence' ? 'x1' : 'x',
            label: ds.label, // Just use the tag as the label identifier
            // Add a display name to use in tooltips but not in legend
            displayName: `${ds.label} (${ds.tag})`
          })),
        ]
      }
    },
    yearChartData(state) {
      const periodData = state.getYearPeriod();
      const yearData = periodData.reduce((res, [_, obj]) => {
        res.income += obj.income
        res.save += obj.save
        res.outcome += obj.outcome
        for (const [key, value] of Object.entries(obj.data)) {
          if (!res.data[key]) res.data[key] = 0;
          res.data[key] += value;
        }

        return res
      }, {
        data: {},
        income: 0,
        save: 0,
        outcome: 0
      })

      return this.categoriesChartData(yearData, this.yearChartOptions.periodLabel);
    },

    accountChartData(state) {
      const $this = this;
      const accounts = Object.values(this.accounts)
        .filter((account) => !account.archive)
        .map(
          (account) => ({
            title: account.title,
            amount: $this.convertToResult(account.balance, account.id)
          })
        ).sort((acc1, acc2) => acc2.amount - acc1.amount);
      const totalBalance = this.getCurrentTotal();
      console.debug('accounts', accounts)
      const result = {
        labels: [],
        datasets: []
      };

      const ds = this.getDataSet(result, 'accounts', {
        instrument: this.getDefaultInstrument(),
        income: totalBalance
      });

      for (const { title, amount } of accounts) {
        ds.data.push(this.normalizeValue(amount))
        result.labels.push(title)
      }
      return result;
    },

    summaryChartData(state) {
      const result = {
        labels: [],
        datasets: []
      };

      const line = {
        type: 'line',
        tension: 0.4,
        cubicInterpolationMode: 'monotone',
      };

      var totals = this.getTotalsByCategories(Object.entries(state.data));
      const categories = Object.entries(state.topCategories).sort(([a], [b]) => totals[b] - totals[a]);
      const data = Object.entries(state.data).filter(([month]) => {
        return +month >= dayjs().subtract(state.summaryChartOptions.period, 'month')
      });
      for (const [month, entry] of data) {
        // Add month to labels
        result.labels.push(dayjs(+month).format('YYYY-MM'));

        // Add income dataset
        this.getDataSet(result, 'income', {
          ...line,
          label: 'Income',
          stack: 'income',
        }).data.push(this.normalizeValue(entry.income));

        // Add expence dataset
        this.getDataSet(result, 'expense', {
          ...line,
          label: 'Expense',
          stack: 'expense',
        }).data.push(this.normalizeValue(entry.outcome));

        // Add save dataset
        this.getDataSet(result, 'save', {
          ...line,
          label: 'Save',
          stack: 'save',
        }).data.push(this.normalizeValue(entry.save));

        const whatIfExpence = this.getDataSet(result, 'whatifexpence', {
          ...line,
          borderDash: [2, 2],
          label: 'Expense',
          stack: 'whatifexpence',
        })
        const whatIfSave = this.getDataSet(result, 'whatifsave', {
          ...line,
          borderDash: [2, 2],
          label: 'Save',
          stack: 'whatifsave',
        })

        // Add total dataset
        this.getDataSet(result, 'total', {
          ...line,
          yAxisID: 'y1',
          label: 'Total',
        }).data.push(this.normalizeValue(entry.total));

        let expense = 0;
        for (const [categoryId, { title }] of categories) {
          const value = this.getValue(entry.data[categoryId] || 0, categoryId);
          this.getDataSet(result, categoryId, {
            label: title,
            stack: 'categories',
            tag: categoryId,
          }).data.push(this.normalizeValue(value));
          expense += +value;
        }

        whatIfExpence.data.push(this.normalizeValue(expense));
        whatIfSave.data.push(this.normalizeValue(entry.income - expense));
      }
      result.datasets = result.datasets.filter(
        ds =>
          ds.data.some(d => d != 0) ||
          state.summaryChartOptions.hiddenCategories.includes(ds.tag)
      );
      return result;
    }
  },

  actions: {
    shadeColor(color, percent) {
      let R = parseInt(color.substring(1, 3), 16);
      let G = parseInt(color.substring(3, 5), 16);
      let B = parseInt(color.substring(5, 7), 16);

      R = Math.min(255, Math.max(0, R + Math.round(2.55 * percent)));
      G = Math.min(255, Math.max(0, G + Math.round(2.55 * percent)));
      B = Math.min(255, Math.max(0, B + Math.round(2.55 * percent)));

      return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
    },
    getDefaultInstrument() {
      return this.instruments[this.accounts[this.resultAcount].instrument];
    },
    categoriesChartData({ data, income, save, outcome }, periodLabel) {
      const result = {
        labels: [],
        datasets: []
      };

      const ds = this.getDataSet(result, 'expence', {
        label: periodLabel,
        instrument: this.instruments[this.accounts[this.resultAcount].instrument],
        income: income,
        expence: outcome,
      });

      const incomeDs = this.getDataSet(result, 'income', {
        label: periodLabel,
        instrument: this.instruments[this.accounts[this.resultAcount].instrument],
        income: income,
        expence: outcome,
      });

      result.labels.push("Income");
      incomeDs.data.push(this.normalizeValue(income || 0));
      ds.data.push(null);

      if (save < 0) {
        result.labels.push("Overspending");
        incomeDs.data.push(this.normalizeValue(save || 0));
        ds.data.push(null);
      }

      // loop over data.data
      for (const [categoryId, amount] of Object.entries(data).sort(([ka, a], [kb, b]) => b - a)) {
        if (!amount) continue; // Skip zero amounts
        result.labels.push(this.topCategories[categoryId].title);
        ds.data.push(this.normalizeValue(amount));
        incomeDs.data.push(null);
      }

      if (save > 0) {
        result.labels.push("Save");
        incomeDs.data.push(null);
        ds.data.push(this.normalizeValue(save || 0));
      }
      return result;
    },
    setPeriodLabel(opts) {
      const period = this.getMonthPeriod();
      opts.periodLabel = dayjs(+period).format('YYYY-MM')
      return opts.periodLabel
    },
    async fetchData() {
      this.transactions = await chartDataService.getTransactions();
      this.categories = await chartDataService.getTags();
      this.accounts = await chartDataService.getAccounts();
      this.instruments = await chartDataService.getInstruments();
      this.topCategories = this.getTopCategories();
      this.resultAcount = chartDataService.getResultAccount() || this.resultAcount;
      console.debug('Top categories', this.resultAcount);
      this.data = this.getAllData();
      //this.monthChartOptions.period = Object.entries(this.data).at(-1)[0];
      this.isLoaded = true;
      console.debug('Data loaded', this.data);
    },
    getAllData() {
      const result = {};
      for (const transaction of this.transactions) {
        const {
          date,
          income,
          outcome,
          tag: tags,
          incomeAccount,
          outcomeAccount,
          deleted,
        } = transaction;
        const month = dayjs(date).startOf('month').valueOf()
        if (income && outcome || deleted || month < this.summaryChartOptions.dataStart) continue; // Skip transactions if transfer or deleted

        if (!result[month]) {
          result[month] = {
            income: 0,
            outcome: 0,
            save: 0,
            total: 0,
            data: {},
            dataIn: {},
            dataOut: {},
          };
        }

        const monthData = result[month];

        const category = tags?.length ?
          this.getTopCategory(tags[0]) :
          'uncategorized';

        const amount = monthData.data[category] || 0;

        const actualIncome = this.convertToResult(income, incomeAccount, date)
        const actualOutcome = this.convertToResult(outcome, outcomeAccount, date)

        monthData.income += actualIncome;
        monthData.outcome += actualOutcome;
        monthData.save += actualIncome - actualOutcome;

        monthData.data[category] = amount + actualOutcome;

        if (outcome) {
          const outAccount = monthData.dataOut[outcomeAccount] ||= {};
          const outAccountCategoryAmount = outAccount[category] || 0;
          outAccount[category] = outAccountCategoryAmount + actualOutcome;
        }

        if (income) {
          const inAmount = monthData.dataIn[incomeAccount] || 0;
          monthData.dataIn[incomeAccount] = inAmount + actualIncome;
        }

      }

      const sortedResult = Object.fromEntries(
        Object.entries(result)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      );

      // calculate total by reducing current total by each month's save
      let total = this.getCurrentTotal();
      Object.keys(sortedResult).reverse()
        .forEach(k => sortedResult[k].total = total -= sortedResult[k].save);

      return sortedResult;
    },
    getDataSet(result, id, defaultObj) {
      let dataset = result.datasets.find(ds => ds.tag === id);
      if (!dataset) {
        dataset = {
          tag: id,
          data: [],
          backgroundColor: ["#36A2EB", "#FF6384", "#FF9F40", "#FFCD56", "#4BC0C0", "#9966FF", "#C9CBCF", "#36A2EB", "#FF6384", "#FF9F40", "#FFCD56", "#4BC0C0", "#9966FF", "#C9CBCF", "#36A2EB", "#FF6384", "#FF9F40", "#FFCD56", "#4BC0C0", "#9966FF", "#C9CBCF", "#36A2EB", "#FF6384", "#FF9F40", "#FFCD56", "#4BC0C0", "#9966FF", "#C9CBCF"],
          ...defaultObj,
        };
        result.datasets.push(dataset);
      }
      return dataset;
    },
    normalizeValue(value) {
      return value.toFixed(2);
    },
    getValue(value, categoryId) {
      return this.summaryChartOptions.hiddenCategories.includes(categoryId) ? 0 : value;
    },
    getFlowPeriod() {
      const { period } = this.flowChartOptions;
      const result = Object.entries(this.data).at(-(period + 1))[0];
      this.flowChartOptions.periodLabel = dayjs(+result).format('YYYY-MM')
      return result
    },
    getMonthPeriod() {
      const { period } = this.monthChartOptions;
      const result = Object.entries(this.data).at(-(period + 1))[0];
      this.monthChartOptions.periodLabel = dayjs(+result).format('YYYY-MM')
      return result
    },
    getComparePeriods() {
      const { period1, period2 } = this.compareChartOptions;
      const result1 = Object.entries(this.data).at(-(period1 + 1))[0];
      const result2 = Object.entries(this.data).at(-(period2 + 1))[0];
      this.compareChartOptions.period1Label = dayjs(+result1).format('YYYY-MM')
      this.compareChartOptions.period2Label = dayjs(+result2).format('YYYY-MM')
      return { result1, result2 };
    },
    getYearPeriod() {
      const { period } = this.yearChartOptions;

      const years = [...new Set(Object.entries(this.data).map(([month]) => dayjs(+month).year()))];
      const year = years.at(-(period + 1));
      const result = Object.entries(this.data).filter(([month]) => dayjs(+month).year() == year)

      const periodLabel = dayjs(+result[0][0]).year()
      this.yearChartOptions.periodLabel = periodLabel

      return result
    },
    getTotalsByCategories(dataEntries) {
      const result = {};
      for (const [_, { data }] of dataEntries) {
        for (const [categoryId, amount] of Object.entries(data)) {
          result[categoryId] = (result[categoryId] || 0) + amount;
        }
      }
      return result;
    },
    getCurrentTotal() {
      const $this = this;
      const totalBalance = Object.values(this.accounts)
        .reduce((sum, account) =>
          sum + (account.archive ? 0 : $this.convertToResult(account.balance, account.id))
          , 0
        );
      console.debug('Active accounts', totalBalance);
      return totalBalance;
    },
    convertToResult(amount, sourceAccount, date) {
      const sourceInstument = this.instruments[this.accounts[sourceAccount].instrument];
      const instrument = this.instruments[this.accounts[this.resultAcount].instrument];

      const sourceRate = !this.convertRates ? sourceInstument.rate: (getRate(sourceInstument.shortTitle, date) || sourceInstument.rate);
      const targetRate = !this.convertRates ? instrument.rate: (getRate(instrument.shortTitle, date) || instrument.rate);

      return amount * sourceRate / targetRate;
    },
    getTopCategories() {
      return {
        ...Object.fromEntries(
          Object.entries(this.categories)
            .filter(([_, category]) => !category.parent)
        ),
        uncategorized: {
          id: 'uncategorized',
          title: 'Uncategorized',
          parent: null,
        }
      };
    },
    getTopCategory(tag) {
      const category = this.categories[tag];

      if (!category.parent) {
        return category.id;
      }

      return this.getTopCategory(category.parent);
    },
    setResultAccount(accountId) {
      this.resultAcount = accountId;
      chartDataService.setResultAccount(accountId);
      this.data = this.getAllData();
    }

  }
});