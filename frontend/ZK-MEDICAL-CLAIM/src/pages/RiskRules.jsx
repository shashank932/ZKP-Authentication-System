export default function RiskRules() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Risk Rules</h1>
      <p className="mt-1 text-sm text-gray-500">Manage fraud detection rules.</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Rule Name</th>
              <th className="px-4 py-3 text-left">Condition</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-800">High Amount</td>
              <td className="px-4 py-3 text-gray-600">Amount &gt; 100,000</td>
              <td className="px-4 py-3 text-gray-600">Flag for Review</td>
              <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span></td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-800">Duplicate Transaction</td>
              <td className="px-4 py-3 text-gray-600">Same amount + same time</td>
              <td className="px-4 py-3 text-gray-600">Auto Reject</td>
              <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Active</span></td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-800">Unusual Location</td>
              <td className="px-4 py-3 text-gray-600">Different city in 1hr</td>
              <td className="px-4 py-3 text-gray-600">Send Alert</td>
              <td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">Inactive</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}