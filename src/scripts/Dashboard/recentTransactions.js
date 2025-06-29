export default function renderTransactions({ tableId = "transactions-table", refreshInterval = 60000 } = {}) {
    const tableContainer = document.getElementById(tableId);
  
    function formatDate(dateStr) {
      const date = new Date(dateStr);
      const now = new Date();
      const oneWeekAgo = new Date(now);
      oneWeekAgo.setDate(now.getDate() - 7);
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(now.getMonth() - 1);
  
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
  
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
      if (date > oneWeekAgo) {
        return `${weekdays[date.getDay()]}/${month}`;
      } else if (date > oneMonthAgo) {
        return `${day}/${month}`;
      } else {
        return `${monthNames[month - 1]}/${year}`;
      }
    }
  
    async function fetchTransactions() {
      try {
        const endDate = new Date().toISOString();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
  
        const body = JSON.stringify({
          startDate: startDate.toISOString(),
          endDate
        });
  
        const headers = { 'Content-Type': 'application/json' };
  
        const [purchasesRes, depositsRes] = await Promise.all([
          fetch('/api/user/fetch/purchases', { method: 'POST', headers, body }),
          fetch('/api/user/fetch/deposits', { method: 'POST', headers, body }),
        ]);
  
        if (!purchasesRes.ok || !depositsRes.ok) {
          throw new Error('Failed to fetch one or more datasets.');
        }
  
        const purchases = await purchasesRes.json();
        const deposits = await depositsRes.json();
  
        const formattedPurchases = purchases.map(p => ({ ...p, type: 'purchase' }));
        const formattedDeposits = deposits.map(d => ({ ...d, type: 'deposit' }));
  
        const transactions = [...formattedPurchases, ...formattedDeposits]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10);
  
        tableContainer.innerHTML = '';
  
        if (transactions.length === 0) {
          tableContainer.innerHTML = '<div class="text-gray-500">No transactions found.</div>';
          return;
        }
  
        const table = document.createElement('table');
        table.className = 'w-full table-auto border-collapse rounded-xl overflow-hidden shadow-md text-sm';
  
        table.innerHTML = `
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="text-left px-4 py-2">Type</th>
              <th class="text-left px-4 py-2">Title</th>
              <th class="text-left px-4 py-2">Amount</th>
              <th class="text-left px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white"></tbody>
        `;
  
        const tbody = table.querySelector('tbody');
  
        for (const item of transactions) {
          const isDeposit = item.type === 'deposit';
          const colorClass = isDeposit ? 'text-green-600' : 'text-red-600';
  
          const row = document.createElement('tr');
          row.innerHTML = `
            <td class="px-4 py-2">${isDeposit ? 'Deposit' : 'Purchase'}</td>
            <td class="px-4 py-2 font-medium">${item.title}</td>
            <td class="px-4 py-2 font-semibold ${colorClass}">$${Math.abs(item.amount).toFixed(2)}</td>
            <td class="px-4 py-2 text-gray-500">${formatDate(item.date)}</td>
          `;
  
          tbody.appendChild(row);
        }
  
        tableContainer.appendChild(table);
      } catch (error) {
        console.error('Transaction fetch error:', error);
        tableContainer.innerHTML = '<div class="text-red-600">Error loading data. Check console.</div>';
      }
    }
  
    fetchTransactions();
    setInterval(fetchTransactions, refreshInterval);
  }

renderTransactions();
  